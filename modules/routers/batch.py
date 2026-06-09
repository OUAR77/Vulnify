import csv
import io
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.asset import MonitoredAsset
from modules.auth import get_current_user
from modules.intel import check_asset as run_intel_check
from config import limiter

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.batch")


@router.post("/batch/check", description="Check multiple domains/emails from CSV")
@limiter.limit("5/hour")
async def batch_check(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Solo archivos .csv")

    contents = await file.read()
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    reader = csv.reader(io.StringIO(text))
    assets = []
    errors = []
    for i, row in enumerate(reader, start=1):
        if not row or not row[0].strip():
            continue
        val = row[0].strip().lower()
        if "@" in val:
            atype = "email"
        elif val.replace(".", "").replace("-", "").replace(":", "").replace("/", "").isdigit():
            atype = "ip"
        else:
            atype = "domain"

        try:
            result = await run_intel_check(atype, val)
            assets.append({
                "row": i,
                "type": atype,
                "value": val,
                "breaches_found": result["breaches_found"],
                "severity": result["severity"],
                "risk_score": result["risk_score"],
                "safe": result["safe"],
            })
        except Exception as e:
            errors.append({"row": i, "value": val, "error": str(e)[:100]})

    return {
        "total": len(assets),
        "checked": assets,
        "errors": errors,
        "summary": {
            "safe": sum(1 for a in assets if a["safe"]),
            "compromised": sum(1 for a in assets if not a["safe"]),
            "critical": sum(1 for a in assets if a["severity"] == "critical"),
            "high": sum(1 for a in assets if a["severity"] == "high"),
            "medium": sum(1 for a in assets if a["severity"] == "medium"),
            "low": sum(1 for a in assets if a["severity"] == "low"),
        },
    }
