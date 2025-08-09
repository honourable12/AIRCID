from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class MatchConfidence(str, Enum):
    """Confidence levels for patient matching"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    EXCLUDED = "excluded"


class MatchReason(BaseModel):
    """Reason for match or exclusion"""
    criteria_id: str = Field(..., description="ID of the criteria that triggered this reason")
    criteria_description: str = Field(..., description="Description of the criteria")
    matched: bool = Field(..., description="Whether this criteria was matched")
    score: float = Field(..., description="Score for this criteria (0.0 to 1.0)")
    details: Optional[str] = Field(None, description="Additional details about the match")
    evidence: Optional[Dict[str, Any]] = Field(None, description="Supporting evidence for the match")


class MatchResult(BaseModel):
    """Result of AI case matching for a patient"""
    patient_id: str = Field(..., description="Patient identifier")
    study_id: str = Field(..., description="Study identifier")
    is_eligible: bool = Field(..., description="Whether patient is eligible for the study")
    confidence: MatchConfidence = Field(..., description="Confidence level of the match")
    overall_score: float = Field(..., description="Overall match score (0.0 to 1.0)")
    inclusion_score: float = Field(..., description="Score for inclusion criteria (0.0 to 1.0)")
    exclusion_score: float = Field(..., description="Score for exclusion criteria (0.0 to 1.0)")
    match_reasons: List[MatchReason] = Field(..., description="Detailed reasons for match/exclusion")
    matched_criteria: List[str] = Field(..., description="List of criteria IDs that were matched")
    excluded_criteria: List[str] = Field(..., description="List of criteria IDs that caused exclusion")
    primary_reason: Optional[str] = Field(None, description="Primary reason for eligibility/ineligibility")
    recommendations: Optional[List[str]] = Field(None, description="Recommendations for manual review")
    requires_manual_review: bool = Field(False, description="Whether manual review is recommended")
    matched_at: datetime = Field(..., description="When the matching was performed")
    processing_time_ms: Optional[int] = Field(None, description="Time taken to process in milliseconds")
    additional_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional result metadata") 