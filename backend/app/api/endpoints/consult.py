from fastapi import APIRouter, HTTPException
from app.models.schemas import ConsultRequest
from app.api.endpoints.briefing import get_patient_briefing
from app.services.llm_service import LLMService
from app.core.supabase_client import get_supabase_client
from sse_starlette.sse import EventSourceResponse

router = APIRouter()

@router.get("/history/{patient_id}")
async def get_history(patient_id: str, department_id: str):
    supabase = get_supabase_client()
    res = supabase.table("consultations")\
        .select("*")\
        .eq("patient_id", patient_id)\
        .eq("department_id", department_id)\
        .order("created_at", desc=True)\
        .execute()
    return res.data

@router.get("/stream")
async def consult_stream(patient_id: str, department_id: str, doctor_message: str):
    return await handle_consult(patient_id, department_id, doctor_message)

@router.post("")
async def consult_post(request: ConsultRequest):
    return await handle_consult(request.patient_id, request.department_id, request.doctor_message)

async def handle_consult(patient_id: str, department_id: str, doctor_message: str):
    briefing = await get_patient_briefing(patient_id, department_id)

    system_prompt = f"""You are a clinical assistant. Use the following patient history to assist the doctor.
Never fabricate information. If the briefing doesn't contain relevant info, say so.

### PATIENT BRIEFING
{briefing.briefing_text}
"""

    async def event_generator():
        full_response = ""
        try:
            generator = LLMService.stream_huggingface(doctor_message, system_prompt)
            async for chunk in generator:
                full_response += chunk
                yield {"data": chunk}
            
            supabase = get_supabase_client()
            supabase.table("consultations").insert({
                "patient_id": patient_id,
                "department_id": department_id,
                "doctor_name": "Dr. AI Assistant",
                "messages": [
                    {"role": "doctor", "content": doctor_message},
                    {"role": "assistant", "content": full_response}
                ]
            }).execute()
        except Exception as e:
            yield {"data": f"Error: {str(e)}"}

    return EventSourceResponse(event_generator())
