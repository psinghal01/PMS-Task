from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class RecordType(str, Enum):
    ALLERGY = "ALLERGY"
    MEDICATION = "MEDICATION"
    DIAGNOSIS = "DIAGNOSIS"
    PROCEDURE = "PROCEDURE"
    LAB_RESULT = "LAB_RESULT"
    CONTRAINDICATION = "CONTRAINDICATION"

class MedicalRecord(BaseModel):
    id: str
    patient_id: str
    department_id: str
    record_type: RecordType
    title: str
    content: str
    severity: int
    recorded_by: Optional[str] = None
    recorded_at: datetime

class Patient(BaseModel):
    id: str
    name: str
    date_of_birth: datetime
    blood_group: Optional[str]
    emergency_contact: Optional[str]

class BriefingResponse(BaseModel):
    patient_name: str
    department_name: str
    age: int
    blood_group: str
    emergency_contact: str
    briefing_text: str
    raw_records: List[MedicalRecord]

class ConsultRequest(BaseModel):
    patient_id: str
    department_id: str
    doctor_message: str

class ConsultationHistory(BaseModel):
    id: str
    patient_id: str
    department_id: str
    doctor_name: str
    messages: List[Dict[str, str]]
    created_at: datetime