# Vulnify

Monitorización de reputación digital y detección de brechas de datos para pymes y autónomos en España.

## Stack

- **Backend:** FastAPI (Python 3.11+)
- **Base de datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **ORM:** SQLAlchemy 2.0
- **Auth:** JWT + refresh tokens
- **Pagos:** Stripe (suscripciones)
- **Emails:** SendGrid
- **Frontend:** Jinja2 templates vanilla CSS (sin dependencias JS externas)
- **Deploy:** Docker + Railway

## Funcionalidades

- Añadir dominios y emails para monitorización
- Comprobación contra base de datos de brechas conocidas
- Alertas por severidad (critical, high, medium, low)
- Dashboard con estadísticas e historial de alertas
- Consulta rápida sin registro
- Planes de suscripción (Gratis / Pro 29€ / Business 99€)

## Desarrollo local

```bash
git clone https://github.com/OUAR77/Vulnify.git
cd Vulnify
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Variables de entorno (`.env`):
```
SECRET_KEY=cambiar-en-produccion
DATABASE_URL=sqlite:///./vulnify.db
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
SITE_URL=https://vulnify.es
```

## Docker

```bash
docker build -t vulnify .
docker run -p 8000:8000 vulnify
```

## Licencia

Uso interno.
