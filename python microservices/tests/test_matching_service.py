import pytest
from datetime import date, datetime
from app.models import Patient, PatientDemographics, StudyCriteria, InclusionCriteria, CriteriaType
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
            gender="Male"
        )
        
        return Patient(
            demographics=demographics,
            diagnoses=["Brain tumor", "Glioblastoma"],
            medications=["Temozolomide", "Dexamethasone"],
            clinical_notes=["Patient presents with severe headache and confusion"]
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
        
        return StudyCriteria(
            study_id="ST001",
            study_name="Brain Tumor Study",
            inclusion_criteria=inclusion_criteria,
            minimum_match_score=0.7
        )
    
    @pytest.mark.asyncio
    async def test_match_patient_success(self, matching_service, sample_patient, sample_study_criteria):
        """Test successful patient matching"""
        result = await matching_service.match_patient(sample_patient, sample_study_criteria)
        
        assert result.patient_id == "P12345"
        assert result.study_id == "ST001"
        assert result.is_eligible is True
        assert result.overall_score > 0.7
        assert len(result.match_reasons) == 2
    
    @pytest.mark.asyncio
    async def test_match_patient_age_exclusion(self, matching_service, sample_study_criteria):
        """Test patient matching with age exclusion"""
        # Create patient under 18
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
        
        result = await matching_service.match_patient(young_patient, sample_study_criteria)
        
        assert result.is_eligible is False
        assert result.overall_score == 0.0
    
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
        invalid_criteria = StudyCriteria(
            study_id="ST002",
            study_name="Invalid Study",
            inclusion_criteria=[
                InclusionCriteria(
                    criteria_id="",  # Empty ID
                    criteria_type=CriteriaType.DIAGNOSIS,
                    field_name="",  # Empty field name
                    operator="contains",
                    value="test",
                    description="Invalid criteria"
                )
            ]
        )
        
        result = await matching_service.validate_criteria(invalid_criteria)
        
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