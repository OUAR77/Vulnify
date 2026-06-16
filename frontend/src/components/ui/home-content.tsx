import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Globe, Bot, Code, Cpu, Zap, ChevronRight, Plus, MessageCircle } from 'lucide-react'
import { ArtificialHero } from '@/components/ui/artificial-hero'
import { BorderBeam } from '@/components/ui/border-beam'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { BentoPricing } from '@/components/ui/bento-pricing'
import { MeshGradient } from '@paper-design/shaders-react'
import FlowArt, { FlowSection } from './story-scroll'
import Testimonials from './twitter-testimonial-cards'

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

export function HomeContent() {
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

  return (
    <>
      <FlowArt className="relative z-10">

        {/* SECTION 1: Hero + Stats + CTA */}
        <FlowSection aria-label="Arquitectura Digital" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
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

      </FlowArt>

      {/* ====== Content after FlowArt — standard scrollable sections ====== */}

      {/* Problem → Solution */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">El Problema</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-5 mb-6">
              Tu web no está trabajando para ti. Debería.
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-2xl mx-auto">
              La mayoría de las webs son folletos digitales estáticos. No generan leads, no automatizan procesos, no se adaptan a tus clientes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
              <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
              <span className="text-xs text-zinc-600 font-mono mb-4 block">Señales de alerta</span>
              <div className="space-y-3">
                {['Sin leads en 30 días', 'Procesos manuales que agotan', 'Web que no convierte'].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="size-2 rounded-full bg-red-400/60" />
                    <span className="text-sm text-zinc-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
              <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
              <span className="text-xs text-zinc-600 font-mono mb-4 block">Nuestra solución</span>
              <div className="space-y-3">
                {[
                  { icon: Globe, title: 'Diseño que convierte', desc: 'Interfaces ultrarrápidas optimizadas para conversión y SEO.' },
                  { icon: Bot, title: 'IA integrada', desc: 'Chatbots inteligentes, automatización y análisis predictivo.' },
                  { icon: Zap, title: 'Crecimiento continuo', desc: 'No es un proyecto finito. Iteramos y escalamos tu presencia digital.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02]">
                    <div className="size-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center shrink-0">
                      <item.icon className="size-4 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div id="servicios" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Servicios</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight max-w-2xl mt-5">
              Todo lo que necesitas para dominar el espacio digital.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <div key={s.title} className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500 relative overflow-hidden">
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-zinc-700 group-hover:text-zinc-500 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                  <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-zinc-500/10 transition-colors">
                    <s.icon className="size-4 text-zinc-400 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process */}
      <div id="proceso" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Proceso</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-5">De la idea al impacto.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <span className="text-6xl md:text-7xl font-bold text-white/[0.04] block mb-4 leading-none">{s.num}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
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

      {/* Testimonials */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="mb-16 text-center">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Reseñas</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-5">Lo que dicen nuestros clientes.</h2>
          </div>
          <div className="flex justify-center">
            <Testimonials />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <BentoPricing />
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

      {/* Contact + CTA */}
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
          <div className="text-center mt-20">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Empieza hoy</span>
            <h2 className="text-3xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-6">
              ¿Listo para dominar <br className="hidden md:block" />el espacio digital?
            </h2>
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed mb-8 max-w-xl mx-auto">
              Solicita una auditoría gratuita de tu presencia digital y descubre cómo podemos ayudarte a crecer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
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
