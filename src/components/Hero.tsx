import React from 'react';
import { Container, Button } from 'react-bootstrap';
import BrandLogo from './BrandLogo';

export const Hero: React.FC = () => {
  return (
    <section className="hero-section">
      <Container>
        <div className="py-5 d-flex flex-column align-items-center justify-content-center">
          <div className="hero-brand-badge mb-3">
            <BrandLogo variant="hero" textColor="#ffffff" subColor="var(--color-rosa-pastel)" />
          </div>
          <h1 className="hero-title mt-2">Accesorios Artesanales</h1>
          <p className="hero-subtitle">
            Colección exclusiva de pulseras, cristales y tejidos en macramé hechos 100% a mano. Diseños únicos creados con dedicación para reflejar tu estilo con elegancia y autenticidad.
          </p>
          <div className="mt-4 d-flex gap-3 flex-wrap justify-content-center">
            <Button href="#productos" className="btn-custom-primary btn-lg px-4 py-2 fs-5">
              Ver Catálogo
            </Button>
            <Button href="#contacto" className="btn-custom-secondary btn-lg px-4 py-2 fs-5 text-white" style={{ borderColor: 'rgba(247, 183, 190, 0.6)' }}>
              Contactanos
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;

