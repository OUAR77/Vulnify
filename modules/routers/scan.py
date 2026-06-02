import logging
import ssl
import socket
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from config import limiter

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.scan")


@router.post("/scan", description="Scan a domain for SSL, headers, DNS issues")
@limiter.limit("20/hour")
async def scan_domain(request: Request):
    data = await request.json()
    domain = data.get("domain", "").strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Dominio requerido")

    domain = domain.replace("https://", "").replace("http://", "").split("/")[0]

    results = {
        "domain": domain,
        "scanned_at": datetime.now().isoformat(),
        "ssl": None,
        "headers": None,
        "dns": None,
        "issues": [],
        "score": 100,
    }

    # SSL check
    ssl_info = {"valid": False, "issuer": None, "expiry": None, "version": None}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                ssl_info["valid"] = True
                ssl_info["issuer"] = dict(cert.get("issuer", [])).get("organizationName", "Unknown")
                ssl_info["expiry"] = cert.get("notAfter", "")
                ssl_info["version"] = ssock.version()
                results["ssl"] = ssl_info
    except Exception as e:
        ssl_info["error"] = str(e)[:100]
        results["ssl"] = ssl_info
        results["issues"].append("SSL/TLS: No se pudo establecer conexión segura")
        results["score"] -= 20

    # HTTP headers check
    headers_info = {}
    try:
        import requests as req
        resp = req.get(f"https://{domain}", timeout=10, headers={"User-Agent": "VulnifyScanner/1.0"})
        h = resp.headers
        headers_info["status"] = resp.status_code
        headers_info["server"] = h.get("Server", "No revelado")
        headers_info["content_type"] = h.get("Content-Type", "")
        headers_info["csp"] = h.get("Content-Security-Policy", "No configurado")
        headers_info["hsts"] = h.get("Strict-Transport-Security", "No configurado")
        headers_info["xframe"] = h.get("X-Frame-Options", "No configurado")
        headers_info["xcontent"] = h.get("X-Content-Type-Options", "No configurado")
        headers_info["referrer"] = h.get("Referrer-Policy", "No configurado")
        results["headers"] = headers_info

        if not h.get("Content-Security-Policy"):
            results["issues"].append("CSP: Cabecera Content-Security-Policy no configurada")
            results["score"] -= 10
        if not h.get("Strict-Transport-Security"):
            results["issues"].append("HSTS: Cabecera Strict-Transport-Security no configurada")
            results["score"] -= 10
        if not h.get("X-Frame-Options"):
            results["issues"].append("XFO: Cabecera X-Frame-Options no configurada")
            results["score"] -= 5
        if not h.get("X-Content-Type-Options"):
            results["issues"].append("XCTO: Cabecera X-Content-Type-Options no configurada")
            results["score"] -= 5
        if not h.get("Referrer-Policy"):
            results["issues"].append("RP: Cabecera Referrer-Policy no configurada")
            results["score"] -= 5
        if h.get("Server", "").lower() in ("nginx", "apache", "iis", "cloudflare", "openresty"):
            pass
        elif h.get("Server"):
            results["issues"].append(f"Server: Versión de servidor revelada ({h.get('Server')})")
            results["score"] -= 5
    except Exception as e:
        headers_info["error"] = str(e)[:100]
        results["headers"] = headers_info
        results["issues"].append("Headers: No se pudieron obtener cabeceras HTTP")
        results["score"] -= 10

    # DNS records check
    dns_info = {"a": [], "mx": [], "ns": [], "txt": []}
    try:
        import dns.resolver
        for qtype, key in [("A", "a"), ("MX", "mx"), ("NS", "ns"), ("TXT", "txt")]:
            try:
                answers = dns.resolver.resolve(domain, qtype)
                dns_info[key] = [str(r) for r in answers]
            except Exception:
                dns_info[key] = []
        results["dns"] = dns_info
        if not dns_info["mx"]:
            results["issues"].append("DNS: No se encontraron registros MX (correo)")
            results["score"] -= 5
        if not dns_info["ns"]:
            results["issues"].append("DNS: No se encontraron servidores DNS autoritativos")
            results["score"] -= 5
    except ImportError:
        pass
    except Exception as e:
        dns_info["error"] = str(e)[:100]
        results["dns"] = dns_info

    results["score"] = max(0, results["score"])
    results["grade"] = "A" if results["score"] >= 90 else "B" if results["score"] >= 70 else "C" if results["score"] >= 50 else "D" if results["score"] >= 30 else "F"
    return results
