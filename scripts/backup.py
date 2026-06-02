"""
Script de backup automático de la base de datos.
Uso: python scripts/backup.py [--output backups/]

Crea un dump SQLite o ejecuta pg_dump para PostgreSQL.
Conserva las últimas 7 copias por defecto.
"""

import argparse
import datetime
import glob
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

DEFAULT_RETENTION = 7


def backup_sqlite(output_dir: str) -> str:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        print(f"ERROR: Base de datos no encontrada: {db_path}")
        sys.exit(1)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"vulnify_backup_{timestamp}.db"
    backup_path = os.path.join(output_dir, backup_name)
    shutil.copy2(db_path, backup_path)
    print(f"Backup creado: {backup_path} ({os.path.getsize(backup_path)} bytes)")
    return backup_path


def backup_postgres(output_dir: str) -> str:
    db_url = settings.DATABASE_URL
    if "//" in db_url:
        parts = db_url.split("//")[1]
        user_pass, rest = parts.split("@", 1)
        user = user_pass.split(":")[0]
        password = user_pass.split(":")[1] if ":" in user_pass else ""
        host_port, dbname = rest.split("/", 1)
        host = host_port.split(":")[0]
        port = host_port.split(":")[1] if ":" in host_port else "5432"
    else:
        print("ERROR: No se pudo parsear DATABASE_URL")
        sys.exit(1)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"vulnify_backup_{timestamp}.sql"
    backup_path = os.path.join(output_dir, backup_name)
    env = os.environ.copy()
    if password:
        env["PGPASSWORD"] = password
    cmd = ["pg_dump", "-h", host, "-p", port, "-U", user, "-d", dbname, "-f", backup_path]
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR pg_dump: {result.stderr}")
        sys.exit(1)
    print(f"Backup creado: {backup_path}")
    return backup_path


def clean_old_backups(output_dir: str, retention: int):
    backups = sorted(glob.glob(os.path.join(output_dir, "vulnify_backup_*")))
    while len(backups) > retention:
        old = backups.pop(0)
        os.remove(old)
        print(f"Backup antiguo eliminado: {old}")


def main():
    parser = argparse.ArgumentParser(description="Backup de BD de Vulnify")
    parser.add_argument("--output", default="backups", help="Directorio de salida")
    parser.add_argument("--retention", type=int, default=DEFAULT_RETENTION, help="Nº de backups a conservar")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    if "postgres" in settings.DATABASE_URL:
        backup_postgres(args.output)
    else:
        backup_sqlite(args.output)

    clean_old_backups(args.output, args.retention)
    print("Backup completado.")


if __name__ == "__main__":
    main()
