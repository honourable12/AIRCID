from typing import List, Dict, Any, Optional
from datetime import datetime, date
import math
from loguru import logger

from app.models import Patient, StudyCriteria, MatchResult, MatchConfidence, MatchReason
from app.services.nlp_service import NLPService


class MatchingService:
    """Core service for AI-powered patient case matching"""
    
    def __init__(self):
        self.nlp_service = NLPService()
        logger.info("MatchingService initialized")
    
    async def match_patient(self, patient: Patient, study_criteria: StudyCriteria) -> MatchResult:
        """
        Match a patient against study criteria using AI and rule-based logic
        
        Args:
            patient: Patient data to evaluate
            study_criteria: Study criteria to match against
            
        Returns:
            MatchResult: Detailed matching results
        """
        logger.info(f"Starting patient matching for patient {patient.demographics.patient_id}")
        
        # Initialize result
        match_reasons = []
        matched_criteria = []
        excluded_criteria = []
        
        # Process inclusion criteria
        inclusion_score, inclusion_reasons = await self._evaluate_inclusion_criteria(
            patient, study_criteria.inclusion_criteria
        )
        match_reasons.extend(inclusion_reasons)
        
        # Process exclusion criteria
        exclusion_score, exclusion_reasons = await self._evaluate_exclusion_criteria(
            patient, study_criteria.exclusion_criteria or []
        )
        match_reasons.extend(exclusion_reasons)
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(inclusion_score, exclusion_score)
        
        # Determine eligibility
        is_eligible = self._determine_eligibility(
            overall_score, 
            inclusion_score, 
            exclusion_score, 
            study_criteria.minimum_match_score
        )
        
        # Determine confidence level
        confidence = self._determine_confidence(overall_score, inclusion_score, exclusion_score)
        
        # Collect matched/excluded criteria IDs
        for reason in match_reasons:
            if reason.matched:
                matched_criteria.append(reason.criteria_id)
            else:
                excluded_criteria.append(reason.criteria_id)
        
        # Generate primary reason
        primary_reason = self._generate_primary_reason(match_reasons, is_eligible)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(match_reasons, overall_score)
        
        # Determine if manual review is needed
        requires_manual_review = self._needs_manual_review(overall_score, confidence, match_reasons)
        
        result = MatchResult(
            patient_id=patient.demographics.patient_id,
            study_id=study_criteria.study_id,
            is_eligible=is_eligible,
            confidence=confidence,
            overall_score=overall_score,
            inclusion_score=inclusion_score,
            exclusion_score=exclusion_score,
            match_reasons=match_reasons,
            matched_criteria=matched_criteria,
            excluded_criteria=excluded_criteria,
            primary_reason=primary_reason,
            recommendations=recommendations,
            requires_manual_review=requires_manual_review,
            matched_at=datetime.now()
        )
        
        logger.info(f"Patient matching completed for {patient.demographics.patient_id}. "
                   f"Eligible: {is_eligible}, Score: {overall_score:.3f}")
        
        return result
    
    async def _evaluate_inclusion_criteria(
        self, 
        patient: Patient, 
        inclusion_criteria: List[Any]
    ) -> tuple[float, List[MatchReason]]:
        """Evaluate inclusion criteria and return score and reasons"""
        total_score = 0.0
        total_weight = 0.0
        reasons = []
        
        for criteria in inclusion_criteria:
            score, reason = await self._evaluate_single_criteria(patient, criteria)
            reasons.append(reason)
            
            if reason.matched:
                weight = criteria.weight or 1.0
                total_score += score * weight
                total_weight += weight
        
        final_score = total_score / total_weight if total_weight > 0 else 0.0
        return final_score, reasons
    
    async def _evaluate_exclusion_criteria(
        self, 
        patient: Patient, 
        exclusion_criteria: List[Any]
    ) -> tuple[float, List[MatchReason]]:
        """Evaluate exclusion criteria and return score and reasons"""
        total_score = 0.0
        reasons = []
        
        for criteria in exclusion_criteria:
            score, reason = await self._evaluate_single_criteria(patient, criteria)
            reasons.append(reason)
            
            # For exclusion criteria, if any match, patient is excluded
            if reason.matched:
                total_score = 1.0  # Full exclusion score
                break
        
        return total_score, reasons
    
    async def _evaluate_single_criteria(self, patient: Patient, criteria: Any) -> tuple[float, MatchReason]:
        """Evaluate a single criteria against patient data"""
        try:
            score = 0.0
            matched = False
            details = ""
            evidence = {}
            
            if criteria.criteria_type.value == "age_range":
                score, matched, details, evidence = await self._evaluate_age_criteria(patient, criteria)
            elif criteria.criteria_type.value == "gender":
                score, matched, details, evidence = await self._evaluate_gender_criteria(patient, criteria)
            elif criteria.criteria_type.value == "diagnosis":
                score, matched, details, evidence = await self._evaluate_diagnosis_criteria(patient, criteria)
            elif criteria.criteria_type.value == "lab_value":
                score, matched, details, evidence = await self._evaluate_lab_criteria(patient, criteria)
            elif criteria.criteria_type.value == "vital_sign":
                score, matched, details, evidence = await self._evaluate_vital_criteria(patient, criteria)
            elif criteria.criteria_type.value == "medication":
                score, matched, details, evidence = await self._evaluate_medication_criteria(patient, criteria)
            elif criteria.criteria_type.value == "procedure":
                score, matched, details, evidence = await self._evaluate_procedure_criteria(patient, criteria)
            elif criteria.criteria_type.value == "imaging_finding":
                score, matched, details, evidence = await self._evaluate_imaging_criteria(patient, criteria)
            elif criteria.criteria_type.value == "clinical_note":
                score, matched, details, evidence = await self._evaluate_clinical_note_criteria(patient, criteria)
            elif criteria.criteria_type.value == "custom_rule":
                score, matched, details, evidence = await self._evaluate_custom_criteria(patient, criteria)
            else:
                details = f"Unknown criteria type: {criteria.criteria_type.value}"
            
            reason = MatchReason(
                criteria_id=criteria.criteria_id,
                criteria_description=criteria.description,
                matched=matched,
                score=score,
                details=details,
                evidence=evidence
            )
            
            return score, reason
            
        except Exception as e:
            logger.error(f"Error evaluating criteria {criteria.criteria_id}: {str(e)}")
            reason = MatchReason(
                criteria_id=criteria.criteria_id,
                criteria_description=criteria.description,
                matched=False,
                score=0.0,
                details=f"Error evaluating criteria: {str(e)}"
            )
            return 0.0, reason
    
    async def _evaluate_age_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate age-based criteria"""
        if not patient.demographics.date_of_birth:
            return 0.0, False, "Date of birth not available", {}
        
        # Calculate age
        today = date.today()
        age = today.year - patient.demographics.date_of_birth.year
        if today.month < patient.demographics.date_of_birth.month or (
            today.month == patient.demographics.date_of_birth.month and 
            today.day < patient.demographics.date_of_birth.day
        ):
            age -= 1
        
        # Evaluate based on operator
        operator = criteria.operator
        target_value = criteria.value
        
        if operator == ">=":
            matched = age >= target_value
            score = 1.0 if matched else 0.0
        elif operator == "<=":
            matched = age <= target_value
            score = 1.0 if matched else 0.0
        elif operator == ">":
            matched = age > target_value
            score = 1.0 if matched else 0.0
        elif operator == "<":
            matched = age < target_value
            score = 1.0 if matched else 0.0
        elif operator == "between":
            if isinstance(target_value, list) and len(target_value) == 2:
                min_age, max_age = target_value
                matched = min_age <= age <= max_age
                score = 1.0 if matched else 0.0
            else:
                matched = False
                score = 0.0
        else:
            matched = False
            score = 0.0
        
        details = f"Patient age: {age}, Criteria: {criteria.description}"
        evidence = {"patient_age": age, "criteria_value": target_value, "operator": operator}
        
        return score, matched, details, evidence
    
    async def _evaluate_gender_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate gender-based criteria"""
        patient_gender = patient.demographics.gender
        if not patient_gender:
            return 0.0, False, "Gender not available", {}
        
        operator = criteria.operator
        target_gender = criteria.value
        
        if operator == "==":
            matched = patient_gender.lower() == target_gender.lower()
        elif operator == "!=":
            matched = patient_gender.lower() != target_gender.lower()
        elif operator == "in":
            if isinstance(target_gender, list):
                matched = patient_gender.lower() in [g.lower() for g in target_gender]
            else:
                matched = False
        else:
            matched = False
        
        score = 1.0 if matched else 0.0
        details = f"Patient gender: {patient_gender}, Criteria: {criteria.description}"
        evidence = {"patient_gender": patient_gender, "criteria_value": target_gender, "operator": operator}
        
        return score, matched, details, evidence
    
    async def _evaluate_diagnosis_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate diagnosis-based criteria"""
        if not patient.diagnoses:
            return 0.0, False, "No diagnoses available", {}
        
        operator = criteria.operator
        target_diagnosis = criteria.value
        
        matched = False
        score = 0.0
        
        if operator == "==":
            matched = any(d.lower() == target_diagnosis.lower() for d in patient.diagnoses)
        elif operator == "contains":
            matched = any(target_diagnosis.lower() in d.lower() for d in patient.diagnoses)
        elif operator == "in":
            if isinstance(target_diagnosis, list):
                matched = any(d.lower() in [diag.lower() for diag in target_diagnosis] for d in patient.diagnoses)
            else:
                matched = False
        elif operator == "not_in":
            if isinstance(target_diagnosis, list):
                matched = not any(d.lower() in [diag.lower() for diag in target_diagnosis] for d in patient.diagnoses)
            else:
                matched = True
        
        score = 1.0 if matched else 0.0
        details = f"Patient diagnoses: {patient.diagnoses}, Criteria: {criteria.description}"
        evidence = {"patient_diagnoses": patient.diagnoses, "criteria_value": target_diagnosis, "operator": operator}
        
        return score, matched, details, evidence
    
    async def _evaluate_lab_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate laboratory value criteria"""
        if not patient.labs:
            return 0.0, False, "No lab results available", {}
        
        # Find matching lab test
        matching_labs = [lab for lab in patient.labs if lab.test_name.lower() == criteria.field_name.lower()]
        if not matching_labs:
            return 0.0, False, f"No lab test '{criteria.field_name}' found", {}
        
        # Use most recent lab result
        latest_lab = max(matching_labs, key=lambda x: x.collected_at or datetime.min)
        
        operator = criteria.operator
        target_value = criteria.value
        
        matched = False
        score = 0.0
        
        if operator == "==":
            matched = latest_lab.test_value == target_value
        elif operator == ">=":
            matched = latest_lab.test_value >= target_value
        elif operator == "<=":
            matched = latest_lab.test_value <= target_value
        elif operator == ">":
            matched = latest_lab.test_value > target_value
        elif operator == "<":
            matched = latest_lab.test_value < target_value
        elif operator == "between":
            if isinstance(target_value, list) and len(target_value) == 2:
                min_val, max_val = target_value
                matched = min_val <= latest_lab.test_value <= max_val
            else:
                matched = False
        elif operator == "abnormal":
            matched = latest_lab.is_abnormal or False
        
        score = 1.0 if matched else 0.0
        details = f"Lab test '{latest_lab.test_name}': {latest_lab.test_value} {latest_lab.unit}, Criteria: {criteria.description}"
        evidence = {
            "lab_test": latest_lab.test_name,
            "lab_value": latest_lab.test_value,
            "unit": latest_lab.unit,
            "criteria_value": target_value,
            "operator": operator
        }
        
        return score, matched, details, evidence
    
    async def _evaluate_vital_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate vital sign criteria"""
        if not patient.vitals:
            return 0.0, False, "No vital signs available", {}
        
        # Use most recent vitals
        latest_vitals = max(patient.vitals, key=lambda x: x.recorded_at or datetime.min)
        
        # Get the specific vital sign
        vital_value = getattr(latest_vitals, criteria.field_name, None)
        if vital_value is None:
            return 0.0, False, f"Vital sign '{criteria.field_name}' not available", {}
        
        operator = criteria.operator
        target_value = criteria.value
        
        matched = False
        score = 0.0
        
        if operator == "==":
            matched = vital_value == target_value
        elif operator == ">=":
            matched = vital_value >= target_value
        elif operator == "<=":
            matched = vital_value <= target_value
        elif operator == ">":
            matched = vital_value > target_value
        elif operator == "<":
            matched = vital_value < target_value
        elif operator == "between":
            if isinstance(target_value, list) and len(target_value) == 2:
                min_val, max_val = target_value
                matched = min_val <= vital_value <= max_val
            else:
                matched = False
        
        score = 1.0 if matched else 0.0
        details = f"Vital sign '{criteria.field_name}': {vital_value}, Criteria: {criteria.description}"
        evidence = {
            "vital_sign": criteria.field_name,
            "vital_value": vital_value,
            "criteria_value": target_value,
            "operator": operator
        }
        
        return score, matched, details, evidence
    
    async def _evaluate_medication_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate medication-based criteria"""
        if not patient.medications:
            return 0.0, False, "No medications available", {}
        
        operator = criteria.operator
        target_medication = criteria.value
        
        matched = False
        
        if operator == "==":
            matched = any(med.lower() == target_medication.lower() for med in patient.medications)
        elif operator == "contains":
            matched = any(target_medication.lower() in med.lower() for med in patient.medications)
        elif operator == "in":
            if isinstance(target_medication, list):
                matched = any(med.lower() in [m.lower() for m in target_medication] for med in patient.medications)
            else:
                matched = False
        elif operator == "not_in":
            if isinstance(target_medication, list):
                matched = not any(med.lower() in [m.lower() for m in target_medication] for med in patient.medications)
            else:
                matched = True
        
        score = 1.0 if matched else 0.0
        details = f"Patient medications: {patient.medications}, Criteria: {criteria.description}"
        evidence = {"patient_medications": patient.medications, "criteria_value": target_medication, "operator": operator}
        
        return score, matched, details, evidence
    
    async def _evaluate_procedure_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate procedure-based criteria"""
        if not patient.procedures:
            return 0.0, False, "No procedures available", {}
        
        operator = criteria.operator
        target_procedure = criteria.value
        
        matched = False
        
        if operator == "==":
            matched = any(proc.lower() == target_procedure.lower() for proc in patient.procedures)
        elif operator == "contains":
            matched = any(target_procedure.lower() in proc.lower() for proc in patient.procedures)
        elif operator == "in":
            if isinstance(target_procedure, list):
                matched = any(proc.lower() in [p.lower() for p in target_procedure] for proc in patient.procedures)
            else:
                matched = False
        elif operator == "not_in":
            if isinstance(target_procedure, list):
                matched = not any(proc.lower() in [p.lower() for p in target_procedure] for proc in patient.procedures)
            else:
                matched = True
        
        score = 1.0 if matched else 0.0
        details = f"Patient procedures: {patient.procedures}, Criteria: {criteria.description}"
        evidence = {"patient_procedures": patient.procedures, "criteria_value": target_procedure, "operator": operator}
        
        return score, matched, details, evidence
    
    async def _evaluate_imaging_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate imaging finding criteria"""
        if not patient.imaging:
            return 0.0, False, "No imaging studies available", {}
        
        operator = criteria.operator
        target_finding = criteria.value
        
        matched = False
        
        # Combine findings and impressions
        imaging_text = []
        for img in patient.imaging:
            if img.findings:
                imaging_text.append(img.findings)
            if img.impression:
                imaging_text.append(img.impression)
        
        if not imaging_text:
            return 0.0, False, "No imaging findings or impressions available", {}
        
        combined_text = " ".join(imaging_text).lower()
        
        if operator == "==":
            matched = target_finding.lower() in combined_text
        elif operator == "contains":
            matched = target_finding.lower() in combined_text
        elif operator == "in":
            if isinstance(target_finding, list):
                matched = any(finding.lower() in combined_text for finding in target_finding)
            else:
                matched = False
        elif operator == "not_in":
            if isinstance(target_finding, list):
                matched = not any(finding.lower() in combined_text for finding in target_finding)
            else:
                matched = True
        
        score = 1.0 if matched else 0.0
        details = f"Imaging findings: {imaging_text}, Criteria: {criteria.description}"
        evidence = {"imaging_text": imaging_text, "criteria_value": target_finding, "operator": operator}
        
        return score, matched, details, evidence
    
    async def _evaluate_clinical_note_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate clinical note criteria using NLP"""
        if not patient.clinical_notes:
            return 0.0, False, "No clinical notes available", {}
        
        # Combine all clinical notes
        combined_notes = " ".join(patient.clinical_notes)
        
        # Use NLP service for advanced text analysis
        nlp_result = await self.nlp_service.analyze_clinical_text(combined_notes, criteria)
        
        score = nlp_result.get("score", 0.0)
        matched = score >= 0.7  # Threshold for matching
        details = f"NLP analysis score: {score:.3f}, Criteria: {criteria.description}"
        evidence = nlp_result
        
        return score, matched, details, evidence
    
    async def _evaluate_custom_criteria(self, patient: Patient, criteria: Any) -> tuple[float, bool, str, Dict]:
        """Evaluate custom rule-based criteria"""
        # This would implement custom logic based on criteria.custom_logic
        # For now, return a placeholder implementation
        return 0.0, False, "Custom criteria evaluation not implemented", {}
    
    def _calculate_overall_score(self, inclusion_score: float, exclusion_score: float) -> float:
        """Calculate overall match score"""
        # If excluded, score is 0
        if exclusion_score > 0:
            return 0.0
        
        # Otherwise, use inclusion score
        return inclusion_score
    
    def _determine_eligibility(
        self, 
        overall_score: float, 
        inclusion_score: float, 
        exclusion_score: float, 
        minimum_score: Optional[float]
    ) -> bool:
        """Determine if patient is eligible based on scores"""
        if exclusion_score > 0:
            return False
        
        threshold = minimum_score or 0.7
        return overall_score >= threshold
    
    def _determine_confidence(
        self, 
        overall_score: float, 
        inclusion_score: float, 
        exclusion_score: float
    ) -> MatchConfidence:
        """Determine confidence level of the match"""
        if exclusion_score > 0:
            return MatchConfidence.EXCLUDED
        
        if overall_score >= 0.9:
            return MatchConfidence.HIGH
        elif overall_score >= 0.7:
            return MatchConfidence.MEDIUM
        else:
            return MatchConfidence.LOW
    
    def _generate_primary_reason(self, match_reasons: List[MatchReason], is_eligible: bool) -> str:
        """Generate primary reason for eligibility/ineligibility"""
        if is_eligible:
            # Find the highest scoring inclusion criteria
            inclusion_reasons = [r for r in match_reasons if r.matched and r.score > 0]
            if inclusion_reasons:
                best_reason = max(inclusion_reasons, key=lambda x: x.score)
                return f"Patient meets criteria: {best_reason.criteria_description}"
            else:
                return "Patient meets minimum eligibility requirements"
        else:
            # Find exclusion reasons
            exclusion_reasons = [r for r in match_reasons if not r.matched and r.score > 0]
            if exclusion_reasons:
                return f"Patient excluded: {exclusion_reasons[0].criteria_description}"
            else:
                return "Patient does not meet inclusion criteria"
    
    def _generate_recommendations(self, match_reasons: List[MatchReason], overall_score: float) -> List[str]:
        """Generate recommendations for manual review"""
        recommendations = []
        
        if overall_score < 0.7:
            recommendations.append("Consider manual review due to low match score")
        
        # Check for borderline cases
        borderline_reasons = [r for r in match_reasons if 0.3 <= r.score <= 0.7]
        if borderline_reasons:
            recommendations.append("Manual review recommended for borderline criteria matches")
        
        # Check for missing data
        missing_data_reasons = [r for r in match_reasons if "not available" in r.details.lower()]
        if missing_data_reasons:
            recommendations.append("Consider obtaining missing clinical data for more accurate assessment")
        
        return recommendations
    
    def _needs_manual_review(self, overall_score: float, confidence: MatchConfidence, match_reasons: List[MatchReason]) -> bool:
        """Determine if manual review is needed"""
        if confidence == MatchConfidence.LOW:
            return True
        
        if overall_score < 0.7:
            return True
        
        # Check for borderline cases
        borderline_reasons = [r for r in match_reasons if 0.3 <= r.score <= 0.7]
        if borderline_reasons:
            return True
        
        return False
    
    async def validate_criteria(self, study_criteria: StudyCriteria) -> Dict[str, Any]:
        """Validate study criteria for syntax and logic"""
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "criteria_count": {
                "inclusion": len(study_criteria.inclusion_criteria),
                "exclusion": len(study_criteria.exclusion_criteria or [])
            }
        }
        
        # Validate inclusion criteria
        for criteria in study_criteria.inclusion_criteria:
            if not criteria.criteria_id:
                validation_result["errors"].append(f"Inclusion criteria missing ID")
                validation_result["valid"] = False
            
            if not criteria.field_name:
                validation_result["errors"].append(f"Criteria {criteria.criteria_id} missing field name")
                validation_result["valid"] = False
        
        # Validate exclusion criteria
        if study_criteria.exclusion_criteria:
            for criteria in study_criteria.exclusion_criteria:
                if not criteria.criteria_id:
                    validation_result["errors"].append(f"Exclusion criteria missing ID")
                    validation_result["valid"] = False
                
                if not criteria.field_name:
                    validation_result["errors"].append(f"Criteria {criteria.criteria_id} missing field name")
                    validation_result["valid"] = False
        
        # Check for minimum score
        if study_criteria.minimum_match_score and (study_criteria.minimum_match_score < 0 or study_criteria.minimum_match_score > 1):
            validation_result["warnings"].append("Minimum match score should be between 0 and 1")
        
        return validation_result 