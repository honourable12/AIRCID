from typing import List, Dict, Any, Optional
import re
from loguru import logger

try:
    import spacy
    from spacy.matcher import Matcher
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    logger.warning("spaCy not available, NLP features will be limited")

try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    logger.warning("NLTK not available, some NLP features will be limited")


class NLPService:
    """NLP service for clinical text analysis"""
    
    def __init__(self):
        self.nlp = None
        self.matcher = None
        self.lemmatizer = None
        self.stop_words = set()
        
        # Initialize spaCy if available
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
                self.matcher = Matcher(self.nlp.vocab)
                logger.info("spaCy model loaded successfully")
            except OSError:
                logger.warning("spaCy model not found, using basic text processing")
        
        # Initialize NLTK if available
        if NLTK_AVAILABLE:
            try:
                self.lemmatizer = WordNetLemmatizer()
                self.stop_words = set(stopwords.words('english'))
                logger.info("NLTK components initialized successfully")
            except Exception as e:
                logger.warning(f"NLTK initialization failed: {str(e)}")
        
        # Medical terminology patterns
        self.medical_patterns = {
            'symptoms': [
                'pain', 'headache', 'nausea', 'vomiting', 'dizziness', 'weakness',
                'numbness', 'tingling', 'seizure', 'confusion', 'memory loss',
                'vision problems', 'hearing loss', 'difficulty walking'
            ],
            'diagnoses': [
                'tumor', 'cancer', 'stroke', 'aneurysm', 'hemorrhage', 'trauma',
                'infection', 'meningitis', 'encephalitis', 'hydrocephalus'
            ],
            'procedures': [
                'surgery', 'operation', 'biopsy', 'resection', 'craniotomy',
                'laminectomy', 'fusion', 'decompression', 'drainage'
            ],
            'medications': [
                'antibiotic', 'anticoagulant', 'anticonvulsant', 'steroid',
                'pain medication', 'chemotherapy', 'radiation'
            ]
        }
    
    async def analyze_clinical_text(self, text: str, criteria: Any) -> Dict[str, Any]:
        """
        Analyze clinical text using NLP techniques
        
        Args:
            text: Clinical text to analyze
            criteria: Criteria object containing NLP keywords and requirements
            
        Returns:
            Dict containing analysis results and score
        """
        if not text:
            return {"score": 0.0, "confidence": 0.0, "extracted_info": {}}
        
        # Clean and preprocess text
        cleaned_text = self._preprocess_text(text)
        
        # Extract information based on criteria
        extracted_info = await self._extract_clinical_information(cleaned_text, criteria)
        
        # Calculate match score
        score = self._calculate_nlp_score(cleaned_text, criteria, extracted_info)
        
        # Calculate confidence
        confidence = self._calculate_confidence(score, extracted_info)
        
        return {
            "score": score,
            "confidence": confidence,
            "extracted_info": extracted_info,
            "processed_text": cleaned_text,
            "criteria_keywords": criteria.nlp_keywords if hasattr(criteria, 'nlp_keywords') else []
        }
    
    async def extract_clinical_information(self, clinical_notes: List[str], extraction_fields: List[str]) -> Dict[str, Any]:
        """
        Extract structured information from clinical notes
        
        Args:
            clinical_notes: List of clinical notes
            extraction_fields: Fields to extract
            
        Returns:
            Dict containing extracted information
        """
        combined_text = " ".join(clinical_notes)
        cleaned_text = self._preprocess_text(combined_text)
        
        extracted_info = {}
        
        for field in extraction_fields:
            if field == "diagnoses":
                extracted_info[field] = self._extract_diagnoses(cleaned_text)
            elif field == "medications":
                extracted_info[field] = self._extract_medications(cleaned_text)
            elif field == "symptoms":
                extracted_info[field] = self._extract_symptoms(cleaned_text)
            elif field == "procedures":
                extracted_info[field] = self._extract_procedures(cleaned_text)
            elif field == "vital_signs":
                extracted_info[field] = self._extract_vital_signs(cleaned_text)
            elif field == "lab_values":
                extracted_info[field] = self._extract_lab_values(cleaned_text)
            else:
                extracted_info[field] = self._extract_general_terms(cleaned_text, field)
        
        return extracted_info
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess clinical text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common medical abbreviations and expand them
        abbreviations = {
            'pt': 'patient',
            'hx': 'history',
            'dx': 'diagnosis',
            'tx': 'treatment',
            'rx': 'prescription',
            'vs': 'vital signs',
            'w/': 'with',
            'w/o': 'without',
            'c/o': 'complaining of'
        }
        
        for abbr, full in abbreviations.items():
            text = re.sub(r'\b' + abbr + r'\b', full, text)
        
        return text.strip()
    
    def _extract_diagnoses(self, text: str) -> List[str]:
        """Extract diagnoses from clinical text"""
        diagnoses = []
        
        # Use spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            
            # Look for medical conditions
            for ent in doc.ents:
                if ent.label_ in ['CONDITION', 'DISEASE']:
                    diagnoses.append(ent.text)
            
            # Look for diagnosis patterns
            diagnosis_patterns = [
                r'diagnosis[:\s]+([^\.]+)',
                r'dx[:\s]+([^\.]+)',
                r'condition[:\s]+([^\.]+)'
            ]
            
            for pattern in diagnosis_patterns:
                matches = re.findall(pattern, text)
                diagnoses.extend(matches)
        
        # Fallback to keyword matching
        if not diagnoses:
            for term in self.medical_patterns['diagnoses']:
                if term in text:
                    diagnoses.append(term)
        
        return list(set(diagnoses))
    
    def _extract_medications(self, text: str) -> List[str]:
        """Extract medications from clinical text"""
        medications = []
        
        # Use spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            
            # Look for medication entities
            for ent in doc.ents:
                if ent.label_ in ['DRUG', 'MEDICATION']:
                    medications.append(ent.text)
        
        # Fallback to keyword matching
        if not medications:
            for term in self.medical_patterns['medications']:
                if term in text:
                    medications.append(term)
        
        # Look for medication patterns
        med_patterns = [
            r'prescribed\s+([^\.]+)',
            r'medication[:\s]+([^\.]+)',
            r'taking\s+([^\.]+)'
        ]
        
        for pattern in med_patterns:
            matches = re.findall(pattern, text)
            medications.extend(matches)
        
        return list(set(medications))
    
    def _extract_symptoms(self, text: str) -> List[str]:
        """Extract symptoms from clinical text"""
        symptoms = []
        
        # Use spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            
            # Look for symptom entities
            for ent in doc.ents:
                if ent.label_ in ['SYMPTOM', 'CONDITION']:
                    symptoms.append(ent.text)
        
        # Fallback to keyword matching
        if not symptoms:
            for term in self.medical_patterns['symptoms']:
                if term in text:
                    symptoms.append(term)
        
        return list(set(symptoms))
    
    def _extract_procedures(self, text: str) -> List[str]:
        """Extract procedures from clinical text"""
        procedures = []
        
        # Use spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            
            # Look for procedure entities
            for ent in doc.ents:
                if ent.label_ in ['PROCEDURE', 'TREATMENT']:
                    procedures.append(ent.text)
        
        # Fallback to keyword matching
        if not procedures:
            for term in self.medical_patterns['procedures']:
                if term in text:
                    procedures.append(term)
        
        return list(set(procedures))
    
    def _extract_vital_signs(self, text: str) -> Dict[str, Any]:
        """Extract vital signs from clinical text"""
        vitals = {}
        
        # Blood pressure patterns
        bp_pattern = r'blood pressure[:\s]*(\d+)/(\d+)'
        bp_match = re.search(bp_pattern, text)
        if bp_match:
            vitals['blood_pressure'] = f"{bp_match.group(1)}/{bp_match.group(2)}"
        
        # Heart rate patterns
        hr_pattern = r'heart rate[:\s]*(\d+)'
        hr_match = re.search(hr_pattern, text)
        if hr_match:
            vitals['heart_rate'] = int(hr_match.group(1))
        
        # Temperature patterns
        temp_pattern = r'temperature[:\s]*(\d+\.?\d*)'
        temp_match = re.search(temp_pattern, text)
        if temp_match:
            vitals['temperature'] = float(temp_match.group(1))
        
        # Respiratory rate patterns
        rr_pattern = r'respiratory rate[:\s]*(\d+)'
        rr_match = re.search(rr_pattern, text)
        if rr_match:
            vitals['respiratory_rate'] = int(rr_match.group(1))
        
        return vitals
    
    def _extract_lab_values(self, text: str) -> Dict[str, Any]:
        """Extract laboratory values from clinical text"""
        labs = {}
        
        # Common lab patterns
        lab_patterns = {
            'glucose': r'glucose[:\s]*(\d+\.?\d*)',
            'creatinine': r'creatinine[:\s]*(\d+\.?\d*)',
            'hemoglobin': r'hemoglobin[:\s]*(\d+\.?\d*)',
            'white_blood_cells': r'wbc[:\s]*(\d+\.?\d*)',
            'platelets': r'platelets[:\s]*(\d+)'
        }
        
        for lab_name, pattern in lab_patterns.items():
            match = re.search(pattern, text)
            if match:
                labs[lab_name] = float(match.group(1))
        
        return labs
    
    def _extract_general_terms(self, text: str, field: str) -> List[str]:
        """Extract general terms based on field name"""
        terms = []
        
        # Create field-specific patterns
        if field == "comorbidities":
            comorbidity_patterns = [
                r'diabetes', r'hypertension', r'heart disease', r'kidney disease',
                r'liver disease', r'cancer', r'stroke'
            ]
        elif field == "allergies":
            allergy_patterns = [
                r'allergic to', r'allergy to', r'sensitive to'
            ]
        else:
            # Generic pattern for unknown fields
            return []
        
        # Search for patterns
        for pattern in comorbidity_patterns if field == "comorbidities" else allergy_patterns:
            if re.search(pattern, text):
                terms.append(pattern)
        
        return terms
    
    def _calculate_nlp_score(self, text: str, criteria: Any, extracted_info: Dict[str, Any]) -> float:
        """Calculate NLP-based match score"""
        score = 0.0
        
        # Get keywords from criteria
        keywords = getattr(criteria, 'nlp_keywords', [])
        if not keywords:
            return 0.0
        
        # Calculate keyword match score
        keyword_matches = 0
        for keyword in keywords:
            if keyword.lower() in text:
                keyword_matches += 1
        
        if keywords:
            score = keyword_matches / len(keywords)
        
        # Boost score based on extracted information relevance
        if extracted_info:
            relevant_extractions = 0
            total_extractions = 0
            
            for field, value in extracted_info.items():
                if value:  # If any information was extracted
                    total_extractions += 1
                    # Check if extracted info matches any keywords
                    if isinstance(value, list):
                        for item in value:
                            if any(keyword.lower() in item.lower() for keyword in keywords):
                                relevant_extractions += 1
                                break
                    elif isinstance(value, dict):
                        for key, val in value.items():
                            if any(keyword.lower() in str(val).lower() for keyword in keywords):
                                relevant_extractions += 1
                                break
            
            if total_extractions > 0:
                extraction_score = relevant_extractions / total_extractions
                score = (score + extraction_score) / 2
        
        return min(score, 1.0)
    
    def _calculate_confidence(self, score: float, extracted_info: Dict[str, Any]) -> float:
        """Calculate confidence level of NLP analysis"""
        confidence = score  # Base confidence on score
        
        # Boost confidence if we extracted substantial information
        if extracted_info:
            non_empty_fields = sum(1 for value in extracted_info.values() if value)
            if non_empty_fields > 0:
                confidence += 0.1  # Small boost for successful extraction
        
        # Reduce confidence if using fallback methods
        if not SPACY_AVAILABLE:
            confidence *= 0.8  # Reduce confidence when spaCy is not available
        
        return min(confidence, 1.0) 