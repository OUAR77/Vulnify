import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from config import limiter, settings
from database import Base, engine
from api import router as api_router
from models.user import User


os.makedirs("uploads", exist_ok=True)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("vulnify")


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        conns = self.active.get(user_id, [])
        if ws in conns:
            conns.remove(ws)

    async def send_to_user(self, user_id: int, message: dict):
        conns = self.active.get(user_id, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            conns.remove(ws)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    import models
    from models.plan import Plan
    from models.user import User
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created via metadata")
    except Exception as e:
        logger.warning("Could not create tables: %s", e)
    try:
        from database import SessionLocal
        from modules.auth import hash_password
        db = SessionLocal()
        if not db.query(Plan).first():
            plans = [
                Plan(name="Gratis", description="Plan gratuito para empezar", price_monthly=0, max_reports=5, max_programs=1, features=["Reportes ilimitados", "Soporte por email", "Perfil público"], active=True),
                Plan(name="Starter", description="Para empresas en crecimiento", price_monthly=49, max_reports=50, max_programs=3, features=["50 reportes/mes", "3 programas activos", "Soporte prioritario", "API básica"], active=True),
                Plan(name="Profesional", description="Para equipos de seguridad", price_monthly=149, max_reports=-1, max_programs=-1, features=["Reportes ilimitados", "Programas ilimitados", "Soporte 24/7", "API completa", "Slack/Discord", "Analítica avanzada"], active=True),
            ]
            db.add_all(plans)
            db.commit()
            logger.info("Seed plans created")
        stripe_updates = {"Gratis": "STRIPE_PRICE_GRATIS", "Starter": "STRIPE_PRICE_STARTER", "Profesional": "STRIPE_PRICE_PRO"}
        stripe_fallbacks = {"Gratis": "STRIPE_PRICE_FREE", "Starter": "STRIPE_PRICE_MONTHLY", "Profesional": "STRIPE_PRICE_YEARLY"}
        any_update = False
        for name in stripe_updates:
            val = os.getenv(stripe_updates[name]) or os.getenv(stripe_fallbacks[name])
            if val:
                p = db.query(Plan).filter(Plan.name == name).first()
                if p and p.stripe_price_id_monthly != val:
                    p.stripe_price_id_monthly = val
                    logger.info("Updated %s stripe_price_id_monthly from env", name)
                    any_update = True
        if any_update:
            db.commit()
        if not db.query(User).filter(User.role == "admin").first():
            admin_pw = os.getenv("ADMIN_PASSWORD", "admin123456")
            admin = User(name="Admin Vulnify", email=os.getenv("ADMIN_EMAIL", "admin@vulnify.com"), password=hash_password(admin_pw), role="admin", company="", is_verified=1)
            db.add(admin)
            db.commit()
            logger.info("Admin user created")
        db.close()
    except Exception as e:
        logger.warning("Could not seed data: %s", e)
    logger.info("Vulnify started (environment=%s)", settings.ENVIRONMENT)
    yield
    logger.info("Vulnify shutting down")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if "text/html" in response.headers.get("content-type", ""):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app = FastAPI(
    title="Vulnify API",
    description="Bug bounty platform — report vulnerabilities, manage programs, and track rewards",
    version="1.3.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.state.ws_manager = manager
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["vulnify-production.up.railway.app", "vulnify.es", "www.vulnify.es"],
    )

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(api_router)

templates = Jinja2Templates(directory="templates")


@app.exception_handler(404)
async def not_found(request: Request, exc):
    return templates.TemplateResponse(request, "404.html", status_code=404)


@app.exception_handler(500)
async def server_error(request: Request, exc):
    logger.exception("Internal server error")
    return templates.TemplateResponse(request, "500.html", status_code=500)


@app.get("/", response_class=HTMLResponse, description="Home page")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/programas", response_class=HTMLResponse, description="Browse bug bounty programs")
async def programas(request: Request):
    return templates.TemplateResponse(request, "programs.html")


@app.get("/precios", response_class=HTMLResponse, description="Pricing plans")
async def precios(request: Request):
    return templates.TemplateResponse(request, "pricing.html")

@app.get("/terminos", response_class=HTMLResponse, description="Terms and conditions")
async def terminos(request: Request):
    return templates.TemplateResponse(request, "terms.html")

@app.get("/sobre-nosotros", response_class=HTMLResponse, description="About us")
async def sobre_nosotros(request: Request):
    return templates.TemplateResponse(request, "about.html")

@app.get("/privacidad", response_class=HTMLResponse, description="Privacy policy")
async def privacidad(request: Request):
    return templates.TemplateResponse(request, "privacy.html")


@app.get("/programa/{program_id}", response_class=HTMLResponse, description="Program detail page")
async def program_detail(request: Request, program_id: int):
    return templates.TemplateResponse(request, "program-detail.html")


@app.get("/hall-of-fame", response_class=HTMLResponse, description="Hall of fame — top hunters")
async def hall_of_fame(request: Request):
    return templates.TemplateResponse(request, "hall-of-fame.html")


@app.get("/hunter/{hunter_id}", response_class=HTMLResponse, description="Hunter profile page")
async def hunter_profile(request: Request, hunter_id: int):
    return templates.TemplateResponse(request, "hunter.html")


@app.get("/dashboard", response_class=HTMLResponse, description="Hunter dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/company", response_class=HTMLResponse, description="Company dashboard")
async def company_dashboard(request: Request):
    return templates.TemplateResponse(request, "company-dashboard.html")


@app.get("/company/billing", response_class=HTMLResponse, description="Company billing & subscription")
async def company_billing(request: Request):
    return templates.TemplateResponse(request, "billing.html")


@app.get("/company/billing-debug", response_class=HTMLResponse, description="Billing debug page")
async def billing_debug(request: Request):
    return templates.TemplateResponse(request, "billing_debug.html")


@app.get("/report/new", response_class=HTMLResponse, description="Submit a new vulnerability report")
async def new_report(request: Request):
    return templates.TemplateResponse(request, "report.html")


@app.get("/report/{report_id}", response_class=HTMLResponse, description="Report detail page")
async def report_detail(request: Request, report_id: int):
    return templates.TemplateResponse(request, "report-detail.html")


@app.get("/stats", response_class=HTMLResponse, description="Platform statistics")
async def stats_page(request: Request):
    return templates.TemplateResponse(request, "stats.html")


@app.get("/admin", response_class=HTMLResponse, description="Admin panel")
async def admin_page(request: Request):
    return templates.TemplateResponse(request, "admin.html")


@app.get("/ai", response_class=HTMLResponse, description="AI-powered tools")
async def ai_tools_page(request: Request):
    return templates.TemplateResponse(request, "ai-tools.html")


@app.get("/health")
async def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
    }


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# --- WebSocket ---

@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = ""):
    if not token:
        await websocket.close(code=1008)
        return
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        await websocket.close(code=1008)
        return
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
