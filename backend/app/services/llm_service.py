from huggingface_hub import InferenceClient
from typing import AsyncGenerator
from app.core.config import settings

class LLMService:
    @staticmethod
    async def stream_huggingface(prompt_text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        client = InferenceClient(
            token=settings.HUGGINGFACE_API_TOKEN
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_text},
        ]

        try:
            for response in client.chat_completion(
                model=settings.HF_MODEL_ID,
                messages=messages,
                max_tokens=1000,
                stream=True,
                temperature=0.1,
            ):
                if response.choices:
                    content = response.choices[0].delta.content
                    if content:
                        yield content
        except Exception as e:
            yield f"Inference Error (Model: {settings.HF_MODEL_ID}): {str(e)}"