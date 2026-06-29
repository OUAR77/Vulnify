import logging
import json
import re
import io
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.purchase import Purchase
from models.product import Product
from config import settings

logger = logging.getLogger("vulnify.api.app")
router = APIRouter(prefix="/api/app")
security = HTTPBearer(auto_error=False)

SYSTEM_PROMPT = "Eres un asistente experto en generar documentos legales y administrativos. Responde siempre en el idioma que te pregunten. Devuelve SOLO el documento solicitado, sin explicaciones adicionales. Usa formato claro y profesional."


def create_app_token(purchase_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    return jwt.encode({"sub": str(purchase_id), "type": "app_session", "exp": expires}, settings.SECRET_KEY, algorithm="HS256")


def get_app_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token requerido")
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "app_session":
            raise HTTPException(status_code=401, detail="Token inválido")
        purchase_id = int(payload["sub"])
        purchase = db.query(Purchase).filter(Purchase.id == purchase_id, Purchase.status == "completed").first()
        if not purchase:
            raise HTTPException(status_code=401, detail="Compra no encontrada")
        if purchase.expires_at and purchase.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Suscripción expirada")
        product = db.query(Product).filter(Product.id == purchase.product_id).first()
        return {"purchase": purchase, "product": product}
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Token inválido")


class LoginRequest(BaseModel):
    token: str


class GenerateRequest(BaseModel):
    prompt: str
    document_type: str = "general"


@router.post("/login")
def app_login(body: LoginRequest, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(
        Purchase.token == body.token,
        Purchase.status == "completed",
    ).first()
    if not purchase:
        raise HTTPException(status_code=401, detail="Token inválido o compra no completada")
    if purchase.expires_at and purchase.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Suscripción expirada")
    product = db.query(Product).filter(Product.id == purchase.product_id).first()
    session_token = create_app_token(purchase.id)
    return {
        "ok": True,
        "session_token": session_token,
        "product_name": product.name if product else "Producto",
        "expires_in_days": 30,
    }


@router.get("/me")
def app_me(user: dict = Depends(get_app_user)):
    purchase = user["purchase"]
    product = user["product"]
    return {
        "ok": True,
        "product_name": product.name if product else "Producto",
        "purchased_at": str(purchase.created_at)[:19] if purchase.created_at else None,
        "expires_at": str(purchase.expires_at)[:19] if purchase.expires_at else None,
    }


async def _generate_doc(document_type: str, prompt_text: str) -> str:
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=502, detail="GROQ_API_KEY no configurada")
    import httpx
    prompt = f"Genera un documento de tipo '{document_type}' con las siguientes instrucciones:\n\n{prompt_text}"
    async with httpx.AsyncClient(timeout=60) as client:
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
                "temperature": 0.3,
            },
        )
        data = resp.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


@router.post("/generate")
async def app_generate(body: GenerateRequest, user: dict = Depends(get_app_user)):
    try:
        content = await _generate_doc(body.document_type, body.prompt)
        return {"ok": True, "document": content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("App generate error: %s", e)
        raise HTTPException(status_code=502, detail="Error al generar documento")


@router.post("/generate-pdf")
async def app_generate_pdf(body: GenerateRequest, user: dict = Depends(get_app_user)):
    try:
        content = await _generate_doc(body.document_type, body.prompt)
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body {{ font-family: 'DejaVu Sans', sans-serif; padding: 2.5cm; line-height: 1.6; color: #111; }}
h1 {{ font-size: 22pt; margin-bottom: 1cm; }}
p {{ margin-bottom: 0.5cm; }}
</style></head><body><div>{content.replace(chr(10), '<br>')}</div></body></html>"""
        try:
            from weasyprint import HTML
            pdf_bytes = HTML(string=html).write_pdf()
        except Exception:
            import markdown
            html_body = markdown.markdown(content)
            html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body {{ font-family: 'DejaVu Sans', sans-serif; padding: 2.5cm; line-height: 1.6; color: #111; }}
</style></head><body>{html_body}</body></html>"""
            from weasyprint import HTML
            pdf_bytes = HTML(string=html).write_pdf()
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=documento.pdf"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error("App generate-pdf error: %s", e)
        raise HTTPException(status_code=502, detail="Error al generar PDF")
