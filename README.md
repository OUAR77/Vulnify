# Vulnify

**Bug Bounty Platform española** — Conectamos hackers éticos con startups tech para mejorar la ciberseguridad.

Vulnify es una plataforma de bug bounty pensada para el ecosistema startup español. Permite a empresas publicar programas de recompensa por vulnerabilidades y a hunters encontrar, reportar y cobrar por bugs en aplicaciones reales.

## Características

- **Programas de bug bounty** — Las empresas publican sus programas con alcance, recompensas y reglas claras.
- **Dashboard para hackers** — Gestiona reportes, sigue programas y recibe pagos.
- **Dashboard para empresas** — Administra programas, revisa reportes y gestiona suscripciones.
- **Sistema de roles** — Admin, empresa y hunter con permisos diferenciados.
- **Autenticación JWT** — Login seguro con tokens de acceso.
- **Suscripciones Stripe** — Planes Gratis, Starter y Profesional con pagos recurrentes.
- **Hall of Fame** — Ranking público de hunters por recompensas acumuladas.
- **IA integrada** — Asistente para clasificar y analizar vulnerabilidades (Ollama / OpenAI).
- **Notificaciones en tiempo real** — WebSockets para eventos en vivo.
- **Rate limiting** — Protección contra abusos con SlowAPI.
- **Tema oscuro / claro** — Soporte nativo con persistencia en localStorage.
- **SEO** — Sitemap, robots.txt, Open Graph tags y meta descripciones.
- **Internacionalización** — Contenido en español, preparado para i18n.

## Stack tecnológico

| Capa          | Tecnología                                                  |
| ------------- | ----------------------------------------------------------- |
| Backend       | Python 3.12+, FastAPI                                       |
| Base de datos | SQLite (desarrollo), PostgreSQL 16 (producción)             |
| ORM           | SQLAlchemy 2.0 + Alembic                                    |
| Plantillas    | Jinja2                                                      |
| Frontend      | CSS personalizado, Google Fonts (Inter), JS vanilla         |
| Autenticación | python-jose (JWT), passlib (bcrypt)                         |
| Pagos         | Stripe                                                      |
| IA            | Ollama (local) / OpenAI API                                 |
| Emails        | SendGrid                                                    |
| Tiempo real   | WebSockets                                                  |
| Rate limiting | SlowAPI                                                     |
| Proxy inverso | Nginx (recomendado en producción)                           |
| Contenedores  | Docker + Docker Compose                                     |

## Inicio rápido

### Requisitos

- Python 3.12+
- SQLite viene incluido; para PostgreSQL tener Docker instalado.

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/vulnify.git
cd vulnify
```

### 2. Crear y activar entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con los valores que necesites. Ver sección [Configuración](#configuración).

### 5. Iniciar la aplicación

```bash
uvicorn main:app --reload --port 8000
```

La aplicación estará disponible en `http://localhost:8000`.

### 6. (Opcional) Ejecutar tests

```bash
pytest
```

## Configuración

Las variables de entorno se definen en `.env`. Puedes copiar `.env.example` como base.

### `SECRET_KEY`

Clave secreta usada para firmar JWT. Genérala con:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

**Obligatorio en producción** — si no se define, la app lanza un error al arrancar.

### Base de datos

Por defecto se usa SQLite (`vulnify.db`). Para PostgreSQL en producción:

```env
DATABASE_URL=postgresql://vulnify:vulnify_secret@db:5432/vulnify
```

### Stripe (pagos)

1. Crea una cuenta en [Stripe Dashboard](https://dashboard.stripe.com/register).
2. Ve a [API Keys](https://dashboard.stripe.com/test/apikeys) y copia la clave `sk_test_...`.
3. Ejecuta el script de setup para crear los precios:

```bash
python scripts/setup_stripe.py sk_test_tuclave
```

4. Instala [Stripe CLI](https://stripe.com/docs/stripe-cli) y reenvía eventos:

```bash
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

5. Define en `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

### IA (clasificación de reportes)

**Ollama (local, por defecto):**

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:14b
```

**OpenAI:**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### SendGrid (emails transaccionales)

```env
SENDGRID_API_KEY=SG.xxxxx
```

## Despliegue

### Docker Compose (recomendado para producción)

```bash
docker-compose up --build -d
```

Esto levanta:
- `app` — La aplicación FastAPI en el puerto `8000`.
- `db` — PostgreSQL 16 Alpine con health check.

Variables de entorno se toman de `.env`. Asegúrate de configurar `ENVIRONMENT=production` y una `SECRET_KEY` segura.

### Railway / Render / Fly.io

La app está preparada para desplegarse en plataformas como Railway. Ajusta las variables de entorno desde el panel de la plataforma.

### Nginx (proxy inverso)

Configuración recomendada para producción:

```nginx
server {
    listen 80;
    server_name vulnify.es www.vulnify.es;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name vulnify.es www.vulnify.es;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Estructura del proyecto

```
vulnify/
├── main.py                 # Punto de entrada FastAPI, rutas web
├── api.py                  # Router principal de la API
├── config.py               # Settings y configuración por entorno
├── database.py             # Engine, SessionLocal, Base declarativa
├── requirements.txt        # Dependencias Python
├── alembic.ini             # Configuración de Alembic
├── .env.example            # Plantilla de variables de entorno
├── Dockerfile              # Imagen Docker para producción
├── docker-compose.yml      # Orquestación con PostgreSQL
├── models/                 # Modelos SQLAlchemy
│   ├── user.py
│   ├── plan.py
│   ├── program.py
│   ├── report.py
│   ├── subscription.py
│   ├── payment.py
│   └── ...
├── modules/                # Lógica de negocio
│   ├── auth.py
│   ├── programs.py
│   ├── reports.py
│   └── ...
├── alembic/                # Migraciones de base de datos
│   ├── env.py
│   └── versions/
├── templates/              # Plantillas Jinja2
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── terms.html
│   ├── privacy.html
│   ├── programs.html
│   ├── dashboard.html
│   └── ...
├── static/                 # Archivos estáticos
│   ├── css/
│   ├── js/
│   ├── favicon.svg
│   ├── og-image.svg
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/                # Utilidades
│   └── setup_stripe.py
├── tests/                  # Tests con pytest
├── uploads/                # Archivos subidos por usuarios
└── venv/                   # Entorno virtual (local)
```
