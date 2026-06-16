import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Globe, Bot, Code, Cpu, Rocket, Sparkles, Zap, ChevronRight, Plus, Download, Mail, MessageCircle } from 'lucide-react'
import { ArtificialHero } from '@/components/ui/artificial-hero'
import { BorderBeam } from '@/components/ui/border-beam'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { Features } from '@/components/ui/features-8'
import { BentoPricing } from '@/components/ui/bento-pricing'
import { BentoGrid } from '@/components/ui/bento-grid'
import { MeshGradient } from '@paper-design/shaders-react'
import FlowArt, { FlowSection } from './story-scroll'

export function FloatingPathsEffect() {
  return (
    <>
      <ArtificialHero />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <MeshGradient
          className="w-full h-full"
          colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
          speed={0.5}
        />
      </div>
    </>
  )
}

const ScaleIn = ({ children, delay = 0, className = '' }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.1, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

const Label = ({ children }: any) => (
  <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-5 font-mono">{children}</span>
)

const FadeIn = ({ children, delay = 0, className = '' }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.1, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

const FAQItem = ({ question, answer }: any) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden relative">
      <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left">
        <span className="text-sm font-medium text-white">{question}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-zinc-600 shrink-0 ml-4">
          <Plus className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-sm text-zinc-500 leading-relaxed">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'

export function HomeContent({ onAboutOpen }: { onAboutOpen?: () => void }) {
  const stats = [
    { number: '40+', label: 'Proyectos entregados' },
    { number: '6+', label: 'Años de experiencia' },
    { number: '98%', label: 'Clientes satisfechos' },
    { number: '24h', label: 'Respuesta inicial' },
  ]

  const services = [
    { icon: Globe, title: 'Desarrollo Web', desc: 'Páginas corporativas, tiendas online y aplicaciones web con React, Next.js y diseño responsive.' },
    { icon: Bot, title: 'Integraciones IA', desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para tu negocio.' },
    { icon: Code, title: 'APIs & Backend', desc: 'Arquitectura escalable, APIs robustas y paneles de administración diseñados para crecer.' },
    { icon: Cpu, title: 'Consultoría Digital', desc: 'Estrategia tecnológica personalizada: desde la idea hasta la implementación.' },
  ]

  const steps = [
    { num: '01', title: 'Auditoría', desc: 'Analizamos tu negocio, competencia y objetivos. Definimos métricas de éxito.' },
    { num: '02', title: 'Estrategia', desc: 'Diseñamos la arquitectura digital: UX, IA, stack tecnológico y roadmap.' },
    { num: '03', title: 'Construcción', desc: 'Desarrollamos con diseño iterativo. Ves el progreso en tiempo real.' },
    { num: '04', title: 'Lanzamiento', desc: 'Despliegue, testing y puesta en marcha. No paramos hasta que funcione.' },
  ]

  const words = ['CREA', 'OPTIMIZA', 'ESCALA', 'DOMINA']

  const caseStudies = [
    { metric: '+300%', label: 'leads orgánicos', company: 'TechFlow', sector: 'SaaS', desc: 'Rediseñamos su web con IA conversacional. Pasaron de 10 a 40 leads/mes sin invertir en anuncios.' },
    { metric: '20h', label: 'semanales ahorradas', company: 'InnovaCorp', sector: 'Consultoría', desc: 'Automatizamos su proceso de reporting con un dashboard predictivo. Su equipo recuperó tiempo estratégico.' },
    { metric: '2.5x', label: 'conversión', company: 'DataSmart', sector: 'E-commerce', desc: 'Integramos recomendaciones inteligentes y chatbots. Su ticket medio creció un 150% en 90 días.' },
  ]

  return (
    <>
      <FlowArt className="relative z-10">

        {/* SECTION 1: Hero + Stats + CTA */}
        <FlowSection aria-label="Arquitectura Digital" style={{ backgroundColor: '#0a0a0a' }}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">01 — Arquitectura Digital</p>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-col justify-center min-h-[30vh]">
            <h1 className="text-[clamp(3.5rem,12vw,14rem)] font-bold leading-[0.85] uppercase tracking-tight text-white">
              Crear<br />Optimizar<br />Escalar
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mt-6 leading-relaxed">
              No construimos páginas. Diseñamos ecosistemas digitales con inteligencia artificial integrada para que tu negocio crezca.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <HoverBorderGradient as="a" href="mailto:hola@vulnify.es" className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                Solicitar auditoría gratis <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 text-base font-medium text-zinc-400 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/20 transition-all"
              >
                <MessageCircle className="size-4" />
                Escribir por WhatsApp
              </a>
            </div>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{s.number}</div>
                <div className="text-sm text-zinc-600">{s.label}</div>
              </div>
            ))}
          </div>
        </FlowSection>

        {/* SECTION 2: Problem → Solution */}
        <FlowSection aria-label="El Problema" style={{ backgroundColor: '#111111' }}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">02 — De Problema a Solución</p>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-col justify-center min-h-[25vh]">
            <h2 className="text-[clamp(2.5rem,8vw,10rem)] font-bold leading-[0.9] uppercase tracking-tight text-white mb-8">
              Tu web no está<br />trabajando para ti.
            </h2>
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div className="space-y-4">
                <p className="text-zinc-400 leading-relaxed">La mayoría de las webs son folletos digitales estáticos. No generan leads, no automatizan procesos, no se adaptan a tus clientes.</p>
                <div className="space-y-2">
                  {['Sin leads en 30 días', 'Procesos manuales que agotan', 'Web que no convierte'].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <span className="size-2 rounded-full bg-red-400/60" />
                      <span className="text-sm text-zinc-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-zinc-500 leading-relaxed mb-6">Mientras tu competencia avanza, tu página sigue siendo un gasto en lugar de una máquina de crecimiento.</p>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: Globe, title: 'Diseño que convierte', desc: 'Interfaces ultrarrápidas construidas con React, optimizadas para conversión y SEO.' },
                    { icon: Bot, title: 'IA integrada', desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para tu negocio.' },
                    { icon: Zap, title: 'Crecimiento continuo', desc: 'No es un proyecto finito. Iteramos, mejoramos y escalamos tu presencia digital.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="size-8 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center shrink-0">
                        <item.icon className="size-4 text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white mb-1">{item.title}</div>
                        <p className="text-xs text-zinc-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {[
              { label: 'SSL 256-bit', desc: 'Cifrado seguro' },
              { label: 'RGPD', desc: 'Cumplimiento UE' },
              { label: 'uptime 99.9%', desc: 'Sin caídas' },
              { label: 'Cloudflare', desc: 'CDN Global' },
              { label: 'PageSpeed A', desc: 'Rendimiento' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="none" className="size-4 text-zinc-600">
                    <path d="M10 1L12.5 7L18 7.5L13.5 11.5L15 18L10 14.5L5 18L6.5 11.5L2 7.5L7.5 7L10 1Z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-400">{b.label}</div>
                  <div className="text-[10px] text-zinc-700">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </FlowSection>

        {/* SECTION 3: Services + Process */}
        <FlowSection aria-label="Servicios" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">03 — Servicios</p>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-col justify-center min-h-[25vh]">
            <h2 className="text-[clamp(2.5rem,8vw,10rem)] font-bold leading-[0.9] uppercase tracking-tight text-white mb-8">
              Todo lo que necesitas.
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {services.map((s, i) => (
                <div key={s.title} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-2xl font-bold text-zinc-700 group-hover:text-zinc-500 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                    <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <s.icon className="size-4 text-zinc-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono mb-6">Cómo trabajamos</p>
              <div className="grid md:grid-cols-4 gap-6">
                {steps.map((s, i) => (
                  <div key={s.num} className="relative">
                    <span className="text-5xl font-bold text-white/[0.04] block mb-3 leading-none">{s.num}</span>
                    <h3 className="text-base font-semibold text-white mb-1">{s.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                    {i < steps.length - 1 && (
                      <div className="hidden md:block absolute top-8 -right-6 text-zinc-700">
                        <ChevronRight className="size-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-wrap justify-center gap-3">
            {['React', 'Next.js', 'TypeScript', 'Tailwind', 'Three.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Cloudflare'].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 font-mono">
                {tech}
              </span>
            ))}
          </div>
        </FlowSection>

        {/* SECTION 4: Results + Contact */}
        <FlowSection aria-label="Resultados" style={{ backgroundColor: '#222222' }}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">04 — Casos de Éxito</p>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex flex-col justify-center min-h-[25vh]">
            <h2 className="text-[clamp(2.5rem,8vw,10rem)] font-bold leading-[0.9] uppercase tracking-tight text-white mb-8">
              Resultados que hablan.
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {caseStudies.map((c) => (
                <div key={c.company} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full flex flex-col">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white tracking-tight">{c.metric}</span>
                    <span className="block text-sm text-zinc-600 mt-1">{c.label}</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4 flex-1">&ldquo;{c.desc}&rdquo;</p>
                  <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{c.company}</div>
                      <div className="text-xs text-zinc-600">{c.sector}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center max-w-lg mx-auto">
              <p className="text-lg text-zinc-400 mb-6">¿Listo para ser el próximo caso de éxito?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <HoverBorderGradient as="a" href="mailto:hola@vulnify.es" className="flex items-center gap-2 px-6 py-3 text-sm font-medium">
                  Solicitar auditoría <ArrowUpRight className="size-4" />
                </HoverBorderGradient>
                <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/20 transition-all"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          <hr className="border-none border-t border-white/20 my-[2vw]" />
          <div className="flex items-center gap-2 text-xs text-zinc-700 justify-center">
            <span className="size-1.5 rounded-full bg-amber-400/60 animate-pulse" />
            Solo 3 proyectos este mes — auditoría gratuita
          </div>
        </FlowSection>

      </FlowArt>

      {/* ====== Content after FlowArt — standard scrollable sections ====== */}

      {/* Trust badges marquee */}
      <div className="w-full border-b border-white/[0.04] overflow-hidden">
        <div className="py-16 md:py-20">
          <div className="text-center mb-10">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Confían en nosotros</span>
          </div>
          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="flex gap-16 md:gap-24 items-center flex-shrink-0"
            >
              {['TechFlow', 'InnovaCorp', 'DataSmart', 'NexusDigital', 'CloudBase', 'AIForge', 'WebCraft', 'PixelPerfect'].map((name) => (
                <span key={name} className="text-lg md:text-xl font-semibold text-zinc-700 whitespace-nowrap tracking-wide">{name}</span>
              ))}
              {['TechFlow', 'InnovaCorp', 'DataSmart', 'NexusDigital', 'CloudBase', 'AIForge', 'WebCraft', 'PixelPerfect'].map((name) => (
                <span key={`dup-${name}`} className="text-lg md:text-xl font-semibold text-zinc-700 whitespace-nowrap tracking-wide">{name}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <div className="w-full border-b border-white/[0.04] overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-12">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Manifiesto</span>
          </div>
          <div className="space-y-6 md:space-y-8">
            {words.map((word, i) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.25, 0.1, 0.1, 1] }}
              >
                <span className="text-[clamp(3rem,12vw,8rem)] font-bold text-white leading-[0.9] tracking-[-0.05em] block">
                  {word}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mt-10">
            <p className="text-lg text-zinc-500 max-w-xl leading-relaxed">
              Tu negocio merece una presencia digital que no solo se vea bien, que trabaje mientras tú duermes.
            </p>
          </div>
        </div>
      </div>

      {/* BentoGrid */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16 text-center">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Lo que hacemos</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4">
              Tecnología que transforma.
            </h2>
          </div>
          <BentoGrid />
        </div>
      </div>

      {/* Features */}
      <div className="w-full border-b border-white/[0.04]">
        <Features />
      </div>

      {/* Pricing */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <BentoPricing />
        </div>
      </div>

      {/* Blog */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16 text-center">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Blog</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4">Recursos para crecer.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { tag: 'Desarrollo', title: 'Next.js vs Astro: cuál elegir según tu proyecto', date: '12 Jun 2026', read: '5 min' },
              { tag: 'IA', title: 'Cómo integrar un chatbot en tu web sin saber programar', date: '28 May 2026', read: '7 min' },
              { tag: 'SEO', title: 'Los 5 errores técnicos que están matando tu posicionamiento', date: '15 May 2026', read: '4 min' },
            ].map((post) => (
              <div key={post.title} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden h-full group">
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04] inline-block mb-4">
                  {post.tag}
                </span>
                <h3 className="text-base font-semibold text-white mb-3 leading-snug group-hover:text-zinc-300 transition-colors">{post.title}</h3>
                <div className="flex items-center gap-3 text-xs text-zinc-700">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700/50" />
                  <span>{post.read}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4">
              Respuestas rápidas.
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: '¿Cuánto tiempo lleva desarrollar una web?', a: 'Depende de la complejidad. Una web corporativa puede estar lista en 2-3 semanas. Proyectos con IA integrada suelen requerir 4-6 semanas.' },
              { q: '¿Necesito tener claro todo antes de empezar?', a: 'No. Te guiamos desde la idea. Nuestro proceso incluye una fase de auditoría y estrategia donde definimos juntos el alcance.' },
              { q: '¿Ofrecen mantenimiento después del lanzamiento?', a: 'Sí. Todos nuestros proyectos incluyen soporte post-lanzamiento y planes de mantenimiento continuo para mantener tu web actualizada.' },
              { q: '¿Cómo integran la inteligencia artificial?', a: 'Desde chatbots personalizados hasta automatización de procesos y análisis predictivo. Evaluamos tu caso y proponemos la solución óptima.' },
            ].map((item) => (
              <FAQItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </div>

      {/* Lead Magnet — Guía gratuita */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent p-[1px]">
            <div className="relative rounded-[inherit] bg-black/60 p-8 md:p-12">
              <div className="grid md:grid-cols-5 gap-10 items-center">
                <div className="md:col-span-3">
                  <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Recurso gratuito</span>
                  <h3 className="text-2xl md:text-4xl font-bold text-white leading-[1.1] tracking-tight mt-4 mb-4">
                    Guía: El stack tecnológico ideal para tu negocio
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed mb-5">
                    Aprende a elegir las herramientas adecuadas para tu proyecto. Desde frameworks web hasta integraciones de IA, sin tecnicismos innecesarios.
                  </p>
                  <div className="space-y-2.5 mb-6">
                    {[
                      { icon: Globe, text: 'Elegir entre React, Next.js o Astro según tu negocio' },
                      { icon: Bot, text: 'IA sin complicaciones: chatbots y automatización al alcance' },
                      { icon: Zap, text: 'Errores técnicos que cuestan dinero al escalar' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <div className="size-6 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mt-0.5 shrink-0">
                          <item.icon className="size-3 text-zinc-500" />
                        </div>
                        <span className="text-sm text-zinc-400">{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex -space-x-2">
                      {['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'].map((c) => (
                        <div key={c} className={`size-7 rounded-full ${c} border-2 border-black flex items-center justify-center text-[9px] font-bold text-white`}>
                          {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-600">
                      Ya lo han descargado <span className="text-zinc-400 font-medium">+130</span> emprendedores
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <Mail className="size-4 text-zinc-600 shrink-0" />
                        <input type="email" placeholder="tu@email.com" className="bg-transparent text-sm text-white placeholder-zinc-600 w-full outline-none" />
                      </div>
                    </div>
                    <HoverBorderGradient
                      as="button"
                      onClick={() => {
                        const content = `GUÍA: EL STACK TECNOLÓGICO IDEAL PARA TU NEGOCIO\n\nEscrito por Dani Ramirez — Vulnify\n\n---\n\n1. ELEGIR EL FRAMEWORK ADECUADO\n- React: ideal para aplicaciones interactivas y dashboards\n- Next.js: perfecto para SEO y páginas que necesitan rendimiento\n- Astro: óptimo para landing pages y sitios de contenido\n\n2. IA SIN COMPLICACIONES\n- ChatGPT API: chatbots personalizados en días\n- Automatización: reduce tareas repetitivas con IA\n- Análisis predictivo: anticipa tendencias de tus clientes\n\n3. ERRORES QUE CUESTAN DINERO\n- Ignorar el rendimiento mobile\n- Stack sobreingenierizado para proyectos pequeños\n- No planificar escalabilidad desde el inicio\n\n---\n\nDescarga completa disponible en vulnify.es/guia`
                        const blob = new Blob([content], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'guia-stack-tecnologico-vulnify.txt'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap"
                    >
                      <Download className="size-4" />
                      Descargar gratis
                    </HoverBorderGradient>
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                    <div className="size-4 rounded border border-white/[0.08] bg-white/[0.02] flex items-center justify-center group-hover:border-white/20 transition-colors">
                      <div className="size-2 rounded-sm bg-white opacity-0 group-hover:opacity-30 transition-opacity" />
                    </div>
                    <span className="text-xs text-zinc-700 group-hover:text-zinc-600 transition-colors">
                      Quiero recibir consejos semanales (sin spam)
                    </span>
                  </label>
                  <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/[0.04]">
                    <div className="size-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-zinc-400">
                      DR
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-400">Dani Ramirez</div>
                      <div className="text-[11px] text-zinc-700">CTO & Fundador de Vulnify</div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex md:col-span-2 items-center justify-center">
                  <div className="relative w-full max-w-[240px] aspect-[3/4] mx-auto">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-800/60 via-zinc-900/40 to-black border border-white/[0.06] overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-zinc-600 via-zinc-500 to-zinc-600" />
                      <div className="p-6 pt-8">
                        <div className="w-10 h-1 rounded-full bg-zinc-700 mb-6" />
                        <div className="space-y-2 mb-6">
                          <div className="h-2 rounded bg-white/[0.04]" />
                          <div className="h-2 rounded bg-white/[0.04] w-3/4" />
                          <div className="h-2 rounded bg-white/[0.04] w-1/2" />
                        </div>
                        <div className="space-y-2 mb-6">
                          <div className="h-2 rounded bg-white/[0.03]" />
                          <div className="h-2 rounded bg-white/[0.03] w-5/6" />
                          <div className="h-2 rounded bg-white/[0.03] w-2/3" />
                          <div className="h-2 rounded bg-white/[0.03] w-3/4" />
                        </div>
                        <div className="flex gap-2 mb-6">
                          <div className="h-6 w-16 rounded bg-white/[0.04]" />
                          <div className="h-6 w-12 rounded bg-white/[0.04]" />
                        </div>
                        <div className="absolute bottom-4 left-6 right-6">
                          <div className="h-px bg-white/[0.04] mb-3" />
                          <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-zinc-700" />
                            <div className="h-2 w-20 rounded bg-white/[0.04]" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-3 text-[9px] text-zinc-700 font-mono tracking-wider">VULNIFY</div>
                    </div>
                    <div className="absolute -inset-1 rounded-[inherit] bg-gradient-to-br from-zinc-600/10 via-transparent to-zinc-400/5 blur-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact section */}
      <div id="contacto" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center mb-14">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Contacto</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-4">
              Cuéntanos tu proyecto.
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
              Sin compromiso. Te respondemos en menos de 24 horas con una propuesta personalizada.
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
            <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
            <form className="space-y-5" action="https://formspree.io/f/xpznqjqr" method="POST">
              <div>
                <label className="text-xs text-zinc-600 mb-2 block">Nombre completo *</label>
                <input type="text" name="name" placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-600 mb-2 block">Email *</label>
                  <input type="email" name="email" placeholder="tu@email.com" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 transition-colors" required />
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-2 block">Teléfono</label>
                  <input type="tel" name="phone" placeholder="+34 600 000 000" className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-600 mb-2 block">Mensaje *</label>
                <textarea rows={4} name="message" placeholder="Cuéntanos en qué podemos ayudarte..." className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors resize-none" required />
              </div>
              <HoverBorderGradient as="button" type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium">
                Enviar mensaje <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <p className="text-xs text-zinc-700 text-center">Te respondemos en menos de 24h.</p>
            </form>
          </div>
        </div>
      </div>

      {/* Closing CTA */}
      <div className="w-full">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Empieza hoy</span>
            <h2 className="text-3xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-6">
              ¿Listo para dominar <br className="hidden md:block" />el espacio digital?
            </h2>
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed mb-10 max-w-xl mx-auto">
              Solicita una auditoría gratuita de tu presencia digital y descubre cómo podemos ayudarte a crecer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <HoverBorderGradient as="a" href="mailto:hola@vulnify.es" className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                Solicitar auditoría gratis <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <a href="https://wa.me/34600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 text-base font-medium text-zinc-400 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/20 transition-all"
              >
                <MessageCircle className="size-4" />
                Escribir por WhatsApp
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-700">
              <span className="size-1.5 rounded-full bg-amber-400/60 animate-pulse" />
              Solo 3 proyectos este mes — auditoría gratuita
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
