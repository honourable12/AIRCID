# AI Case Matching Service

A FastAPI-based microservice for AI-powered patient case matching in neurosurgical research studies.

## Overview

This service provides intelligent patient matching capabilities for research studies by evaluating patient data against defined inclusion and exclusion criteria. It combines rule-based logic with NLP techniques to identify eligible patients for clinical research.

## Features

- **Multi-criteria Patient Matching**: Evaluate patients against complex inclusion/exclusion criteria
- **NLP-powered Clinical Text Analysis**: Extract structured information from clinical notes
- **Flexible Criteria Types**: Support for age, gender, diagnosis, lab values, vital signs, medications, procedures, and custom rules
- **Confidence Scoring**: Provide detailed confidence levels and reasoning for matches
- **Batch Processing**: Match multiple patients against study criteria
- **Criteria Validation**: Validate study criteria for syntax and logic
- **Clinical Information Extraction**: Extract structured data from unstructured clinical notes

## Architecture

The service follows a microservices architecture with the following components:

- **FastAPI Application**: RESTful API endpoints for patient matching
- **MatchingService**: Core logic for evaluating patient data against criteria
- **NLPService**: Natural language processing for clinical text analysis
- **Pydantic Models**: Type-safe data models for patient data, criteria, and results

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed service health status

### Patient Matching
- `POST /match-patient` - Match a single patient against study criteria
- `POST /match-multiple-patients` - Match multiple patients against study criteria

### Criteria Management
- `POST /validate-criteria` - Validate study criteria for syntax and logic
- `GET /supported-criteria-types` - Get list of supported criteria types

### Clinical Information Extraction
- `POST /extract-clinical-info` - Extract structured information from clinical notes

## Data Models

### Patient Data
```python
Patient:
  demographics: PatientDemographics
  vitals: List[PatientVitals]
  labs: List[PatientLabs]
  imaging: List[PatientImaging]
  diagnoses: List[str]
  medications: List[str]
  procedures: List[str]
  clinical_notes: List[str]
```

### Study Criteria
```python
StudyCriteria:
  study_id: str
  study_name: str
  inclusion_criteria: List[InclusionCriteria]
  exclusion_criteria: List[ExclusionCriteria]
  minimum_match_score: float
```

### Match Results
```python
MatchResult:
  patient_id: str
  study_id: str
  is_eligible: bool
  confidence: MatchConfidence
  overall_score: float
  match_reasons: List[MatchReason]
```

## Supported Criteria Types

1. **Age Range**: Age-based inclusion/exclusion criteria
2. **Gender**: Gender-based criteria
3. **Diagnosis**: Diagnosis-based criteria
4. **Lab Value**: Laboratory value criteria
5. **Vital Sign**: Vital sign criteria
6. **Medication**: Medication-based criteria
7. **Procedure**: Procedure-based criteria
8. **Imaging Finding**: Imaging finding criteria
9. **Clinical Note**: Clinical note content criteria (NLP-based)
10. **Custom Rule**: Custom rule-based criteria

## Installation

### Prerequisites
- Python 3.10+
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   cd python microservices/ai_case_matching
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download NLP models**
   ```bash
   python -m spacy download en_core_web_sm
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
   ```

5. **Run the service**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t ai-case-matching .
   ```

2. **Run the container**
   ```bash
   docker run -p 8000:8000 ai-case-matching
   ```

## Usage Examples

### Match a Patient Against Study Criteria

```python
import requests

# Patient data
patient_data = {
    "demographics": {
        "patient_id": "P12345",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1980-05-15",
        "gender": "Male"
    },
    "diagnoses": ["Brain tumor", "Glioblastoma"],
    "medications": ["Temozolomide", "Dexamethasone"],
    "clinical_notes": ["Patient presents with severe headache and confusion"]
}

# Study criteria
study_criteria = {
    "study_id": "ST001",
    "study_name": "Brain Tumor Study",
    "inclusion_criteria": [
        {
            "criteria_id": "INC001",
            "criteria_type": "diagnosis",
            "field_name": "diagnoses",
            "operator": "contains",
            "value": "tumor",
            "description": "Patient must have brain tumor diagnosis"
        }
    ],
    "exclusion_criteria": [
        {
            "criteria_id": "EXC001",
            "criteria_type": "age_range",
            "field_name": "age",
            "operator": "<",
            "value": 18,
            "description": "Patient must be 18 or older"
        }
    ]
}

# Make API request
response = requests.post(
    "http://localhost:8000/match-patient",
    json={"patient": patient_data, "study_criteria": study_criteria}
)

result = response.json()
print(f"Eligible: {result['is_eligible']}")
print(f"Score: {result['overall_score']}")
print(f"Confidence: {result['confidence']}")
```

### Extract Clinical Information

```python
# Extract information from clinical notes
clinical_notes = [
    "Patient presents with severe headache and confusion. MRI shows 3cm mass in right frontal lobe.",
    "Previous history of diabetes and hypertension. Currently taking metformin and lisinopril."
]

extraction_fields = ["diagnoses", "medications", "symptoms"]

response = requests.post(
    "http://localhost:8000/extract-clinical-info",
    json={
        "clinical_notes": clinical_notes,
        "extraction_fields": extraction_fields
    }
)

extracted_info = response.json()
print(extracted_info)
```

## Configuration

The service can be configured using environment variables:

- `API_HOST`: Host address (default: 0.0.0.0)
- `API_PORT`: Port number (default: 8000)
- `DEBUG`: Enable debug mode (default: False)
- `DEFAULT_MINIMUM_MATCH_SCORE`: Default minimum match score (default: 0.7)
- `NLP_CONFIDENCE_THRESHOLD`: NLP confidence threshold (default: 0.7)

## Testing

Run the test suite:

```bash
pytest tests/
```

## API Documentation

Once the service is running, you can access:

- **Interactive API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is part of the AIRCID platform for AI Research Case Identification & Data Integration.

## Support

For questions or support, please contact the development team. 