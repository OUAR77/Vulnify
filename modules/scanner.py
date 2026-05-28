import ssl
import socket
import dns.resolver
import requests
from datetime import datetime

def parse_domain(url):
    d = url.lower().strip()
    d = d.replace('https://', '').replace('http://', '').split('/')[0].replace('www.', '')
    return d

def check_ssl(domain):
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                expires = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                days_left = (expires - datetime.now()).days
                issuer = dict(cert['issuer'][0]).get('commonName', 'Desconocido')
                score = 100
                if days_left < 0: score = 0
                elif days_left < 7: score = 20
                elif days_left < 30: score = 50
                elif days_left < 90: score = 80
                return {
                    'valid': True, 'issuer': issuer,
                    'expires': expires.isoformat(),
                    'daysLeft': days_left,
                    'subject': domain, 'score': score
                }
    except Exception as e:
        return {'valid': False, 'error': str(e), 'score': 0}

def check_headers(domain):
    try:
        resp = requests.get(f'https://{domain}', timeout=10, headers={'User-Agent': 'Vulnify/1.0'})
        h = resp.headers
        checks = []
        score = 0
        total = 8

        if h.get('strict-transport-security'):
            checks.append({'name': 'HSTS', 'status': 'ok', 'desc': 'HTTP Strict Transport Security presente'})
            score += 1
        else:
            checks.append({'name': 'HSTS', 'status': 'fail', 'desc': 'Falta cabecera HSTS'})

        if h.get('x-frame-options'):
            checks.append({'name': 'X-Frame-Options', 'status': 'ok', 'desc': 'Protección clickjacking activa'})
            score += 1
        else:
            checks.append({'name': 'X-Frame-Options', 'status': 'fail', 'desc': 'Falta protección contra clickjacking'})

        if h.get('x-content-type-options'):
            checks.append({'name': 'X-Content-Type-Options', 'status': 'ok', 'desc': 'Protección MIME sniffing activa'})
            score += 1
        else:
            checks.append({'name': 'X-Content-Type-Options', 'status': 'fail', 'desc': 'Falta cabecera anti-MIME sniffing'})

        if h.get('x-xss-protection'):
            checks.append({'name': 'X-XSS-Protection', 'status': 'warn', 'desc': 'Cabecera XSS presente (obsoleta en algunos navegadores)'})
        else:
            checks.append({'name': 'X-XSS-Protection', 'status': 'warn', 'desc': 'Falta cabecera XSS'})

        if h.get('content-security-policy'):
            checks.append({'name': 'CSP', 'status': 'ok', 'desc': 'Content Security Policy configurada'})
            score += 1
        else:
            checks.append({'name': 'CSP', 'status': 'fail', 'desc': 'Falta CSP - riesgo de XSS'})

        if h.get('referrer-policy'):
            checks.append({'name': 'Referrer-Policy', 'status': 'ok', 'desc': 'Política de referer configurada'})
            score += 1
        else:
            checks.append({'name': 'Referrer-Policy', 'status': 'warn', 'desc': 'Falta Referrer-Policy'})

        if h.get('permissions-policy'):
            checks.append({'name': 'Permissions-Policy', 'status': 'ok', 'desc': 'Política de permisos configurada'})
            score += 1
        else:
            checks.append({'name': 'Permissions-Policy', 'status': 'warn', 'desc': 'Falta Permissions-Policy'})

        if resp.status_code == 200:
            checks.append({'name': 'HTTP Status', 'status': 'ok', 'desc': f'Responde OK ({resp.status_code})'})
        else:
            checks.append({'name': 'HTTP Status', 'status': 'warn', 'desc': f'Código de respuesta: {resp.status_code}'})

        return {'checks': checks, 'score': round((score / total) * 100)}
    except Exception as e:
        return {'checks': [{'name': 'Error', 'status': 'fail', 'desc': str(e)}], 'score': 0}

def check_dns(domain):
    results = []
    try:
        answers = dns.resolver.resolve(domain, 'A')
        results.append({'type': 'A', 'value': ', '.join([str(a) for a in answers[:3]]), 'status': 'ok'})
    except:
        results.append({'type': 'A', 'value': 'Sin registro', 'status': 'warn'})

    try:
        answers = dns.resolver.resolve(domain, 'MX')
        results.append({'type': 'MX', 'value': ', '.join([str(a.exchange) for a in answers[:2]]), 'status': 'ok'})
    except:
        results.append({'type': 'MX', 'value': 'Sin registro MX', 'status': 'warn'})

    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        txts = [str(a) for a in answers]
        has_spf = any('v=spf1' in t for t in txts)
        has_dkim = any('dkim' in t for t in txts)
        results.append({'type': 'SPF', 'value': 'Configurado' if has_spf else 'No configurado', 'status': 'ok' if has_spf else 'warn'})
    except:
        results.append({'type': 'SPF', 'value': 'No configurado', 'status': 'warn'})

    return results

async def scan_domain(domain):
    clean = parse_domain(domain)
    ssl_result = check_ssl(clean)
    headers_result = check_headers(clean)
    dns_result = check_dns(clean)

    overall = round((ssl_result['score'] * 0.35) + (headers_result['score'] * 0.35) + 30)

    issues = []
    if not ssl_result.get('valid'):
        issues.append({'severity': 'critical', 'text': f'SSL no válido: {ssl_result.get("error", "Error desconocido")}'})
    elif ssl_result.get('daysLeft', 999) < 30:
        issues.append({'severity': 'high', 'text': f'SSL expira en {ssl_result["daysLeft"]} días'})
    for c in headers_result.get('checks', []):
        if c['status'] == 'fail':
            issues.append({'severity': 'medium', 'text': c['desc']})
    for d in dns_result:
        if d['status'] == 'warn':
            issues.append({'severity': 'low', 'text': f'DNS: {d["type"]} - {d["value"]}'})

    return {
        'domain': clean,
        'scannedAt': datetime.now().isoformat(),
        'scores': {'general': overall, 'ssl': ssl_result['score'], 'headers': headers_result['score']},
        'ssl': ssl_result,
        'headers': headers_result['checks'],
        'dns': dns_result,
        'issues': issues
    }
