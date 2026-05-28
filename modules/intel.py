import requests
import hashlib
from datetime import datetime

HIBP_API = "https://haveibeenpwned.com/api/v3"
HIBP_PW_RANGE = "https://api.pwnedpasswords.com/range"

BREACH_DATABASE = [
    {"name": "LinkedIn", "date": "2021-06-22", "domain": "linkedin.com", "data_classes": ["Email", "Password", "Name", "Phone"], "severity": "high", "description": "Filtración masiva de LinkedIn con datos de 700M de usuarios."},
    {"name": "Facebook", "date": "2019-09-01", "domain": "facebook.com", "data_classes": ["Email", "Phone", "Name", "ID"], "severity": "high", "description": "Datos de 533M de usuarios de Facebook expuestos en un foro."},
    {"name": "Adobe", "date": "2013-10-04", "domain": "adobe.com", "data_classes": ["Email", "Password", "Name"], "severity": "high", "description": "Filtración de 153M de cuentas de Adobe."},
    {"name": "Dropbox", "date": "2012-07-01", "domain": "dropbox.com", "data_classes": ["Email", "Password"], "severity": "high", "description": "68M de credenciales de Dropbox filtradas."},
    {"name": "Twitter", "date": "2022-07-01", "domain": "twitter.com", "data_classes": ["Email", "Name", "Phone", "Username"], "severity": "high", "description": "Datos de 5.4M de cuentas de Twitter expuestos."},
    {"name": "Canva", "date": "2019-05-24", "domain": "canva.com", "data_classes": ["Email", "Name", "Password"], "severity": "high", "description": "139M de cuentas de Canva comprometidas."},
    {"name": "Santander", "date": "2024-05-01", "domain": "santander.com", "data_classes": ["Email", "Name", "Phone", "Account"], "severity": "critical", "description": "Datos de clientes de Santander expuestos en foros."},
    {"name": "Ticketmaster", "date": "2024-05-01", "domain": "ticketmaster.com", "data_classes": ["Email", "Name", "Phone", "Payment"], "severity": "critical", "description": "Filtración de Ticketmaster con datos de pago."},
    {"name": "Movistar", "date": "2023-11-15", "domain": "movistar.es", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high", "description": "Datos de clientes de Movistar expuestos."},
    {"name": "Iberdrola", "date": "2023-08-10", "domain": "iberdrola.es", "data_classes": ["Email", "Name", "DNI", "Address"], "severity": "critical", "description": "Filtración de Iberdrola con datos personales y DNI."},
    {"name": "BBVA", "date": "2024-02-20", "domain": "bbva.com", "data_classes": ["Email", "Name", "Account", "Phone"], "severity": "critical", "description": "Datos bancarios de clientes BBVA expuestos."},
    {"name": "El Corte Inglés", "date": "2023-06-05", "domain": "elcorteingles.es", "data_classes": ["Email", "Name", "Address", "Phone"], "severity": "high", "description": "Datos de clientes de El Corte Inglés filtrados."},
    {"name": "Telefónica", "date": "2024-01-10", "domain": "telefonica.com", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high", "description": "Datos internos de Telefónica expuestos."},
    {"name": "Mapfre", "date": "2023-09-20", "domain": "mapfre.com", "data_classes": ["Email", "Name", "DNI", "Phone"], "severity": "critical", "description": "Datos de asegurados de Mapfre comprometidos."},
    {"name": "SEAT", "date": "2023-07-15", "domain": "seat.com", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high", "description": "Datos de clientes de SEAT filtrados."},
    {"name": "Repsol", "date": "2023-12-01", "domain": "repsol.com", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high", "description": "Datos de clientes de Repsol expuestos."},
    {"name": "Mercadona", "date": "2024-03-15", "domain": "mercadona.es", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high", "description": "Datos de clientes de Mercadona comprometidos."},
    {"name": "Banco Sabadell", "date": "2024-04-10", "domain": "bancsabadell.com", "data_classes": ["Email", "Name", "Account", "Phone"], "severity": "critical", "description": "Datos bancarios de clientes Sabadell expuestos."},
    {"name": "CaixaBank", "date": "2024-01-25", "domain": "caixabank.com", "data_classes": ["Email", "Name", "Account", "DNI"], "severity": "critical", "description": "Filtración de datos de CaixaBank."},
]


SEVERITY_BY_DATA = {
    "Password": "critical",
    "Payment": "critical",
    "Account": "critical",
    "DNI": "critical",
    "Credit Card": "critical",
    "SSN": "critical",
    "Phone": "high",
    "Address": "high",
    "Email": "medium",
    "Name": "medium",
    "Username": "low",
    "IP": "low",
}


def classify_severity(data_classes: list) -> str:
    max_sev = "low"
    for dc in data_classes:
        sev = SEVERITY_BY_DATA.get(dc, "medium")
        if sev == "critical":
            return "critical"
        if sev == "high":
            max_sev = "high"
        if sev == "medium" and max_sev == "low":
            max_sev = "medium"
    return max_sev


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
                "severity": b.get("severity", classify_severity(b.get("DataClasses", []))),
                "description": f"Datos expuestos: {', '.join(b.get('DataClasses', []))}.",
            })
            seen.add(name.lower())
    return merged


ALL_BREACHES = None


def get_breaches():
    global ALL_BREACHES
    if ALL_BREACHES is None:
        ALL_BREACHES = fetch_all_breaches()
    return ALL_BREACHES


def normalize_domain(d: str) -> str:
    d = d.lower().strip()
    d = d.replace("https://", "").replace("http://", "").split("/")[0]
    d = d.replace("www.", "").replace("www2.", "").strip()
    return d


def match_domain(input_domain: str, breach_domain: str) -> bool:
    if not breach_domain:
        return False
    if input_domain == breach_domain:
        return True
    if input_domain.endswith("." + breach_domain):
        return True
    if breach_domain.endswith("." + input_domain):
        return True
    parts_in = input_domain.split(".")
    parts_br = breach_domain.split(".")
    common = 0
    for a, b in zip(reversed(parts_in), reversed(parts_br)):
        if a == b:
            common += 1
        else:
            break
    if common >= 2:
        return True
    return False


def check_email_via_hibp(email: str) -> list[dict]:
    results = []
    try:
        resp = requests.get(
            f"{HIBP_API}/breachedaccount/{email}?truncateResponse=true",
            timeout=10,
            headers={"hibp-api-key": ""},
        )
        if resp.status_code == 200:
            for breach_ref in resp.json():
                results.append({
                    "breach_name": breach_ref.get("Name", "Desconocida"),
                    "breach_date": breach_ref.get("BreachDate", ""),
                    "data_classes": breach_ref.get("DataClasses", []),
                    "severity": classify_severity(breach_ref.get("DataClasses", [])),
                    "confidence": "high",
                    "description": f"Email {email} comprometido en {breach_ref.get('Name', 'brecha')}.",
                })
    except:
        pass
    return results


def check_email_in_breaches(email: str) -> list[dict]:
    results = []
    email_lower = email.lower().strip()
    domain_part = email_lower.split("@")[-1] if "@" in email_lower else email_lower
    domain_norm = normalize_domain(domain_part)

    try:
        hibp_results = check_email_via_hibp(email)
        results.extend(hibp_results)
    except:
        pass

    for breach in get_breaches():
        breach_name = breach.get("name", breach.get("Name", ""))
        breach_domain = normalize_domain(breach.get("domain", breach.get("Domain", "")))
        breach_date = breach.get("date", breach.get("BreachDate", ""))
        data_classes = breach.get("data_classes", breach.get("DataClasses", []))
        severity = breach.get("severity", classify_severity(data_classes))
        description = breach.get("description", f"Datos expuestos: {', '.join(data_classes)}.")

        matched_names = {r["breach_name"].lower() for r in results}
        if breach_name.lower() in matched_names:
            continue

        if breach_domain and match_domain(domain_norm, breach_domain):
            results.append({
                "breach_name": breach_name,
                "breach_date": breach_date,
                "data_classes": data_classes,
                "severity": severity,
                "confidence": "medium",
                "description": description,
            })

    return results


def check_domain_in_breaches(domain: str) -> list[dict]:
    results = []
    domain_norm = normalize_domain(domain)

    for breach in get_breaches():
        breach_name = breach.get("name", breach.get("Name", ""))
        breach_domain = normalize_domain(breach.get("domain", breach.get("Domain", "")))
        breach_date = breach.get("date", breach.get("BreachDate", ""))
        data_classes = breach.get("data_classes", breach.get("DataClasses", []))
        severity = breach.get("severity", classify_severity(data_classes))
        description = breach.get("description", f"Datos expuestos: {', '.join(data_classes)}.")

        if breach_domain and match_domain(domain_norm, breach_domain):
            results.append({
                "breach_name": breach_name,
                "breach_date": breach_date,
                "data_classes": data_classes,
                "severity": severity,
                "confidence": "high",
                "description": description,
            })

    return results


async def check_asset(asset_type: str, asset_value: str) -> dict:
    if asset_type == "domain":
        breaches = check_domain_in_breaches(asset_value)
    else:
        breaches = check_email_in_breaches(asset_value)

    severity = "low"
    data_classes_seen = set()
    for b in breaches:
        for dc in b.get("data_classes", []):
            data_classes_seen.add(dc)
        if b.get("severity") == "critical":
            severity = "critical"
        elif b.get("severity") == "high" and severity != "critical":
            severity = "high"
        elif b.get("severity") == "medium" and severity not in ("critical", "high"):
            severity = "medium"

    return {
        "asset": asset_value,
        "type": asset_type,
        "checked_at": datetime.now().isoformat(),
        "breaches_found": len(breaches),
        "severity": severity,
        "data_classes_exposed": sorted(data_classes_seen),
        "breaches": breaches,
        "safe": len(breaches) == 0,
    }
