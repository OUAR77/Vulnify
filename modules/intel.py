import requests
import json
from datetime import datetime

HIBP_API = "https://haveibeenpwned.com/api/v3"

BREACH_DATABASE = [
    {"name": "LinkedIn", "date": "2021-06-22", "domain": "linkedin.com", "data_classes": ["Email", "Password", "Name", "Phone"], "severity": "high"},
    {"name": "Facebook", "date": "2019-09-01", "domain": "facebook.com", "data_classes": ["Email", "Phone", "Name", "ID"], "severity": "high"},
    {"name": "Adobe", "date": "2013-10-04", "domain": "adobe.com", "data_classes": ["Email", "Password", "Name"], "severity": "high"},
    {"name": "Dropbox", "date": "2012-07-01", "domain": "dropbox.com", "data_classes": ["Email", "Password"], "severity": "high"},
    {"name": "Twitter", "date": "2022-07-01", "domain": "twitter.com", "data_classes": ["Email", "Name", "Phone", "Username"], "severity": "high"},
    {"name": "Canva", "date": "2019-05-24", "domain": "canva.com", "data_classes": ["Email", "Name", "Password"], "severity": "high"},
    {"name": "Santander", "date": "2024-05-01", "domain": "santander.com", "data_classes": ["Email", "Name", "Phone", "Account"], "severity": "critical"},
    {"name": "Ticketmaster", "date": "2024-05-01", "domain": "ticketmaster.com", "data_classes": ["Email", "Name", "Phone", "Payment"], "severity": "critical"},
    {"name": "Movistar", "date": "2023-11-15", "domain": "movistar.es", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high"},
    {"name": "Iberdrola", "date": "2023-08-10", "domain": "iberdrola.es", "data_classes": ["Email", "Name", "DNI", "Address"], "severity": "critical"},
    {"name": "BBVA", "date": "2024-02-20", "domain": "bbva.com", "data_classes": ["Email", "Name", "Account", "Phone"], "severity": "critical"},
    {"name": "El Corte Inglés", "date": "2023-06-05", "domain": "elcorteingles.es", "data_classes": ["Email", "Name", "Address", "Phone"], "severity": "high"},
]


def fetch_all_breaches() -> list[dict]:
    hibp = []
    try:
        resp = requests.get(f"{HIBP_API}/breaches", timeout=10, headers={"hibp-api-key": ""})
        if resp.status_code == 200:
            hibp = resp.json()
    except:
        pass
    merged = list(BREACH_DATABASE)
    seen = {b["name"].lower() for b in BREACH_DATABASE}
    for b in hibp:
        name = b.get("Name", "")
        if name.lower() not in seen:
            merged.append({
                "name": name,
                "date": b.get("BreachDate", "2024-01-01"),
                "domain": b.get("Domain", "").lower(),
                "data_classes": b.get("DataClasses", []),
                "severity": "high",
            })
            seen.add(name.lower())
    return merged


def check_domain_in_breaches(domain: str) -> list[dict]:
    results = []
    domain_lower = domain.lower().strip()
    domain_lower = domain_lower.replace("https://", "").replace("http://", "").split("/")[0].replace("www.", "")

    for breach in BREACH_DATABASE:
        breach_domain = breach["domain"]
        if domain_lower == breach_domain or domain_lower.endswith("." + breach_domain):
            results.append({
                "breach_name": breach["name"],
                "breach_date": breach["date"],
                "data_classes": breach["data_classes"],
                "severity": breach["severity"],
                "confidence": "high",
            })
    return results


def check_email_in_breaches(email: str) -> list[dict]:
    results = []
    email_lower = email.lower().strip()
    domain_part = email_lower.split("@")[-1] if "@" in email_lower else ""

    domain_part = domain_part.replace("www.", "")
    for breach in fetch_all_breaches():
        breach_name = breach.get("Name", breach.get("name", ""))
        breach_domain = (breach.get("Domain", "") or breach.get("domain", "")).lower().replace("www.", "")
        breach_date = breach.get("BreachDate", breach.get("date", "2024-01-01"))
        data_classes = breach.get("DataClasses", breach.get("data_classes", []))
        severity = breach.get("severity", "high")

        if breach_domain and domain_part == breach_domain:
            results.append({
                "breach_name": breach_name,
                "breach_date": breach_date,
                "data_classes": data_classes,
                "severity": severity,
                "confidence": "medium",
            })

    return results


async def check_asset(asset_type: str, asset_value: str) -> dict:
    if asset_type == "domain":
        breaches = check_domain_in_breaches(asset_value)
    else:
        breaches = check_email_in_breaches(asset_value)

    severity = "low"
    if any(b["severity"] == "critical" for b in breaches):
        severity = "critical"
    elif any(b["severity"] == "high" for b in breaches):
        severity = "high"
    elif breaches:
        severity = "medium"

    return {
        "asset": asset_value,
        "type": asset_type,
        "checked_at": datetime.now().isoformat(),
        "breaches_found": len(breaches),
        "severity": severity,
        "breaches": breaches,
        "safe": len(breaches) == 0,
    }
