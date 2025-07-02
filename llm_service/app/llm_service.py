import os
from typing import Optional
from groq import Groq
from dotenv import load_dotenv
import json
import jsonschema
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from app.db_utils import init_db

CHROMA_PERSIST_DIRECTORY = "chroma_db"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

init_db()
load_dotenv()

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        if not self.client.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables. Please set it in your .env file.")
        if not hasattr(self, '_embeddings'):
            print(f"Initializing embedding model for RAG queries: {EMBEDDING_MODEL_NAME}")
            self._embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

        # Initialize ChromaDB vector store
        if not hasattr(self, '_vectorstore'):
            print(f"Loading ChromaDB from: {CHROMA_PERSIST_DIRECTORY}")
            try:
                # This will load the existing DB. If it's empty, it won't have docs.
                # It will NOT create an empty one if the directory doesn't exist,
                # but it will initialize an empty client if the collection is empty.
                self._vectorstore = Chroma(
                    persist_directory=CHROMA_PERSIST_DIRECTORY,
                    embedding_function=self._embeddings
                )
                print("ChromaDB loaded successfully.")
                # You can add a check here if self.vectorstore.get()['ids'] is empty to suggest indexing.
            except Exception as e:
                print(f"Error loading ChromaDB: {e}. Ensure utils/kb_builder.py or /documents/upload has been run to populate it.")
                self._vectorstore = None # Handle case where DB isn't ready
                # We could also create an empty one here if it's truly not found:
                # self._vectorstore = Chroma(embedding_function=self._embeddings, persist_directory=CHROMA_PERSIST_DIRECTORY)

    @property
    def embeddings(self):
        return self._embeddings

    @property
    def vectorstore(self):
        return self._vectorstore

    def augment_criteria(self, researcher_input: str) -> dict:
        """
        Sends the researcher's input to the LLM and returns refined suggestions.
        """
        # --- Prompt Engineering ---
        prompt = f"""
        You are an intelligent assistant specialized in refining research criteria.
        Your task is to take a researcher's natural language input for criteria and
        suggest clearer, more precise wording. Additionally, you should propose
        potential structured rules that could be derived from the input.

        The output should be in a structured format that can be easily parsed.
        Please provide:
        1. A 'clearer_wording' field with the refined natural language.
        2. A 'suggested_rules' field, which is a list of objects. Each object
           should have a 'description' (clear rule description) and optionally
           a 'structured_format' (e.g., a pseudo-code, JSON snippet, or formal
           notation if applicable).

        Here is the researcher's input:
        "{researcher_input}"

        Example Output Structure (important for parsing):
        ```json
        {{
            "clearer_wording": "Refined and clearer statement of the criteria.",
            "suggested_rules": [
                {{
                    "description": "Rule description 1.",
                    "structured_format": "Optional structured format for rule 1 (e.g., 'IF condition THEN action')"
                }},
                {{
                    "description": "Rule description 2.",
                    "structured_format": null
                }}
            ]
        }}
        ```
        Please provide only the JSON output, without any additional text or formatting outside the JSON block.
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="meta-llama/llama-4-scout-17b-16e-instruct", 
                response_format={"type": "json_object"}, # structured output
                temperature=0.7, 
                max_tokens=1024 #output length
            )
            llm_output_content = chat_completion.choices[0].message.content
            parsed_output = json.loads(llm_output_content)
            return {
                "clearer_wording": parsed_output.get("clearer_wording", "No clearer wording provided."),
                "suggested_rules": parsed_output.get("suggested_rules", []),
                "llm_raw_output": llm_output_content # Included raw output for debugging
            }
        except Exception as e:
            print(f"Error communicating with LLM for criteria augmentation: {e}")
            return {
                "clearer_wording": f"Error: Could not process request. {e}",
                "suggested_rules": [],
                "llm_raw_output": f"Error: {e}"
            }

    def generate_json_schema(self, study_objectives: str, additional_context: Optional[str] = None) -> dict:
        """
        Instructs the LLM to generate a valid JSON Schema for a data collection form.
        """
        # --- Prompt Engineering for JSON Schema Generation ---
        prompt = f"""
        You are an expert in data modeling and JSON Schema.
        Your task is to generate a valid JSON Schema for a data collection form
        based on the provided study objectives. The schema should define the
        fields, their types, descriptions, and any relevant validation rules
        (e.g., required fields, min/max lengths, patterns, enums).

        The output MUST be a complete and valid JSON Schema object.
        Ensure it adheres to the JSON Schema Draft 7 standard (or a commonly
        used draft like 2020-12).

        Study Objectives:
        "{study_objectives}"

        {'Additional Context/Requirements: ' + additional_context if additional_context else ''}

        Consider common data types like string, number, integer, boolean, array, object.
        For example, if you need a date, use type "string" with "format": "date" or "date-time".
        For multiple choice, use "enum" or an array of strings.

        Example of a simple JSON Schema:
        ```json
        {{
            "$schema": "[http://json-schema.org/draft-07/schema#](http://json-schema.org/draft-07/schema#)",
            "title": "Patient Enrollment Form",
            "description": "Schema for collecting patient enrollment data.",
            "type": "object",
            "properties": {{
                "patientName": {{
                    "type": "string",
                    "description": "Full name of the patient.",
                    "minLength": 3
                }},
                "age": {{
                    "type": "integer",
                    "description": "Age of the patient in years.",
                    "minimum": 0,
                    "maximum": 120
                }},
                "gender": {{
                    "type": "string",
                    "description": "Patient's gender.",
                    "enum": ["Male", "Female", "Other", "Prefer not to say"]
                }},
                "diagnosisDate": {{
                    "type": "string",
                    "format": "date",
                    "description": "Date of diagnosis."
                }}
            }},
            "required": ["patientName", "age", "gender"]
        }}
        ```
        Please provide only the JSON Schema output, without any additional text or formatting outside the JSON block.
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                response_format={"type": "json_object"}, # structured JSON output
                temperature=0.7, 
                max_tokens=2048 
            )
            llm_output_content = chat_completion.choices[0].message.content

            # --- Validation Logic ---
            try:
                generated_schema = json.loads(llm_output_content)
                # Validate the schema structure
                if not isinstance(generated_schema, dict) or "$schema" not in generated_schema:
                    raise ValueError("LLM output is not a valid JSON Schema structure.")

                return {
                    "json_schema": generated_schema,
                    "llm_raw_output": llm_output_content
                }
            except (json.JSONDecodeError, ValueError, jsonschema.exceptions.ValidationError) as e:
                print(f"LLM output is not valid JSON or JSON Schema: {e}")
                return {
                    "json_schema": {}, # Return empty schema on failure
                    "llm_raw_output": llm_output_content, # included raw output for debugging
                    "error": f"LLM generated invalid JSON or JSON Schema: {e}"
                }

        except Exception as e:
            print(f"Error communicating with LLM for JSON Schema generation: {e}")
            return {
                "json_schema": {}, # Return empty schema on failure
                "llm_raw_output": f"Error: {e}",
                "error": f"Internal LLM communication error: {e}"
            }
            
    def summarize_text(self, text_content: str, summary_context: str, target_length: Optional[str] = None) -> dict:
        """
        Uses the LLM to generate a concise summary of a given text block,
        tailoring the prompt based on the summary context.
        """
        # --- Prompt Engineering for Summarization ---
        base_prompt = "Please summarize the following text concisely and accurately."
        context_specific_instructions = ""

        if summary_context == "specialist_clinical":
            context_specific_instructions = "Focus on critical clinical details, diagnoses, treatments, and patient status for a medical specialist. Use medical terminology where appropriate."
        elif summary_context == "high_level_findings":
            context_specific_instructions = "Provide a high-level overview of the main findings or conclusions. Omit minor details and focus on the most impactful information."
        elif summary_context == "general":
            context_specific_instructions = "Provide a general summary suitable for a broad audience."
        # TODO: Add more context-specific instructions here as you define more SummaryContext types

        length_instruction = f" Ensure the summary is {target_length}." if target_length else ""

        full_prompt = f"""
        {base_prompt} {context_specific_instructions}{length_instruction}

        Here is the text to summarize:
        ---
        {text_content}
        ---

        Please provide only the summary text.
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": full_prompt,
                    }
                ],
                model="meta-llama/llama-4-scout-17b-16e-instruct",  
                temperature=0.3, 
                max_tokens=512 
            )
            summary_output = chat_completion.choices[0].message.content
            return {
                "summary": summary_output.strip(),
                "llm_raw_output": summary_output
            }
        except Exception as e:
            print(f"Error communicating with LLM for text summarization: {e}")
            return {
                "summary": f"Error: Could not generate summary. {e}",
                "llm_raw_output": f"Error: {e}"
            }


    def answer_question_with_rag(self, question: str, num_context_chunks: int = 5) -> dict:
        """
        Implements the RAG pipeline: retrieves context from vector DB and uses LLM to answer.
        """
        if not self.vectorstore:
            return {
                "answer": "Knowledge base not initialized or empty. Please upload documents.",
                "sources": [],
                "retrieved_chunks": [],
                "llm_raw_output": "N/A",
                "error": "Knowledge base unavailable"
            }

        try:
            # 1. Retrieve relevant document chunks
            print(f"Retrieving {num_context_chunks} relevant chunks for question: '{question}'")
            # The documents returned by ChromaDB are LangChain Document objects,
            # which have `page_content` (the text) and `metadata`.
            retrieved_docs_with_scores = self.vectorstore.similarity_search_with_score(question, k=num_context_chunks)

            context_texts = []
            source_list = []
            retrieved_chunks_content = []

            for doc, score in retrieved_docs_with_scores:
                context_texts.append(doc.page_content)
                retrieved_chunks_content.append(doc.page_content) # Store raw chunk content for response

                # Extract source information from metadata, which now includes 'db_id' and 'filename'
                source_info = doc.metadata.get('source', 'Unknown Source')
                # You can enrich this further if 'page' or other metadata were stored during indexing
                # Example: source_path = doc.metadata.get('source_path', 'N/A')
                # page_number = doc.metadata.get('page', 'N/A')
                # source_list.append(f"{source_info} (Path: {source_path}, Page: {page_number})")
                source_list.append(source_info) # Use the source field as indexed

                print(f"  - Retrieved chunk (Score: {score:.4f}): {doc.page_content[:100]}... (Source: {source_info})")

            context_string = "\n\n".join(context_texts)
            unique_sources = list(set(source_list)) # Get unique sources

            # 3. Prompt Engineering: Construct RAG prompt
            rag_prompt = f"""
            You are a helpful and knowledgeable assistant.
            Use the following pieces of context to answer the user's question.
            If you don't know the answer based on the provided context,
            simply state that you cannot find the answer in the provided information.
            Do NOT try to make up an answer.

            Context:
            ---
            {context_string}
            ---

            Question: {question}

            Answer:
            """

            # 4. Send the constructed prompt to the LLM
            print("Sending RAG prompt to LLM...")
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": rag_prompt,
                    }
                ],
                model="llama3-8b-8192",  # Use a suitable Groq model
                temperature=0.2, # Lower temperature for more factual, less creative answers
                max_tokens=1024 # Adjust based on expected answer length
            )
            llm_answer = chat_completion.choices[0].message.content.strip()

            return {
                "answer": llm_answer,
                "sources": unique_sources,
                "retrieved_chunks": retrieved_chunks_content,
                "llm_raw_output": llm_answer
            }

        except Exception as e:
            print(f"Error during RAG pipeline execution: {e}")
            return {
                "answer": f"An error occurred while trying to answer your question: {e}",
                "sources": [],
                "retrieved_chunks": [],
                "llm_raw_output": f"Error: {e}",
                "error": str(e)
            }
            