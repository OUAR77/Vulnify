# Vulnify

**Seguridad web automatizada para pymes y autónomos.**

Analiza cualquier dominio en segundos y obtén informes profesionales con los problemas detectados y cómo solucionarlos.

## Características

- **Escáner de seguridad** — SSL/TLS, cabeceras de seguridad (HSTS, CSP, X-Frame-Options, etc.) y DNS.
- **Informes PDF** — Descarga informes profesionales con puntuación y recomendaciones.
- **Dashboard** — Historial de todos tus escaneos con estadísticas.
- **API** — Integra el escáner en tus propios sistemas con API keys.
- **Suscripciones Stripe** — Planes Gratis, Pro (9€/mes) y Business (29€/mes).
- **Autenticación JWT** — Login seguro con tokens de acceso.
- **Tema oscuro / claro** — Soporte nativo con persistencia.
- **SEO** — Sitemap, robots.txt, Open Graph tags.

## Stack tecnológico

| Capa          | Tecnología                                                  |
| ------------- | ----------------------------------------------------------- |
| Backend       | Python 3.12+, FastAPI                                       |
| Base de datos | SQLite (desarrollo), PostgreSQL 16 (producción)             |
| ORM           | SQLAlchemy 2.0 + Alembic                                    |
| Plantillas    | Jinja2                                                      |
| Autenticación | python-jose (JWT), passlib (bcrypt)                         |
| Pagos         | Stripe                                                      |
| Emails        | SendGrid                                                    |
| Rate limiting | SlowAPI                                                     |
| Contenedores  | Docker + Docker Compose                                     |

## Inicio rápido

### Requisitos

- Python 3.12+

### 1. Clonar y preparar

```bash
git clone https://github.com/OUAR77/Vulnify.git
cd vulnify
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
```

### 2. Iniciar la aplicación

```bash
uvicorn main:app --reload --port 8000
```

Disponible en `http://localhost:8000`.

### 3. Ejecutar tests

```bash
pytest
```

## API

### Escaneo de dominios

```bash
curl -X POST https://vulnify.es/api/scan \
  -H "Content-Type: application/json" \
  -d '{"domain": "ejemplo.com"}'
```

### Obtener historial (autenticado)

```bash
curl -H "Authorization: Bearer <token>" \
  https://vulnify.es/api/scans
```

## Despliegue

```bash
docker-compose up --build -d
```

Variables de entorno se toman de `.env`. Configura `ENVIRONMENT=production` y una `SECRET_KEY` segura.

## Licencia

MIT
