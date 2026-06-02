import asyncio
import logging
from datetime import datetime
from sqlalchemy import text
from database import SessionLocal
from modules.intel import check_asset as run_intel_check

logger = logging.getLogger("vulnify.scheduler")


async def scan_all_assets():
    logger.info("Scheduled scan: starting check of all monitored assets")
    try:
        db = SessionLocal()
        assets = db.execute(
            text("SELECT id, type, value, user_id FROM monitored_assets WHERE status='active'")
        ).fetchall()
        db.close()
    except Exception as e:
        logger.warning("Scheduler DB error: %s", e)
        return

    for asset_id, asset_type, asset_value, user_id in assets:
        try:
            result = await run_intel_check(asset_type, asset_value)
            db2 = SessionLocal()
            db2.execute(
                text("UPDATE monitored_assets SET last_checked=:now, breaches_found=:bf WHERE id=:id"),
                {"now": datetime.now(), "bf": result["breaches_found"], "id": asset_id}
            )
            for breach in result["breaches"]:
                existing = db2.execute(
                    text("SELECT id FROM breach_alerts WHERE user_id=:uid AND breach_name=:bn AND asset_id=:aid"),
                    {"uid": user_id, "bn": breach["breach_name"], "aid": asset_id}
                ).fetchone()
                if not existing:
                    db2.execute(
                        text("""INSERT INTO breach_alerts
                            (user_id, asset_id, breach_name, breach_date, data_classes, severity, description, read, resolved, created_at)
                            VALUES (:uid, :aid, :bn, :bd, :dc, :sev, :desc, false, false, :now)"""),
                        {
                            "uid": user_id, "aid": asset_id,
                            "bn": breach["breach_name"],
                            "bd": breach.get("breach_date", ""),
                            "dc": str(breach.get("data_classes", [])),
                            "sev": breach.get("severity", "medium"),
                            "desc": f"Auto-detectado: {asset_value} aparece en {breach['breach_name']}.",
                            "now": datetime.now(),
                        }
                    )
            db2.commit()
            db2.close()
            logger.debug("Scheduled check OK: %s (%s) - %d breaches", asset_value, asset_type, result["breaches_found"])
        except Exception as e:
            logger.warning("Scheduler check error for %s: %s", asset_value, e)

    logger.info("Scheduled scan complete")


def run_scheduled_scan():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(scan_all_assets())
    finally:
        loop.close()
