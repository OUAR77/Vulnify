import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
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
            except Exception as e:
                logger.warning("WebSocket send error to user %s: %s", user_id, e)
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
                Plan(name="Gratis", description="Escaneos ilimitados, informes básicos", price_monthly=0, max_reports=-1, max_programs=0, features=["Escaneos ilimitados", "Informe PDF básico", "Problemas críticos"], active=True),
                Plan(name="Pro", description="Para autónomos y pequeñas empresas", price_monthly=9, max_reports=-1, max_programs=0, features=["Escaneos ilimitados", "Informe PDF detallado", "Alertas por email", "Monitorización semanal", "3 dominios"], active=True),
                Plan(name="Business", description="Para equipos y agencias", price_monthly=29, max_reports=-1, max_programs=0, features=["Dominios ilimitados", "Escaneo diario", "API de escaneo", "Informes personalizados", "Soporte prioritario"], active=True),
            ]
            db.add_all(plans)
            db.commit()
            logger.info("Seed plans created")
        stripe_updates = {"Gratis": "STRIPE_PRICE_GRATIS", "Pro": "STRIPE_PRICE_STARTER", "Business": "STRIPE_PRICE_PRO"}
        stripe_fallbacks = {"Gratis": "STRIPE_PRICE_FREE", "Pro": "STRIPE_PRICE_MONTHLY", "Business": "STRIPE_PRICE_YEARLY"}
        for name in stripe_updates:
            val = os.getenv(stripe_updates[name]) or os.getenv(stripe_fallbacks[name])
            if val:
                p = db.query(Plan).filter(Plan.name == name).first()
                if p and p.stripe_price_id_monthly != val:
                    p.stripe_price_id_monthly = val
                    logger.info("Updated %s stripe_price_id_monthly from env", name)
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
    description="Security scanner platform — scan domains, find vulnerabilities, and get reports",
    version="2.0.0",
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


@app.get("/robots.txt", response_class=FileResponse)
async def robots():
    return FileResponse("static/robots.txt", media_type="text/plain")

@app.get("/sitemap.xml", response_class=FileResponse)
async def sitemap():
    return FileResponse("static/sitemap.xml", media_type="application/xml")

@app.get("/", response_class=HTMLResponse, description="Home page")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/login", response_class=HTMLResponse, description="Login")
async def login_page(request: Request):
    return templates.TemplateResponse(request, "login.html")


@app.get("/register", response_class=HTMLResponse, description="Register")
async def register_page(request: Request):
    return templates.TemplateResponse(request, "register.html")


@app.get("/scanner", response_class=HTMLResponse, description="Security scanner")
async def scanner_page(request: Request):
    return templates.TemplateResponse(request, "scan.html")


@app.get("/precios", response_class=HTMLResponse, description="Pricing plans")
async def precios(request: Request):
    return templates.TemplateResponse(request, "pricing.html")


@app.get("/dashboard", response_class=HTMLResponse, description="User dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/terminos", response_class=HTMLResponse, description="Terms and conditions")
async def terminos(request: Request):
    return templates.TemplateResponse(request, "terms.html")

@app.get("/contacto", response_class=HTMLResponse, description="Contact page")
async def contacto(request: Request):
    return templates.TemplateResponse(request, "contact.html")

@app.get("/sobre-nosotros", response_class=HTMLResponse, description="About us")
async def sobre_nosotros(request: Request):
    return templates.TemplateResponse(request, "about.html")

@app.get("/privacidad", response_class=HTMLResponse, description="Privacy policy")
async def privacidad(request: Request):
    return templates.TemplateResponse(request, "privacy.html")


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


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
