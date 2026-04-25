import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(override=True) 

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hospital AI Assistant"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    HUGGINGFACE_API_TOKEN: str = os.getenv("HUGGINGFACE_API_TOKEN", "")
    HUGGINGFACEHUB_API_TOKEN: str = os.getenv("HUGGINGFACE_API_TOKEN", "")
    HF_MODEL_ID: str = os.getenv("HF_MODEL_ID", "meta-llama/Meta-Llama-3-8B-Instruct")
    HF_API_URL: str = os.getenv("HF_API_URL", "")

    class Config:
        case_sensitive = True

settings = Settings()