from fastapi import APIRouter, HTTPException
from app.models import CriteriaAugmentRequest, CriteriaAugmentResponse, SuggestedRule
from app.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

@router.post("/augment", response_model=CriteriaAugmentResponse)
async def augment_criteria_endpoint(request: CriteriaAugmentRequest):
    """
    Takes a researcher's natural language input for criteria and suggests
    clearer wording and potential structured rules using an LLM.
    """
    try:
        llm_suggestions = llm_service.augment_criteria(request.researcher_input)

        if "error" in llm_suggestions.get("clearer_wording", "").lower():
            raise HTTPException(status_code=500, detail=llm_suggestions["clearer_wording"])

        # Ensure suggested_rules are correctly parsed into SuggestedRule objects
        parsed_suggested_rules = []
        for rule_data in llm_suggestions.get("suggested_rules", []):
            try:
                parsed_suggested_rules.append(SuggestedRule(**rule_data))
            except Exception as e:
                print(f"Warning: Could not parse suggested rule: {rule_data}. Error: {e}")
                # Optionally, you can add a default or skip this rule
                parsed_suggested_rules.append(SuggestedRule(description=rule_data.get("description", "Malformed rule"), structured_format=None))


        return CriteriaAugmentResponse(
            clearer_wording=llm_suggestions["clearer_wording"],
            suggested_rules=parsed_suggested_rules,
            llm_raw_output=llm_suggestions.get("llm_raw_output")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")