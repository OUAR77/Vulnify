// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { GLSLHills } from '@/components/ui/glsl-hills';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card } from '@/components/ui/card';


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
        <div className="hero-subtitle">
          <p>Sitios web modernos con inteligencia artificial,</p>
          <p>automatización y diseño que convierte</p>
        </div>
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

      <section className="py-16 md:py-32 bg-black">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-4">Tecnología 3D</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white">Experiencias digitales inmersivas</h2>
            <p className="text-zinc-400 max-w-xl mx-auto mt-4 text-lg">Integramos gráficos 3D interactivos en tu web.</p>
          </div>
          <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-zinc-800">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
            <div className="flex h-full flex-col md:flex-row">
              <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
                <h3 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                  Web + IA
                </h3>
                <p className="mt-4 text-neutral-300 max-w-lg">
                  Creamos tu web con integraciones de inteligencia artificial,
                  diseño 3D interactivo y automatizaciones que transforman tu negocio.
                </p>
                <div className="mt-6">
                  <a href="#contacto" className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black transition hover:bg-neutral-200">
                    Solicitar presupuesto
                  </a>
                </div>
              </div>
              <ErrorBoundary fallback={<div className="flex-1 relative flex items-center justify-center"><p className="text-zinc-500 text-sm">3D no disponible</p></div>}>
                <div className="flex-1 relative min-h-[250px]">
                  <SplineScene
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                </div>
              </ErrorBoundary>
            </div>
          </Card>
        </div>
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
          <a href="mailto:hola@vulnify.es" className="cta-button">hola@vulnify.es</a>
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
