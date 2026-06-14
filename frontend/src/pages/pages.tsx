import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export function BlogPage() {
  const posts = [
    { tag: 'Desarrollo', title: 'Next.js vs Astro: cuál elegir según tu proyecto', date: '12 Jun 2026', read: '5 min', desc: 'Comparativa completa de los dos frameworks más populares para construir webs modernas.' },
    { tag: 'IA', title: 'Cómo integrar un chatbot en tu web sin saber programar', date: '28 May 2026', read: '7 min', desc: 'Guía paso a paso para añadir inteligencia artificial a tu sitio sin escribir una línea de código.' },
    { tag: 'SEO', title: 'Los 5 errores técnicos que están matando tu posicionamiento', date: '15 May 2026', read: '4 min', desc: 'Errores comunes que cometemos al optimizar una web y cómo solucionarlos.' },
    { tag: 'Rendimiento', title: 'Core Web Vitals: la guía definitiva para 2026', date: '2 May 2026', read: '6 min', desc: 'Todo lo que necesitas saber sobre las métricas que Google usa para posicionar tu web.' },
    { tag: 'Negocio', title: 'Por qué tu web debería ser una máquina de leads', date: '20 Abr 2026', read: '5 min', desc: 'De folleto digital a motor de crecimiento. Estrategias para convertir visitantes en clientes.' },
    { tag: 'Tecnología', title: 'Automatización con IA: casos reales en pymes', date: '8 Abr 2026', read: '8 min', desc: 'Ejemplos prácticos de cómo pequeñas empresas están usando IA para ahorrar tiempo y dinero.' },
  ]

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="mb-16">
          <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
            ← Volver al inicio
          </Link>
          <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">Blog</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">Recursos para crecer.</h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.title} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden">
              <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04] inline-block mb-4">
                {post.tag}
              </span>
              <h2 className="text-base font-semibold text-white mb-2 leading-snug">{post.title}</h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">{post.desc}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-700 mt-auto">
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700/50" />
                <span>{post.read}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LegalPage({ title, date, children }: { title: string; date: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
          ← Volver al inicio
        </Link>
        <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">{title}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-[1.05] tracking-tight mb-2">{title}</h1>
        <p className="text-xs text-zinc-700 mb-10">Última actualización: {date}</p>
        <div className="text-sm text-zinc-400 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" date="1 de junio de 2026">
      <h2 className="text-white font-medium text-base mt-8 mb-3">1. Responsable del tratamiento</h2>
      <p>Vulnify (en adelante, "la empresa"), con domicilio en España, es la responsable del tratamiento de los datos personales facilitados por los usuarios a través de este sitio web.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">2. Datos recopilados</h2>
      <p>Recopilamos información que nos proporcionas directamente al rellenar el formulario de contacto: nombre, dirección de email, y teléfono. También recopilamos datos de navegación mediante cookies técnicas y analíticas.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">3. Finalidad del tratamiento</h2>
      <p>Tus datos serán utilizados para: (a) atender tu solicitud de información o presupuesto, (b) enviarte comunicaciones comerciales si has dado tu consentimiento, y (c) mejorar nuestros servicios mediante análisis de navegación.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">4. Base legal</h2>
      <p>El tratamiento se basa en tu consentimiento explícito al enviar el formulario y, en su caso, en el interés legítimo de la empresa para mejorar sus servicios.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">5. Conservación</h2>
      <p>Conservaremos tus datos mientras sea necesario para cumplir con la finalidad para la que fueron recogidos, y durante los plazos legales establecidos.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">6. Derechos</h2>
      <p>Tienes derecho a acceder, rectificar, suprimir, limitar el tratamiento, oponerte al tratamiento y solicitar la portabilidad de tus datos. Puedes ejercer estos derechos escribiendo a hola@vulnify.es.</p>
    </LegalPage>
  )
}

export function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" date="1 de junio de 2026">
      <h2 className="text-white font-medium text-base mt-8 mb-3">1. Aceptación de los términos</h2>
      <p>Al acceder y utilizar este sitio web, aceptas los presentes términos y condiciones. Si no estás de acuerdo con alguno de ellos, te recomendamos no utilizar el sitio.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">2. Servicios</h2>
      <p>Vulnify ofrece servicios de desarrollo web, integración de inteligencia artificial, desarrollo de APIs y consultoría digital. El alcance específico de cada servicio se definirá en el presupuesto correspondiente.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">3. Propiedad intelectual</h2>
      <p>Todo el contenido del sitio web (textos, imágenes, logotipos, código) es propiedad de Vulnify o se utiliza con licencia. Queda prohibida su reproducción sin autorización expresa.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">4. Limitación de responsabilidad</h2>
      <p>Vulnify no se hace responsable de los daños que pudieran derivarse del uso inadecuado del sitio web o de la interrupción del servicio por causas ajenas a su control.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">5. Modificaciones</h2>
      <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán publicados en esta página.</p>
    </LegalPage>
  )
}

export function CookiesPage() {
  return (
    <LegalPage title="Política de Cookies" date="1 de junio de 2026">
      <h2 className="text-white font-medium text-base mt-8 mb-3">1. ¿Qué son las cookies?</h2>
      <p>Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas un sitio web. Nos permiten recordar tus preferencias y mejorar tu experiencia de navegación.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">2. Tipos de cookies que utilizamos</h2>
      <p><strong>Cookies técnicas:</strong> necesarias para el funcionamiento del sitio web. No requieren consentimiento.<br />
      <strong>Cookies analíticas:</strong> nos ayudan a entender cómo los usuarios interactúan con el sitio, para mejorarlo.<br />
      <strong>Cookies de preferencias:</strong> recuerdan tus ajustes (como el tema oscuro) para ofrecerte una experiencia personalizada.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">3. Gestión de cookies</h2>
      <p>Puedes gestionar las cookies desde la configuración de tu navegador. Ten en cuenta que bloquear las cookies técnicas puede afectar al funcionamiento del sitio.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">4. Cookies de terceros</h2>
      <p>Este sitio web no utiliza cookies de terceros para publicidad ni seguimiento externo.</p>

      <h2 className="text-white font-medium text-base mt-8 mb-3">5. Más información</h2>
      <p>Para cualquier duda sobre nuestra política de cookies, escríbenos a hola@vulnify.es.</p>
    </LegalPage>
  )
}

export function CasosExitoPage() {
  const cases = [
    { metric: '+300%', label: 'leads orgánicos', company: 'TechFlow', sector: 'SaaS', desc: 'Rediseñamos su web con IA conversacional. Pasaron de 10 a 40 leads/mes sin invertir en anuncios.', result: 'Aumento del tráfico orgánico en un 180% gracias a la optimización SEO técnica y de contenido.' },
    { metric: '20h', label: 'semanales ahorradas', company: 'InnovaCorp', sector: 'Consultoría', desc: 'Automatizamos su proceso de reporting con un dashboard predictivo. Su equipo recuperó tiempo estratégico.', result: 'Reducción del 85% en el tiempo dedicado a reportes manuales. El equipo pasó de 24h a 4h semanales.' },
    { metric: '2.5x', label: 'conversión', company: 'DataSmart', sector: 'E-commerce', desc: 'Integramos recomendaciones inteligentes y chatbots. Su ticket medio creció un 150% en 90 días.', result: 'Tasa de conversión del 2.1% al 5.3%. El chatbot resolvió el 40% de las consultas sin intervención humana.' },
  ]

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
          ← Volver al inicio
        </Link>
        <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">Casos de éxito</span>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-10">Resultados que hablan.</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.company} className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden h-full flex flex-col">
              <div className="mb-5">
                <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">{c.metric}</span>
                <span className="block text-sm text-zinc-600 mt-1">{c.label}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">&ldquo;{c.desc}&rdquo;</p>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1">{c.result}</p>
              <div className="pt-5 border-t border-white/[0.04] flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{c.company}</div>
                  <div className="text-xs text-zinc-600">{c.sector}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ServicioPage() {
  const location = useLocation()
  const services: Record<string, { title: string; desc: string; features: string[] }> = {
    'desarrollo-web': {
      title: 'Desarrollo Web',
      desc: 'Creamos páginas corporativas, tiendas online y aplicaciones web con React, Next.js y diseño responsive. Cada proyecto está optimizado para velocidad, SEO y conversión.',
      features: ['Landing pages y webs corporativas', 'Tiendas online (e-commerce)', 'Aplicaciones web progresivas (PWA)', 'Optimización Core Web Vitals', 'Diseño responsive y accesible', 'Integración con CMS'],
    },
    'integraciones-ia': {
      title: 'Integraciones IA',
      desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para tu negocio. Lleva la inteligencia artificial a cada rincón de tu operación digital.',
      features: ['Chatbots con IA conversacional', 'Automatización de procesos', 'Análisis predictivo', 'Procesamiento de lenguaje natural', 'Recomendaciones inteligentes', 'Asistentes virtuales'],
    },
    'apis-backend': {
      title: 'APIs & Backend',
      desc: 'Arquitectura escalable, APIs robustas y paneles de administración diseñados para crecer. Construimos la columna vertebral técnica de tu negocio digital.',
      features: ['APIs RESTful y GraphQL', 'Microservicios escalables', 'Bases de datos SQL y NoSQL', 'Autenticación y autorización', 'Documentación automática', 'Monitorización y logging'],
    },
    'consultoria': {
      title: 'Consultoría Digital',
      desc: 'Estrategia tecnológica personalizada: desde la idea hasta la implementación. Te ayudamos a tomar las decisiones correctas para tu negocio.',
      features: ['Auditoría tecnológica', 'Roadmap de producto', 'Selección de stack técnico', 'Arquitectura de software', 'Estrategia de crecimiento', 'Formación y mentoring'],
    },
  }

  const slug = location.pathname.split('/').pop() || 'desarrollo-web'
  const service = services[slug] || services['desarrollo-web']

  return (
    <div className="min-h-screen pt-28 md:pt-36">
      <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <Link to="/" className="text-xs text-zinc-600 hover:text-white transition-colors inline-flex items-center gap-1 mb-6">
          ← Volver al inicio
        </Link>
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          <div>
            <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-4 font-mono">Servicios</span>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-6">{service.title}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">{service.desc}</p>
            <a href="mailto:hola@vulnify.es" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors">
              Solicitar presupuesto <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4">Qué incluye</h3>
            {service.features.map((f) => (
              <div key={f} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="size-1.5 rounded-full bg-zinc-500" />
                <span className="text-sm text-zinc-400">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
