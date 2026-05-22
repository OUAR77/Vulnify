import csv
import io
import os
import re
import shutil
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from fastapi.responses import Response
from datetime import date, datetime
from pydantic import BaseModel, field_validator
from fastapi import Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case
from database import get_db
from models.user import User
from models.report import Report
from models.program import Program
from models.notification import Notification
from models.apikey import ApiKey
from models.plan import Plan
from models.subscription import CompanySubscription
from models.payout import Payout
from modules.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
    require_admin, require_verified, validate_password,
    create_reset_token, verify_reset_token,
    create_refresh_token, verify_refresh_token,
    create_verification_token, verify_email_token,
    hash_api_key, get_user_by_api_key,
)
from modules.ai import (
    analyze_report as ai_analyze, check_duplicate as ai_check_dup,
    chat as ai_chat, enhance_report as ai_enhance,
    suggest_poc as ai_poc, client as ai_client,
)
from config import limiter, settings

router = APIRouter(prefix="/api")


# --- FILE VALIDATION ---

ALLOWED_EXTENSIONS = {ext.lower() for ext in settings.ALLOWED_EXTENSIONS}


def validate_file(file: UploadFile) -> str | None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if not ext or ext not in ALLOWED_EXTENSIONS:
        return f"Tipo de archivo no permitido: {ext}. Permitidos: {', '.join(settings.ALLOWED_EXTENSIONS)}"
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.MAX_UPLOAD_SIZE_BYTES:
        return f"Archivo demasiado grande. Máximo {settings.MAX_UPLOAD_SIZE_MB}MB"
    return None


def sanitize_filename(filename: str) -> str:
    name, ext = os.path.splitext(filename)
    name = re.sub(r"[^\w\-]", "_", name)[:64]
    ext = ext.lower()
    return f"{name}{ext}"


# --- PASSWORD RESET ---

class RefreshBody(BaseModel):
    refresh_token: str


class VerifyEmailBody(BaseModel):
    token: str


class ForgotPasswordBody(BaseModel):
    email: str


@router.post("/auth/forgot-password", description="Request a password reset email")
@limiter.limit("3/hour")
def forgot_password(request: Request, body: ForgotPasswordBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return {"ok": True, "message": "Si el email existe, recibirás un enlace"}
    token = create_reset_token(user.id)
    return {"ok": True, "message": "Enlace enviado (simulado)", "reset_token": token}


class ResetPasswordBody(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v


@router.post("/auth/reset-password", description="Reset password using a valid token")
@limiter.limit("5/hour")
def reset_password(request: Request, body: ResetPasswordBody, db: Session = Depends(get_db)):
    user_id = verify_reset_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password = hash_password(body.password)
    db.commit()
    return {"ok": True, "message": "Contraseña actualizada"}


# --- API KEYS ---

class ApiKeyCreateBody(BaseModel):
    name: str


@router.post("/auth/api-keys", description="Create a new API key")
def create_api_key(body: ApiKeyCreateBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key_value = f"vul_{secrets.token_urlsafe(32)}"
    api_key = ApiKey(user_id=user.id, name=body.name, key=hash_api_key(key_value))
    db.add(api_key)
    db.commit()
    return {"ok": True, "key": key_value, "name": body.name, "id": api_key.id}


@router.get("/auth/api-keys", description="List user API keys")
def list_api_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(ApiKey).filter(ApiKey.user_id == user.id).all()
    return [{"id": k.id, "name": k.name, "created_at": str(k.created_at)[:19]} for k in keys]


@router.delete("/auth/api-keys/{key_id}", description="Delete an API key")
def delete_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    k = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not k:
        raise HTTPException(status_code=404, detail="API key no encontrada")
    db.delete(k)
    db.commit()
    return {"ok": True}


# --- AUTH ---

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str
    role: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre no puede estar vacío")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Email inválido")
        return v.lower().strip()


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/auth/register", description="Register a new user (hunter or company)")
@limiter.limit("5/minute")
def register(request: Request, body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if body.role not in ("hunter", "company", "admin"):
        raise HTTPException(status_code=400, detail="Rol inválido")
    if body.role == "admin":
        raise HTTPException(status_code=403, detail="No puedes registrarte como admin")
    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
        role=body.role,
        company=body.name if body.role == "company" else "",
        is_verified=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    return {
        "token": token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


@router.post("/auth/login", description="Login with email and password")
@limiter.limit("10/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    return {
        "token": token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "verified": bool(user.is_verified)},
    }


@router.post("/auth/refresh", description="Refresh access token using refresh token")
def refresh_access_token(body: RefreshBody, db: Session = Depends(get_db)):
    user_id = verify_refresh_token(body.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    token = create_access_token({"sub": str(user.id)})
    return {"token": token}


@router.post("/auth/send-verification", description="Send email verification token")
@limiter.limit("3/hour")
def send_verification(request: Request, user: User = Depends(get_current_user)):
    if user.is_verified:
        return {"ok": True, "message": "Email ya verificado"}
    token = create_verification_token(user.id)
    return {"ok": True, "message": "Token de verificación generado", "token": token}


@router.post("/auth/verify-email", description="Verify email with token")
def verify_email(body: VerifyEmailBody, db: Session = Depends(get_db)):
    user_id = verify_email_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_verified = 1
    db.commit()
    return {"ok": True, "message": "Email verificado correctamente"}


@router.get("/auth/me", description="Get current user profile")
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "company": user.company, "bio": user.bio,
        "created_at": str(user.created_at)
    }


class ProfileBody(BaseModel):
    name: str | None = None
    company: str | None = None
    bio: str | None = None


@router.put("/auth/profile", description="Update user profile")
@limiter.limit("10/minute")
def update_profile(request: Request, body: ProfileBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.name is not None:
        user.name = body.name
    if body.company is not None and user.role == "company":
        user.company = body.company
    if body.bio is not None:
        user.bio = body.bio
    db.commit()
    return {"ok": True}


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v


@router.put("/auth/password", description="Change current user password")
@limiter.limit("5/hour")
def change_password(
    request: Request,
    body: ChangePasswordBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    user.password = hash_password(body.new_password)
    db.commit()
    return {"ok": True, "message": "Contraseña actualizada"}


# --- PROGRAMS (DB) ---

def parse_date(v: str | None) -> date | None:
    if v is None or v == "":
        return None
    try:
        return date.fromisoformat(v)
    except (ValueError, TypeError):
        raise ValueError("Fecha inválida. Usa formato ISO (YYYY-MM-DD)")


class ProgramCreateBody(BaseModel):
    company_name: str
    industry: str
    max_reward: int
    description: str = ""
    scope: list[str] = []
    out_of_scope: list[str] = []
    rules: str = ""
    tags: list[str] = []
    disclosure_date: str | None = None


class ProgramUpdateBody(BaseModel):
    company_name: str | None = None
    industry: str | None = None
    max_reward: int | None = None
    description: str | None = None
    scope: list[str] | None = None
    out_of_scope: list[str] | None = None
    rules: str | None = None
    tags: list[str] | None = None
    status: str | None = None
    disclosure_date: str | None = None


@router.post("/programs", description="Create a new bug bounty program")
@limiter.limit("10/hour")
def create_program(request: Request, body: ProgramCreateBody, user: User = Depends(require_verified), db: Session = Depends(get_db)):
    if user.role not in ("company", "admin"):
        raise HTTPException(status_code=403, detail="Solo empresas pueden crear programas")
    prog = Program(
        company_id=user.id,
        company_name=body.company_name,
        industry=body.industry,
        max_reward=body.max_reward,
        description=body.description,
        tags=body.tags,
        scope=body.scope,
        out_of_scope=body.out_of_scope,
        rules=body.rules,
        disclosure_date=parse_date(body.disclosure_date),
    )
    db.add(prog)
    db.commit()
    db.refresh(prog)
    return {
        "id": prog.id, "company_name": prog.company_name,
        "industry": prog.industry, "max_reward": prog.max_reward,
        "tags": prog.tags or [],
        "status": prog.status, "created_at": str(prog.created_at)
    }


@router.get("/programs", description="List active bug bounty programs")
def list_programs(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    report_counts = db.query(
        Report.program_id,
        func.count(Report.id).label("cnt"),
        func.count(func.distinct(Report.hunter_id)).label("hunter_cnt"),
    ).group_by(Report.program_id).subquery()

    q = db.query(
        Program,
        func.coalesce(report_counts.c.cnt, 0).label("reports_count"),
        func.coalesce(report_counts.c.hunter_cnt, 0).label("hunters_count"),
    ).outerjoin(
        report_counts, Program.id == report_counts.c.program_id
    ).filter(Program.status == "active").order_by(desc(Program.created_at))

    total = q.count()
    rows = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": p.Program.id, "company_name": p.Program.company_name,
            "industry": p.Program.industry,
            "max_reward": p.Program.max_reward, "description": p.Program.description,
            "tags": p.Program.tags or [],
            "reports_count": p.reports_count,
            "hunters_count": p.hunters_count,
            "status": p.Program.status,
            "disclosure_date": p.Program.disclosure_date.isoformat() if p.Program.disclosure_date else None,
            "created_at": str(p.Program.created_at)
        } for p in rows]
    }


@router.get("/programs/{program_id}", description="Get program details")
def get_program(program_id: int, db: Session = Depends(get_db)):
    p = db.query(Program).filter(Program.id == program_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return {
        "id": p.id, "company_name": p.company_name, "industry": p.industry,
        "max_reward": p.max_reward, "description": p.description,
        "scope": p.scope or [],
        "out_of_scope": p.out_of_scope or [],
        "tags": p.tags or [],
        "rules": p.rules, "status": p.status, "company_id": p.company_id,
        "disclosure_date": p.disclosure_date.isoformat() if p.disclosure_date else None,
        "reports_count": db.query(Report).filter(Report.program_id == p.id).count(),
        "hunters_count": db.query(Report.hunter_id).filter(Report.program_id == p.id).distinct().count(),
        "created_at": str(p.created_at)
    }


@router.put("/programs/{program_id}", description="Update a program")
def update_program(program_id: int, body: ProgramUpdateBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Program).filter(Program.id == program_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    if p.company_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="No eres dueño de este programa")
    if body.company_name is not None: p.company_name = body.company_name
    if body.industry is not None: p.industry = body.industry
    if body.max_reward is not None: p.max_reward = body.max_reward
    if body.description is not None: p.description = body.description
    if body.scope is not None: p.scope = body.scope
    if body.out_of_scope is not None: p.out_of_scope = body.out_of_scope
    if body.rules is not None: p.rules = body.rules
    if body.tags is not None: p.tags = body.tags
    if body.status is not None: p.status = body.status
    if body.disclosure_date is not None: p.disclosure_date = parse_date(body.disclosure_date)
    db.commit()
    return {"ok": True}


@router.delete("/programs/{program_id}", description="Delete a program")
def delete_program(program_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("company", "admin"):
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar programas")
    p = db.query(Program).filter(Program.id == program_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    if p.company_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="No eres dueño de este programa")
    db.delete(p)
    db.commit()
    return {"ok": True}


# --- REPORTS ---

class ReportBody(BaseModel):
    title: str
    description: str
    severity: str
    steps: str = ""
    impact: str = ""
    program_id: int


@router.post("/reports", description="Submit a new vulnerability report")
@limiter.limit("30/hour")
def create_report(request: Request, body: ReportBody, user: User = Depends(require_verified), db: Session = Depends(get_db)):
    if user.role != "hunter":
        raise HTTPException(status_code=403, detail="Solo hunters pueden reportar bugs")
    prog = db.query(Program).filter(Program.id == body.program_id).first()
    if not prog or prog.status != "active":
        raise HTTPException(status_code=404, detail="Programa no encontrado o inactivo")
    duplicate = db.query(Report).filter(
        Report.title.ilike(body.title.strip()),
        Report.program_id == body.program_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Ya existe un reporte con ese título en este programa")
    report = Report(
        title=body.title, description=body.description, severity=body.severity,
        steps=body.steps, impact=body.impact, program_id=body.program_id, hunter_id=user.id
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"ok": True, "id": report.id}


@router.post("/reports/{report_id}/attach", description="Attach a file to a report")
@limiter.limit("10/minute")
def attach_file(
    request: Request,
    report_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if r.hunter_id != user.id:
        raise HTTPException(status_code=403, detail="No eres dueño de este reporte")

    validation_error = validate_file(file)
    if validation_error:
        raise HTTPException(status_code=400, detail=validation_error)

    sanitized_name = sanitize_filename(file.filename or "attachment.bin")
    unique_name = f"{report_id}_{secrets.token_hex(16)}_{sanitized_name}"
    path = f"uploads/{unique_name}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    r.attachment = path
    db.commit()
    return {"ok": True, "path": path}


@router.get("/reports", description="List user reports (scoped by role)")
def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: str = Query("", max_length=100),
    severity: str = Query("", max_length=20),
    status: str = Query("", max_length=20),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Report)
    if user.role == "hunter":
        q = q.filter(Report.hunter_id == user.id)
    elif user.role == "company":
        prog_ids = [p.id for p in db.query(Program).filter(Program.company_id == user.id).all()]
        q = q.filter(Report.program_id.in_(prog_ids)) if prog_ids else q.filter(False)
    if search:
        q = q.filter(Report.title.ilike(f"%{search}%"))
    if severity:
        q = q.filter(Report.severity == severity)
    if status:
        q = q.filter(Report.status == status)
    total = q.count()
    reports = q.order_by(desc(Report.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    prog_names = {p.id: p.company_name for p in db.query(Program).all()}
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": r.id, "title": r.title, "severity": r.severity,
            "status": r.status, "reward": r.reward,
            "program_id": r.program_id, "program_name": prog_names.get(r.program_id, ""),
            "hunter_id": r.hunter_id, "created_at": str(r.created_at),
            "attachment": r.attachment or ""
        } for r in reports]
    }


@router.get("/reports/{report_id}", description="Get report details")
def get_report(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if user.role != "admin":
        if user.role == "hunter" and r.hunter_id != user.id:
            raise HTTPException(status_code=403, detail="No tienes acceso a este reporte")
        if user.role == "company":
            prog = db.query(Program).filter(Program.id == r.program_id).first()
            if not prog or prog.company_id != user.id:
                raise HTTPException(status_code=403, detail="No tienes acceso a este reporte")
    return {
        "id": r.id, "title": r.title, "description": r.description,
        "severity": r.severity, "status": r.status, "steps": r.steps,
        "impact": r.impact, "reward": r.reward, "attachment": r.attachment or "",
        "program_id": r.program_id, "hunter_id": r.hunter_id,
        "created_at": str(r.created_at)
    }


class ReportStatusBody(BaseModel):
    status: str
    reward: int = 0


@router.put("/reports/{report_id}/status", description="Update report status and reward")
@limiter.limit("30/hour")
async def update_report_status(request: Request, report_id: int, body: ReportStatusBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("company", "admin"):
        raise HTTPException(status_code=403, detail="Solo empresas pueden validar reportes")
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    prog = db.query(Program).filter(Program.id == r.program_id).first()
    if not prog or (prog.company_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=403, detail="No eres dueño del programa de este reporte")
    new_status = body.status
    reward = body.reward
    if new_status not in ("pending", "valid", "invalid", "paid"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    r.status = new_status
    if new_status in ("valid", "paid") and reward:
        r.reward = reward
    elif new_status == "paid":
        r.reward = r.reward or prog.max_reward
    if new_status == "paid" and r.reward > 0:
        commission_pct = settings.PLATFORM_COMMISSION_PERCENT
        commission_amt = round(r.reward * commission_pct / 100, 2)
        hunter_amt = r.reward - commission_amt
        payout = Payout(
            company_id=prog.company_id,
            hunter_id=r.hunter_id,
            report_id=r.id,
            amount=float(r.reward),
            commission_percentage=commission_pct,
            commission_amount=commission_amt,
            hunter_amount=hunter_amt,
            status="completed",
        )
        db.add(payout)
    db.commit()
    notif = Notification(user_id=r.hunter_id, message=f"Tu reporte «{r.title[:50]}» ha cambiado a {new_status}", link=f"/report/{r.id}")
    db.add(notif)
    db.commit()
    ws_manager = request.app.state.ws_manager
    await ws_manager.send_to_user(r.hunter_id, {
        "type": "status_update",
        "report_id": r.id,
        "status": r.status,
        "reward": r.reward,
        "message": notif.message,
        "link": notif.link,
    })
    return {"ok": True, "status": r.status, "reward": r.reward}


# --- HUNTERS ---

@router.get("/hunters/leaderboard", description="Hunter leaderboard by valid reports")
def leaderboard(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    valid_statuses = ("valid", "paid")
    stats = db.query(
        Report.hunter_id,
        func.count(Report.id).label("total_reports"),
        func.sum(case((Report.status.in_(valid_statuses), 1), else_=0)).label("valid_reports"),
        func.sum(case((Report.status == "paid", 1), else_=0)).label("paid_reports"),
    ).group_by(Report.hunter_id).subquery()

    users = db.query(User, stats.c.total_reports, stats.c.valid_reports, stats.c.paid_reports).outerjoin(
        stats, User.id == stats.c.hunter_id
    ).filter(User.role == "hunter").order_by(
        stats.c.valid_reports.desc().nullslast(),
        stats.c.paid_reports.desc().nullslast(),
    ).all()

    result = [{
        "id": u.User.id, "name": u.User.name, "bio": u.User.bio,
        "valid_reports": u.valid_reports or 0,
        "paid_reports": u.paid_reports or 0,
        "total_reports": u.total_reports or 0,
        "joined": str(u.User.created_at)[:10]
    } for u in users]

    total = len(result)
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": result[start:end]
    }


@router.get("/hunters/{hunter_id}", description="Get hunter public profile")
def get_hunter(hunter_id: int, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == hunter_id, User.role == "hunter").first()
    if not u:
        raise HTTPException(status_code=404, detail="Hunter no encontrado")
    valid = db.query(Report).filter(Report.hunter_id == u.id, Report.status.in_(["valid", "paid"])).count()
    paid = db.query(Report).filter(Report.hunter_id == u.id, Report.status == "paid").count()
    total = db.query(Report).filter(Report.hunter_id == u.id).count()
    return {
        "id": u.id, "name": u.name, "bio": u.bio,
        "valid_reports": valid, "paid_reports": paid,
        "total_reports": total, "joined": str(u.created_at)[:10]
    }


# --- COMPANY PROGRAMS (for dashboard) ---

@router.get("/company/programs", description="List own programs (company only)")
def list_company_programs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "company":
        raise HTTPException(status_code=403, detail="Solo empresas")
    report_counts = db.query(
        Report.program_id,
        func.count(Report.id).label("cnt"),
        func.count(func.distinct(Report.hunter_id)).label("hunter_cnt"),
    ).group_by(Report.program_id).subquery()

    rows = db.query(
        Program,
        func.coalesce(report_counts.c.cnt, 0).label("reports_count"),
        func.coalesce(report_counts.c.hunter_cnt, 0).label("hunters_count"),
    ).outerjoin(
        report_counts, Program.id == report_counts.c.program_id
    ).filter(Program.company_id == user.id).order_by(desc(Program.created_at)).all()

    return [{
        "id": p.Program.id, "company_name": p.Program.company_name,
        "industry": p.Program.industry,
        "max_reward": p.Program.max_reward, "status": p.Program.status,
        "tags": p.Program.tags or [],
        "reports_count": p.reports_count,
        "hunters_count": p.hunters_count,
        "created_at": str(p.Program.created_at)
    } for p in rows]


# --- COMPANY REPORTS (filtered for dashboard) ---

@router.get("/company/reports", description="List reports for own programs (company only)")
def list_company_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    search: str = Query("", max_length=100),
    severity: str = Query("", max_length=20),
    status_filter: str = Query("", max_length=20, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role != "company":
        raise HTTPException(status_code=403, detail="Solo empresas")
    prog_ids = [p.id for p in db.query(Program).filter(Program.company_id == user.id).all()]
    if not prog_ids:
        return {"total": 0, "items": []}
    q = db.query(Report).filter(Report.program_id.in_(prog_ids))
    if search:
        q = q.filter(Report.title.ilike(f"%{search}%"))
    if severity:
        q = q.filter(Report.severity == severity)
    if status_filter:
        q = q.filter(Report.status == status_filter)
    total = q.count()
    reports = q.order_by(desc(Report.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": r.id, "title": r.title, "severity": r.severity,
            "status": r.status, "reward": r.reward, "program_id": r.program_id,
            "hunter_id": r.hunter_id, "created_at": str(r.created_at)
        } for r in reports]
    }


# --- STATS ---

@router.get("/stats", description="Get platform statistics")
def get_stats(db: Session = Depends(get_db)):
    total_programs = db.query(Program).count()
    total_reports = db.query(Report).count()
    total_hunters = db.query(User).filter(User.role == "hunter").count()
    total_companies = db.query(User).filter(User.role == "company").count()
    severity_counts = {}
    for sev in ("critical", "high", "medium", "low", "info"):
        severity_counts[sev] = db.query(Report).filter(Report.severity == sev).count()
    top_programs = db.query(
        Program.id, Program.company_name,
        func.count(Report.id).label("report_count")
    ).outerjoin(Report, Report.program_id == Program.id
    ).group_by(Program.id).order_by(desc("report_count")).limit(5).all()
    return {
        "total_programs": total_programs,
        "total_reports": total_reports,
        "total_hunters": total_hunters,
        "total_companies": total_companies,
        "severity_counts": severity_counts,
        "top_programs": [{"id": p.id, "company_name": p.company_name, "reports": p.report_count} for p in top_programs]
    }


# --- CSV EXPORT ---

@router.get("/reports/export/csv", description="Export reports as CSV (company only)")
def export_reports_csv(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("company", "admin"):
        raise HTTPException(status_code=403, detail="Solo empresas pueden exportar")
    prog_ids = [p.id for p in db.query(Program).filter(Program.company_id == user.id).all()]
    q = db.query(Report).filter(Report.program_id.in_(prog_ids)) if prog_ids else db.query(Report).filter(False)
    reports = q.order_by(desc(Report.created_at)).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ID", "Titulo", "Severidad", "Estado", "Recompensa", "Programa ID", "Hunter ID", "Creado"])
    for r in reports:
        w.writerow([r.id, r.title, r.severity, r.status, r.reward, r.program_id, r.hunter_id, str(r.created_at)[:19]])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=reportes.csv"})


# --- NOTIFICATIONS ---

@router.get("/notifications", description="List user notifications")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Notification).filter(Notification.user_id == user.id).order_by(desc(Notification.created_at)).limit(20).all()
    return [{
        "id": n.id, "message": n.message, "link": n.link,
        "read": n.read, "created_at": str(n.created_at)[:19]
    } for n in notes]


@router.put("/notifications/{notification_id}/read", description="Mark notification as read")
def mark_notification_read(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    n.read = True
    db.commit()
    return {"ok": True}


# --- ADMIN ---

@router.get("/admin/users", description="List all users (admin only)")
def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(User).order_by(User.created_at.desc())
    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "company": u.company, "bio": u.bio, "created_at": str(u.created_at)[:19]
        } for u in users]
    }


class AdminUpdateUserBody(BaseModel):
    role: str | None = None
    name: str | None = None
    company: str | None = None
    bio: str | None = None


@router.put("/admin/users/{user_id}", description="Update user details (admin only)")
def admin_update_user(user_id: int, body: AdminUpdateUserBody, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if body.role and body.role in ("hunter", "company", "admin"):
        u.role = body.role
    if body.name is not None:
        u.name = body.name
    if body.company is not None:
        u.company = body.company
    if body.bio is not None:
        u.bio = body.bio
    db.commit()
    return {"ok": True}


@router.delete("/admin/users/{user_id}", description="Delete a user (admin only)")
def admin_delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    db.delete(u)
    db.commit()
    return {"ok": True}


@router.get("/admin/programs", description="List all programs (admin only)")
def admin_list_programs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report_counts = db.query(
        Report.program_id,
        func.count(Report.id).label("cnt"),
    ).group_by(Report.program_id).subquery()

    q = db.query(
        Program,
        func.coalesce(report_counts.c.cnt, 0).label("reports_count"),
    ).outerjoin(
        report_counts, Program.id == report_counts.c.program_id
    ).order_by(Program.created_at.desc())

    total = q.count()
    rows = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": p.Program.id, "company_name": p.Program.company_name,
            "industry": p.Program.industry,
            "max_reward": p.Program.max_reward, "status": p.Program.status,
            "company_id": p.Program.company_id,
            "reports_count": p.reports_count,
            "created_at": str(p.Program.created_at)
        } for p in rows]
    }


@router.get("/admin/reports", description="List all reports (admin only)")
def admin_list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(Report).order_by(Report.created_at.desc())
    total = q.count()
    reports = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": r.id, "title": r.title, "severity": r.severity, "status": r.status,
            "reward": r.reward, "program_id": r.program_id, "hunter_id": r.hunter_id,
            "created_at": str(r.created_at)
        } for r in reports]
    }


# --- AI ---


class AnalyzeBody(BaseModel):
    title: str
    description: str
    steps: str = ""
    impact: str = ""


@router.post("/ai/analyze", description="AI analysis of a vulnerability report")
@limiter.limit("20/hour")
def analyze_report_endpoint(request: Request, body: AnalyzeBody):
    if not ai_client:
        raise HTTPException(status_code=400, detail="IA no configurada. Revisa AI_PROVIDER en .env")
    result = ai_analyze(body.title, body.description, body.steps, body.impact)
    if not result:
        raise HTTPException(status_code=503, detail="Error al analizar el reporte")
    return result


class DuplicateBody(BaseModel):
    new_title: str
    new_description: str
    existing_title: str
    existing_description: str


@router.post("/ai/check-duplicate", description="Check if a report is a duplicate")
@limiter.limit("30/hour")
def check_duplicate_endpoint(request: Request, body: DuplicateBody):
    if not ai_client:
        raise HTTPException(status_code=400, detail="OpenAI no configurado")
    result = ai_check_dup(body.new_title, body.new_description, body.existing_title, body.existing_description)
    if not result:
        raise HTTPException(status_code=503, detail="Error al verificar duplicados")
    return result


class ChatBody(BaseModel):
    messages: list[dict]


@router.post("/ai/chat", description="Chat with AI security assistant")
@limiter.limit("30/hour")
def chat_endpoint(request: Request, body: ChatBody):
    if not ai_client:
        raise HTTPException(status_code=400, detail="OpenAI no configurado")
    response = ai_chat(body.messages)
    if not response:
        raise HTTPException(status_code=503, detail="Error al generar respuesta")
    return {"response": response}


class EnhanceBody(BaseModel):
    text: str
    mode: str = "grammar"


@router.post("/ai/enhance", description="Enhance report text (grammar, summary, translate)")
@limiter.limit("20/hour")
def enhance_endpoint(request: Request, body: EnhanceBody):
    if not ai_client:
        raise HTTPException(status_code=400, detail="OpenAI no configurado")
    if body.mode not in ("grammar", "summary", "translate_en", "translate_es"):
        raise HTTPException(status_code=400, detail="Modo inválido. Usa: grammar, summary, translate_en, translate_es")
    result = ai_enhance(body.text, body.mode)
    if not result:
        raise HTTPException(status_code=503, detail="Error al procesar el texto")
    return {"result": result}


class PocBody(BaseModel):
    description: str
    vulnerability_type: str = ""


@router.post("/ai/suggest-poc", description="Suggest proof-of-concept steps for a vulnerability")
@limiter.limit("15/hour")
def suggest_poc_endpoint(request: Request, body: PocBody):
    if not ai_client:
        raise HTTPException(status_code=400, detail="OpenAI no configurado")
    result = ai_poc(body.description, body.vulnerability_type)
    if not result:
        raise HTTPException(status_code=503, detail="Error al generar PoC")
    return {"result": result}


# === PLANS (admin) ===

@router.get("/admin/plans", description="List all subscription plans (admin only)")
def admin_list_plans(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    plans = db.query(Plan).order_by(Plan.price_monthly).all()
    return [{
        "id": p.id, "name": p.name, "description": p.description,
        "price_monthly": p.price_monthly, "price_yearly": p.price_yearly,
        "stripe_price_id_monthly": p.stripe_price_id_monthly, "stripe_price_id_yearly": p.stripe_price_id_yearly,
        "max_reports": p.max_reports, "max_programs": p.max_programs,
        "features": p.features, "active": p.active,
        "created_at": str(p.created_at)
    } for p in plans]


@router.post("/admin/plans", description="Create a subscription plan (admin only)")
def admin_create_plan(body: dict, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = Plan(
        name=body.get("name", ""),
        description=body.get("description", ""),
        price_monthly=body.get("price_monthly", 0),
        price_yearly=body.get("price_yearly"),
        stripe_price_id_monthly=body.get("stripe_price_id_monthly"),
        stripe_price_id_yearly=body.get("stripe_price_id_yearly"),
        max_reports=body.get("max_reports", 0),
        max_programs=body.get("max_programs", 0),
        features=body.get("features", []),
        active=body.get("active", True),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id, "name": plan.name}


@router.put("/admin/plans/{plan_id}", description="Update a subscription plan (admin only)")
def admin_update_plan(plan_id: int, body: dict, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    for field in ("name", "description", "price_monthly", "price_yearly", "stripe_price_id_monthly", "stripe_price_id_yearly", "max_reports", "max_programs", "features", "active"):
        if field in body:
            setattr(plan, field, body[field])
    db.commit()
    return {"ok": True}


@router.delete("/admin/plans/{plan_id}", description="Delete a subscription plan (admin only)")
def admin_delete_plan(plan_id: int, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    db.delete(plan)
    db.commit()
    return {"ok": True}


# === PUBLIC PLANS ===

@router.get("/plans", description="List active subscription plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.active == True).order_by(Plan.price_monthly).all()
    return [{
        "id": p.id, "name": p.name, "description": p.description,
        "price_monthly": p.price_monthly, "price_yearly": p.price_yearly,
        "max_reports": p.max_reports, "max_programs": p.max_programs,
        "features": p.features,
    } for p in plans]


# === COMPANY SUBSCRIPTION ===

COMMISSION = settings.PLATFORM_COMMISSION_PERCENT


@router.post("/company/subscribe", description="Create Stripe Checkout Session for subscription")
def company_subscribe(
    request: Request,
    plan_id: int = Body(...),
    interval: str = Body("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "company":
        raise HTTPException(status_code=403, detail="Solo empresas")
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    price = plan.price_monthly if interval == "month" else (plan.price_yearly or plan.price_monthly)

    # Plan gratuito: activar sin Stripe
    if price == 0:
        existing = db.query(CompanySubscription).filter(CompanySubscription.company_id == user.id).first()
        if existing:
            existing.plan_id = plan.id
            existing.status = "active"
            existing.current_period_end = None
        else:
            db.add(CompanySubscription(company_id=user.id, plan_id=plan.id, status="active"))
        db.commit()
        return {"checkout_url": None, "free": True}

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe no configurado")
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    price_id = plan.stripe_price_id_monthly if interval == "month" else plan.stripe_price_id_yearly
    if not price_id:
        raise HTTPException(status_code=400, detail="Este plan no tiene precio configurado en Stripe")
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=str(user.id),
            customer_email=user.email,
            success_url=request.base_url._url.rstrip("/") + "/company/billing?success=1",
            cancel_url=request.base_url._url.rstrip("/") + "/company/billing?canceled=1",
            metadata={"plan_id": str(plan.id), "company_id": str(user.id)},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear sesión: {str(e)}")


@router.get("/company/subscription", description="Get current subscription status")
def get_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "company":
        raise HTTPException(status_code=403, detail="Solo empresas")
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == user.id).first()
    if not sub:
        return {"subscribed": False}
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "subscribed": True,
        "status": sub.status,
        "plan": {"id": plan.id, "name": plan.name, "price_monthly": plan.price_monthly} if plan else None,
        "current_period_start": str(sub.current_period_start) if sub.current_period_start else None,
        "current_period_end": str(sub.current_period_end) if sub.current_period_end else None,
    }


@router.post("/company/subscription/cancel", description="Cancel subscription")
def cancel_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "company":
        raise HTTPException(status_code=403, detail="Solo empresas")
    sub = db.query(CompanySubscription).filter(CompanySubscription.company_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No hay suscripción activa")
    if sub.stripe_subscription_id and settings.STRIPE_SECRET_KEY:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            stripe.Subscription.delete(sub.stripe_subscription_id)
        except Exception:
            pass
    sub.status = "canceled"
    db.commit()
    return {"ok": True, "message": "Suscripción cancelada"}


# === STRIPE WEBHOOK ===

@router.post("/stripe/webhook", description="Stripe webhook endpoint")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return {"ok": True}
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        company_id = int(session["metadata"]["company_id"])
        plan_id = int(session["metadata"]["plan_id"])
        subscription_id = session.get("subscription")
        customer_id = session.get("customer")
        existing = db.query(CompanySubscription).filter(CompanySubscription.company_id == company_id).first()
        if existing:
            existing.stripe_subscription_id = subscription_id
            existing.stripe_customer_id = customer_id
            existing.plan_id = plan_id
            existing.status = "active"
        else:
            sub = CompanySubscription(
                company_id=company_id,
                plan_id=plan_id,
                stripe_subscription_id=subscription_id,
                stripe_customer_id=customer_id,
                status="active",
            )
            db.add(sub)
        user = db.query(User).filter(User.id == company_id).first()
        if user:
            user.stripe_customer_id = customer_id
        db.commit()

    elif event["type"] == "customer.subscription.updated":
        sub_data = event["data"]["object"]
        sub = db.query(CompanySubscription).filter(
            CompanySubscription.stripe_subscription_id == sub_data["id"]
        ).first()
        if sub:
            sub.status = sub_data["status"]
            from datetime import datetime
            if sub_data.get("current_period_start"):
                sub.current_period_start = datetime.fromtimestamp(sub_data["current_period_start"])
            if sub_data.get("current_period_end"):
                sub.current_period_end = datetime.fromtimestamp(sub_data["current_period_end"])
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        sub_data = event["data"]["object"]
        sub = db.query(CompanySubscription).filter(
            CompanySubscription.stripe_subscription_id == sub_data["id"]
        ).first()
        if sub:
            sub.status = "canceled"
            db.commit()

    return {"ok": True}


# === ADMIN REVENUE ===

@router.get("/admin/revenue", description="Platform revenue overview (admin only)")
def admin_revenue(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_payouts = db.query(Payout).count()
    total_commission = db.query(func.coalesce(func.sum(Payout.commission_amount), 0)).scalar()
    total_bounties = db.query(func.coalesce(func.sum(Payout.amount), 0)).scalar()
    active_subs = db.query(CompanySubscription).filter(CompanySubscription.status == "active").count()
    return {
        "active_subscriptions": active_subs,
        "total_payouts": total_payouts,
        "total_commission_earned": float(total_commission),
        "total_bounties_processed": float(total_bounties),
        "commission_percentage": settings.PLATFORM_COMMISSION_PERCENT,
    }


@router.post("/admin/seed", description="Seed initial admin user (one-time)")
def seed_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.role == "admin").first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un admin")
    admin_password = os.getenv("ADMIN_PASSWORD") or f"Admin{secrets.token_urlsafe(8)}1!"
    admin = User(
        name="Admin",
        email="admin@vulnify.com",
        password=hash_password(admin_password),
        role="admin",
        company="Vulnify",
        is_verified=1,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token = create_access_token({"sub": str(admin.id)})
    return {
        "token": token,
        "password": admin_password,
        "user": {"id": admin.id, "name": admin.name, "email": admin.email, "role": "admin"},
    }
