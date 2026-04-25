from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_scoped_client(department_id: str) -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return client
