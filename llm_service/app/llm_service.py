import os
from typing import Optional
from groq import Groq
from dotenv import load_dotenv
import json
import jsonschema

load_dotenv()

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
