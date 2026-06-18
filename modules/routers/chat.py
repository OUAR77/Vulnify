import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from config import settings

logger = logging.getLogger("vulnify.api.chat")

router = APIRouter(prefix="/api/chat")

SYSTEM_PROMPT = """Eres el asistente virtual de Vulnify, una agencia de desarrollo web e inteligencia artificial.

Servicios que ofreces:
- Desarrollo Web: webs corporativas, tiendas online, aplicaciones web
- Integraciones IA: chatbots, automatizaciones, análisis predictivo
- APIs & Backend: APIs robustas, paneles de administración, backend escalable
- Consultoría: estrategia digital, asesoría tecnológica

Sitio web: https://vulnify.es
Email: hola@vulnify.es

Responde siempre en español, de forma amable y profesional. Si te preguntan por precios, deriva al formulario de contacto. Si no sabes algo, sé honesto y ofrece ayudar a derivar la consulta."""

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("", response_model=ChatResponse)
async def chat(request: Request, body: ChatMessage):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    if settings.AI_PROVIDER == "ollama":
        return await _chat_ollama(body.message)
    return await _chat_openai(body.message)

async def _chat_openai(message: str) -> ChatResponse:
    try:
        import openai
        client = openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            max_tokens=500,
            temperature=0.7,
        )
        reply = resp.choices[0].message.content or ""
        return ChatResponse(reply=reply)
    except Exception as e:
        logger.error("OpenAI chat error: %s", e)
        raise HTTPException(status_code=502, detail="Error al comunicar con el asistente")

async def _chat_ollama(message: str) -> ChatResponse:
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    "stream": False,
                    "options": {"num_predict": 500, "temperature": 0.7},
                },
                timeout=30,
            )
            data = resp.json()
            reply = data.get("message", {}).get("content", "")
            return ChatResponse(reply=reply)
    except Exception as e:
        logger.error("Ollama chat error: %s", e)
        raise HTTPException(status_code=502, detail="Error al comunicar con el asistente")
