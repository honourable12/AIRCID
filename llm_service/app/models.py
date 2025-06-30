from pydantic import BaseModel, Field
from typing import List, Optional

class CriteriaAugmentRequest(BaseModel):
    researcher_input: str = Field(..., description="The researcher's natural language input for criteria.")

class SuggestedRule(BaseModel):
    description: str = Field(..., description="A clear description of the suggested rule.")
    structured_format: Optional[str] = Field(None, description="An optional structured format for the rule (e.g., JSON, YAML, pseudocode).")

class CriteriaAugmentResponse(BaseModel):
    clearer_wording: str = Field(..., description="The LLM's suggestion for clearer wording of the input criteria.")
    suggested_rules: List[SuggestedRule] = Field(..., description="A list of structured rules suggested by the LLM.")
    llm_raw_output: Optional[str] = Field(None, description="The raw output from the LLM for debugging/inspection.")