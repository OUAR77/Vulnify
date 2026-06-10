// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

export const Component = () => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const scrollProgressRef = useRef(null);
  const menuRef = useRef(null);

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

  const splitTitle = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="title-char">{char}</span>
    ));
  };

  return (
    <div ref={containerRef} className="hero-container">
      <div className="hero-bg" />

      <div ref={menuRef} className="side-menu">
        <div className="menu-icon">
          <span /><span /><span />
        </div>
        <div className="vertical-text">VULNIFY</div>
      </div>

      <div className="hero-content">
        <h1 ref={titleRef} className="hero-title">
          {splitTitle('CREAMOS TU WEB')}
        </h1>
        <div ref={subtitleRef} className="hero-subtitle">
          <p>Sitios web modernos con inteligencia artificial,</p>
          <p>automatización y diseño que convierte</p>
        </div>
        <div className="hero-ctas">
          <a href="#contacto" className="cta-primary">Solicitar presupuesto</a>
          <a href="#servicios" className="cta-secondary">Ver servicios</a>
        </div>
      </div>

      <div ref={scrollProgressRef} className="scroll-progress">
        <div className="scroll-text">DESCUBRE</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${scrollProgress * 100}%` }} />
        </div>
        <div className="section-counter">
          {String(currentSection).padStart(2, '0')} / {String(totalSections).padStart(2, '0')}
        </div>
      </div>

      <div className="scroll-sections">
        {[...Array(2)].map((_, i) => {
          const titles = { 0: 'DESARROLLO WEB', 1: 'INTELIGENCIA ARTIFICIAL' };
          const subtitles = {
            0: { line1: 'Creamos experiencias digitales únicas', line2: 'con React, Next.js y diseño responsive' },
            1: { line1: 'Integramos IA en tu negocio', line2: 'chatbots, automatización y análisis predictivo' }
          };
          return (
            <section key={i} className="content-section">
              <h2 className="section-title">{titles[i + 1]}</h2>
              <div className="section-subtitle">
                <p>{subtitles[i + 1]?.line1}</p>
                <p>{subtitles[i + 1]?.line2}</p>
              </div>
            </section>
          );
        })}
      </div>

      <section className="spline-section">
        <div className="spline-inner">
          <div className="spline-header">
            <p className="spline-label">Tecnología 3D</p>
            <h2 className="spline-title">Experiencias digitales inmersivas</h2>
            <p className="spline-desc">Integramos gráficos 3D interactivos en tu web.</p>
          </div>
          <div className="spline-card-wrapper">
            <div className="spline-card">
              <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
              <div className="spline-card-inner">
                <div className="spline-text-side">
                  <h3 className="spline-heading">Web + IA</h3>
                  <p className="spline-text">
                    Creamos tu web con integraciones de inteligencia artificial,
                    diseño 3D interactivo y automatizaciones que transforman tu negocio.
                  </p>
                  <div className="spline-cta">
                    <a href="#contacto" className="spline-button">Solicitar presupuesto</a>
                  </div>
                </div>
                <div className="spline-scene-side">
                  <SplineScene
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
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
