from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import BriefingResponse, MedicalRecord, RecordType
from app.core.supabase_client import get_supabase_client
from app.core.config import settings
import tiktoken
from datetime import datetime

router = APIRouter()

def get_token_count(text: str) -> int:
    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))

@router.get("/{patient_id}/briefing", response_model=BriefingResponse)
async def get_patient_briefing(patient_id: str, department_id: str = Query(...)):
    supabase = get_supabase_client()

    patient_data = supabase.table("patients").select("*").eq("id", patient_id).execute()
    if not patient_data.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = patient_data.data[0]
    
    dept_data = supabase.table("departments").select("name").eq("id", department_id).execute()
    if not dept_data.data:
        raise HTTPException(status_code=404, detail="Department not found")
    dept_name = dept_data.data[0]["name"]
    records_data = supabase.table("medical_records").select("*")\
        .eq("patient_id", patient_id)\
        .eq("department_id", department_id)\
        .order("severity", desc=True)\
        .order("recorded_at", desc=True)\
        .execute()
    
    all_records = [MedicalRecord(**r) for r in records_data.data]
    
    selected_records = []
    total_tokens = 0
    token_limit = 2000
    
    for record in all_records:
        if record.severity == 5:
            record_text = f"{record.record_type}: {record.title} - {record.content}\n"
            tokens = get_token_count(record_text)
            selected_records.append(record)
            total_tokens += tokens
    for severity in [4, 3, 2, 1]:
        for record in all_records:
            if record.severity == severity:
                record_text = f"{record.record_type}: {record.title} - {record.content}\n"
                tokens = get_token_count(record_text)
                if total_tokens + tokens <= token_limit:
                    selected_records.append(record)
                    total_tokens += tokens
                elif severity == 5:
                    pass
    dob = datetime.fromisoformat(patient["date_of_birth"].replace('Z', '+00:00'))
    age = (datetime.now().date() - dob.date()).days // 365
    critical_alerts = [r for r in selected_records if r.severity == 5]
    medications = [r for r in selected_records if r.record_type == RecordType.MEDICATION]
    history = [r for r in selected_records if r.record_type in [RecordType.DIAGNOSIS, RecordType.PROCEDURE, RecordType.LAB_RESULT]]
    decisions = [r for r in selected_records if r.record_type == RecordType.DIAGNOSIS and "Switched" in r.content] # Example filter
    
    briefing_text = f"PATIENT BRIEFING — {patient['name']}\n"
    briefing_text += f"Department: {dept_name}\n"
    briefing_text += f"Age: {age} | Blood Group: {patient.get('blood_group', 'N/A')} | Emergency Contact: {patient.get('emergency_contact', 'N/A')}\n\n"
    
    briefing_text += "⚠ CRITICAL ALERTS:\n"
    if critical_alerts:
        for r in critical_alerts:
            briefing_text += f"- [{r.record_type}] {r.title}: {r.content}\n"
    else:
        briefing_text += "- None\n"
        
    briefing_text += "\nACTIVE MEDICATIONS:\n"
    if medications:
        for r in medications:
            briefing_text += f"- {r.title}: {r.content}\n"
    else:
        briefing_text += "- None\n"
        
    briefing_text += "\nKEY HISTORY:\n"
    if history:
        history.sort(key=lambda x: x.recorded_at, reverse=True)
        for r in history:
            briefing_text += f"- [{r.record_type}] {r.title} ({r.recorded_at.strftime('%b %Y')}): {r.content}\n"
    else:
        briefing_text += "- None\n"
        
    briefing_text += "\nPAST CLINICAL DECISIONS:\n"
    if history:
        for r in history:
            if r.severity >= 4:
                briefing_text += f"- {r.title}: {r.content} (Recorded by: {r.recorded_by})\n"
    else:
        briefing_text += "- None\n"

    return BriefingResponse(
        patient_name=patient["name"],
        department_name=dept_name,
        age=age,
        blood_group=patient.get('blood_group', 'N/A'),
        emergency_contact=patient.get('emergency_contact', 'N/A'),
        briefing_text=briefing_text,
        raw_records=selected_records
    )