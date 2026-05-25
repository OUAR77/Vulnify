"""Genera .env.production con claves seguras para producción."""
import secrets, os

def gen(len=48):
    return secrets.token_urlsafe(len)

env = f"""# === GENERADO AUTOMATICAMENTE - CAMBIA LAS CLAVES SENSIBLES ===
SECRET_KEY={gen()}
ENVIRONMENT=production
LOG_LEVEL=WARNING
ACCESS_TOKEN_EXPIRE_DAYS=7
SITE_URL=https://vulnify.es
CORS_ORIGINS=["https://vulnify.es","https://www.vulnify.es"]
ADMIN_SEED_SECRET={gen()}
ADMIN_PASSWORD={gen(16)}
ADMIN_EMAIL=admin@vulnify.es
PLATFORM_COMMISSION_PERCENT=10.0
# === BASE DE DATOS (cambiar por PostgreSQL en produccion) ===
DATABASE_URL=sqlite:///./vulnify.db
# DATABASE_URL=postgresql://vulnify:DB_PASSWORD@db:5432/vulnify
# === STRIPE (rellenar con tus claves reales) ===
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# === SENDGRID (rellenar si quieres emails) ===
# SENDGRID_API_KEY=SG.xxxxx
# === AI (opcional) ===
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5-coder:14b
"""
path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
with open(path, "w") as f:
    f.write(env)
print(f"[OK] Creado {os.path.abspath(path)}")
print("1. Revisa y edita STRIPE, SENDGRID y DATABASE_URL si es necesario")
print("2. Copia a .env:  copy .env.production .env")
print("3. Despliega:  docker compose up -d")
