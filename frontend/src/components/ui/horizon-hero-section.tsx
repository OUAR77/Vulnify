import React from 'react';

export const Component = () => {
  return (
    <div style={{ background: '#f2f2f2', minHeight: '100vh', padding: '40px', color: '#212121' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>CREAMOS TU WEB</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>Sitios web modernos con inteligencia artificial</p>
      <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
        <a href="#contacto" style={{ display: 'inline-block', padding: '12px 32px', background: '#6366f1', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>Solicitar presupuesto</a>
        <a href="#servicios" style={{ display: 'inline-block', padding: '12px 32px', border: '1px solid #404040', color: '#a3a3a3', borderRadius: '8px', textDecoration: 'none' }}>Ver servicios</a>
      </div>
      <section id="servicios" style={{ marginTop: '120px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold' }}>Servicios</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginTop: '40px' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #d4d4d4' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Desarrollo Web</h3>
            <p style={{ marginTop: '12px', color: '#737373' }}>Creamos páginas web corporativas, tiendas online y aplicaciones web.</p>
          </div>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #d4d4d4' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Integraciones IA</h3>
            <p style={{ marginTop: '12px', color: '#737373' }}>Conectamos tu negocio con inteligencia artificial.</p>
          </div>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #d4d4d4' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>APIs & Backend</h3>
            <p style={{ marginTop: '12px', color: '#737373' }}>Diseñamos APIs robustas y sistemas backend escalables.</p>
          </div>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #d4d4d4' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Consultoría</h3>
            <p style={{ marginTop: '12px', color: '#737373' }}>Te asesoramos en la estrategia digital de tu empresa.</p>
          </div>
        </div>
      </section>
      <section id="contacto" style={{ marginTop: '120px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold' }}>Transforma tu negocio</h2>
        <p style={{ marginTop: '16px', color: '#737373' }}>Cuéntanos tu proyecto.</p>
        <a href="mailto:hola@vulnify.es" style={{ display: 'inline-block', marginTop: '40px', padding: '12px 32px', background: '#6366f1', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>hola@vulnify.es</a>
      </section>
      <footer style={{ marginTop: '120px', borderTop: '1px solid #d4d4d4', padding: '48px 0', textAlign: 'center' }}>
        <p>&copy; 2026 Vulnify</p>
      </footer>
    </div>
  );
};
