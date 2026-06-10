// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { GLSLHills } from '@/components/ui/glsl-hills';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { Calendar, FileText, Code, Cpu, Rocket, Mail } from 'lucide-react';


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
    { title: 'DESARROLLO WEB', line1: 'Creamos experiencias digitales únicas', line2: 'con React, Next.js y diseño responsive' },
    { title: 'INTELIGENCIA ARTIFICIAL', line1: 'Integramos IA en tu negocio', line2: 'chatbots, automatización y análisis predictivo' },
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
        <div className="menu-icon">
          <span /><span /><span />
        </div>
        <div className="vertical-text">VULNIFY</div>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          {splitTitle('VULNIFY')}
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl text-center">Creamos tu web con tecnología moderna y diseño que convierte.</p>
        <div className="hero-ctas">
          <a href="#contacto" className="cta-primary">Solicitar presupuesto</a>
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
            <div className="section-subtitle">
              <p>{s.line1}</p>
              <p>{s.line2}</p>
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
            <p className="services-desc">Soluciones completas para tu negocio.</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <span className="service-card-icon">01</span>
              <h3 className="service-card-title">Desarrollo Web</h3>
              <p className="service-card-desc">Páginas web corporativas, tiendas online y aplicaciones web.</p>
            </div>
            <div className="service-card">
              <span className="service-card-icon">02</span>
              <h3 className="service-card-title">Integraciones IA</h3>
              <p className="service-card-desc">Chatbots, automatización y análisis predictivo.</p>
            </div>
            <div className="service-card">
              <span className="service-card-icon">03</span>
              <h3 className="service-card-title">APIs & Backend</h3>
              <p className="service-card-desc">APIs robustas, paneles de administración y sistemas escalables.</p>
            </div>
            <div className="service-card">
              <span className="service-card-icon">04</span>
              <h3 className="service-card-title">Consultoría</h3>
              <p className="service-card-desc">Estrategia digital, desde la tecnología hasta la implementación.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="cta-section">
        <div className="cta-inner">
          <p className="cta-label">Empieza ahora</p>
          <h2 className="cta-title">Transforma tu negocio<br/>con tecnología que <em>impacta</em></h2>
          <p className="cta-desc">Cuéntanos tu proyecto y te enviaremos un presupuesto personalizado en 24h.</p>
          <div className="flex flex-col items-center gap-3">
            <a href="mailto:hola@vulnify.es" className="cta-button">hola@vulnify.es</a>
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <Mail className="size-3" />
              Precio personalizado · Sin compromiso
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
            <a href="/contacto">Contacto</a>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Vulnify. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
