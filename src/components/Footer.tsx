import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export const Footer: React.FC = () => {
  const { isAuthenticated, isAdmin, setAuthModalOpen, setAuthModalMode, setProfileModalOpen, setAdminDashboardOpen } = useAuth();

  const handleOpenLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleOpenRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleOpenProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileModalOpen(true);
  };

  const handleOpenAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdminDashboardOpen(true);
  };

  return (
    <footer className="custom-footer" id="footer">
      {/* Ondas o borde decorativo superior */}
      <div className="footer-top-accent"></div>

      <Container className="py-5">
        <Row className="gy-4 gx-lg-5">
          {/* Columna 1: Marca & Propósito */}
          <Col lg={4} md={6}>
            <div className="footer-brand-container mb-3">
              <div className="mb-3">
                <BrandLogo variant="footer" textColor="var(--color-terracota)" subColor="var(--color-rosa-pastel)" />
              </div>
              <p className="footer-about-text">
                Diseños únicos hechos a mano con pasión, amor y dedicación. Cada pieza refleja autenticidad y elegancia artesanal para complementar tus momentos especiales.
              </p>
              <div className="footer-badge-pill d-inline-flex align-items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span>Envíos a toda la República Argentina</span>
              </div>
            </div>
          </Col>

          {/* Columna 2: Mapa del Sitio (Navegación) */}
          <Col lg={2} md={6} sm={6} className="col-6">
            <h5 className="footer-heading">
              <span className="footer-heading-line"></span>
              Mapa del Sitio
            </h5>
            <ul className="footer-nav-list list-unstyled">
              <li>
                <a href="#home" className="footer-link">
                  <span className="link-bullet">›</span> Inicio
                </a>
              </li>
              <li>
                <a href="#productos" className="footer-link">
                  <span className="link-bullet">›</span> Catálogo de Productos
                </a>
              </li>
              <li>
                <a href="#contacto" className="footer-link">
                  <span className="link-bullet">›</span> Contacto & Pedidos
                </a>
              </li>
              {!isAuthenticated ? (
                <>
                  <li>
                    <a href="#login" onClick={handleOpenLogin} className="footer-link">
                      <span className="link-bullet">›</span> Iniciar Sesión
                    </a>
                  </li>
                  <li>
                    <a href="#registro" onClick={handleOpenRegister} className="footer-link">
                      <span className="link-bullet">›</span> Crear Cuenta
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a href="#perfil" onClick={handleOpenProfile} className="footer-link">
                      <span className="link-bullet">›</span> Mi Perfil Comprador
                    </a>
                  </li>
                  {isAdmin && (
                    <li>
                      <a href="#admin" onClick={handleOpenAdmin} className="footer-link footer-link-admin d-inline-flex align-items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M3 20h18"></path></svg>
                        <span>Panel Administrador</span>
                      </a>
                    </li>
                  )}
                </>
              )}
            </ul>
          </Col>

          {/* Columna 3: Categorías & Colecciones */}
          <Col lg={3} md={6} sm={6} className="col-6">
            <h5 className="footer-heading">
              <span className="footer-heading-line"></span>
              Colecciones
            </h5>
            <ul className="footer-nav-list list-unstyled">
              <li>
                <a href="#productos" className="footer-link">
                  <span className="link-bullet">›</span> Pulseras Hilo Encerado
                </a>
              </li>
              <li>
                <a href="#productos" className="footer-link">
                  <span className="link-bullet">›</span> Diseños Macramé & Dijes
                </a>
              </li>
              <li>
                <a href="#productos" className="footer-link">
                  <span className="link-bullet">›</span> Cristales & Ojo Turco
                </a>
              </li>
              <li>
                <a href="#productos" className="footer-link">
                  <span className="link-bullet">›</span> Edición Sunset & Boho
                </a>
              </li>
              <li>
                <a href="#contacto" className="footer-link">
                  <span className="link-bullet">›</span> Pedidos Personalizados
                </a>
              </li>
            </ul>
          </Col>

          {/* Columna 4: Redes Sociales & Contacto Directo */}
          <Col lg={3} md={6}>
            <h5 className="footer-heading">
              <span className="footer-heading-line"></span>
              Conecta con Nosotros
            </h5>
            <p className="footer-social-intro mb-3">
              Síguenos en nuestras redes para ver nuevos lanzamientos, sorteos y novedades diarias.
            </p>

            <div className="footer-social-grid mb-3">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/chunna.accs/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn social-btn-instagram"
                title="Síguenos en Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>@chunna.accs</span>
              </a>

              {/* Email */}
              <a
                href="mailto:chunna.accs@gmail.com"
                className="social-btn social-btn-email"
                title="Escríbenos por correo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z"/>
                </svg>
                <span>chunna.accs@gmail.com</span>
              </a>
            </div>

            <div className="footer-payment-methods">
              <span className="small d-block mb-1">Medios de pago disponibles:</span>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="payment-badge d-inline-flex align-items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                  <span>Transferencia</span>
                </span>
                <span className="payment-badge d-inline-flex align-items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  <span>Mercado Pago</span>
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Separador inferior */}
        <hr className="footer-divider my-4" />

        {/* Barra de Derechos y Créditos */}
        <div className="footer-bottom-bar d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-center text-md-start">
          <p className="mb-0 small footer-copyright">
            &copy; {new Date().getFullYear()} <strong className="text-highlight">Chunna Accesorios</strong>. Todos los derechos reservados.
          </p>
          <p className="mb-0 small footer-credits">
            Hecho a mano con <span className="heart-pulse d-inline-flex align-items-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-danger"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg></span> en Argentina
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
