from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from enum import Enum
from pydantic import BaseModel, Field


class CriteriaType(str, Enum):
    """Types of criteria for study inclusion/exclusion"""
    AGE_RANGE = "age_range"
    GENDER = "gender"
    DIAGNOSIS = "diagnosis"
    LAB_VALUE = "lab_value"
    VITAL_SIGN = "vital_sign"
    MEDICATION = "medication"
    PROCEDURE = "procedure"
    IMAGING_FINDING = "imaging_finding"
    CLINICAL_NOTE = "clinical_note"
    CUSTOM_RULE = "custom_rule"


class InclusionCriteria(BaseModel):
    """Criteria that must be met for patient inclusion"""
    criteria_id: str = Field(..., description="Unique identifier for this criteria")
    criteria_type: CriteriaType = Field(..., description="Type of criteria")
    field_name: str = Field(..., description="Field to evaluate (e.g., 'age', 'diagnosis')")
    operator: str = Field(..., description="Comparison operator (e.g., '>=', '==', 'contains')")
    value: Union[str, int, float, List[str]] = Field(..., description="Value to compare against")
    description: str = Field(..., description="Human-readable description of the criteria")
    is_required: bool = Field(True, description="Whether this criteria is mandatory")
    weight: Optional[float] = Field(1.0, description="Weight for scoring (0.0 to 1.0)")
    nlp_keywords: Optional[List[str]] = Field(None, description="Keywords for NLP-based matching")
    custom_logic: Optional[str] = Field(None, description="Custom logic expression if needed")


class ExclusionCriteria(BaseModel):
    """Criteria that exclude patients from the study"""
    criteria_id: str = Field(..., description="Unique identifier for this criteria")
    criteria_type: CriteriaType = Field(..., description="Type of criteria")
    field_name: str = Field(..., description="Field to evaluate")
    operator: str = Field(..., description="Comparison operator")
    value: Union[str, int, float, List[str]] = Field(..., description="Value to compare against")
    description: str = Field(..., description="Human-readable description of the criteria")
    is_required: bool = Field(True, description="Whether this criteria is mandatory")
    nlp_keywords: Optional[List[str]] = Field(None, description="Keywords for NLP-based matching")
    custom_logic: Optional[str] = Field(None, description="Custom logic expression if needed")


class StudyCriteria(BaseModel):
    """Complete study criteria definition for AI case matching"""
    study_id: str = Field(..., description="Unique study identifier")
    study_name: str = Field(..., description="Name of the research study")
    study_description: Optional[str] = Field(None, description="Description of the study")
    inclusion_criteria: List[InclusionCriteria] = Field(..., description="Criteria for patient inclusion")
    exclusion_criteria: Optional[List[ExclusionCriteria]] = Field(None, description="Criteria for patient exclusion")
    minimum_match_score: Optional[float] = Field(0.7, description="Minimum score for patient to be considered eligible")
    priority_score: Optional[float] = Field(1.0, description="Priority weight for this study")
    is_active: bool = Field(True, description="Whether the study is currently active")
    created_at: Optional[datetime] = Field(None, description="When the criteria was created")
    updated_at: Optional[datetime] = Field(None, description="When the criteria was last updated")
    created_by: Optional[str] = Field(None, description="User who created the criteria")
    additional_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional study metadata") 