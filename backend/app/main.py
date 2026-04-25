from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import briefing, consult
from app.core.supabase_client import get_supabase_client
from app.core.config import settings
import uvicorn

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    print("========================================")
    print(f"STARTING HOSPITAL AI BACKEND")
    print(f"HF_MODEL_ID: {settings.HF_MODEL_ID}")
    print("========================================")
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(briefing.router, prefix="/patients", tags=["Briefing"])
app.include_router(consult.router, prefix="/consult", tags=["Consultation"])

@app.get("/")
async def root():
    return {"message": "Hospital AI API is running"}

@app.get("/patients")
async def list_patients():
    supabase = get_supabase_client()
    data = supabase.table("patients").select("*").execute()
    return data.data

@app.get("/departments")
async def list_departments():
    supabase = get_supabase_client()
    data = supabase.table("departments").select("*").execute()
    return data.data

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
