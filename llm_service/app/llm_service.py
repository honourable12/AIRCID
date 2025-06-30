import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        if not self.client.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables. Please set it in your .env file.")

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
                model="llama3-8b-8192",  # Or another suitable Groq model like "mixtral-8x7b-32768"
                response_format={"type": "json_object"}, # This is crucial for getting structured output
                temperature=0.7, # Adjust creativity
                max_tokens=1024 # Adjust based on expected output length
            )
            llm_output_content = chat_completion.choices[0].message.content
            import json
            # Attempt to parse the JSON directly
            parsed_output = json.loads(llm_output_content)
            return {
                "clearer_wording": parsed_output.get("clearer_wording", "No clearer wording provided."),
                "suggested_rules": parsed_output.get("suggested_rules", []),
                "llm_raw_output": llm_output_content # Include raw output for debugging
            }
        except Exception as e:
            print(f"Error communicating with LLM: {e}")
            return {
                "clearer_wording": f"Error: Could not process request. {e}",
                "suggested_rules": [],
                "llm_raw_output": f"Error: {e}"
            }