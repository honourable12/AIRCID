#!/usr/bin/env python3
"""
Simple test script for the AI Case Matching Service
"""

import asyncio
import json
from datetime import date
from app.models import (
    Patient, PatientDemographics, StudyCriteria, 
    InclusionCriteria, ExclusionCriteria, CriteriaType
)
from app.services.matching_service import MatchingService


async def test_basic_matching():
    """Test basic patient matching functionality"""
    print("Testing AI Case Matching Service...")
    
    # Create matching service
    matching_service = MatchingService()
    
    # Create sample patient
    demographics = PatientDemographics(
        patient_id="P12345",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1980, 5, 15),
        gender="Male"
    )
    
    patient = Patient(
        demographics=demographics,
        diagnoses=["Brain tumor", "Glioblastoma"],
        medications=["Temozolomide", "Dexamethasone"],
        clinical_notes=["Patient presents with severe headache and confusion"]
    )
    
    # Create sample study criteria
    inclusion_criteria = [
        InclusionCriteria(
            criteria_id="INC001",
            criteria_type=CriteriaType.DIAGNOSIS,
            field_name="diagnoses",
            operator="contains",
            value="tumor",
            description="Patient must have brain tumor diagnosis"
        ),
        InclusionCriteria(
            criteria_id="INC002",
            criteria_type=CriteriaType.AGE_RANGE,
            field_name="age",
            operator=">=",
            value=18,
            description="Patient must be 18 or older"
        )
    ]
    
    exclusion_criteria = [
        ExclusionCriteria(
            criteria_id="EXC001",
            criteria_type=CriteriaType.MEDICATION,
            field_name="medications",
            operator="contains",
            value="warfarin",
            description="Patients on warfarin are excluded"
        )
    ]
    
    study_criteria = StudyCriteria(
        study_id="ST001",
        study_name="Brain Tumor Study",
        study_description="Study for patients with brain tumors",
        inclusion_criteria=inclusion_criteria,
        exclusion_criteria=exclusion_criteria,
        minimum_match_score=0.7
    )
    
    # Test patient matching
    print("Matching patient against study criteria...")
    result = await matching_service.match_patient(patient, study_criteria)
    
    # Print results
    print(f"\nResults:")
    print(f"Patient ID: {result.patient_id}")
    print(f"Study ID: {result.study_id}")
    print(f"Eligible: {result.is_eligible}")
    print(f"Overall Score: {result.overall_score:.3f}")
    print(f"Inclusion Score: {result.inclusion_score:.3f}")
    print(f"Exclusion Score: {result.exclusion_score:.3f}")
    print(f"Confidence: {result.confidence}")
    print(f"Primary Reason: {result.primary_reason}")
    print(f"Requires Manual Review: {result.requires_manual_review}")
    
    print(f"\nMatch Reasons:")
    for reason in result.match_reasons:
        print(f"  - {reason.criteria_description}: {'✓' if reason.matched else '✗'} (Score: {reason.score:.3f})")
    
    if result.recommendations:
        print(f"\nRecommendations:")
        for rec in result.recommendations:
            print(f"  - {rec}")
    
    # Test criteria validation
    print(f"\nValidating study criteria...")
    validation_result = await matching_service.validate_criteria(study_criteria)
    print(f"Valid: {validation_result['valid']}")
    print(f"Errors: {validation_result['errors']}")
    print(f"Warnings: {validation_result['warnings']}")
    
    print("\nTest completed successfully!")


async def test_exclusion_case():
    """Test patient exclusion scenario"""
    print("\nTesting exclusion case...")
    
    matching_service = MatchingService()
    
    # Create young patient (should be excluded)
    demographics = PatientDemographics(
        patient_id="P12346",
        first_name="Jane",
        last_name="Smith",
        date_of_birth=date(2010, 3, 10),  # 13 years old
        gender="Female"
    )
    
    young_patient = Patient(
        demographics=demographics,
        diagnoses=["Brain tumor"],
        medications=["Temozolomide"]
    )
    
    # Same study criteria as before
    inclusion_criteria = [
        InclusionCriteria(
            criteria_id="INC001",
            criteria_type=CriteriaType.DIAGNOSIS,
            field_name="diagnoses",
            operator="contains",
            value="tumor",
            description="Patient must have brain tumor diagnosis"
        ),
        InclusionCriteria(
            criteria_id="INC002",
            criteria_type=CriteriaType.AGE_RANGE,
            field_name="age",
            operator=">=",
            value=18,
            description="Patient must be 18 or older"
        )
    ]
    
    study_criteria = StudyCriteria(
        study_id="ST001",
        study_name="Brain Tumor Study",
        inclusion_criteria=inclusion_criteria,
        minimum_match_score=0.7
    )
    
    result = await matching_service.match_patient(young_patient, study_criteria)
    
    print(f"Patient ID: {result.patient_id}")
    print(f"Eligible: {result.is_eligible}")
    print(f"Overall Score: {result.overall_score:.3f}")
    print(f"Primary Reason: {result.primary_reason}")
    
    print("Exclusion test completed!")


if __name__ == "__main__":
    # Run tests
    asyncio.run(test_basic_matching())
    asyncio.run(test_exclusion_case()) 