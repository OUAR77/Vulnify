// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { GLSLHills } from '@/components/ui/glsl-hills';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { Calendar, FileText, Code, Cpu, Rocket, Mail, Globe, Bot, ShieldCheck, TrendingUp, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Footer_03 from '@/components/ui/ruixen-footer03';

const services = [
  { icon: Globe, title: 'Desarrollo Web', desc: 'Páginas corporativas, tiendas online y aplicaciones web con React, Next.js y diseño responsive.' },
  { icon: Bot, title: 'Integraciones IA', desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para tu negocio.' },
  { icon: ShieldCheck, title: 'APIs & Backend', desc: 'Arquitectura escalable, APIs robustas y paneles de administración diseñados para crecer.' },
  { icon: TrendingUp, title: 'Consultoría Digital', desc: 'Estrategia tecnológica personalizada: desde la idea hasta la implementación.' },
];

const navLinks = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#contacto', label: 'Contacto' },
];

export const Component = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [navSolid, setNavSolid] = useState(0);
  const lastScrollY = useRef(0);
  const totalSections = 2;

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
      setCurrentSection(Math.floor(progress * totalSections));

      const solid = Math.min(scrollY / 200, 1);
      setNavSolid(solid);

      if (scrollY > 100) {
        if (scrollY > lastScrollY.current) {
          setNavVisible(false);
        } else {
          setNavVisible(true);
        }
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const sections = [
    { icon: Globe, title: 'DESARROLLO WEB', desc: 'Creamos tu web con las tecnologías más modernas para que tu negocio destaque y convierta.' },
    { icon: Bot, title: 'INTELIGENCIA ARTIFICIAL', desc: 'Automatiza tu negocio con IA: chatbots, análisis predictivo y procesos inteligentes.' },
  ];

  const splitTitle = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="title-char">{char}</span>
    ));
  };

  return (
    <div className="hero-container">
      <div className="hero-canvas-layer">
        <GLSLHills cameraZ={125} planeSize={256} speed={0.3} />
      </div>

      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 transition-all duration-500"
        style={{
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
          backgroundColor: `rgba(0, 0, 0, ${0.4 + navSolid * 0.4})`,
          backdropFilter: `blur(${12 + navSolid * 16}px)`,
          WebkitBackdropFilter: `blur(${12 + navSolid * 16}px)`,
          paddingTop: `${20 - navSolid * 4}px`,
          paddingBottom: `${20 - navSolid * 4}px`,
          borderBottom: navSolid > 0.1 ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
          boxShadow: navSolid > 0.1 ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <span className="text-base font-bold tracking-[0.35em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">VULNIFY</span>
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300 tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <div className="w-px h-6 bg-white/10 mx-5" />
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <a href="mailto:hola@vulnify.es" className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-5 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-400 hover:text-white hover:scale-105 transition-all duration-200">Solicitar presupuesto</a>
        </div>
        <button onClick={() => setMenuOpen(true)} className="md:hidden text-white/80 hover:text-white p-2 transition-colors" aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
      </nav>

      <div
        className="fixed top-[56px] left-0 right-0 z-40 pointer-events-none transition-opacity duration-700"
        style={{ opacity: navSolid * 0.6 }}
      >
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent w-full shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
            <span className="text-sm font-bold tracking-[0.25em] text-white/90">VULNIFY</span>
            <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white p-2 transition-colors" aria-label="Cerrar menú">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-3xl tracking-tight text-zinc-500 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="mailto:hola@vulnify.es"
              onClick={() => setMenuOpen(false)}
              className="text-base font-medium text-zinc-400 border border-zinc-600 hover:border-zinc-400 hover:text-white px-10 py-3.5 rounded-lg transition-all duration-200"
            >
              Solicitar presupuesto
            </a>
          </div>
        </div>
      )}

      <div className="hero-content" id="inicio">
        <h1 className="hero-title">{splitTitle('VULNIFY')}</h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl text-center leading-relaxed tracking-wide">
          Creamos tu web con tecnología moderna y diseño que convierte.
        </p>
        <p className="text-zinc-600 text-sm mt-3 max-w-lg text-center tracking-wide leading-relaxed">
          Desarrollo web, inteligencia artificial y automatización para impulsar tu negocio.
        </p>
        <div className="hero-ctas">
          <a href="mailto:hola@vulnify.es" className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-8 py-3.5 text-base font-medium text-zinc-400 hover:border-zinc-400 hover:text-white hover:scale-105 transition-all duration-200">Solicitar presupuesto</a>
          <a href="#servicios" className="cta-secondary">Ver servicios</a>
        </div>
      </div>

      <div className="scroll-progress">
        <div className="scroll-text">DESCUBRE</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${scrollProgress * 100}%` }} />
        </div>
        <div className="section-counter">
          {String(currentSection + 1).padStart(2, '0')} / {String(sections.length + 1).padStart(2, '0')}
        </div>
      </div>

      <div className="scroll-sections">
        {sections.map((s, i) => (
          <section key={i} className="content-section">
            <h2 className="section-title">{s.title}</h2>
            <div className="section-subtitle max-w-2xl">
              <p>{s.desc}</p>
            </div>
          </section>
        ))}
      </div>

      <section id="proceso" className="bg-black">
        <RadialOrbitalTimeline
          timelineData={[
            { id: 1, title: "Planificación", date: "Semana 1", content: "Analizamos tu negocio, definimos objetivos y creamos el roadmap del proyecto.", category: "Planning", icon: Calendar, relatedIds: [2], status: "completed", energy: 100 },
            { id: 2, title: "Diseño UI/UX", date: "Semana 2", content: "Diseñamos interfaces modernas, intuitivas y centradas en la conversión.", category: "Design", icon: FileText, relatedIds: [1, 3], status: "completed", energy: 90 },
            { id: 3, title: "Desarrollo Web", date: "Semana 3-6", content: "Construimos tu web con React, Next.js o el stack que mejor se adapte a tu proyecto.", category: "Development", icon: Code, relatedIds: [2, 4], status: "in-progress", energy: 60 },
            { id: 4, title: "Integración IA", date: "Semana 6-7", content: "Incorporamos chatbots, automatización y análisis predictivo con inteligencia artificial.", category: "AI", icon: Cpu, relatedIds: [3, 5], status: "pending", energy: 30 },
            { id: 5, title: "Lanzamiento", date: "Semana 8", content: "Despliegue en producción, testing final y puesta en marcha de tu nueva web.", category: "Launch", icon: Rocket, relatedIds: [4], status: "pending", energy: 10 },
          ]}
        />
      </section>

      <section id="servicios" className="services-section">
        <div className="services-inner">
          <div className="services-header">
            <p className="services-label">Servicios</p>
            <h2 className="services-title">Todo lo que necesitas</h2>
            <p className="services-desc">Soluciones completas de desarrollo web e inteligencia artificial para tu negocio.</p>
          </div>
          <div className="services-grid">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="service-card group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="service-card-icon">{String(i + 1).padStart(2, '0')}</span>
                    <div className="size-9 rounded-lg bg-zinc-800/80 flex items-center justify-center">
                      <Icon className="size-4 text-zinc-400" />
                    </div>
                  </div>
                  <h3 className="service-card-title">{s.title}</h3>
                  <p className="service-card-desc">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contacto" className="cta-section">
        <div className="cta-inner">
          <p className="cta-label">Empieza ahora</p>
          <h2 className="cta-title">Transforma tu negocio<br/>con tecnología que <em>impacta</em></h2>
          <p className="cta-desc">Cuéntanos tu proyecto y te enviaremos un presupuesto personalizado en 24h.</p>
          <div className="flex flex-col items-center gap-3">
            <a href="mailto:hola@vulnify.es" className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-10 py-4 text-base font-medium text-zinc-400 hover:border-zinc-400 hover:text-white hover:scale-105 transition-all duration-200">Solicitar presupuesto</a>
            <span className="text-xs text-zinc-600">Precio personalizado · Sin compromiso</span>
          </div>
        </div>
      </section>

      <Footer_03 />
    </div>
  );
};
