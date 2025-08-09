# AI Case Matching Service API Documentation

## Overview

The AI Case Matching Service is a FastAPI-based microservice that provides intelligent patient case matching for neurosurgical research studies. The service uses AI and NLP techniques to match patients against study criteria with confidence scoring.

**Base URL**: `http://localhost:8000` (development)  
**API Documentation**: `http://localhost:8000/docs` (Swagger UI)  
**ReDoc Documentation**: `http://localhost:8000/redoc`

## Quick Start

### 1. Start the Service

```bash
# Navigate to the service directory
cd "python microservices"

# Install dependencies
pip install -r requirements.txt

# Start the service
python -m app.main
```

The service will be available at `http://localhost:8000`

### 2. Test the Health Endpoint

```bash
curl http://localhost:8000/health
```

## API Endpoints

### Health Check Endpoints

#### GET `/`
**Description**: Basic health check endpoint  
**Response**: Service status and version information

**Example Request**:
```bash
curl http://localhost:8000/
```

**Example Response**:
```json
{
  "service": "AI Case Matching Service",
  "version": "1.0.0",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.123456"
}
```

#### GET `/health`
**Description**: Detailed health check with service status  
**Response**: Comprehensive health information

**Example Request**:
```bash
curl http://localhost:8000/health
```

**Example Response**:
```json
{
  "status": "healthy",
  "services": {
    "matching_service": "operational",
    "nlp_service": "operational"
  },
  "timestamp": "2024-01-15T10:30:00.123456"
}
```

### Patient Matching Endpoints

#### POST `/match-patient`
**Description**: Match a single patient against study criteria using AI  
**Request Body**: Patient data and study criteria  
**Response**: Detailed matching results with confidence scores

**Request Schema**:
```json
{
  "patient": {
    "demographics": {
      "patient_id": "string",
      "first_name": "string",
      "last_name": "string",
      "date_of_birth": "YYYY-MM-DD",
      "gender": "string",
      "ethnicity": "string",
      "race": "string",
      "contact_info": {}
    },
    "vitals": [
      {
        "temperature": 37.2,
        "heart_rate": 72,
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 80,
        "respiratory_rate": 16,
        "oxygen_saturation": 98.5,
        "height": 175.0,
        "weight": 70.0,
        "bmi": 22.9,
        "recorded_at": "2024-01-15T10:30:00Z"
      }
    ],
    "labs": [
      {
        "test_name": "CBC",
        "test_value": 12.5,
        "unit": "g/dL",
        "reference_range": "12.0-15.5",
        "is_abnormal": false,
        "collected_at": "2024-01-15T09:00:00Z"
      }
    ],
    "imaging": [
      {
        "study_type": "MRI",
        "body_part": "Brain",
        "findings": "Right frontal lobe mass",
        "impression": "Suspicious for glioblastoma",
        "performed_at": "2024-01-15T08:00:00Z"
      }
    ],
    "diagnoses": ["Glioblastoma", "Right frontal lobe mass"],
    "medications": ["Temozolomide", "Dexamethasone"],
    "procedures": ["Craniotomy", "Tumor resection"],
    "clinical_notes": [
      "Patient presents with right-sided weakness and headache. MRI shows right frontal lobe mass suspicious for glioblastoma."
    ]
  },
  "study_criteria": {
    "study_id": "GBM-001",
    "study_name": "Glioblastoma Treatment Study",
    "study_description": "Study for patients with newly diagnosed glioblastoma",
    "inclusion_criteria": [
      {
        "criteria_id": "age_18_70",
        "criteria_type": "age_range",
        "field_name": "age",
        "operator": "between",
        "value": [18, 70],
        "description": "Age between 18 and 70 years",
        "is_required": true,
        "weight": 1.0
      },
      {
        "criteria_id": "diagnosis_gbm",
        "criteria_type": "diagnosis",
        "field_name": "diagnoses",
        "operator": "contains",
        "value": "Glioblastoma",
        "description": "Diagnosis of glioblastoma",
        "is_required": true,
        "weight": 1.0
      }
    ],
    "exclusion_criteria": [
      {
        "criteria_id": "pregnancy",
        "criteria_type": "custom_rule",
        "field_name": "demographics",
        "operator": "custom",
        "value": "pregnant",
        "description": "Pregnant patients excluded",
        "is_required": true
      }
    ],
    "minimum_match_score": 0.8
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/match-patient" \
  -H "Content-Type: application/json" \
  -d @patient_match_request.json
```

**Example Response**:
```json
{
  "patient_id": "P12345",
  "study_id": "GBM-001",
  "is_eligible": true,
  "confidence": "high",
  "overall_score": 0.95,
  "inclusion_score": 1.0,
  "exclusion_score": 0.0,
  "match_reasons": [
    {
      "criteria_id": "age_18_70",
      "criteria_description": "Age between 18 and 70 years",
      "matched": true,
      "score": 1.0,
      "details": "Patient age 45 is within required range",
      "evidence": {
        "patient_age": 45,
        "required_range": [18, 70]
      }
    },
    {
      "criteria_id": "diagnosis_gbm",
      "criteria_description": "Diagnosis of glioblastoma",
      "matched": true,
      "score": 1.0,
      "details": "Patient has glioblastoma diagnosis",
      "evidence": {
        "found_diagnoses": ["Glioblastoma"]
      }
    }
  ],
  "matched_criteria": ["age_18_70", "diagnosis_gbm"],
  "excluded_criteria": [],
  "primary_reason": "Patient meets all inclusion criteria and no exclusion criteria",
  "recommendations": [],
  "requires_manual_review": false,
  "matched_at": "2024-01-15T10:30:00.123456",
  "processing_time_ms": 245
}
```

#### POST `/match-multiple-patients`
**Description**: Match multiple patients against study criteria using batch processing  
**Request Body**: List of patients and study criteria  
**Response**: List of matching results for each patient

**Request Schema**:
```json
{
  "patients": [
    {
      "demographics": {
        "patient_id": "P12345",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1979-05-15",
        "gender": "Male"
      },
      "diagnoses": ["Glioblastoma"],
      "medications": ["Temozolomide"]
    },
    {
      "demographics": {
        "patient_id": "P12346",
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1985-08-22",
        "gender": "Female"
      },
      "diagnoses": ["Meningioma"],
      "medications": ["Levetiracetam"]
    }
  ],
  "study_criteria": {
    "study_id": "GBM-001",
    "study_name": "Glioblastoma Treatment Study",
    "inclusion_criteria": [
      {
        "criteria_id": "diagnosis_gbm",
        "criteria_type": "diagnosis",
        "field_name": "diagnoses",
        "operator": "contains",
        "value": "Glioblastoma",
        "description": "Diagnosis of glioblastoma",
        "is_required": true
      }
    ]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/match-multiple-patients" \
  -H "Content-Type: application/json" \
  -d @batch_match_request.json
```

**Example Response**:
```json
[
  {
    "patient_id": "P12345",
    "reason": "Eligible - Matches glioblastoma diagnosis criteria"
  },
  {
    "patient_id": "P12346",
    "reason": "Not eligible - Does not have glioblastoma diagnosis"
  }
]
```

### Study Criteria Management

#### POST `/validate-criteria`
**Description**: Validate study criteria for syntax and logic errors  
**Request Body**: Study criteria to validate  
**Response**: Validation results with any errors or warnings

**Example Request**:
```bash
curl -X POST "http://localhost:8000/validate-criteria" \
  -H "Content-Type: application/json" \
  -d @criteria_validation_request.json
```

**Example Response**:
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    "Criteria 'age_18_70' uses 'between' operator but value should be a list"
  ],
  "suggestions": [
    "Consider adding more specific exclusion criteria",
    "Age range criteria could be more restrictive"
  ]
}
```

#### GET `/supported-criteria-types`
**Description**: Get list of supported criteria types and operators  
**Response**: Available criteria types with descriptions and operators

**Example Request**:
```bash
curl http://localhost:8000/supported-criteria-types
```

**Example Response**:
```json
{
  "criteria_types": [
    {
      "type": "age_range",
      "description": "Age-based inclusion/exclusion criteria",
      "operators": ["==", ">=", "<=", ">", "<", "between"]
    },
    {
      "type": "gender",
      "description": "Gender-based criteria",
      "operators": ["==", "!=", "in"]
    },
    {
      "type": "diagnosis",
      "description": "Diagnosis-based criteria",
      "operators": ["==", "contains", "in", "not_in"]
    },
    {
      "type": "lab_value",
      "description": "Laboratory value criteria",
      "operators": ["==", ">=", "<=", ">", "<", "between", "abnormal"]
    },
    {
      "type": "vital_sign",
      "description": "Vital sign criteria",
      "operators": ["==", ">=", "<=", ">", "<", "between", "abnormal"]
    },
    {
      "type": "medication",
      "description": "Medication-based criteria",
      "operators": ["==", "contains", "in", "not_in"]
    },
    {
      "type": "procedure",
      "description": "Procedure-based criteria",
      "operators": ["==", "contains", "in", "not_in"]
    },
    {
      "type": "imaging_finding",
      "description": "Imaging finding criteria",
      "operators": ["==", "contains", "in", "not_in"]
    },
    {
      "type": "clinical_note",
      "description": "Clinical note content criteria (NLP-based)",
      "operators": ["contains", "contains_keywords", "sentiment"]
    },
    {
      "type": "custom_rule",
      "description": "Custom rule-based criteria",
      "operators": ["custom"]
    }
  ]
}
```

### NLP Processing Endpoints

#### POST `/extract-clinical-info`
**Description**: Extract structured information from clinical notes using NLP  
**Request Body**: Clinical notes and fields to extract  
**Response**: Extracted structured information

**Request Schema**:
```json
{
  "clinical_notes": [
    "Patient presents with right-sided weakness and headache. MRI shows right frontal lobe mass suspicious for glioblastoma. Patient is alert and oriented x3.",
    "Follow-up visit: Patient reports decreased headache intensity. No new neurological deficits noted."
  ],
  "extraction_fields": ["diagnosis", "medications", "symptoms", "procedures"]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/extract-clinical-info" \
  -H "Content-Type: application/json" \
  -d @nlp_extraction_request.json
```

**Example Response**:
```json
{
  "extracted_info": {
    "diagnosis": ["glioblastoma", "right frontal lobe mass"],
    "medications": [],
    "symptoms": ["right-sided weakness", "headache"],
    "procedures": [],
    "confidence_scores": {
      "diagnosis": 0.95,
      "medications": 0.0,
      "symptoms": 0.88,
      "procedures": 0.0
    },
    "entities_found": [
      {
        "text": "glioblastoma",
        "type": "diagnosis",
        "confidence": 0.95,
        "position": [45, 56]
      },
      {
        "text": "right-sided weakness",
        "type": "symptom",
        "confidence": 0.88,
        "position": [25, 42]
      }
    ]
  }
}
```

## Data Models

### Patient Model

The `Patient` model contains comprehensive patient information:

```python
class Patient(BaseModel):
    demographics: PatientDemographics          # Basic patient info
    vitals: Optional[List[PatientVitals]]     # Vital signs history
    labs: Optional[List[PatientLabs]]         # Laboratory results
    imaging: Optional[List[PatientImaging]]   # Imaging studies
    diagnoses: Optional[List[str]]            # Patient diagnoses
    medications: Optional[List[str]]          # Current medications
    procedures: Optional[List[str]]           # Procedures performed
    clinical_notes: Optional[List[str]]       # Unstructured notes
    admission_date: Optional[datetime]        # Admission date
    discharge_date: Optional[datetime]        # Discharge date
    emergency_contact: Optional[Dict[str, str]] # Emergency contact
    insurance_info: Optional[Dict[str, str]]  # Insurance information
    additional_data: Optional[Dict[str, Any]] # Additional data
```

### Study Criteria Model

The `StudyCriteria` model defines inclusion and exclusion criteria:

```python
class StudyCriteria(BaseModel):
    study_id: str                            # Unique study identifier
    study_name: str                          # Study name
    study_description: Optional[str]          # Study description
    inclusion_criteria: List[InclusionCriteria] # Must-have criteria
    exclusion_criteria: Optional[List[ExclusionCriteria]] # Exclusion criteria
    minimum_match_score: Optional[float]      # Minimum score for eligibility
    priority_score: Optional[float]           # Study priority weight
    is_active: bool                          # Whether study is active
    created_at: Optional[datetime]           # Creation timestamp
    updated_at: Optional[datetime]           # Last update timestamp
    created_by: Optional[str]                # Creator user
    additional_metadata: Optional[Dict[str, Any]] # Additional metadata
```

### Match Result Model

The `MatchResult` model provides detailed matching results:

```python
class MatchResult(BaseModel):
    patient_id: str                          # Patient identifier
    study_id: str                            # Study identifier
    is_eligible: bool                        # Eligibility status
    confidence: MatchConfidence              # Confidence level
    overall_score: float                     # Overall match score
    inclusion_score: float                   # Inclusion criteria score
    exclusion_score: float                   # Exclusion criteria score
    match_reasons: List[MatchReason]         # Detailed reasons
    matched_criteria: List[str]              # Matched criteria IDs
    excluded_criteria: List[str]             # Excluded criteria IDs
    primary_reason: Optional[str]            # Primary reason
    recommendations: Optional[List[str]]     # Recommendations
    requires_manual_review: bool             # Manual review needed
    matched_at: datetime                     # Matching timestamp
    processing_time_ms: Optional[int]        # Processing time
    additional_metadata: Optional[Dict[str, Any]] # Additional metadata
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **200**: Success
- **400**: Bad Request (validation errors)
- **500**: Internal Server Error

**Error Response Format**:
```json
{
  "detail": "Error description"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting based on your requirements.

## Authentication

Currently, no authentication is required. For production use, implement appropriate authentication and authorization mechanisms.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Get supported criteria types
curl http://localhost:8000/supported-criteria-types

# Match a patient (using a JSON file)
curl -X POST "http://localhost:8000/match-patient" \
  -H "Content-Type: application/json" \
  -d @test_patient.json
```

### Using Python requests

```python
import requests
import json

# Base URL
base_url = "http://localhost:8000"

# Health check
response = requests.get(f"{base_url}/health")
print(response.json())

# Match a patient
patient_data = {
    "patient": {
        "demographics": {
            "patient_id": "P12345",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1979-05-15",
            "gender": "Male"
        },
        "diagnoses": ["Glioblastoma"],
        "medications": ["Temozolomide"]
    },
    "study_criteria": {
        "study_id": "GBM-001",
        "study_name": "Glioblastoma Treatment Study",
        "inclusion_criteria": [
            {
                "criteria_id": "diagnosis_gbm",
                "criteria_type": "diagnosis",
                "field_name": "diagnoses",
                "operator": "contains",
                "value": "Glioblastoma",
                "description": "Diagnosis of glioblastoma",
                "is_required": True
            }
        ]
    }
}

response = requests.post(
    f"{base_url}/match-patient",
    json=patient_data,
    headers={"Content-Type": "application/json"}
)
print(response.json())
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const baseUrl = 'http://localhost:8000';

// Health check
async function checkHealth() {
    try {
        const response = await axios.get(`${baseUrl}/health`);
        console.log(response.data);
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}

// Match a patient
async function matchPatient() {
    const patientData = {
        patient: {
            demographics: {
                patient_id: "P12345",
                first_name: "John",
                last_name: "Doe",
                date_of_birth: "1979-05-15",
                gender: "Male"
            },
            diagnoses: ["Glioblastoma"],
            medications: ["Temozolomide"]
        },
        study_criteria: {
            study_id: "GBM-001",
            study_name: "Glioblastoma Treatment Study",
            inclusion_criteria: [
                {
                    criteria_id: "diagnosis_gbm",
                    criteria_type: "diagnosis",
                    field_name: "diagnoses",
                    operator: "contains",
                    value: "Glioblastoma",
                    description: "Diagnosis of glioblastoma",
                    is_required: true
                }
            ]
        }
    };

    try {
        const response = await axios.post(
            `${baseUrl}/match-patient`,
            patientData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(response.data);
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}

checkHealth();
matchPatient();
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

Create a `.env` file:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Database Configuration (if applicable)
DATABASE_URL=postgresql://user:password@localhost/dbname

# API Keys (if applicable)
OPENAI_API_KEY=your_openai_api_key

# Logging
LOG_LEVEL=INFO
```

## Monitoring and Logging

The service includes basic health checks and can be extended with:

- Application performance monitoring (APM)
- Structured logging
- Metrics collection
- Alerting

## Security Considerations

For production deployment:

1. **Authentication**: Implement JWT or OAuth2 authentication
2. **Authorization**: Add role-based access control
3. **HTTPS**: Use SSL/TLS encryption
4. **Rate Limiting**: Implement request rate limiting
5. **Input Validation**: Ensure all inputs are properly validated
6. **Audit Logging**: Log all API access and changes
7. **Data Encryption**: Encrypt sensitive data at rest and in transit

## Support

For issues or questions:

1. Check the API documentation at `/docs`
2. Review the logs for error details
3. Test with the health check endpoint
4. Verify request/response formats

## Versioning

The API version is included in the response headers and can be checked via the root endpoint. Future versions will maintain backward compatibility where possible. 