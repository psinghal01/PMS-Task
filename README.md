# Hospital Patient Briefing & AI Consultation Tool

An internal hospital tool that generates concise patient summaries and enables doctors to consult an AI assistant with full clinical context.

## Features

* Auto-generated patient briefings with priority-based summarization
* AI-powered clinical assistant for real-time consultation
* Secure department-level data isolation (RLS)
* Stored consultation history
* Responsive dashboard with modern UI

## Tech Stack

* Backend: FastAPI (Python)
* Frontend: React (TypeScript), Tailwind CSS
* Database: Supabase (PostgreSQL)
* AI Model: Llama 3 (via Hugging Face API)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run python -m app.main
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker

```bash
docker-compose up --build
```

## Environment Variables

**Backend**

* SUPABASE_URL
* SUPABASE_KEY
* HUGGINGFACE_API_TOKEN
* HF_MODEL_ID

**Frontend**

* VITE_API_URL