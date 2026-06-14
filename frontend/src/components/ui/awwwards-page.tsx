// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Globe, Bot, Code, Cpu, Rocket, Sparkles, Zap, Quote, ChevronRight, Plus, MessageCircle, Download, Mail, Phone, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { BorderBeam } from '@/components/ui/border-beam';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { Features } from '@/components/ui/features-8';
import { BentoPricing } from '@/components/ui/bento-pricing';
import { BentoGrid } from '@/components/ui/bento-grid';


const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-500"
      style={{ scaleX: progress }}
    />
  );
};

const FloatingPaths = ({ position = 1, opacity = 0.5 }: { position?: number; opacity?: number }) => {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity }}>
      <svg className="w-full h-full text-white/20" viewBox="0 0 696 316" fill="none" preserveAspectRatio="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.04 + path.id * 0.008}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.6, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted');
    if (!accepted) setVisible(true);
  }, []);
  const accept = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/[0.04] py-4 px-6"
    >
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Usamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestra{' '}
          <a href="#" className="underline hover:text-white transition-colors">política de cookies</a>.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={accept} className="px-5 py-2 text-xs font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors">
            Aceptar
          </button>
          <button onClick={accept} className="px-5 py-2 text-xs font-medium rounded-lg border border-white/[0.06] text-zinc-500 hover:text-white transition-colors">
            Rechazar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

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
);

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

const FAQItem = ({ question, answer }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden relative">
      <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-sm font-medium text-white">{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-600 shrink-0 ml-4"
        >
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
  );
};

// ─── Nav ────────────────────────────────────────────────────────
const Nav = ({ menuOpen, setMenuOpen, isDark, onToggle }: any) => {
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
          <div className="w-px h-5 bg-white/[0.06]" />
          <ThemeToggle isDark={isDark} onToggle={onToggle} />
          <HoverBorderGradient as="a" href="mailto:hola@vulnify.es" className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium">
            Presupuesto <ArrowUpRight className="size-3.5" />
          </HoverBorderGradient>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white/80 p-2" aria-label="Menú">
          <MenuToggleIcon open={menuOpen} className="size-5" duration={500} />
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
                <MenuToggleIcon open={true} className="size-5" duration={500} />
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
              <HoverBorderGradient as="a" href="mailto:hola@vulnify.es" className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                Solicitar presupuesto <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Hero ────────────────────────────────────────────────────────
const HeroSection = () => (
  <BackgroundPaths title="Arquitectura Digital Inteligente" />
);

// ─── Sections ────────────────────────────────────────────────────
// Each section is a plain div with w-full, explicit padding, and a border-b separator

export const Component = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

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

  const words = ['CREA', 'OPTIMIZA', 'ESCALA', 'DOMINA'];

  const testimonials = [
    { name: 'Carlos Mendoza', role: 'CEO, TechFlow', text: 'Transformaron nuestra web en una máquina de ventas. El chatbot IA nos ahorra 20h semanales.' },
    { name: 'María García', role: 'Directora Marketing, InnovaCorp', text: 'El proceso fue increíblemente fluido. Entregaron antes de tiempo y los resultados superaron expectativas.' },
    { name: 'Javier Ruiz', role: 'Fundador, DataSmart', text: 'Buscábamos algo más que una web bonita. Conseguimos un ecosistema digital completo con IA integrada.' },
  ];

  return (
    <div className="relative bg-black text-zinc-300 antialiased selection:bg-zinc-500/30 selection:text-white">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,255,0,0.06),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 z-0">
        <FloatingPaths position={1} opacity={0.4} />
        <FloatingPaths position={-1} opacity={0.4} />
      </div>
      <div className="grain" />

      <div className="relative z-10">
        <ScrollProgress />
        <Nav menuOpen={menuOpen} setMenuOpen={setMenuOpen} isDark={isDark} onToggle={() => setIsDark(!isDark)} />

        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <motion.a
            href="https://wa.me/34600000000"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.4, type: 'spring' }}
            className="size-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-110 hover:bg-emerald-400 transition-all"
            whileHover={{ rotate: -8 }}
            aria-label="WhatsApp"
          >
            <MessageCircle className="size-5" />
          </motion.a>
          <motion.a
            href="mailto:hola@vulnify.es"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2, duration: 0.4, type: 'spring' }}
            className="size-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            whileHover={{ rotate: -12 }}
            aria-label="Contacto"
          >
            <ArrowUpRight className="size-5" />
          </motion.a>
        </div>

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

      {/* ─── CLIENT LOGOS ─── */}
      <div className="w-full border-b border-white/[0.04] overflow-hidden">
        <div className="py-16 md:py-20">
          <FadeIn className="text-center mb-10">
            <span className="text-[11px] tracking-[0.25em] uppercase text-zinc-600 font-mono">Confían en nosotros</span>
          </FadeIn>
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
              <div className="aspect-[4/3] rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center p-8 relative overflow-hidden">
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
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
              <ScaleIn key={item.title} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                className="group p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden"
              >
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                <div className="size-12 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center mb-6 group-hover:bg-zinc-500/20 transition-colors">
                  <item.icon className="size-5 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
              </ScaleIn>
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
              <ScaleIn key={s.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500 relative overflow-hidden"
              >
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-zinc-700 group-hover:text-zinc-500 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                  <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-zinc-500/10 transition-colors">
                    <s.icon className="size-4 text-zinc-400 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </motion.div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TECH STACK ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="text-center mb-16">
            <Label>Tecnología</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">
              Stack moderno, resultados reales.
            </h2>
          </FadeIn>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {['React', 'Next.js', 'TypeScript', 'Tailwind', 'Three.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Cloudflare'].map((tech, i) => (
              <ScaleIn key={tech} delay={i * 0.05}>
              <motion.span
                whileHover={{ y: -4, scale: 1.05 }}
                className="px-5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-zinc-400 font-mono hover:text-white hover:border-white/20 transition-colors block"
              >
                {tech}
              </motion.span>
              </ScaleIn>
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

      {/* ─── BENTO GRID ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="mb-16 text-center">
            <Label>Lo que hacemos</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">
              Tecnología que transforma.
            </h2>
          </FadeIn>
          <BentoGrid />
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
              <ScaleIn key={t.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden"
              >
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                <Quote className="size-6 text-zinc-500/30 mb-4" />
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-zinc-600">{t.role}</div>
                </div>
              </motion.div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </div>

      {/* ─── LEAD MAGNET ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent p-[1px]">
            <div className="relative rounded-[inherit] bg-black/60 p-8 md:p-12">
              <div className="grid md:grid-cols-5 gap-10 items-center">
                <FadeIn className="md:col-span-3">
                  <Label>Recurso gratuito</Label>
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
                        <input
                          type="email"
                          placeholder="tu@email.com"
                          className="bg-transparent text-sm text-white placeholder-zinc-600 w-full outline-none"
                        />
                      </div>
                    </div>
                    <HoverBorderGradient as="button" className="flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap">
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
                      <div className="text-xs font-medium text-zinc-400">Daniel Ramos</div>
                      <div className="text-[11px] text-zinc-700">CTO & Fundador de Vulnify</div>
                    </div>
                  </div>
                </FadeIn>
                <FadeIn delay={0.2} className="hidden md:flex md:col-span-2 items-center justify-center">
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
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <Features />
      </div>

      {/* ─── PRICING V1 ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <BentoPricing />
        </div>
      </div>

      {/* ─── FAQ ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="text-center mb-16">
            <Label>FAQ</Label>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight">
              Respuestas rápidas.
            </h2>
          </FadeIn>
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

      {/* ─── CONTACT FORM ─── */}
      <div id="contacto" className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20">
            <FadeIn>
              <Label>Contacto</Label>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-6">
                Cuéntanos tu proyecto.
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-8">
                Sin compromiso. Te respondemos en menos de 24 horas con una propuesta personalizada.
              </p>
              <div className="hidden md:flex flex-col gap-5">
                {[
                  { icon: Mail, label: 'Email', value: 'hola@vulnify.es' },
                  { icon: MessageCircle, label: 'WhatsApp', value: '+34 600 000 000' },
                  { icon: Phone, label: 'Teléfono', value: '+34 900 000 000' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <item.icon className="size-4 text-zinc-600" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-700">{item.label}</div>
                      <div className="text-sm text-zinc-400">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 relative overflow-hidden">
                <BorderBeam duration={10} lightColor="#FAFAFA" borderWidth={1} />
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="text-xs text-zinc-600 mb-2 block">Nombre completo *</label>
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-600 mb-2 block">Email *</label>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 mb-2 block">Teléfono</label>
                      <input
                        type="tel"
                        placeholder="+34 600 000 000"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 mb-2 block">Mensaje *</label>
                    <textarea
                      rows={4}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-zinc-700 outline-none focus:border-white/20 transition-colors resize-none"
                      required
                    />
                  </div>
                  <HoverBorderGradient as="button" type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium">
                    Enviar mensaje <ArrowUpRight className="size-4" />
                  </HoverBorderGradient>
                  <p className="text-xs text-zinc-700 text-center">Te respondemos en menos de 24h.</p>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* ─── CLOSING CTA ─── */}
      <div className="w-full border-b border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20 py-28 md:py-36">
          <FadeIn className="text-center max-w-3xl mx-auto">
            <Label>Empieza hoy</Label>
            <h2 className="text-3xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mt-4 mb-6">
              ¿Listo para dominar <br className="hidden md:block" />el espacio digital?
            </h2>
            <p className="text-base md:text-lg text-zinc-500 leading-relaxed mb-10 max-w-xl mx-auto">
              Solicita una auditoría gratuita de tu presencia digital y descubre cómo podemos ayudarte a crecer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <HoverBorderGradient as="a" href="mailto:hola@vulnify.es" className="flex items-center gap-2 px-8 py-4 text-base font-medium">
                Solicitar auditoría gratis <ArrowUpRight className="size-4" />
              </HoverBorderGradient>
              <a
                href="https://wa.me/34600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 text-base font-medium text-zinc-400 hover:text-white border border-white/[0.06] rounded-xl hover:border-white/20 transition-all"
              >
                <MessageCircle className="size-4" />
                Escribir por WhatsApp
              </a>
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
            <div className="flex items-center gap-5">
              <a href="https://twitter.com/vulnify" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-white transition-colors">Twitter</a>
              <a href="https://linkedin.com/company/vulnify" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-white transition-colors">LinkedIn</a>
              <a href="https://github.com/vulnify" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-white transition-colors">GitHub</a>
              <span className="text-zinc-700/50">|</span>
              <a href="mailto:hola@vulnify.es" className="text-xs text-zinc-600 hover:text-white transition-colors">hola@vulnify.es</a>
            </div>
          </div>
        </div>
      </footer>
      <CookieBanner />
      </div>
    </div>
  );
};
