// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { GLSLHills } from '@/components/ui/glsl-hills';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { Calendar, FileText, Code, Cpu, Rocket, Mail, Globe, Bot, ShieldCheck, TrendingUp, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const stats = [
  { value: '50+', label: 'Proyectos entregados', icon: Globe },
  { value: '100%', label: 'Personalizado', icon: Sparkles },
  { value: '24h', label: 'Respuesta inicial', icon: Mail },
  { value: '9/10', label: 'Clientes satisfechos', icon: TrendingUp },
];

const services = [
  { num: '01', icon: Globe, title: 'Desarrollo Web', desc: 'Páginas corporativas, tiendas online y aplicaciones web con React, Next.js y diseño responsive que convierte visitantes en clientes.' },
  { num: '02', icon: Bot, title: 'Integraciones IA', desc: 'Chatbots inteligentes, automatización de procesos y análisis predictivo para optimizar tu negocio.' },
  { num: '03', icon: ShieldCheck, title: 'APIs & Backend', desc: 'Arquitectura escalable, APIs robustas y paneles de administración diseñados para crecer contigo.' },
  { num: '04', icon: TrendingUp, title: 'Consultoría Digital', desc: 'Estrategia tecnológica personalizada: desde la idea hasta la implementación y el crecimiento.' },
];

export const Component = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 2;

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
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  const sections = [
    { icon: Globe, title: 'DESARROLLO WEB', desc: 'Creamos tu web con las tecnologías más modernas para que tu negocio destaque y convierta visitantes en clientes.' },
    { icon: Bot, title: 'INTELIGENCIA ARTIFICIAL', desc: 'Automatiza tu negocio con IA: chatbots, análisis predictivo y procesos inteligentes que te ahorran tiempo y dinero.' },
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

      <div className="side-menu">
        <div className="menu-icon"><span /><span /><span /></div>
        <div className="vertical-text">VULNIFY</div>
      </div>

      <div className="hero-content">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400 mb-8">
          <Sparkles className="size-3 text-blue-400" />
          Transformamos ideas en resultados digitales
        </div>

        <h1 className="hero-title">{splitTitle('VULNIFY')}</h1>

        <p className="text-zinc-300 text-lg md:text-xl max-w-2xl text-center leading-relaxed">
          Creamos tu web con{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">
            tecnología moderna
          </span>
          {' '}y diseño que{' '}
          <span className="text-white font-semibold">convierte</span>.
        </p>
        <p className="text-zinc-500 text-sm mt-3 max-w-lg text-center">
          Desarrollo web, inteligencia artificial y automatización para impulsar tu negocio.
        </p>

        <div className="hero-ctas">
          <a href="#contacto" className="cta-primary">
            Solicitar presupuesto <ArrowRight className="size-4 ml-1" />
          </a>
          <a href="#servicios" className="cta-secondary">Ver servicios</a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl w-full">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                <Icon className="size-4 text-blue-400" />
                <span className="text-lg font-bold text-white">{s.value}</span>
                <span className="text-xs text-zinc-500 text-center">{s.label}</span>
              </div>
            );
          })}
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
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
              <s.icon className="size-7 text-blue-400" />
            </div>
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
                  <div className="flex items-center gap-4 mb-4">
                    <span className="service-card-icon">{s.num}</span>
                    <div className="size-10 rounded-xl bg-zinc-800/80 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                      <Icon className="size-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <h3 className="service-card-title group-hover:text-white transition-colors">{s.title}</h3>
                  <p className="service-card-desc">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contacto" className="cta-section">
        <div className="cta-inner">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400 mb-6">
            <Mail className="size-3 text-blue-400" />
            Empieza hoy
          </div>
          <h2 className="cta-title">
            ¿Listo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">transformar</span> tu negocio?
          </h2>
          <p className="cta-desc">
            Cuéntanos tu proyecto y te enviaremos un presupuesto personalizado en menos de 24h. Sin compromiso.
          </p>
          <div className="flex flex-col items-center gap-3">
            <a href="mailto:hola@vulnify.es" className="cta-button inline-flex items-center gap-2">
              Solicitar presupuesto <ArrowRight className="size-4" />
            </a>
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <CheckCircle className="size-3 text-green-500" />
              Precio personalizado · Sin compromiso · Respuesta en 24h
            </span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">VULNIFY</span>
            <p className="footer-tagline">Desarrollo web & inteligencia artificial</p>
          </div>
          <div className="footer-links">
            <a href="/terminos">Términos</a>
            <a href="/privacidad">Privacidad</a>
            <a href="mailto:hola@vulnify.es">hola@vulnify.es</a>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Vulnify. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
