import os
import json
import logging
import threading
from contextlib import asynccontextmanager
from datetime import datetime
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
from modules.routers import auth_router, assets_router, alerts_router, plans_router, admin_router, search_router, reports_router, scan_router, batch_router
from models.user import User

os.makedirs("uploads", exist_ok=True)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("vulnify")

# Sentry
if settings.SENTRY_DSN and settings.ENVIRONMENT == "production":
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=settings.SENTRY_DSN, environment=settings.ENVIRONMENT)
        logger.info("Sentry initialized")
    except Exception as e:
        logger.warning("Sentry init failed: %s", e)


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
    from database import SessionLocal
    db = SessionLocal()
    is_postgres = "postgres" in settings.DATABASE_URL
    is_sqlite = "sqlite" in settings.DATABASE_URL
    try:
        logger.info("Creating tables with engine: %s", settings.DATABASE_URL[:30] + "...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created via metadata")
    except Exception as e:
        logger.warning("Could not create tables: %s", str(e)[:200])
    migrations = [
        ("plans", "max_assets", "INTEGER DEFAULT 0"),
        ("users", "totp_secret", "VARCHAR"),
        ("users", "totp_enabled", "BOOLEAN DEFAULT false"),
        ("users", "notify_critical", "BOOLEAN DEFAULT true"),
        ("users", "notify_high", "BOOLEAN DEFAULT true"),
        ("users", "notify_medium", "BOOLEAN DEFAULT true"),
        ("users", "notify_low", "BOOLEAN DEFAULT false"),
        ("users", "notify_email", "BOOLEAN DEFAULT true"),
        ("users", "dark_mode", "BOOLEAN DEFAULT false"),
        ("breach_alerts", "resolved", "BOOLEAN DEFAULT false"),
        ("breach_alerts", "resolved_at", "TIMESTAMP"),
    ]
    if is_sqlite:
        type_map = {"BOOLEAN DEFAULT true": "INTEGER DEFAULT 1", "BOOLEAN DEFAULT false": "INTEGER DEFAULT 0"}
        mappings = []
        for table, col, col_type in migrations:
            col_type = type_map.get(col_type, col_type)
            mappings.append((table, col, col_type))
        for table, col, col_type in mappings:
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                db.commit()
            except Exception:
                db.rollback()
    else:
        for table, col, col_type in migrations:
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                db.commit()
            except Exception:
                try:
                    db.rollback()
                    db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                    db.commit()
                except Exception:
                    db.rollback()
    try:
        from modules.auth import hash_password
        if not db.query(Plan).first():
            plans = [
                Plan(name="Gratis", description="Monitorización básica de brechas", price_monthly=0, price_yearly=0, max_assets=1, max_reports=-1, max_programs=0, features=["1 dominio o email", "Alertas por email", "Informe básico de brechas"], active=True),
                Plan(name="Starter", description="Para autónomos y pequeñas empresas", price_monthly=49, price_yearly=490, max_assets=5, max_reports=-1, max_programs=0, features=["Hasta 5 dominios o emails", "Alertas por email y dashboard", "Monitorización semanal", "Informe detallado de brechas", "Historial de alertas"], active=True),
                Plan(name="Profesional", description="Para equipos y agencias", price_monthly=149, price_yearly=1490, max_assets=-1, max_reports=-1, max_programs=0, features=["Dominios y emails ilimitados", "Monitorización diaria", "API de consulta", "Alertas en tiempo real", "Soporte prioritario 24/7"], active=True),
            ]
            db.add_all(plans)
            db.commit()
            logger.info("Seed plans created")
        if db.query(Plan).filter(Plan.name == "Pro").first():
            logger.info("Migrating old plan names (Pro->Starter, Business->Profesional)...")
            old_mapping = [
                ("Pro", "Starter", 49, 490, 5, settings.STRIPE_PRICE_STARTER_MONTHLY, settings.STRIPE_PRICE_STARTER_YEARLY),
                ("Business", "Profesional", 149, 1490, -1, settings.STRIPE_PRICE_PROFESIONAL_MONTHLY, settings.STRIPE_PRICE_PROFESIONAL_YEARLY),
            ]
            for old_name, new_name, price_m, price_y, max_a, stripe_m, stripe_y in old_mapping:
                plan = db.query(Plan).filter(Plan.name == old_name).first()
                if plan:
                    plan.name = new_name
                    plan.price_monthly = price_m
                    plan.price_yearly = price_y
                    plan.max_assets = max_a
                    if stripe_m:
                        plan.stripe_price_id_monthly = stripe_m
                    if stripe_y:
                        plan.stripe_price_id_yearly = stripe_y
                    logger.info("Migrated %s -> %s (%d€/%d€)", old_name, new_name, price_m, price_y)
            db.commit()
        gratis = db.query(Plan).filter(Plan.name == "Gratis").first()
        if gratis and gratis.max_assets == 0:
            gratis.max_assets = 1
            logger.info("Set Gratis max_assets=1")
        db.commit()
        stripe_price_map = {
            "Gratis": {"monthly": os.getenv("STRIPE_PRICE_GRATIS_MONTHLY", ""), "yearly": ""},
            "Starter": {"monthly": settings.STRIPE_PRICE_STARTER_MONTHLY, "yearly": settings.STRIPE_PRICE_STARTER_YEARLY},
            "Profesional": {"monthly": settings.STRIPE_PRICE_PROFESIONAL_MONTHLY, "yearly": settings.STRIPE_PRICE_PROFESIONAL_YEARLY},
        }
        for name, prices in stripe_price_map.items():
            p = db.query(Plan).filter(Plan.name == name).first()
            if p:
                if prices["monthly"] and p.stripe_price_id_monthly != prices["monthly"]:
                    p.stripe_price_id_monthly = prices["monthly"]
                if prices["yearly"] and p.stripe_price_id_yearly != prices["yearly"]:
                    p.stripe_price_id_yearly = prices["yearly"]
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
    # Start scheduler
    scheduler_thread = None
    try:
        if settings.ENVIRONMENT == "production":
            from apscheduler.schedulers.background import BackgroundScheduler
            from modules.scheduler import run_scheduled_scan
            sched = BackgroundScheduler()
            interval = max(1, settings.ASSET_CHECK_INTERVAL_HOURS)
            sched.add_job(run_scheduled_scan, 'interval', hours=interval, id='asset_scan', replace_existing=True)
            sched.start()
            logger.info("Scheduler started (interval=%dh)", interval)
    except Exception as e:
        logger.warning("Scheduler init error: %s", e)

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
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://js.stripe.com; connect-src 'self' ws: https://api.stripe.com"
        if "text/html" in response.headers.get("content-type", ""):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app = FastAPI(
    title="Vulnify API",
    description="Reputation monitoring & dark web breach detection platform",
    version="3.1.0",
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
if os.path.isdir("frontend/dist/assets"):
    app.mount("/app/assets", StaticFiles(directory="frontend/dist/assets"), name="frontend_assets")
app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(alerts_router)
app.include_router(plans_router)
app.include_router(admin_router)
app.include_router(search_router)
app.include_router(reports_router)
app.include_router(scan_router)
app.include_router(batch_router)

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


@app.get("/monitor", response_class=HTMLResponse, description="Reputation monitor")
async def monitor_page(request: Request):
    return templates.TemplateResponse(request, "monitor.html")


@app.get("/scanner", response_class=HTMLResponse, description="Security scanner")
async def scanner_page(request: Request, target: str = ""):
    return templates.TemplateResponse(request, "scan.html", {"target": target})


@app.get("/precios", response_class=HTMLResponse, description="Pricing plans")
async def precios(request: Request):
    return templates.TemplateResponse(request, "pricing.html")


@app.get("/dashboard", response_class=HTMLResponse, description="User dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(request, "dashboard.html")


@app.get("/admin", response_class=HTMLResponse, description="Admin panel")
async def admin_panel(request: Request):
    return templates.TemplateResponse(request, "admin.html")


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


@app.get("/settings", response_class=HTMLResponse, description="User settings")
async def settings_page(request: Request):
    return templates.TemplateResponse(request, "settings.html")


@app.post("/api/contact")
async def contact_form(request: Request):
    try:
        data = await request.json()
        name = data.get("name", "")
        email = data.get("email", "")
        company = data.get("company", "")
        service = data.get("service", "")
        message = data.get("message", "")
        logger.info("Contact form: %s (%s) - %s", name, email, service)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/app/{full_path:path}")
async def react_app(request: Request, full_path: str):
    index_path = "frontend/dist/index.html"
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Frontend not built yet</h1><p>Run <code>cd frontend && npm install && npm run build</code></p>", status_code=200)

@app.get("/health")
async def health():
    from database import SessionLocal
    db_status = "error"
    db_type = "unknown"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "ok"
        db_type = "postgresql" if "postgres" in settings.DATABASE_URL else "sqlite"
    except Exception as e:
        db_status = str(e)[:100]
    return {"status": "ok", "environment": settings.ENVIRONMENT, "database": db_status, "db_type": db_type, "version": "3.1.0"}


@app.get("/db-tables")
async def db_tables():
    from database import SessionLocal
    try:
        db = SessionLocal()
        if "postgres" in settings.DATABASE_URL:
            rows = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).fetchall()
        else:
            rows = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
        tables = [r[0] for r in rows]
        counts = {}
        for t in tables:
            try:
                c = db.execute(text(f"SELECT count(*) FROM \"{t}\"")).scalar()
                counts[t] = c
            except:
                pass
        db.close()
        return {"tables": tables, "counts": counts}
    except Exception as e:
        return {"error": str(e)}


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
