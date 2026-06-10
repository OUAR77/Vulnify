// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
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
  const [isReady, setIsReady] = useState(false);
  const totalSections = 2;

  useEffect(() => {
    setIsReady(true);
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (!isReady) return;

    gsap.set([menuRef.current, titleRef.current, subtitleRef.current, scrollProgressRef.current], {
      visibility: 'visible'
    });

    const tl = gsap.timeline();

    if (menuRef.current) {
      tl.from(menuRef.current, {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
    }

    if (titleRef.current) {
      const titleChars = titleRef.current.querySelectorAll('.title-char');
      tl.from(titleChars, {
        y: 200,
        opacity: 0,
        duration: 1.5,
        stagger: 0.05,
        ease: "power4.out"
      }, "-=0.5");
    }

    if (subtitleRef.current) {
      const subtitleLines = subtitleRef.current.querySelectorAll('.subtitle-line');
      tl.from(subtitleLines, {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out"
      }, "-=0.8");
    }

    if (scrollProgressRef.current) {
      tl.from(scrollProgressRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power2.out"
      }, "-=0.5");
    }

    return () => {
      tl.kill();
    };
  }, [isReady]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      const progress = Math.min(scrollY / maxScroll, 1);

      setScrollProgress(progress);
      const newSection = Math.floor(progress * totalSections);
      setCurrentSection(newSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  const splitTitle = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="title-char">
        {char}
      </span>
    ));
  };

  return (
    <div ref={containerRef} className="hero-container cosmos-style">

      <div ref={menuRef} className="side-menu" style={{ visibility: 'hidden' }}>
        <div className="menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="vertical-text">VULNIFY</div>
      </div>

      <div className="hero-content cosmos-content">
        <h1 ref={titleRef} className="hero-title">
          {splitTitle('CREAMOS TU WEB')}
        </h1>

        <div ref={subtitleRef} className="hero-subtitle cosmos-subtitle">
          <p className="subtitle-line">
            Sitios web modernos con inteligencia artificial,
          </p>
          <p className="subtitle-line">
            automatización y diseño que convierte
          </p>
        </div>
        <div className="hero-ctas" style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#contacto" className="cta-primary">
            Solicitar presupuesto
          </a>
          <a href="#servicios" className="cta-secondary">
            Ver servicios
          </a>
        </div>
      </div>

      <div ref={scrollProgressRef} className="scroll-progress" style={{ visibility: 'hidden' }}>
        <div className="scroll-text">DESCUBRE</div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
        <div className="section-counter">
          {String(currentSection).padStart(2, '0')} / {String(totalSections).padStart(2, '0')}
        </div>
      </div>

      <div className="scroll-sections">
        {[...Array(2)].map((_, i) => {
          const titles = {
            0: 'DESARROLLO WEB',
            1: 'INTELIGENCIA ARTIFICIAL',
            2: 'TRANSFORMA TU NEGOCIO'
          };

          const subtitles = {
            0: {
              line1: 'Creamos experiencias digitales únicas',
              line2: 'con React, Next.js y diseño responsive'
            },
            1: {
              line1: 'Integramos IA en tu negocio',
              line2: 'chatbots, automatización y análisis predictivo'
            },
            2: {
              line1: 'Lleva tu empresa al siguiente nivel',
              line2: 'con tecnología que marca la diferencia'
            }
          };

          return (
            <section key={i} className="content-section">
              <h1 className="hero-title">
                {titles[i + 1] || 'DEFAULT'}
              </h1>

              <div className="hero-subtitle cosmos-subtitle">
                <p className="subtitle-line">
                  {subtitles[i + 1]?.line1}
                </p>
                <p className="subtitle-line">
                  {subtitles[i + 1]?.line2}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Spline Scene Section */}
      <section className="spline-section">
        <div className="spline-inner">
          <div className="spline-header">
            <p className="spline-label">Tecnología 3D</p>
            <h2 className="spline-title">Experiencias digitales inmersivas</h2>
            <p className="spline-desc">
              Integramos gráficos 3D interactivos en tu web para captar la atención y diferenciar tu marca.
            </p>
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

      {/* Services Section */}
      <section id="servicios" className="services-section">
        <div className="services-inner">
          <div className="services-header">
            <p className="services-label">Servicios</p>
            <h2 className="services-title">Todo lo que necesitas</h2>
            <p className="services-desc">
              Soluciones completas para llevar tu negocio al siguiente nivel digital.
            </p>
          </div>
          <div className="services-grid">
            {[
              { icon: "01", title: "Desarrollo Web", desc: "Creamos páginas web corporativas, tiendas online y aplicaciones web con tecnologías modernas." },
              { icon: "02", title: "Integraciones IA", desc: "Conectamos tu negocio con inteligencia artificial: chatbots, automatizaciones y análisis predictivo." },
              { icon: "03", title: "APIs & Backend", desc: "Diseñamos APIs robustas, paneles de administración y sistemas backend escalables." },
              { icon: "04", title: "Consultoría", desc: "Te asesoramos en la estrategia digital de tu empresa, desde la tecnología hasta la implementación." },
            ].map((s) => (
              <div key={s.title} className="service-card">
                <span className="service-card-icon">{s.icon}</span>
                <h3 className="service-card-title">{s.title}</h3>
                <p className="service-card-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contacto" className="cta-section">
        <div className="cta-inner">
          <p className="cta-label">Empieza ahora</p>
          <h2 className="cta-title">Transforma tu negocio<br/>con tecnología que <em>impacta</em></h2>
          <p className="cta-desc">
            Cuéntanos tu proyecto y te enviaremos un presupuesto personalizado en 24h.
          </p>
          <div className="cta-actions">
            <a href="mailto:hola@vulnify.es" className="cta-button">hola@vulnify.es</a>
          </div>
        </div>
      </section>

      {/* Footer */}
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
          <p className="footer-copy">© {new Date().getFullYear()} Vulnify. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
