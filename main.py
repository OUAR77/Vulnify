import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from config import limiter, settings
from database import Base, engine
from modules.routers import auth_router, plans_router, admin_router, messages_router, orders_router, user_orders_router
from modules.routers.chat import router as chat_router
from modules.routers.blog import router as blog_router
from modules.routers.testimonials import router as testimonials_router
from modules.routers.faqs import router as faqs_router
from modules.routers.property_extract import router as property_extract_routerfrom models.user import User
from models.message import Message

os.makedirs("uploads", exist_ok=True)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("vulnify")

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
    from database import SessionLocal
    db = SessionLocal()
    try:
        logger.info("Creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created")
    except Exception as e:
        logger.warning("Could not create tables: %s", str(e)[:200])
    try:
        from modules.auth import hash_password
        if not db.query(Plan).first():
            plan = Plan(name="default", description="Plan por defecto", price_monthly=0, price_yearly=0, max_assets=0, max_reports=0, max_programs=0, features=[], active=True)
            db.add(plan)
            db.commit()
        if not db.query(User).filter(User.role == "admin").first():
            admin_pw = os.getenv("ADMIN_PASSWORD", "admin123456")
            admin = User(name="Admin Vulnify", email=os.getenv("ADMIN_EMAIL", "admin@vulnify.com"), password=hash_password(admin_pw), role="admin", company="", is_verified=1)
            db.add(admin)
            db.commit()
            logger.info("Admin user created")
        for table_sql in [
            "CREATE TABLE IF NOT EXISTS order_photos (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), image_data TEXT NOT NULL, caption VARCHAR DEFAULT '', created_at TIMESTAMP DEFAULT NOW())",
            "CREATE TABLE IF NOT EXISTS blog_posts (id SERIAL PRIMARY KEY, title VARCHAR NOT NULL, slug VARCHAR UNIQUE NOT NULL, tag VARCHAR DEFAULT 'General', excerpt TEXT DEFAULT '', content TEXT DEFAULT '', author VARCHAR DEFAULT 'Vulnify', read_time VARCHAR DEFAULT '5 min', published BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())",
            "CREATE TABLE IF NOT EXISTS testimonials (id SERIAL PRIMARY KEY, name VARCHAR NOT NULL, role VARCHAR DEFAULT '', company VARCHAR DEFAULT '', content TEXT NOT NULL, avatar_url VARCHAR DEFAULT '', rating INTEGER DEFAULT 5, featured BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW())",
            "CREATE TABLE IF NOT EXISTS faqs (id SERIAL PRIMARY KEY, question VARCHAR NOT NULL, answer TEXT NOT NULL, category VARCHAR DEFAULT 'General', \"order\" INTEGER DEFAULT 0, published BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW())",
            "CREATE TABLE IF NOT EXISTS order_logs (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id), field VARCHAR NOT NULL, old_value TEXT DEFAULT '', new_value TEXT DEFAULT '', changed_by VARCHAR DEFAULT '', created_at TIMESTAMP DEFAULT NOW())",
        ]:
            try:
                db.execute(text(table_sql))
                db.commit()
            except Exception:
                db.rollback()
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
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.spline.design; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; frame-src https://js.stripe.com; connect-src 'self' ws: https://api.stripe.com https://*.spline.design; media-src https://*.spline.design; worker-src 'self' blob:"
        if "text/html" in response.headers.get("content-type", ""):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app = FastAPI(
    title="Vulnify API",
    description="Vulnify · Desarrollo Web & IA — APIs para la web corporativa",
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
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="frontend_assets")
app.include_router(auth_router)
app.include_router(plans_router)
app.include_router(admin_router)
app.include_router(messages_router)
app.include_router(orders_router)
app.include_router(user_orders_router)
app.include_router(blog_router)
app.include_router(testimonials_router)
app.include_router(faqs_router)
app.include_router(chat_router)
app.include_router(property_extract_router)

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return HTMLResponse("Not Found", status_code=404)


@app.exception_handler(500)
async def server_error(request: Request, exc):
    logger.exception("Internal server error")
    return HTMLResponse("Internal Server Error", status_code=500)


@app.get("/robots.txt", response_class=FileResponse)
async def robots():
    return FileResponse("static/robots.txt", media_type="text/plain")


@app.get("/sitemap.xml", response_class=FileResponse)
async def sitemap():
    return FileResponse("static/sitemap.xml", media_type="application/xml")


@app.get("/", response_class=HTMLResponse, description="Home page")
async def index():
    index_path = "frontend/dist/index.html"
    if os.path.isfile(index_path):
        with open(index_path, encoding="utf-8") as f:
            return HTMLResponse(f.read())
    return HTMLResponse("<h1>Vulnify</h1><p>Desarrollo Web & IA</p>")


@app.post("/api/contact")
async def contact_form(request: Request):
    try:
        data = await request.json()
        name = data.get("name", "")
        email = data.get("email", "")
        company = data.get("company", "")
        service = data.get("service", "")
        message_text = data.get("message", "")
        subject = data.get("subject", service or "Contacto web")
        logger.info("Contact form: %s (%s) - %s", name, email, service)
        from database import SessionLocal
        db = SessionLocal()
        try:
            msg = Message(name=name, email=email, company=company, subject=subject, message=message_text)
            db.add(msg)
            db.commit()
        finally:
            db.close()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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


@app.get("/{path:path}", response_class=HTMLResponse, include_in_schema=False)
async def spa_fallback(request: Request, path: str):
    if path.startswith(("api/", "ws/", "static/", "assets/")) or path in ("health", "robots.txt", "sitemap.xml"):
        raise HTTPException(status_code=404)
    index_path = "frontend/dist/index.html"
    if os.path.isfile(index_path):
        with open(index_path, encoding="utf-8") as f:
            return HTMLResponse(f.read())
    return HTMLResponse("<h1>Vulnify</h1><p>Desarrollo Web & IA</p>")


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
