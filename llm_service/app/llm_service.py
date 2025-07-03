import os
from typing import Dict, List, Optional
from groq import Groq
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, AIMessage 
from dotenv import load_dotenv
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_groq import ChatGroq

# For token counting approximation (simple character count for now)
# For more accurate token counting, consider Groq's tokenizer if available,
# or a general-purpose library like `transformers` tokenizers.
# TOKEN_APPROX_MULTIPLIER = 4 # Roughly 4 chars per token for English text
# LLAMA3_MAX_TOKENS = 8192 # Max context window for Llama 3 8B
# We'll use character count directly for simplicity as a proxy for "length"
CHAT_HISTORY_MAX_CHARS = 2000 # Max characters allowed for chat history before summarization
                              # This is a heuristic; adjust based on LLM context window and typical query/answer sizes.
                              # E.g., if total context is 8192 tokens, and RAG context takes 4000,
                              # then remaining for history + question + answer is ~4000 tokens.
                              # 2000 chars is roughly 500 tokens.

load_dotenv() # Load environment variables

class LLMService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set.")

        self.client = Groq(api_key=self.groq_api_key)

        # Initialize Embedding Model
        self.embedding_model = SentenceTransformerEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )

        # Initialize ChromaDB Vector Store
        self.vectorstore_path = "chroma_db"
        self.vectorstore = Chroma(
            persist_directory=self.vectorstore_path,
            embedding_function=self.embedding_model,
        )
        self.langchain_llm = ChatGroq(
            groq_api_key=self.groq_api_key,
            model_name="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.1
        )
        self.summary_prompt_template = PromptTemplate(
            template="""You are a concise summarization expert. Summarize the following text
            based on the context '{summary_context}'. Provide a summary in {length_preference} words or less.
            Text: {text_content}
            Summary:""",
            input_variables=["text_content", "summary_context", "length_preference"]
        )

        self.criteria_augment_prompt_template = PromptTemplate(
            template="""You are an expert in refining research criteria.
            Based on the researcher's input: "{researcher_input}", suggest clearer wording
            and propose structured rule templates (e.g., using IF/THEN logic) to make the criteria
            more precise for a clinical study.
            Output your response as a JSON object with two keys:
            'clearer_wording': 'your suggested clearer phrasing',
            'suggested_rules': [{'description': 'rule description', 'structured_format': 'IF condition THEN action'}]
            Example: {{"clearer_wording": "Patients diagnosed with Stage II breast cancer", "suggested_rules": [{{"description": "Diagnosis confirmed by biopsy", "structured_format": "IF diagnosis is 'Stage II breast cancer' AND biopsy='confirmed' THEN INCLUDE"}}]}}
            Response:""",
            input_variables=["researcher_input"]
        )

        self.form_generate_prompt_template = PromptTemplate(
            template="""You are an expert at generating JSON schema for data collection forms.
            Based on the following study objectives or selected criteria: "{study_objectives}",
            propose a preliminary JSON schema definition for a dynamic data collection form.
            Suggest relevant data points, field types (e.g., "string", "number", "boolean", "array"),
            and common form elements. Ensure the JSON is valid and follows JSON Schema Draft 7.
            Example for collecting patient name and age:
            {{
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "Patient Demographics Form",
                "type": "object",
                "properties": {{
                    "patientName": {{"type": "string", "description": "Full name of the patient"}},
                    "patientAge": {{"type": "integer", "description": "Age of the patient in years", "minimum": 0}}
                }},
                "required": ["patientName", "patientAge"]
            }}
            Response JSON Schema:""",
            input_variables=["study_objectives"]
        )

        self.qna_prompt_template = PromptTemplate(
            template="""You are a helpful and informative AI assistant specializing in medical and neurosurgical research.
            Use the following retrieved context to answer the question.
            If you don't know the answer based on the provided context, state that you don't know,
            rather than trying to make up an answer.

            Context:
            {context}

            Question: {question}

            Answer:""",
            input_variables=["context", "question"]
        )

        self.history_summarizer_prompt_template = PromptTemplate(
            template="""You are a helpful AI assistant. Summarize the following conversation history between a user and an assistant.
            Focus on key topics discussed, main questions asked, and critical information exchanged.
            The summary should be concise and retain enough detail to provide context for a new user question.
            Do not include the latest user question that needs to be answered.

            Conversation History:
            {chat_history}

            Concise Summary of Conversation:""",
            input_variables=["chat_history"]
        )


    def _call_llm(self, messages: List[Dict[str, str]], model: str = "llama3-8b-8192", max_tokens: int = 2000, json_mode: bool = False):
        """
        Generic method to call the LLM.
        `messages` should be a list of dictionaries like [{"role": "user", "content": "..."}]
        """
        try:
            response_format = {"type": "json_object"} if json_mode else None
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=model,
                max_tokens=max_tokens,
                temperature=0.0,
                response_format=response_format
            )
            # Access content based on response_format
            if json_mode:
                return chat_completion.choices[0].message.content # Returns JSON string
            else:
                return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling LLM: {e}")
            raise

    def _get_message_char_count(self, messages: List[Dict[str, str]]) -> int:
        """Approximates the total character count of a list of messages."""
        total_chars = 0
        for msg in messages:
            total_chars += len(msg.get("content", ""))
        return total_chars

    async def _summarize_long_chat_history(self, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Summarizes older parts of the chat history if it exceeds a character limit.
        Keeps the last 2 messages (user + assistant) un-summarized for immediate context.
        Returns the new, potentially summarized, chat history.
        """
        if not history:
            return []
        num_messages_to_keep = 2
        if len(history) <= num_messages_to_keep:
            return history
        # Split history into recent and older parts
        recent_history = history[-num_messages_to_keep:]
        older_history = history[:-num_messages_to_keep]

        older_history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in older_history])

        print(f"Summarizing chat history (length: {len(older_history_str)} chars)...")

        summarization_prompt = self.history_summarizer_prompt_template.format(
            chat_history=older_history_str
        )

        try:
            summary_message = self._call_llm(
                messages=[{"role": "user", "content": summarization_prompt}],
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                max_tokens=500 
            )
            print("Chat history summarized.")
            # Prepend the summary as an "assistant" message to represent the summarized context
            # and then add the recent history back.
            summarized_history = [{"role": "assistant", "content": f"Previous conversation summary: {summary_message}"}]
            return summarized_history + recent_history
        except Exception as e:
            print(f"Failed to summarize chat history: {e}. Returning original history.")
            return history # Fallback to original history if summarization fails


    # --- EXISTING LLM SERVICE METHODS (summarize_text, augment_criteria, generate_form) ---
    def summarize_text(self, text_content: str, summary_context: str, length_preference: str = "200 words"):
        prompt = self.summary_prompt_template.format(
            text_content=text_content,
            summary_context=summary_context,
            length_preference=length_preference
        )
        messages = [{"role": "user", "content": prompt}]
        return self._call_llm(messages)

    def augment_criteria(self, researcher_input: str):
        prompt = self.criteria_augment_prompt_template.format(researcher_input=researcher_input)
        messages = [{"role": "user", "content": prompt}]
        raw_json_str = self._call_llm(messages, json_mode=True)
        return raw_json_str

    def generate_form(self, study_objectives: str):
        prompt = self.form_generate_prompt_template.format(study_objectives=study_objectives)
        messages = [{"role": "user", "content": prompt}]
        raw_json_schema = self._call_llm(messages, json_mode=True)
        return raw_json_schema

    # --- ENHANCED answer_question_with_rag FOR MULTI-HOP REASONING & HISTORY SUMMARIZATION ---
    async def answer_question_with_rag(self, question: str, num_context_chunks: int = 5, chat_history: Optional[List[Dict[str, str]]] = None):
        """
        Answers a question using Retrieval Augmented Generation (RAG) with multi-hop reasoning
        and chat history summarization.
        """
        history_was_summarized = False
        processed_chat_history_for_llm = []

        if chat_history:
            # Check if history needs summarization
            total_history_chars = self._get_message_char_count(chat_history)
            if total_history_chars > CHAT_HISTORY_MAX_CHARS:
                print(f"Chat history (approx {total_history_chars} chars) exceeds limit {CHAT_HISTORY_MAX_CHARS}. Summarizing...")
                processed_chat_history_for_llm = await self._summarize_long_chat_history(chat_history)
                history_was_summarized = True
            else:
                processed_chat_history_for_llm = chat_history
            print(f"Processed chat history length for LLM: {self._get_message_char_count(processed_chat_history_for_llm)} chars")

        if not self.vectorstore:
            return {
                "answer": "Knowledge base not initialized or empty. Please upload documents.",
                "sources": [],
                "retrieved_chunks": [],
                "llm_raw_output": "N/A",
                "error": "Knowledge base unavailable",
                "history_summarized": history_was_summarized
            }

        try:
            # 1. Multi-Query Generation for Enhanced Retrieval
            retriever_from_llm = MultiQueryRetriever.from_llm(
                retriever=self.vectorstore.as_retriever(search_kwargs={"k": num_context_chunks}),
                llm=self.langchain_llm,
            )

            retrieved_docs = await retriever_from_llm.ainvoke(question)

            context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
            sources = sorted(list(set([
                f"{doc.metadata.get('source', 'Unknown Source')}{' (Page ' + str(doc.metadata['page']) + ')' if 'page' in doc.metadata else ''}"
                for doc in retrieved_docs
            ])))
            retrieved_chunks = [doc.page_content for doc in retrieved_docs]

            # 2. Construct messages for the final LLM call
            # Start with processed chat history
            messages_for_llm = []
            for msg in processed_chat_history_for_llm:
                messages_for_llm.append({"role": msg['role'], "content": msg['content']})

            # Add the RAG prompt with context and the current question
            final_rag_prompt_content = self.qna_prompt_template.format(
                context=context_text,
                question=question
            )
            messages_for_llm.append({"role": "user", "content": final_rag_prompt_content})

            print(f"Sending final RAG prompt to LLM (total messages: {len(messages_for_llm)}).")
            # Use _call_llm for the final answer
            answer = self._call_llm(
                messages=messages_for_llm,
                model=self.langchain_llm.model_name,
                max_tokens=2000, # Max tokens for the answer
            )

            return {
                "answer": answer,
                "sources": sources,
                "retrieved_chunks": retrieved_chunks,
                "llm_raw_output": answer, # Raw output is the answer here
                "history_summarized": history_was_summarized
            }
        except Exception as e:
            print(f"Error in RAG process: {e}")
            return {
                "answer": f"An error occurred while trying to answer your question: {e}",
                "sources": [],
                "retrieved_chunks": [],
                "llm_raw_output": f"Error: {e}",
                "error": str(e),
                "history_summarized": history_was_summarized
            }