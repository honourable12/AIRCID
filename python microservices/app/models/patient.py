from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field


class PatientDemographics(BaseModel):
    """Patient demographic information"""
    patient_id: str = Field(..., description="Unique patient identifier")
    first_name: Optional[str] = Field(None, description="Patient first name")
    last_name: Optional[str] = Field(None, description="Patient last name")
    date_of_birth: Optional[date] = Field(None, description="Patient date of birth")
    gender: Optional[str] = Field(None, description="Patient gender")
    ethnicity: Optional[str] = Field(None, description="Patient ethnicity")
    race: Optional[str] = Field(None, description="Patient race")
    contact_info: Optional[Dict[str, str]] = Field(None, description="Contact information")


class PatientVitals(BaseModel):
    """Patient vital signs"""
    temperature: Optional[float] = Field(None, description="Body temperature in Celsius")
    heart_rate: Optional[int] = Field(None, description="Heart rate in BPM")
    blood_pressure_systolic: Optional[int] = Field(None, description="Systolic blood pressure")
    blood_pressure_diastolic: Optional[int] = Field(None, description="Diastolic blood pressure")
    respiratory_rate: Optional[int] = Field(None, description="Respiratory rate")
    oxygen_saturation: Optional[float] = Field(None, description="Oxygen saturation percentage")
    height: Optional[float] = Field(None, description="Height in cm")
    weight: Optional[float] = Field(None, description="Weight in kg")
    bmi: Optional[float] = Field(None, description="Body Mass Index")
    recorded_at: Optional[datetime] = Field(None, description="When vitals were recorded")


class PatientLabs(BaseModel):
    """Laboratory test results"""
    test_name: str = Field(..., description="Name of the laboratory test")
    test_value: Optional[float] = Field(None, description="Test result value")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    reference_range: Optional[str] = Field(None, description="Normal reference range")
    is_abnormal: Optional[bool] = Field(None, description="Whether result is outside normal range")
    collected_at: Optional[datetime] = Field(None, description="When test was collected")
    reported_at: Optional[datetime] = Field(None, description="When result was reported")


class PatientImaging(BaseModel):
    """Imaging study information"""
    study_type: str = Field(..., description="Type of imaging study (CT, MRI, X-ray, etc.)")
    body_part: Optional[str] = Field(None, description="Anatomical region imaged")
    findings: Optional[str] = Field(None, description="Radiological findings")
    impression: Optional[str] = Field(None, description="Radiologist impression")
    performed_at: Optional[datetime] = Field(None, description="When imaging was performed")
    report_url: Optional[str] = Field(None, description="Link to full imaging report")


class Patient(BaseModel):
    """Complete patient data model for AI case matching"""
    demographics: PatientDemographics = Field(..., description="Patient demographic information")
    vitals: Optional[List[PatientVitals]] = Field(None, description="Patient vital signs history")
    labs: Optional[List[PatientLabs]] = Field(None, description="Laboratory test results")
    imaging: Optional[List[PatientImaging]] = Field(None, description="Imaging studies")
    diagnoses: Optional[List[str]] = Field(None, description="List of patient diagnoses")
    medications: Optional[List[str]] = Field(None, description="List of current medications")
    procedures: Optional[List[str]] = Field(None, description="List of procedures performed")
    clinical_notes: Optional[List[str]] = Field(None, description="Unstructured clinical notes")
    admission_date: Optional[datetime] = Field(None, description="Date of admission")
    discharge_date: Optional[datetime] = Field(None, description="Date of discharge")
    emergency_contact: Optional[Dict[str, str]] = Field(None, description="Emergency contact information")
    insurance_info: Optional[Dict[str, str]] = Field(None, description="Insurance information")
    additional_data: Optional[Dict[str, Any]] = Field(None, description="Any additional patient data") 