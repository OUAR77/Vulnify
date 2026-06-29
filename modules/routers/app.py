import logging
import json
import re
import io
import httpx
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

SYSTEM_PROMPT = """Eres un asistente experto en redacción de documentos profesionales, legales y corporativos de alta calidad.

NORMAS ESTRICTAS:
- Responde SIEMPRE en el mismo idioma en que te pregunten.
- Devuelve ÚNICAMENTE el documento solicitado, sin explicaciones, saludos ni despedidas.
- Usa un formato profesional, bien estructurado y visualmente limpio.
- Incluye encabezados, secciones numeradas, párrafos bien separados y sangrías cuando corresponda.
- No uses markdown ni caracteres especiales de formato. Usa texto plano con estructura clara.
- El documento debe verse como si hubiera sido redactado por un abogado, notario o consultor profesional.
- Sé específico, detallado y riguroso en la redacción.
- Para contratos: incluye cláusulas bien redactadas, condiciones, plazos, obligaciones de cada parte, firma y fechas.
- Para facturas: incluye número de factura, fecha, desglose de conceptos con cantidades, base imponible, IVA y total.
- Para informes: incluye portada, índice, introducción, desarrollo, conclusiones y recomendaciones.
- Para cartas: incluye membrete, fecha, destinatario, asunto, cuerpo formal y despedida cortés.
- Para presupuestos: incluye datos del emisor y cliente, descripción detallada de servicios, importes, condiciones de pago y validez."""


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
    document_type: str = "general"
    fields: dict[str, str] = {}
    logo: str = ""


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


FIELD_LABELS: dict[str, str] = {
    "party_a": "Parte A (contratante)",
    "party_b": "Parte B (contratado)",
    "contract_subject": "Objeto del contrato",
    "duration": "Duración",
    "start_date": "Fecha de inicio",
    "city": "Ciudad",
    "company_name": "Nombre de la empresa",
    "client_name": "Nombre del cliente",
    "invoice_number": "Número de factura",
    "amount": "Monto/Cantidad",
    "concept": "Concepto",
    "date": "Fecha",
    "title": "Título",
    "author": "Autor",
    "summary": "Resumen/Contenido",
    "recipient_name": "Nombre del destinatario",
    "sender_name": "Nombre del remitente",
    "subject": "Asunto",
    "service_description": "Descripción del servicio",
    "valid_until": "Validez",
    "prompt": "Instrucciones adicionales",
}


async def _generate_doc(document_type: str, fields: dict[str, str]) -> str:
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=502, detail="GROQ_API_KEY no configurada")

    type_names = {
        "contract": "CONTRATO",
        "invoice": "FACTURA",
        "report": "INFORME",
        "letter": "CARTA",
        "quote": "PRESUPUESTO",
        "general": "DOCUMENTO",
    }
    type_name = type_names.get(document_type, "DOCUMENTO")

    field_lines = []
    for key, value in fields.items():
        if value.strip():
            label = FIELD_LABELS.get(key, key)
            field_lines.append(f"  • {label}: {value}")

    structure_guides = {
        "contract": (
            "Estructura obligatoria:\n"
            "1. Título centrado: CONTRATO DE [objeto]\n"
            "2. Encabezado con lugar y fecha\n"
            "3. Identificación de las partes (nombre, RUT/NIF, domicilio)\n"
            "4. ANTECEDENTES / CONSIDERANDOS (exposición de motivos)\n"
            "5. CLÁUSULAS numeradas con obligaciones, plazos, condiciones\n"
            "6. CLÁUSULAS ADICIONALES: vigencia, resolución, confidencialidad, jurisdicción\n"
            "7. Fecha y firmas de ambas partes"
        ),
        "invoice": (
            "Estructura obligatoria:\n"
            "1. Título: FACTURA Nº [número]\n"
            "2. Datos del emisor y del cliente\n"
            "3. Fecha de emisión y vencimiento\n"
            "4. Desglose detallado: concepto, cantidad, precio unitario, importe\n"
            "5. Base imponible, IVA (% y total), Total factura\n"
            "6. Forma de pago y datos bancarios"
        ),
        "report": (
            "Estructura obligatoria:\n"
            "1. Portada: título, autor, fecha, versión\n"
            "2. Índice / Tabla de contenidos\n"
            "3. Resumen ejecutivo\n"
            "4. Introducción y objetivos\n"
            "5. Desarrollo: análisis, datos, metodología\n"
            "6. Conclusiones y recomendaciones\n"
            "7. Anexos si procede"
        ),
        "letter": (
            "Estructura obligatoria:\n"
            "1. Lugar y fecha en la parte superior derecha\n"
            "2. Datos del destinatario (nombre, cargo, empresa, dirección)\n"
            "3. Asunto claro y conciso\n"
            "4. Saludo formal (Estimado/a Sr./Sra. ...)\n"
            "5. Cuerpo: exposición clara y ordenada\n"
            "6. Despedida cortés (Atentamente, Reciba un cordial saludo...)\n"
            "7. Firma y cargo del remitente"
        ),
        "quote": (
            "Estructura obligatoria:\n"
            "1. Título: PRESUPUESTO Nº [número]\n"
            "2. Datos del emisor y del cliente\n"
            "3. Fecha de emisión y validez\n"
            "4. Descripción detallada de los servicios/productos\n"
            "5. Desglose de importes\n"
            "6. Total y condiciones de pago\n"
            "7. Condiciones generales y plazo de validez"
        ),
    }
    structure = structure_guides.get(document_type, "")

    if not field_lines:
        if structure:
            prompt = f"Genera un {type_name} profesional completo.\n\n{structure}"
        else:
            prompt = f"Genera un {type_name} profesional completo y bien estructurado."
    else:
        fields_text = chr(10).join(field_lines)
        if structure:
            prompt = f"Genera un {type_name} profesional completo con los siguientes datos:\n\n{fields_text}\n\n{structure}"
        else:
            prompt = f"Genera un {type_name} profesional completo con los siguientes datos:\n\n{fields_text}"
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
                "temperature": 0.5,
            },
        )
        data = resp.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


@router.post("/generate")
async def app_generate(body: GenerateRequest, user: dict = Depends(get_app_user)):
    try:
        content = await _generate_doc(body.document_type, body.fields)
        return {"ok": True, "document": content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("App generate error: %s", e)
        raise HTTPException(status_code=502, detail="Error al generar documento")


@router.post("/generate-pdf")
async def app_generate_pdf(body: GenerateRequest, user: dict = Depends(get_app_user)):
    try:
        content = await _generate_doc(body.document_type, body.fields)
        logo_html = ""
        if body.logo:
            logo_html = f'<div style="text-align:center;margin-bottom:1.5cm"><img src="{body.logo}" style="max-height:80px;max-width:200px" /></div>'
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body {{ font-family: 'DejaVu Sans', sans-serif; padding: 2.5cm; line-height: 1.6; color: #111; }}
h1 {{ font-size: 22pt; margin-bottom: 1cm; }}
p {{ margin-bottom: 0.5cm; }}
</style></head><body>{logo_html}<div>{content.replace(chr(10), '<br>')}</div></body></html>"""
        try:
            from weasyprint import HTML
            pdf_bytes = HTML(string=html).write_pdf()
        except Exception:
            import markdown
            html_body = markdown.markdown(content)
            html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body {{ font-family: 'DejaVu Sans', sans-serif; padding: 2.5cm; line-height: 1.6; color: #111; }}
</style></head><body>{logo_html}{html_body}</body></html>"""
            from weasyprint import HTML
            pdf_bytes = HTML(string=html).write_pdf()
        return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=documento.pdf"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error("App generate-pdf error: %s", e)
        raise HTTPException(status_code=502, detail="Error al generar PDF")
