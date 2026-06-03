import socket
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger("vulnify.port_scanner")

CRITICAL_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 111: "RPC", 135: "MSRPC", 139: "NetBIOS",
    143: "IMAP", 389: "LDAP", 443: "HTTPS", 445: "SMB", 993: "IMAPS",
    995: "POP3S", 1433: "MSSQL", 1521: "Oracle", 2049: "NFS",
    3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL", 5900: "VNC",
    6379: "Redis", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt", 27017: "MongoDB",
}

DANGEROUS_PORTS = {21, 23, 111, 135, 139, 389, 445, 2049, 3389, 5900}
COMMON_PORTS = sorted(CRITICAL_PORTS.keys())


async def _scan_port(host: str, port: int, timeout: float = 2.0) -> dict:
    try:
        _, _, ips = socket.gethostbyname_ex(host)
        ip = ips[0]
    except Exception:
        try:
            ip = socket.gethostbyname(host)
        except Exception:
            return {"port": port, "service": CRITICAL_PORTS.get(port, ""), "open": False, "error": "DNS resolution failed"}

    try:
        loop = asyncio.get_event_loop()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = await loop.run_in_executor(None, lambda: sock.connect_ex((ip, port)))
        sock.close()

        if result == 0:
            service = CRITICAL_PORTS.get(port, "unknown")
            danger = port in DANGEROUS_PORTS
            return {
                "port": port,
                "service": service,
                "open": True,
                "dangerous": danger,
                "protocol": "TCP",
            }
        return {"port": port, "service": CRITICAL_PORTS.get(port, ""), "open": False}
    except Exception as e:
        return {"port": port, "service": CRITICAL_PORTS.get(port, ""), "open": False, "error": str(e)[:60]}


async def scan_host(host: str, ports: list[int] | None = None, timeout: float = 1.5) -> dict:
    if ports is None:
        ports = COMMON_PORTS
    host = host.lower().strip()
    host = host.replace("https://", "").replace("http://", "").split("/")[0]
    host = host.split("@")[-1]

    tasks = [_scan_port(host, p, timeout) for p in ports]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    open_ports = []
    for r in results:
        if isinstance(r, dict) and r.get("open"):
            open_ports.append(r)

    services_found = {p["service"] for p in open_ports if p.get("service")}
    dangerous_open = [p for p in open_ports if p.get("dangerous")]

    issues = []
    if dangerous_open:
        port_list = ", ".join(f"{p['port']} ({p['service']})" for p in dangerous_open)
        issues.append(f"Puertos peligrosos abiertos: {port_list}")
    if len(open_ports) > 10:
        issues.append(f"Demasiados puertos abiertos ({len(open_ports)}) — superficie de ataque amplia")

    return {
        "host": host,
        "scanned_at": datetime.now().isoformat(),
        "ports_scanned": len(ports),
        "open_ports": len(open_ports),
        "ports": open_ports,
        "services": sorted(services_found),
        "dangerous_open": len(dangerous_open),
        "issues": issues,
    }
