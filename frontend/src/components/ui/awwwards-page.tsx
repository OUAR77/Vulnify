// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLSLHills } from '@/components/ui/glsl-hills';
import { Menu, X, ArrowUpRight, Globe, Bot, Code, Cpu, Rocket, Sparkles, Zap, Quote, ChevronRight } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────
const Label = ({ children }: any) => (
  <span className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-600 mb-5 font-mono">{children}</span>
);

const SplitText = ({ text, className = '', delay = 0 }: any) => (
  <span className={`inline-flex flex-wrap ${className}`}>
    {text.split(' ').map((word: string, wi: number) => (
      <span key={wi} className="inline-flex mr-[0.3em]">
        {word.split('').map((char: string, ci: number) => (
          <motion.span
            key={ci}
            initial={{ opacity: 0, y: 40, rotateX: -90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: delay + (wi * 0.08 + ci * 0.03), duration: 0.6, ease: [0.25, 0.1, 0.1, 1] }}
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </span>
    ))}
  </span>
);

const CTAButton = ({ href, children, primary = true }: any) => (
  <motion.a
    href={href}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.97 }}
    className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all duration-300 ${
      primary
        ? 'bg-white text-black hover:bg-zinc-200'
        : 'border border-white/15 text-zinc-400 hover:text-white hover:border-white/40'
    }`}
  >
    {children} {primary && <ArrowUpRight className="size-4" />}
  </motion.a>
);

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
);

// ─── Nav ────────────────────────────────────────────────────────
const Nav = ({ menuOpen, setMenuOpen }: any) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.1, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-500 ${
          scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl' : ''
        }`}
        style={{ borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent' }}
      >
        <span className="text-base font-bold tracking-[0.3em] text-white/90">VULNIFY</span>
        <div className="hidden md:flex items-center gap-8">
          {['Servicios', 'Trabajo', 'Proceso', 'Contacto'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-zinc-500 hover:text-white transition-colors relative group">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/40 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <motion.a
            href="mailto:hola@vulnify.es"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Presupuesto <ArrowUpRight className="size-3.5" />
          </motion.a>
        </div>
        <button onClick={() => setMenuOpen(true)} className="md:hidden text-white/80 p-2" aria-label="Menú">
          <Menu className="size-5" />
        </button>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505]/98 backdrop-blur-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04]">
              <span className="text-base font-bold tracking-[0.3em] text-white/90">VULNIFY</span>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 p-2">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-10">
              {['Servicios', 'Trabajo', 'Proceso', 'Contacto'].map((l, i) => (
                <motion.a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-4xl md:text-5xl tracking-tight text-zinc-500 hover:text-white transition-colors"
                >
                  {l}
                </motion.a>
              ))}
              <motion.a
                href="mailto:hola@vulnify.es"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black text-base font-medium"
              >
                Solicitar presupuesto <ArrowUpRight className="size-4" />
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Hero ────────────────────────────────────────────────────────
const HeroSection = () => (
  <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
    <div className="absolute inset-0 w-full h-full">
      <GLSLHills cameraZ={120} planeSize={256} speed={0.2} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]" />
    </div>

    <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl pt-32 pb-20 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-8"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-[11px] tracking-[0.2em] uppercase text-zinc-500">
          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Desarrollo Web + Inteligencia Artificial
        </span>
      </motion.div>

      <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.85] tracking-[-0.04em] text-white mb-6 max-w-4xl">
        <SplitText text="Arquitectura" delay={0.4} />
        <br />
        <SplitText text="Digital Inteligente" delay={0.9} />
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="text-lg md:text-xl text-zinc-500 max-w-xl leading-relaxed mb-10"
      >
        No construimos páginas. Diseñamos ecosistemas digitales con inteligencia artificial integrada para que tu negocio crezca.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="flex flex-wrap items-center gap-4"
      >
        <CTAButton href="mailto:hola@vulnify.es">Solicitar presupuesto</CTAButton>
        <CTAButton href="#trabajo" primary={false}>Ver proyectos</CTAButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-10 bg-white/10"
        />
      </motion.div>
    </div>
  </div>
);

// ─── Sections ────────────────────────────────────────────────────
// Each section is a plain div with w-full, explicit padding, and a border-b separator

export const Component = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const stats = [
    { number: '40+', label: 'Proyectos entregados' },
    { number: '6+', label: 'Años de experiencia' },
    { number: '98%', label: 'Clientes satisfechos' },
    { number: '24h', label: 'Respuesta inicial' },
  ];

  const services = [
    { icon: Globe, title: 'Desarrollo Web', desc: 'Páginas corporativas, tiendas online y aplicaciones web con React, Next.js y diseño responsive.' },
    { icon: Bot, title: 'Integraciones IA', desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para tu negocio.' },
    { icon: Code, title: 'APIs & Backend', desc: 'Arquitectura escalable, APIs robustas y paneles de administración diseñados para crecer.' },
    { icon: Cpu, title: 'Consultoría Digital', desc: 'Estrategia tecnológica personalizada: desde la idea hasta la implementación.' },
  ];

  const steps = [
    { num: '01', title: 'Auditoría', desc: 'Analizamos tu negocio, competencia y objetivos. Definimos métricas de éxito.' },
    { num: '02', title: 'Estrategia', desc: 'Diseñamos la arquitectura digital: UX, IA, stack tecnológico y roadmap.' },
    { num: '03', title: 'Construcción', desc: 'Desarrollamos con diseño iterativo. Ves el progreso en tiempo real.' },
    { num: '04', title: 'Lanzamiento', desc: 'Despliegue, testing y puesta en marcha. No paramos hasta que funcione.' },
  ];

  const projects = [
    { title: 'E-commerce IA', cat: 'Desarrollo Web + IA', desc: 'Tienda online con recomendaciones inteligentes y chatbot predictivo.' },
    { title: 'Dashboard Financiero', cat: 'Backend + APIs', desc: 'Panel de control con análisis predictivo y automatización de reportes.' },
    { title: 'Landing Corporativa', cat: 'Desarrollo Web', desc: 'Web institucional con diseño editorial y sistema de gestión de contenido.' },
  ];

  const words = ['CREA', 'OPTIMIZA', 'ESCALA', 'DOMINA'];

  const testimonials = [
    { name: 'Carlos Mendoza', role: 'CEO, TechFlow', text: 'Transformaron nuestra web en una máquina de ventas. El chatbot IA nos ahorra 20h semanales.' },
    { name: 'María García', role: 'Directora Marketing, InnovaCorp', text: 'El proceso fue increíblemente fluido. Entregaron antes de tiempo y los resultados superaron expectativas.' },
    { name: 'Javier Ruiz', role: 'Fundador, DataSmart', text: 'Buscábamos algo más que una web bonita. Conseguimos un ecosistema digital completo con IA integrada.' },
  ];

  return (
    <div className="bg-[#050505] text-[#f5f0e8] antialiased selection:bg-cyan-500/30 selection:text-white">
      <Nav menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ─── HERO ─── */}
      <HeroSection />

      {/* ─── STATS ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.1} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{s.number}</div>
                <div className="text-sm text-zinc-600">{s.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PROBLEM ─── */}
      <div id="insight" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <FadeIn>
              <Label>El Problema</Label>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mb-6">
                Tu web no está trabajando<br />para ti. Debería.
              </h2>
              <div className="space-y-4 text-zinc-500 leading-relaxed">
                <p>La mayoría de las webs son folletos digitales estáticos. No generan leads, no automatizan procesos, no se adaptan a tus clientes.</p>
                <p>Mientras tu competencia avanza, tu página sigue siendo un gasto en lugar de una máquina de crecimiento.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="aspect-[4/3] rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center p-8">
                <div className="space-y-4 w-full max-w-sm">
                  {['Sin leads en 30 días', 'Procesos manuales que agotan', 'Web que no convierte'].map((item, i) => (
                    <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <span className="size-2 rounded-full bg-red-400/60" />
                      <span className="text-sm text-zinc-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* ─── SOLUTION ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="text-center mb-16 md:mb-24">
            <Label>La Solución</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight max-w-3xl mx-auto">
              Una web que piensa, aprende y convierte por ti.
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Diseño que convierte', desc: 'Interfaces ultrarrápidas construidas con React, optimizadas para conversión y SEO.' },
              { icon: Bot, title: 'IA integrada', desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para tu negocio.' },
              { icon: Zap, title: 'Crecimiento continuo', desc: 'No es un proyecto finito. Iteramos, mejoramos y escalamos tu presencia digital.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="group p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className="size-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                  <item.icon className="size-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SERVICES ─── */}
      <div id="servicios" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="mb-16">
            <Label>Servicios</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight max-w-2xl">
              Todo lo que necesitas para dominar el espacio digital.
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-zinc-700 group-hover:text-zinc-500 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                  <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                    <s.icon className="size-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PROCESS ─── */}
      <div id="proceso" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="mb-16">
            <Label>Proceso</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">De la idea al impacto.</h2>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <FadeIn key={s.num} delay={i * 0.12} className="relative">
                <span className="text-6xl md:text-7xl font-bold text-white/[0.04] block mb-4 leading-none">{s.num}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-6 text-zinc-700">
                    <ChevronRight className="size-5" />
                  </div>
                )}
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PORTFOLIO ─── */}
      <div id="trabajo" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="mb-16">
            <Label>Proyectos</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">Trabajo que habla.</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500"
              >
                <div className="aspect-[16/10] rounded-xl bg-white/[0.03] mb-6 flex items-center justify-center border border-white/[0.04]">
                  <span className="text-5xl font-bold text-white/[0.06]">{i + 1}</span>
                </div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-cyan-500/70 mb-2 block">{p.cat}</span>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">{p.title}</h3>
                <p className="text-sm text-zinc-500">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── STORYTELLING ─── */}
      <div className="w-full border-b border-white/[0.04] overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="mb-12">
            <Label>Manifiesto</Label>
          </FadeIn>
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
          <FadeIn delay={0.7}>
            <p className="text-lg text-zinc-500 max-w-xl mt-10 leading-relaxed">
              Tu negocio merece una presencia digital que no solo se vea bien, que trabaje mientras tú duermes.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="mb-16 text-center">
            <Label>Testimonios</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">Lo que dicen nuestros clientes.</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <Quote className="size-6 text-cyan-500/30 mb-4" />
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-zinc-600">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20 py-28 md:py-36 text-center">
          <FadeIn>
            <Label>Empieza hoy</Label>
            <h2 className="text-3xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Hablemos de tu<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">próximo proyecto</span>
            </h2>
            <p className="text-lg text-zinc-500 max-w-lg mx-auto mb-10 leading-relaxed">
              Cuéntanos qué necesitas y te enviaremos un presupuesto personalizado en 24 horas. Sin compromiso.
            </p>
            <div className="flex flex-col items-center gap-4">
              <CTAButton href="mailto:hola@vulnify.es">Solicitar presupuesto</CTAButton>
              <span className="text-xs text-zinc-700">Precio personalizado · Sin compromiso</span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="w-full">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div>
              <span className="text-base font-bold tracking-[0.3em] text-white/80">VULNIFY</span>
              <p className="text-sm text-zinc-600 mt-4 max-w-[200px] leading-relaxed">Desarrollo web e inteligencia artificial para impulsar tu negocio.</p>
            </div>
            {[
              { title: 'Servicios', links: ['Desarrollo Web', 'Integraciones IA', 'APIs & Backend', 'Consultoría'] },
              { title: 'Compañía', links: ['Sobre nosotros', 'Blog', 'Casos de éxito', 'Contacto'] },
              { title: 'Legal', links: ['Privacidad', 'Términos', 'Cookies'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-5">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-600 hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-700">&copy; {new Date().getFullYear()} Vulnify. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                <a key={s} href="#" className="text-xs text-zinc-600 hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
