import logging
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings

logger = logging.getLogger("vulnify.api.property_extract")

router = APIRouter(prefix="/api/extract-property")

SYSTEM_PROMPT = "Eres un extractor de datos inmobiliarios. Devuelve SOLO JSON válido, sin markdown, sin texto adicional."

class ExtractRequest(BaseModel):
    text: str

EXTRACT_FIELDS = [
    "direccion", "precio", "metros_cuadrados", "habitaciones",
    "banos", "planta", "ascensor", "garaje", "terraza",
    "gastos_comunidad", "tipo", "estado", "descripcion_corta"
]

@router.post("")
async def extract_property(body: ExtractRequest):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=502, detail="GROQ_API_KEY no configurada")

    try:
        import httpx
        prompt = (
            f"Extrae estos campos: {', '.join(EXTRACT_FIELDS)}. "
            f"Tipos: direccion (string), precio (número sin símbolos), "
            f"metros_cuadrados (número), habitaciones (número), "
            f"banos (número), planta (string), ascensor (true/false), "
            f"garaje (true/false), terraza (true/false), "
            f"gastos_comunidad (string), tipo (piso/casa/local/oficina/garaje), "
            f"estado (string), descripcion_corta (string, max 100 chars). "
            f"Propiedad: {body.text}"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                },
            )
            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            cleaned = re.sub(r"```json\s*|\s*```", "", content).strip()
            result = json.loads(cleaned)
            return {"ok": True, "data": result}
    except json.JSONDecodeError:
        logger.error("Groq returned invalid JSON: %s", content)
        raise HTTPException(status_code=502, detail="Error al procesar la respuesta del AI")
    except Exception as e:
        logger.error("Property extract error: %s", e)
        raise HTTPException(status_code=502, detail="Error al extraer datos de la propiedad")
