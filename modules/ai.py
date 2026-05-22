import logging
from openai import OpenAI
from config import settings

logger = logging.getLogger("vulnify.ai")


if settings.OPENAI_API_KEY:
    if settings.OPENAI_BASE_URL:
        client = OpenAI(base_url=settings.OPENAI_BASE_URL, api_key=settings.OPENAI_API_KEY)
    else:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
    MODEL = settings.OPENAI_MODEL
elif settings.AI_PROVIDER == "ollama":
    client = OpenAI(base_url=f"{settings.OLLAMA_BASE_URL}/v1", api_key="ollama")
    MODEL = settings.OLLAMA_MODEL
else:
    client = None
    MODEL = settings.OPENAI_MODEL


def _call(prompt: str, system: str = "") -> str | None:
    if not client:
        return None
    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": prompt})
    try:
        res = client.chat.completions.create(model=MODEL, messages=msgs, temperature=0.3, max_tokens=2000)
        return res.choices[0].message.content
    except Exception as e:
        logger.error("AI call failed: %s", e)
        return None


ANALYZER_SYSTEM = """Eres un analista de seguridad experto en bug bounty.
Analiza reportes de vulnerabilidades y responde SOLO con JSON válido sin markdown.
Campos: severity (critical/high/medium/low/info), cwe_id (string), cvss_score (0-10),
cvss_vector (string), confidence (0-1), explanation (explicación breve)."""


def analyze_report(title: str, description: str, steps: str, impact: str) -> dict | None:
    prompt = f"""Título: {title}
Descripción: {description}
Pasos para reproducir: {steps}
Impacto: {impact}

Analiza esta vulnerabilidad y devuelve JSON con severity, cwe_id, cvss_score, cvss_vector, confidence, explanation."""
    res = _call(prompt, ANALYZER_SYSTEM)
    if not res:
        return None
    import json, re
    match = re.search(r"\{.*\}", res, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None


DUP_SYSTEM = """Eres un experto en seguridad que detecta si dos reportes de bug bounty describen la misma vulnerabilidad.
Responde SOLO con JSON: {{"is_duplicate": bool, "similarity": 0.0-1.0, "reason": "explicación breve"}}."""


def check_duplicate(new_title: str, new_desc: str, existing_title: str, existing_desc: str) -> dict | None:
    prompt = f"""Reporte nuevo:
Título: {new_title}
Descripción: {new_desc}

Reporte existente:
Título: {existing_title}
Descripción: {existing_desc}

¿Describen la misma vulnerabilidad? Responde JSON con is_duplicate, similarity, reason."""
    res = _call(prompt, DUP_SYSTEM)
    if not res:
        return None
    import json, re
    match = re.search(r"\{.*\}", res, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None


CHAT_SYSTEM = """Eres un asistente experto en bug bounty y ciberseguridad. Ayudas a hunters a:
- Mejorar sus reportes de vulnerabilidades
- Entender vectores de ataque
- Sugerir pasos para reproducir bugs
- Identificar tipos de vulnerabilidades
Responde en español, sé conciso y práctico."""


def chat(messages: list[dict]) -> str | None:
    if not client:
        return None
    try:
        msgs = [{"role": "system", "content": CHAT_SYSTEM}] + messages
        res = client.chat.completions.create(model=MODEL, messages=msgs, temperature=0.5, max_tokens=1500)
        return res.choices[0].message.content
    except Exception as e:
        logger.error("Chat error: %s", e)
        return None


ENHANCE_SYSTEM = """Eres un editor técnico especializado en reportes de seguridad.
Mejora el texto manteniendo la información técnica precisa."""

ENHANCE_PROMPTS = {
    "grammar": "Corrige la gramática y ortografía. Mantén el contenido técnico intacto. Responde SOLO con el texto corregido.",
    "summary": "Haz un resumen ejecutivo conciso del reporte (máx 3 párrafos). Responde SOLO con el resumen.",
    "translate_en": "Traduce al inglés manteniendo la terminología técnica. Responde SOLO con la traducción.",
    "translate_es": "Traduce al español manteniendo la terminología técnica. Responde SOLO con la traducción.",
}


def enhance_report(text: str, mode: str = "grammar") -> str | None:
    instruction = ENHANCE_PROMPTS.get(mode)
    if not instruction:
        return None
    prompt = f"{instruction}\n\nTexto:\n{text}"
    return _call(prompt, ENHANCE_SYSTEM)


POC_SYSTEM = """Eres un investigador de seguridad experto. Dada una descripción de vulnerabilidad,
sugiere pasos concretos para crear un PoC (Proof of Concept).
Responde en español con formato claro y pasos numerados."""


def suggest_poc(description: str, vulnerability_type: str = "") -> str | None:
    prompt = f"""Tipo de vulnerabilidad: {vulnerability_type or "No especificado"}
Descripción: {description}

Sugiere pasos para crear un Proof of Concept funcional, incluyendo:
1. Herramientas necesarias
2. Pasos detallados
3. Payloads o ejemplos de código si aplica
4. Cómo verificar que el PoC funciona"""
    return _call(prompt, POC_SYSTEM)
