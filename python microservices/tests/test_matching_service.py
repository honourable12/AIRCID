import pytest
from datetime import date, datetime
from app.models import Patient, PatientDemographics, StudyCriteria, InclusionCriteria, CriteriaType, ExclusionCriteria
from app.services.matching_service import MatchingService


class TestMatchingService:
    """Test cases for the MatchingService"""
    
    @pytest.fixture
    def matching_service(self):
        """Create a matching service instance"""
        return MatchingService()
    
    @pytest.fixture
    def sample_patient(self):
        """Create a sample patient for testing"""
        demographics = PatientDemographics(
            patient_id="P12345",
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1980, 5, 15),
            gender="Male",
            ethnicity=None,
            race=None,
            contact_info=None
        )
        
        return Patient(
            demographics=demographics,
            vitals=None,
            labs=None,
            imaging=None,
            diagnoses=["Brain tumor", "Glioblastoma"],
            medications=["Temozolomide", "Dexamethasone"],
            procedures=None,
            clinical_notes=["Patient presents with severe headache and confusion"],
            admission_date=None,
            discharge_date=None,
            emergency_contact=None,
            insurance_info=None,
            additional_data=None
        )
    
    @pytest.fixture
    def sample_study_criteria(self):
        """Create sample study criteria for testing"""
        inclusion_criteria = [
            InclusionCriteria(
                criteria_id="INC001",
                criteria_type=CriteriaType.DIAGNOSIS,
                field_name="diagnoses",
                operator="contains",
                value="tumor",
                description="Patient must have brain tumor diagnosis",
                is_required=True,
                weight=1.0,
                nlp_keywords=None,
                custom_logic=None
            ),
            InclusionCriteria(
                criteria_id="INC002",
                criteria_type=CriteriaType.AGE_RANGE,
                field_name="age",
                operator=">=",
                value=18,
                description="Patient must be 18 or older",
                is_required=True,
                weight=1.0,
                nlp_keywords=None,
                custom_logic=None
            )
        ]
        
        exclusion_criteria = [
            ExclusionCriteria(
                criteria_id="EXC001",
                criteria_type=CriteriaType.MEDICATION,
                field_name="medications",
                operator="contains",
                value="warfarin",
                description="Patients on warfarin are excluded",
                is_required=True,
                nlp_keywords=None,
                custom_logic=None
            )
        ]
        
        return StudyCriteria(
            study_id="ST001",
            study_name="Brain Tumor Study",
            study_description="Study for patients with brain tumors",
            inclusion_criteria=inclusion_criteria,
            exclusion_criteria=exclusion_criteria,
            minimum_match_score=0.7,
            priority_score=1.0,
            is_active=True,
            created_at=None,
            updated_at=None,
            created_by=None,
            additional_metadata=None
        )
    
    @pytest.mark.asyncio
    async def test_match_patient_success(self, matching_service, sample_patient, sample_study_criteria):
        """Test successful patient matching"""
        result = await matching_service.match_patient(sample_patient, sample_study_criteria)
        
        assert result.patient_id == "P12345"
        assert result.study_id == "ST001"
        assert result.is_eligible is True
        assert result.overall_score > 0.7
        # Updated: Expect 3 reasons (2 inclusion + 1 exclusion)
        assert len(result.match_reasons) == 3
    
    @pytest.mark.asyncio
    async def test_match_patient_age_exclusion(self, matching_service, sample_study_criteria):
        """Test patient matching with age exclusion"""
        # Create patient under 18
        demographics = PatientDemographics(
            patient_id="P12346",
            first_name="Jane",
            last_name="Smith",
            date_of_birth=date(2010, 3, 10),  # 13 years old
            gender="Female",
            ethnicity=None,
            race=None,
            contact_info=None
        )
        
        young_patient = Patient(
            demographics=demographics,
            vitals=None,
            labs=None,
            imaging=None,
            diagnoses=["Brain tumor"],
            medications=["Temozolomide"],
            procedures=None,
            clinical_notes=["Patient presents with severe headache and confusion"],
            admission_date=None,
            discharge_date=None,
            emergency_contact=None,
            insurance_info=None,
            additional_data=None
        )
        
        result = await matching_service.match_patient(young_patient, sample_study_criteria)
        # Updated: This should be False if matching logic is correct
        assert result.is_eligible is False, "Patient under 18 should not be eligible (check matching logic)"
    
    @pytest.mark.asyncio
    async def test_validate_criteria_success(self, matching_service, sample_study_criteria):
        """Test criteria validation success"""
        result = await matching_service.validate_criteria(sample_study_criteria)
        
        assert result["valid"] is True
        assert len(result["errors"]) == 0
        assert result["criteria_count"]["inclusion"] == 2
    
    @pytest.mark.asyncio
    async def test_validate_criteria_failure(self, matching_service):
        """Test criteria validation failure"""
        # Create invalid criteria
        study_criteria = StudyCriteria(
            study_id="ST002",
            study_name="Invalid Study",
            study_description=None,
            inclusion_criteria=[
                InclusionCriteria(
                    criteria_id="",  # Empty ID
                    criteria_type=CriteriaType.DIAGNOSIS,
                    field_name="",  # Empty field name
                    operator="contains",
                    value="test",
                    description="Invalid criteria",
                    is_required=True,
                    weight=1.0,
                    nlp_keywords=None,
                    custom_logic=None
                )
            ],
            exclusion_criteria=None,
            minimum_match_score=0.7,
            priority_score=1.0,
            is_active=True,
            created_at=None,
            updated_at=None,
            created_by=None,
            additional_metadata=None
        )
        
        result = await matching_service.validate_criteria(study_criteria)
        
        assert result["valid"] is False
        assert len(result["errors"]) > 0
    
    def test_calculate_overall_score(self, matching_service):
        """Test overall score calculation"""
        # Test exclusion case
        score = matching_service._calculate_overall_score(0.8, 1.0)
        assert score == 0.0
        
        # Test inclusion case
        score = matching_service._calculate_overall_score(0.8, 0.0)
        assert score == 0.8
    
    def test_determine_eligibility(self, matching_service):
        """Test eligibility determination"""
        # Test eligible case
        is_eligible = matching_service._determine_eligibility(0.8, 0.8, 0.0, 0.7)
        assert is_eligible is True
        
        # Test ineligible case
        is_eligible = matching_service._determine_eligibility(0.5, 0.5, 0.0, 0.7)
        assert is_eligible is False
        
        # Test exclusion case
        is_eligible = matching_service._determine_eligibility(0.0, 0.8, 1.0, 0.7)
        assert is_eligible is False
    
    def test_determine_confidence(self, matching_service):
        """Test confidence level determination"""
        from app.models import MatchConfidence
        
        # Test high confidence
        confidence = matching_service._determine_confidence(0.95, 0.95, 0.0)
        assert confidence == MatchConfidence.HIGH
        
        # Test medium confidence
        confidence = matching_service._determine_confidence(0.75, 0.75, 0.0)
        assert confidence == MatchConfidence.MEDIUM
        
        # Test low confidence
        confidence = matching_service._determine_confidence(0.5, 0.5, 0.0)
        assert confidence == MatchConfidence.LOW
        
        # Test excluded
        confidence = matching_service._determine_confidence(0.0, 0.8, 1.0)
        assert confidence == MatchConfidence.EXCLUDED 