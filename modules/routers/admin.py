import csv
import io
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.activity_log import ActivityLog
from modules.auth import require_admin, require_admin_totp, verify_password
from models.blog_post import BlogPost
from models.testimonial import Testimonial
from models.faq import FAQ
from models.product import Product
from modules.activity_logger import log_activity, get_client_ip
from config import limiter

router = APIRouter(prefix="/api/admin")
logger = logging.getLogger("vulnify.api.admin")


@router.get("/users", description="List all users (admin only)")
@limiter.limit("30/minute")
def admin_list_users(request: Request, page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=100), search: str | None = Query(None), admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    q = db.query(User).order_by(User.created_at.desc())
    if search:
        q = q.filter(
            User.email.ilike(f"%{search}%") |
            User.name.ilike(f"%{search}%")
        )
    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()
    log_activity("admin.list_users", admin.id, admin.email, {"page": page, "search": search})
    return {"total": total, "page": page, "per_page": per_page, "items": [{
        "id": u.id, "name": u.name, "email": u.email, "role": u.role,
        "is_verified": bool(u.is_verified), "totp_enabled": u.totp_enabled,
        "created_at": str(u.created_at)[:19],
    } for u in users]}


@router.delete("/users/{user_id}", description="Delete a user (admin only)")
@limiter.limit("10/minute")
def admin_delete_user(request: Request, user_id: int, password: str | None = Query(None), admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta. Debes confirmar tu contraseña para esta acción.")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    log_activity("admin.delete_user", admin.id, admin.email, {"deleted_user_id": user_id, "deleted_email": u.email, "deleted_name": u.name}, get_client_ip(request))
    db.delete(u)
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/role", description="Change user role (admin only)")
@limiter.limit("10/minute")
def admin_change_role(request: Request, user_id: int, role: str = Query(...), password: str | None = Query(None), admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta. Debes confirmar tu contraseña para esta acción.")
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Rol inválido")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    old_role = u.role
    u.role = role
    db.commit()
    log_activity("admin.change_role", admin.id, admin.email, {"user_id": user_id, "old_role": old_role, "new_role": role}, get_client_ip(request))
    return {"ok": True}


@router.get("/stats", description="Global platform stats (admin only)")
@limiter.limit("30/minute")
def admin_stats(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    from models.message import Message
    from models.order import Order
    return {
        "total_users": db.query(User).count(),
        "total_messages": db.query(Message).count(),
        "total_orders": db.query(Order).count(),
        "total_logs": db.query(ActivityLog).count(),
    }


@router.get("/activity-actions", description="List unique activity action types (admin only)")
@limiter.limit("30/minute")
def admin_activity_actions(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    rows = db.query(ActivityLog.action).distinct().order_by(ActivityLog.action).all()
    return [r[0] for r in rows]


@router.get("/activity-logs", description="List activity logs (admin only)")
@limiter.limit("30/minute")
def admin_activity_logs(
    request: Request,
    page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=200),
    action: str | None = Query(None),
    admin: User = Depends(require_admin_totp), db: Session = Depends(get_db),
):
    q = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())
    if action:
        q = q.filter(ActivityLog.action == action)
    total = q.count()
    logs = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total, "page": page, "per_page": per_page,
        "items": [{
            "id": l.id, "user_id": l.user_id, "email": l.email,
            "action": l.action, "details": l.details,
            "ip_address": l.ip_address,
            "created_at": str(l.created_at)[:19],
        } for l in logs],
    }


@router.post("/verify-password", description="Verify admin password for sensitive actions")
@limiter.limit("10/minute")
def admin_verify_password(request: Request, admin: User = Depends(require_admin_totp)):
    return {"ok": True}


@router.get("/messages/export", description="Export messages as CSV (admin only)")
def admin_export_messages(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    from models.message import Message
    items = db.query(Message).order_by(Message.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ID", "Nombre", "Email", "Mensaje", "Leído", "Creado"])
    for m in items:
        w.writerow([m.id, m.name, m.email, m.message, "Sí" if m.read else "No", str(m.created_at)[:19]])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=messages.csv"})


@router.get("/orders/export", description="Export orders as CSV (admin only)")
def admin_export_orders(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    from models.order import Order
    items = db.query(Order).order_by(Order.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ID", "Cliente", "Email", "Servicio", "Descripción", "Importe", "Estado", "Creado"])
    for o in items:
        w.writerow([o.id, o.client_name, o.client_email, o.service, o.description, o.amount, o.status, str(o.created_at)[:19]])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=orders.csv"})


@router.get("/maintenance", description="Get maintenance mode status (admin only)")
def get_maintenance(admin: User = Depends(require_admin_totp)):
    from config import settings
    return {"maintenance_mode": settings.MAINTENANCE_MODE}


@router.put("/maintenance", description="Toggle maintenance mode (admin only)")
def set_maintenance(
    request: Request,
    body: dict,
    password: str | None = Query(None),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    from config import settings
    enabled = body.get("maintenance_mode", False)
    import os
    os.environ["MAINTENANCE_MODE"] = "true" if enabled else "false"
    settings.MAINTENANCE_MODE = enabled
    log_activity("admin.maintenance", admin.id, admin.email, {"maintenance_mode": enabled})
    return {"ok": True, "maintenance_mode": enabled}

@router.post("/seed", description="Insert sample data: blog posts, testimonials, FAQs, and products")
@limiter.limit("2/minute")
def seed_data(request: Request, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    count = {"posts": 0, "testimonials": 0, "faqs": 0, "products": 0}

    if db.query(BlogPost).count() == 0:
        posts = [
            BlogPost(
                title="Next.js vs Astro: cuál elegir según tu proyecto en 2026",
                slug="nextjs-vs-astro-2026",
                tag="Desarrollo Web",
                excerpt="Comparativa completa de los dos frameworks que dominan el ecosistema React. Analizamos rendimiento, curva de aprendizaje, SEO y casos de uso ideales para cada uno.",
                content="""Elegir el framework adecuado para tu proyecto web puede marcar la diferencia entre un desarrollo ágil y un dolor de cabeza constante. En 2026, dos opciones destacan por encima del resto: **Next.js** y **Astro**.

## ¿Qué ofrece cada uno?

### Next.js

Next.js es el framework React por excelencia. Creado por Vercel, ofrece:

- **Server Side Rendering (SSR)** y **Static Site Generation (SSG)**
- **App Router** con layouts anidados y server components
- **API Routes** para construir tu backend junto al frontend
- Optimización automática de imágenes y fuentes

```jsx
// app/page.tsx — Server Component por defecto
export default async function Home() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  return (
    <main>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </main>
  )
}
```

### Astro

Astro, por su parte, revolucionó el concepto de **islas de interactividad**. Su enfoque:

- **Zero JS por defecto**: envía solo HTML y CSS, JavaScript solo cuando es necesario
- Compatible con múltiples frameworks (React, Vue, Svelte, Solid)
- **Content Collections** para gestionar contenido Markdown/MDX
- Rendimiento sobresaliente en Lighthouse

```astro
---
// Ejemplo de página en Astro
import BlogPost from '../components/BlogPost.astro'
const posts = await Astro.glob('./posts/*.md')
---
<html>
  <body>
    {posts.map(post => <BlogPost post={post} />)}
  </body>
</html>
```

## Comparativa directa

| Característica | Next.js | Astro |
|---|---|---|
| JS por defecto | Sí | No |
| SSR | Nativo | Limitado |
| Islas interactivas | No | Sí |
| Curva de aprendizaje | Media | Baja |
| Ecosistema | Muy amplio | Creciendo |
| Ideal para | Aplicaciones web | Sitios de contenido |

## ¿Cuál elegir?

- **Elige Next.js** si necesitas una aplicación web con mucho estado, dashboard, panel de admin o funcionalidad en tiempo real.
- **Elige Astro** si tu proyecto es principalmente contenido: blog, documentación, landing page o sitio corporativo.

> En Vulnify usamos ambos según el proyecto. Para este mismo blog elegimos Astro por su velocidad. Para nuestras herramientas internas, Next.js.

## Conclusión

No hay un ganador absoluto. Ambos frameworks son excelentes en lo suyo. Lo importante es conocer sus fortalezas y elegir el que mejor se adapte a tu proyecto.""",
                author="Vulnify", read_time="8 min", published=True
            ),
            BlogPost(
                title="Cómo integrar un chatbot con IA en tu web sin saber programar",
                slug="chatbot-integracion-ia",
                tag="Inteligencia Artificial",
                excerpt="Guía paso a paso para añadir un asistente inteligente a tu sitio web usando herramientas low-code. Sin escribir una sola línea de código.",
                content="""Los chatbots con inteligencia artificial han pasado de ser un lujo a una necesidad. Según estudios recientes, **el 68% de los usuarios prefiere interactuar con un chatbot** antes que rellenar un formulario.

Y lo mejor: hoy puedes tener uno funcionando en tu web sin saber programar.

## Paso 1: Define el propósito

Antes de elegir herramienta, pregúntate:

1. **¿Atención al cliente?** — Resolver dudas frecuentes, estado de pedidos.
2. **¿Generación de leads?** — Cualificar visitantes y capturar contactos.
3. **¿Soporte técnico?** — Guiar usuarios en pasos concretos.
4. **¿Ventas?** — Recomendar productos y cerrar ventas.

## Paso 2: Elige la plataforma adecuada

Estas son las mejores opciones low-code en 2026:

### Tidio
- Plan gratuito generoso (hasta 100 conversaciones/mes)
- Integración nativa con Shopify, WooCommerce
- Editor visual de flujos con IA

### ManyChat
- Ideal para integración con Instagram y Facebook
- Plantillas prediseñadas para ecommerce
- Automatización multicanal

### Voiceflow
- Enfoque en experiencias conversacionales
- Soporte para voz (Alexa, Google Home)
- Plan gratuito para proyectos pequeños

## Paso 3: Diseña el flujo conversacional

Un buen flujo sigue esta estructura:

```
Saludo → ¿En qué puedo ayudarte?
├── Información general → FAQ automático
├── Precios → Enlace a planes + formulario
├── Soporte → Ticket + horario
└── Hablar con humano → Derivación a agente
```

> **Consejo:** No intentes cubrir todos los casos posibles desde el día uno. Empieza con los 5 escenarios más comunes y ve ampliando.

## Paso 4: Configura las respuestas de IA

La mayoría de plataformas permiten conectar **GPT-4 o Claude** para respuestas inteligentes. Esto significa que si el usuario hace una pregunta no prevista, la IA genera una respuesta coherente automáticamente.

## Paso 5: Instala en tu web

El proceso es siempre el mismo:

1. Copias un snippet de JavaScript
2. Lo pegas en el `<head>` de tu web
3. ¡Listo! El chatbot aparece en tu sitio

```html
<!-- Ejemplo de snippet de Tidio -->
<script src="//code.tidio.co/tu-codigo-unico.js" async></script>
```

## Resultados esperados

Nuestros clientes suelen ver:

- **Reducción del 40%** en tickets de soporte
- **Incremento del 25%** en captación de leads
- **Respuesta instantánea** 24/7 sin coste adicional

## Conclusión

Integrar un chatbot con IA hoy es cuestión de horas, no de meses. La tecnología low-code ha democratizado el acceso a la inteligencia artificial conversacional. Si tu web aún no tiene uno, estás perdiendo oportunidades.""",
                author="Vulnify", read_time="7 min", published=True
            ),
            BlogPost(
                title="Core Web Vitals: la guía definitiva para posicionar en Google en 2026",
                slug="core-web-vitals-guia-2026",
                tag="SEO",
                excerpt="Todo lo que necesitas saber sobre LCP, FID, CLS e INP: las métricas que Google usa para decidir si tu web merece estar en primera página.",
                content="""Desde 2021, Google incluye los **Core Web Vitals** como factor de posicionamiento. En 2026, con la llegada de **INP (Interaction to Next Paint)** como sustituto de FID, dominar estas métricas es más importante que nunca.

## ¿Qué son los Core Web Vitals?

Son un conjunto de métricas que miden la **experiencia de usuario** real en tu web. Google las usa para determinar si tus visitantes disfrutan o sufren al navegar.

### Las 4 métricas clave

#### LCP (Largest Contentful Paint) — < 2.5s

Mide cuánto tarda en cargarse el elemento más grande visible. Puede ser una imagen, un vídeo o un bloque de texto grande.

**Cómo mejorarlo:**
- Optimiza y comprime imágenes al formato WebP o AVIF
- Usa un CDN para servir assets
- Elimina recursos que bloqueen el renderizado
- Aplica lazy loading a imágenes fuera del viewport

```html
<!-- Imagen optimizada con lazy loading -->
<img
  src="hero.webp"
  loading="lazy"
  width="1200"
  height="600"
  alt="Hero image optimizada"
/>
```

#### INP (Interaction to Next Paint) — < 200ms

**Nueva en 2026.** Sustituye a FID. Mide el tiempo desde que el usuario interactúa (click, tap, teclado) hasta que la web responde visualmente.

**Cómo mejorarlo:**
- Divide el JavaScript pesado en chunks más pequeños
- Usa `setTimeout` o `requestAnimationFrame` para tareas no críticas
- Evita listeners complejos en eventos de scroll o resize
- Implementa web workers para procesos intensivos

#### CLS (Cumulative Layout Shift) — < 0.1

Mide cuánto se mueve el contenido mientras se carga. Esa molesta experiencia de *"iba a hacer click pero todo se movió"*.

**Cómo mejorarlo:**
- Especifica dimensiones explícitas en imágenes y vídeos
- Reserva espacio para embeds y anuncios
- Inserta contenido dinámico debajo del pliegue
- Usa `aspect-ratio` en CSS

```css
/* Evita layout shifts en imágenes */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}
```

#### TTFB (Time to First Byte) — < 800ms

Aunque no es oficialmente un Core Web Vital, es su base. Mide cuánto tarda el servidor en responder.

**Cómo mejorarlo:**
- Usa un hosting rápido con CDN global
- Implementa caché en servidor y navegador
- Optimiza consultas a base de datos
- Considera un static site generator si tu contenido cambia poco

## Herramientas para medir

- **PageSpeed Insights** — La herramienta oficial de Google
- **Lighthouse** — Integrado en Chrome DevTools
- **Search Console** — Informe de Core Web Vitals con datos reales
- **Web Vitals Extension** — Extensión de Chrome para monitoreo en tiempo real

## Caso real: mejora del 60% en LCP

Uno de nuestros clientes tenía un LCP de 4.8 segundos. Esto es lo que hicimos:

1. Convertimos las imágenes a WebP -> Ahorro del 40% en peso
2. Implementamos un CDN -> Reducción de latencia del 50%
3. Eliminamos CSS no usado -> Reducción del 30% en render blocking
4. Aplazamos scripts de terceros -> Mejora del 20% en INP

**Resultado:** LCP bajó a 1.9 segundos. Su tráfico orgánico creció un 35% en 3 meses.

## Conclusión

Los Core Web Vitals no son opcionales. Son un requisito para competir en Google. La buena noticia: con las estrategias adecuadas, cualquier web puede alcanzar puntuaciones sobresalientes.""",
                author="Vulnify", read_time="10 min", published=True
            ),
            BlogPost(
                title="Automatización con IA: cómo ahorrar 20 horas semanales en tu negocio",
                slug="automatizacion-ia-negocio",
                tag="Inteligencia Artificial",
                excerpt="Descubre cómo empresas como la tuya están usando inteligencia artificial para automatizar tareas repetitivas y liberar tiempo para lo que realmente importa.",
                content="""Imagina llegar al lunes y tener todo el reporting semanal listo, los emails de seguimiento enviados y los leads clasificados por prioridad. Sin mover un dedo.

Esto no es ciencia ficción. Es lo que la **automatización con IA** está haciendo realidad para cientos de negocios.

## ¿Qué tareas se pueden automatizar?

### 1. Atención al cliente (80% de reducción)

Los chatbots con IA pueden resolver el 80% de las consultas sin intervención humana:

- Estado de pedidos
- Preguntas frecuentes
- Problemas comunes de configuración
- Derivación inteligente a soporte humano

### 2. Reporting y análisis de datos

Olvídate de los informes manuales en Excel. La IA puede:

- Generar dashboards automáticos desde tus fuentes de datos
- Enviar informes programados por email
- Detectar anomalías sin que las busques

```python
# Ejemplo: script Python para reporte automático
import pandas as pd
import openai
import smtplib

# 1. Cargar datos
df = pd.read_sql("SELECT * FROM ventas WHERE fecha = CURRENT_DATE", conn)

# 2. IA genera análisis
resumen = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{
        "role": "user",
        "content": f"Analiza estos datos de ventas: {df.to_json()}"
    }]
)

# 3. Enviar por email
enviar_email(destino="ceo@empresa.com", asunto="Reporte diario", cuerpo=resumen)
```

### 3. Clasificación de leads

No todos los leads son iguales. La IA puede:

- Analizar el comportamiento del usuario en tu web
- Puntuarlos según probabilidad de conversión
- Enviarlos al equipo comercial adecuado automáticamente

### 4. Email marketing personalizado

La segmentación manual está muerta. La IA:

- Analiza el historial de cada usuario
- Genera contenido personalizado para cada segmento
- Optimiza el momento de envío para máxima apertura

## El proceso de implantación

### Fase 1: Auditoría (semana 1)
Identificamos los procesos repetitivos que consumen más tiempo en tu negocio. Creamos un mapa de automatización.

### Fase 2: Desarrollo (semanas 2-3)
Implementamos las soluciones elegidas: chatbots, scripts de automatización, integraciones con tus herramientas actuales.

### Fase 3: Formación y ajuste (semana 4)
Formamos a tu equipo y ajustamos los flujos según el feedback inicial.

## Resultados de clientes reales

| Área | Horas ahorradas/semana | ROI |
|---|---|---|
| Atención al cliente | 12h | 300% |
| Reporting | 5h | 200% |
| Clasificación leads | 3h | 400% |
| **Total** | **20h** | **~300%** |

## Conclusión

La automatización con IA no es el futuro, es el presente. Las empresas que la adoptan están ganando una ventaja competitiva significativa. Las que no, se están quedando atrás.

> En Vulnify ayudamos a empresas como la tuya a implementar estas soluciones. El proceso es más sencillo de lo que imaginas.""",
                author="Vulnify", read_time="8 min", published=True
            ),
            BlogPost(
                title="Guía completa de SEO técnico para desarrolladores web",
                slug="seo-tecnico-desarrolladores",
                tag="SEO",
                excerpt="Los aspectos técnicos que todo desarrollador debe conocer para que Google entienda y posicione correctamente sus proyectos web.",
                content="""El SEO no es solo cosa de copywriters y estrategas de contenido. Como desarrollador, tienes en tus manos **el 60% del éxito SEO** de un proyecto. Si la base técnica no es sólida, ningún contenido la va a salvar.

## 1. Arquitectura de la información

Google necesita entender la estructura de tu web. Así se la facilitas:

### URLs semánticas
```
❌ /page?id=123&cat=productos
✅ /productos/zapatillas-running-hombre
```

### Estructura de enlazado interno
Cada página debe ser accesible desde al menos un enlace interno. El **siloing** temático ayuda a Google a entender la jerarquía:

```
Inicio
├── Productos
│   ├── Zapatillas
│   ├── Ropa
│   └── Accesorios
└── Blog
    ├── Guía de tallas
    └── Consejos de entrenamiento
```

## 2. HTML semántico

Usa las etiquetas HTML5 correctamente:

```html
<!-- Bien -->
<article>
  <header>
    <h1>Título del artículo</h1>
    <time datetime="2026-06-15">15 junio 2026</time>
  </header>
  <section>
    <h2>Subtema relacionado</h2>
    <p>Contenido...</p>
  </section>
  <footer>
    <address>Por Vulnify</address>
  </footer>
</article>

<!-- Mal -->
<div class="articulo">
  <div class="titulo">Título</div>
  <div class="contenido">...</div>
</div>
```

## 3. Meta tags esenciales

```html
<!-- Title único por página -->
<title>Guía SEO Técnico | Vulnify Blog</title>

<!-- Meta description convincente -->
<meta name="description" content="Aprende los fundamentos del SEO técnico...">

<!-- Open Graph para redes sociales -->
<meta property="og:title" content="Guía SEO Técnico">
<meta property="og:description" content="Aprende los fundamentos...">
<meta property="og:image" content="https://vulnify.es/og-seo.png">

<!-- Canonical para evitar contenido duplicado -->
<link rel="canonical" href="https://vulnify.es/blog/seo-tecnico">
```

## 4. Rendimiento y Core Web Vitals

Google lo ha dejado claro: **la velocidad importa**. Asegúrate de:

- **LCP < 2.5s**: Optimiza la carga del hero image
- **INP < 200ms**: Elimina JavaScript que bloquee la interacción
- **CLS < 0.1**: Dimensiones fijas en imágenes y embeds

## 5. Datos estructurados (Schema.org)

Ayudan a Google a entender el contenido y generar **rich snippets**:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Guía completa de SEO técnico",
  "author": {
    "@type": "Organization",
    "name": "Vulnify"
  },
  "datePublished": "2026-06-15",
  "description": "Guía técnica de SEO para desarrolladores"
}
```

## 6. Sitemap y robots.txt

Un sitemap bien configurado es el mapa del tesoro para Google:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vulnify.es/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://vulnify.es/blog</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Errores comunes que debes evitar

1. **Contenido duplicado** — Misma página accesible por múltiples URLs
2. **Páginas huérfanas** — Sin enlaces internos que apunten a ellas
3. **JavaScript sin SSR** — Google puede ejecutar JS, pero no siempre bien
4. **Redirecciones en cadena** — Cada redirección pierde autoridad
5. **Imágenes sin alt text** — Google no ve imágenes, lee el atributo alt

## Herramientas imprescindibles

- **Ahrefs / Semrush** — Auditoría técnica completa
- **Google Search Console** — Monitorización oficial
- **Screaming Frog** — Crawling de tu web
- **Lighthouse** — Rendimiento y buenas prácticas

## Conclusión

El SEO técnico es responsabilidad del desarrollador. Ignorarlo es construir sobre arena. Implementa estas bases desde el día uno y tu proyecto tendrá una ventaja competitiva imposible de alcanzar con parches posteriores.""",
                author="Vulnify", read_time="10 min", published=True
            ),
            BlogPost(
                title="¿Necesitas una web progresiva (PWA)? Ventajas para tu negocio",
                slug="pwa-ventajas-negocio",
                tag="Desarrollo Web",
                excerpt="Las Progressive Web Apps combinan lo mejor de las webs y las apps nativas. Descubre por qué cada vez más negocios están adoptando esta tecnología.",
                content="""Imagina que tu web funciona offline, puede instalarse en la pantalla de inicio del móvil y envía notificaciones push como una app nativa. Todo sin pasar por la App Store ni Google Play.

Eso es una **Progressive Web App (PWA)**. Y está cambiando las reglas del juego.

## ¿Qué hace que una web sea PWA?

Tres requisitos técnicos:

1. **HTTPS** — Seguridad obligatoria
2. **Service Worker** — Script que actúa como proxy entre el navegador y la red
3. **Manifest JSON** — Archivo que define cómo se comporta la app instalada

```json
{
  "name": "Vulnify",
  "short_name": "Vulnify",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Ventajas para tu negocio

### 1. Sin fricción de instalación

Una app nativa requiere:
- Ir a la store
- Buscar la app
- Descargarla (varios MB)
- Instalarla
- Registrarse

Una PWA requiere:
- Un click en "Añadir a pantalla de inicio"

La tasa de conversión es **3 veces mayor** que la instalación de apps nativas.

### 2. Funciona offline

El service worker puede cachear tu contenido para que funcione sin conexión. Esto es crítico en:

- Zonas con cobertura móvil deficiente
- Usuarios que viajan en metro o avión
- Mercados emergentes con datos móviles caros

```javascript
// Service Worker: cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  )
})
```

### 3. Notificaciones push

Reengancha a tus usuarios sin depender del email. Las tasas de clic en notificaciones push son del **20-30%**, frente al 2-3% del email marketing.

### 4. Menor coste de desarrollo

Desarrollar una app nativa para iOS y Android puede costar **50.000€-150.000€**. Una PWA cuesta una fracción y mantienes un solo código base.

### 5. Ocupa menos espacio

Una PWA típica ocupa **1-2 MB**. Una app nativa: **50-200 MB**. Para usuarios con almacenamiento limitado, la decisión es clara.

## ¿Cuándo NO usar una PWA?

Las PWA no son perfectas. Evítalas si necesitas:

- Acceso profundo al hardware (Bluetooth, NFC, sensores específicos)
- Apps con mucho procesamiento local (juegos 3D, edición de vídeo)
- Integración obligatoria con Google Play / App Store

## Caso de éxito: Twitter Lite

Twitter lanzó su versión PWA (Twitter Lite) y consiguió:

- **250k bytes** vs 23MB de la app nativa
- **Aumento del 75%** en tuits enviados
- **Reducción del 20%** en tasa de rebote
- **Aumento del 50%** en páginas por sesión

## Conclusión

Si tu negocio necesita llegar a más usuarios con menor inversión, una PWA es probablemente la mejor decisión tecnológica que puedes tomar. Y lo mejor: puedes empezar con una web normal e ir añadiendo capacidades PWA progresivamente.""",
                author="Vulnify", read_time="7 min", published=True
            ),
            BlogPost(
                title="Midjourney, DALL-E y Stable Diffusion: cuál usa tu proyecto",
                slug="ia-generativa-imagenes-comparativa",
                tag="Inteligencia Artificial",
                excerpt="Comparativa exhaustiva de los tres generadores de imágenes por IA más potentes del mercado. Analizamos calidad, precio, velocidad y casos de uso ideales para cada uno.",
                content="""La generación de imágenes con inteligencia artificial ha pasado de ser una curiosidad a una herramienta esencial para diseñadores, marketers y desarrolladores. Pero con tantas opciones, elegir la adecuada puede ser abrumador.

## Los tres grandes

### Midjourney

El favorito de los creativos. Midjourney destaca por:

- **Calidad artística inigualable** — Sus imágenes parecen obras de arte
- **Estilo único** — Reconocible al instante, con una estética muy cuidada
- **Comunidad activa** — Millones de usuarios compartiendo prompts
- **Control mediante parámetros** — `--ar 16:9`, `--stylize 1000`, `--v 6`

**Precio:** Desde 10$/mes (plan básico)
**Ideal para:** Arte conceptual, ilustraciones, branding creativo

### DALL-E 3

La apuesta de OpenAI. Integrado con ChatGPT, su punto fuerte es:

- **Seguimiento de instrucciones** — El mejor interpretando prompts complejos
- **Integración nativa con ChatGPT** — Describe lo que quieres en lenguaje natural
- **Calidad consistente** — Menos variabilidad, más predecible
- **Sin necesidad de prompts técnicos** — Habla como lo harías con un humano

**Precio:** Incluido en ChatGPT Plus (20$/mes)
**Ideal para:** Prototipado rápido, contenido comercial, redes sociales

### Stable Diffusion

La opción open-source. Con ella:

- **Se ejecuta localmente** — Sin límites de generación, sin censura
- **Completamente gratuito** — Si tienes el hardware adecuado
- **Extensible con modelos** — Checkpoints, LoRAs, ControlNet
- **Control total** — Fine-tuning, entrenamiento personalizado

```python
# Ejemplo: Stable Diffusion con diffusers
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)
pipe = pipe.to("cuda")

prompt = "foto realista de un café de especialidad, luz natural, canon 5d"
image = pipe(prompt).images[0]
image.save("cafe-realista.png")
```

**Precio:** Gratuito (hardware propio) o desde 0.002$/imagen en API
**Ideal para:** Proyectos que requieren control total, lotes masivos, fine-tuning

## Comparativa directa

| Aspecto | Midjourney | DALL-E 3 | Stable Diffusion |
|---|---|---|---|
| Calidad artística | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Seguir prompts | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Precio | 10$/mes | 20$/mes | Gratis / 0.002$ img |
| Velocidad | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ (local) |
| Control | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Open source | No | No | Sí |

## Casos de uso prácticos

### Marketing digital
→ **DALL-E 3** para variaciones rápidas de anuncios y banners
→ **Midjourney** para la identidad visual de campañas importantes

### Desarrollo web
→ **Stable Diffusion** para generar assets en lotes con estilos consistentes
→ **Midjourney** para hero images y backgrounds únicos

### Branding
→ **Midjourney** para explorar direcciones visuales
→ **Stable Diffusion** para crear variaciones de un logo con ControlNet

## El futuro: vídeo y 3D

La próxima frontera ya está aquí:

- **Sora (OpenAI)** — Generación de vídeo realista
- **Runway Gen-3** — Edición de vídeo con IA
- **Pika Labs** — Animación de imágenes estáticas

## Conclusión

No necesitas elegir uno. Los profesionales usan los tres según el momento: Midjourney para explorar, DALL-E para ejecutar, Stable Diffusion para escalar. La clave está en conocer sus fortalezas y aplicarlas donde brillan.""",
                author="Vulnify", read_time="9 min", published=True
            ),
            BlogPost(
                title="Tailwind CSS v4: lo que cambia y cómo migrar tu proyecto",
                slug="tailwind-css-v4-novedades",
                tag="Desarrollo Web",
                excerpt="La nueva versión de Tailwind CSS llega con cambios importantes. Te contamos las novedades, qué debes saber para migrar y por qué es aún más rápido que antes.",
                content="""Tailwind CSS v4 ya está aquí y trae cambios importantes respecto a v3. Si eres desarrollador frontend, esto te interesa.

## ¿Qué cambia realmente?

Tailwind v4 es una **reescritura completa** del motor CSS. Esto significa:

- **Sin archivo `tailwind.config.js`** — Configuración desde CSS nativo
- **Sin PostCSS necesario** — Engine independiente más rápido
- **Compilación nativa** — Hasta 10x más rápido que v3

## Las novedades principales

### 1. Configuración desde CSS

Adiós al archivo de configuración. Ahora todo se declara en CSS:

```css
/* tailwind.css — Configuración nativa */
@import "tailwindcss";

@theme {
  --color-primary: #6366f1;
  --color-secondary: #ec4899;
  --font-family-display: "Inter", sans-serif;
  --breakpoint-xs: 30rem;
}
```

### 2. `@variant` para variantes personalizadas

```css
@variant dark {
  --color-primary: #818cf8;
}

@variant hocus (&:hover, &:focus) {
  --tw-ring-width: 3px;
}

/* Uso en HTML */
/* <div class="bg-primary hocus:ring-3"> */
```

### 3. Nuevas utilidades

```html
<!-- Contenedor con query container intrinsic -->
<div class="container">
  <div class="@sm:text-lg @md:text-xl">
    <!-- Crece según el contenedor, no el viewport -->
  </div>
</div>

<!-- Field sizing -->
<input class="field-sizing-content" />

<!-- Scroll snap mejorado -->
<div class="snap-x snap-mandatory overflow-x-auto">
  <div class="snap-start">Slide 1</div>
  <div class="snap-start">Slide 2</div>
</div>
```

### 4. Sin dependencia de PostCSS

Esto es enorme. La v4 incluye un compilador propio escrito en Rust que:

- Escanea tu HTML y genera el CSS exacto que necesitas
- No requiere configuración de PostCSS
- Soporta Vite, Next.js, y CLI directamente

```bash
# Uso standalone
npx @tailwindcss/cli -i input.css -o output.css
```

## ¿Debes migrar?

### Migra YA si:
- Empiezas un proyecto nuevo desde cero
- Tu proyecto es pequeño o mediano
- Quieres velocidades de compilación brutalmente rápidas

### Espera si:
- Usas muchos plugins de Tailwind v3 que no tienen equivalente
- Dependes de `@apply` intensivamente (ahora es más restrictivo)
- Tienes configuraciones muy complejas con PostCSS

## Cómo migrar un proyecto existente

```
1. npm install tailwindcss@next
2. Elimina tailwind.config.js y postcss.config.js
3. Añade configuración @theme en tu archivo CSS principal
4. Sustituye directivas @tailwind por @import
5. Compila y revisa cambios visuales
6. Actualiza valores personalizados al nuevo sistema
```

> **Consejo:** No migres en producción sin probar. La v4 cambia la generación de clases y algunas utilidades pueden tener nombres diferentes.

## Rendimiento: los números

| Operación | Tailwind v3 | Tailwind v4 | Mejora |
|---|---|---|---|
| Build inicial | 2.3s | 0.4s | 5.7x |
| Build incremental | 400ms | 30ms | 13x |
| Tamaño CSS (dev) | 12MB | 4MB | 3x |
| Tamaño CSS (prod) | 18KB | 14KB | 1.3x |

## Conclusión

Tailwind CSS v4 es un salto generacional. La desaparición del archivo de configuración, el compilador nativo en Rust y las nuevas variantes lo convierten en la mejor opción para desarrollo web en 2026. Si empiezas un proyecto hoy, no lo dudes.""",
                author="Vulnify", read_time="8 min", published=True
            ),
        ]
        db.add_all(posts)
        count["posts"] = len(posts)

    if db.query(Testimonial).count() == 0:
        testimonials = [
            Testimonial(name="Carlos Mendoza", role="CEO", company="TechFlow",
                        content="Vulnify transformó nuestra web. Pasamos de 5 a 40 leads al mes sin invertir en anuncios.", rating=5, featured=True),
            Testimonial(name="Laura García", role="CTO", company="InnovaCorp",
                        content="En 3 semanas teníamos nuestra web lista con chatbot IA incluido. El equipo súper profesional.", rating=5, featured=True),
            Testimonial(name="Miguel Ángel Ruiz", role="Director Operaciones", company="DataSmart",
                        content="Automatizamos todo nuestro reporting. Ahorramos 20h semanales y tenemos datos en tiempo real.", rating=5, featured=True),
        ]
        db.add_all(testimonials)
        count["testimonials"] = len(testimonials)

    if db.query(FAQ).count() == 0:
        faqs = [
            FAQ(question="¿Cuánto tiempo lleva desarrollar una web?", answer= "Depende de la complejidad. Una web corporativa puede estar lista en 2-3 semanas. Proyectos con IA suelen requerir 4-6 semanas.", order=1, published=True),
            FAQ(question="¿Necesito tener claro todo antes de empezar?", answer="No. Te guiamos desde la idea. Incluye una fase de auditoría donde definimos juntos el alcance.", order=2, published=True),
            FAQ(question="¿Ofrecen mantenimiento después del lanzamiento?", answer="Sí. Todos nuestros proyectos incluyen soporte post-lanzamiento y planes de mantenimiento continuo.", order=3, published=True),
            FAQ(question="¿Cómo integran la inteligencia artificial?", answer="Desde chatbots personalizados hasta automatización de procesos y análisis predictivo. Evaluamos tu caso y proponemos la solución óptima.", order=4, published=True),
        ]
        db.add_all(faqs)
        count["faqs"] = len(faqs)

    product_slugs = [p.slug for p in db.query(Product.slug).all()]
    products_to_seed = [
        Product(
            name="Generador de Documentos IA",
            slug="generador-documentos-ia",
            description="Tu asistente para crear contratos, facturas, presupuestos, informes y cartas profesionales con inteligencia artificial. Incluye editor, descarga en PDF y plantillas personalizables.",
            price_one_time=49.0,
            price_monthly=9.0,
            active=True,
        ),
        Product(
            name="Kit RGPD Completo",
            slug="kit-rgpd-completo",
            description="Plantillas legales para cumplir con la normativa de protección de datos: políticas de privacidad, consentimientos, DPO, registro de actividades y más. Adaptado a la LOPDGDD española.",
            price_one_time=29.0,
            price_monthly=None,
            active=True,
        ),
        Product(
            name="Pack Contratos Profesionales",
            slug="pack-contratos-profesionales",
            description="10 plantillas de contratos listos para usar: prestación de servicios, confidencialidad, arrendamiento, laboral, compraventa, colaboración, y más. Formato Word y PDF.",
            price_one_time=39.0,
            price_monthly=None,
            active=True,
        ),
        Product(
            name="Chatbot IA White-Label",
            slug="chatbot-ia-white-label",
            description="Asistente inteligente listo para integrar en tu web con tu propia marca. Responde preguntas, captura leads y deriva a soporte humano. Sin límite de conversaciones.",
            price_one_time=149.0,
            price_monthly=19.0,
            active=True,
        ),
        Product(
            name="SEO Analyzer",
            slug="seo-analyzer",
            description="Analiza cualquier URL y obtén un informe completo de SEO técnico: Core Web Vitals, estructura HTML, meta tags, datos estructurados, rendimiento y recomendaciones accionables.",
            price_one_time=19.0,
            price_monthly=None,
            active=True,
        ),
        Product(
            name="Generador de Blog con IA",
            slug="generador-blog-ia",
            description="Crea artículos optimizados para SEO con inteligencia artificial. Elige tema, tono y extensión. Incluye keywords, meta description y estructura lista para publicar.",
            price_one_time=24.0,
            price_monthly=7.0,
            active=True,
        ),
        Product(
            name="Curso: ChatGPT para Empresas",
            slug="curso-chatgpt-empresas",
            description="Domina ChatGPT y la IA generativa para tu negocio: automatización de tareas, redacción comercial, análisis de datos, atención al cliente y más. 8 módulos con ejercicios prácticos.",
            price_one_time=37.0,
            price_monthly=None,
            active=True,
        ),
        Product(
            name="Soporte Técnico Recurrente",
            slug="soporte-tecnico-recurrente",
            description="Plan mensual de soporte técnico con 5 horas de dedicación. Ideal para mantener tu web actualizada, resolver incidencias y realizar mejoras continuas. Respuesta en 24h.",
            price_one_time=None,
            price_monthly=49.0,
            active=True,
        ),
        Product(
            name="Tokens API Inteligencia Artificial",
            slug="tokens-api-inteligencia-artificial",
            description="500.000 tokens mensuales para usar en tus propias integraciones con IA. Compatible con GPT-4, Claude y Llama. Incluye documentación y acceso a nuestra API proxy.",
            price_one_time=None,
            price_monthly=29.0,
            active=True,
        ),
    ]
    new_products = [p for p in products_to_seed if p.slug not in product_slugs]
    if new_products:
        db.add_all(new_products)
        count["products"] = len(new_products)

    db.commit()
    return {"ok": True, "inserted": count}
