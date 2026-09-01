import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { API_BASE_URL } from '../config/api';

export const ContactForm: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [mail, setMail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim() || !mail.trim() || !mensaje.trim()) {
      setStatus({ type: 'danger', message: 'Por favor, completa todos los campos del formulario.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nombre.trim(),
          email: mail.trim(),
          message: mensaje.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Hubo un problema al enviar tu mensaje. Intenta nuevamente.');
      }

      setStatus({ 
        type: 'success', 
        message: data.message || '¡Datos enviados correctamente! Muchas gracias por ponerte en contacto con Chunna.' 
      });
      
      // Limpiamos los campos tras envío exitoso
      setNombre('');
      setMail('');
      setMensaje('');
    } catch (error: any) {
      console.error('Error al enviar formulario de contacto:', error);
      setStatus({ 
        type: 'danger', 
        message: error.message || 'Error de conexión. No pudimos enviar tu mensaje.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="contact-section" aria-labelledby="contact-heading">
      <Container>
        {/* Encabezado de Sección */}
        <div className="text-center mb-5">
          <span 
            className="badge rounded-pill text-uppercase px-3 py-2 mb-2" 
            style={{ 
              backgroundColor: 'var(--color-rosa-soft)', 
              color: 'var(--color-terracota)', 
              border: '1px solid var(--color-rosa-pastel)', 
              letterSpacing: '1px',
              fontSize: '0.75rem'
            }}
          >
            Estamos para ayudarte
          </span>
          <h2 id="contact-heading" className="display-6 fw-bold" style={{ color: 'var(--color-azul-profundo)' }}>
            Contacto & Redes
          </h2>
          <div 
            className="mx-auto my-3" 
            style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-terracota)', borderRadius: '2px' }}
          ></div>
          <p className="col-md-8 mx-auto" style={{ color: 'var(--color-azul-medio)', fontSize: '1.05rem' }}>
            ¿Tienes consultas sobre productos, querés hacer un pedido especial o enviarnos tu mensaje? Escribinos o seguinos en Instagram.
          </p>
        </div>

        <Row className="g-4 align-items-stretch">
          {/* Tarjeta Destacada de Instagram & Datos de Contacto (Columna Izquierda) */}
          <Col lg={5}>
            <div 
              className="contact-info-card h-100 p-4 p-md-5 d-flex flex-column justify-content-between rounded-4 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1b2636 0%, #2e3d52 100%)', color: '#ffffff' }}
            >
              <div>
                {/* Header Instagram */}
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div 
                    className="instagram-gradient-icon-wrapper rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: '56px', height: '56px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="h4 mb-0 text-white fw-bold">Instagram Oficial</h3>
                    <span className="text-white-50 small">@chunna.accs</span>
                  </div>
                </div>

                <p className="text-white-50 mb-4 lh-base" style={{ fontSize: '0.95rem' }}>
                  Sumate a nuestra comunidad en Instagram. Compartimos nuevos ingresos, promociones exclusivas, el proceso artesanal de tejido y novedades diarias de la tienda.
                </p>

                {/* Botón Destacado Instagram */}
                <a
                  href="https://www.instagram.com/chunna.accs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-instagram-custom w-100 py-3 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2 mb-4 shadow"
                  style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', border: 'none' }}
                  aria-label="Visitar el perfil oficial de Chunna Accesorios en Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span>Seguinos en Instagram</span>
                </a>

                {/* Canales Adicionales */}
                <div className="border-top border-secondary pt-4 mt-2">
                  <h4 className="h6 text-uppercase text-white-50 letter-spacing-1 mb-3" style={{ fontSize: '0.75rem' }}>
                    Canales de Atención
                  </h4>
                  
                  <div className="d-flex flex-column gap-3">
                    <a 
                      href="mailto:cunna.accs@gmail.com" 
                      className="d-flex align-items-center gap-3 text-white text-decoration-none p-2 rounded hover-bg-light-trans"
                      aria-label="Enviar correo electrónico a cunna.accs@gmail.com"
                    >
                      <div className="icon-badge p-2 rounded-circle bg-white-10 text-white d-flex align-items-center justify-content-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div className="small text-white-50" style={{ fontSize: '0.75rem' }}>Correo Electrónico</div>
                        <div className="fw-semibold small">cunna.accs@gmail.com</div>
                      </div>
                    </a>

                    <div className="d-flex align-items-center gap-3 text-white p-2 rounded">
                      <div className="icon-badge p-2 rounded-circle bg-white-10 text-white d-flex align-items-center justify-content-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <div className="small text-white-50" style={{ fontSize: '0.75rem' }}>Origen y Envíos</div>
                        <div className="fw-semibold small">Córdoba, Argentina (Envíos a todo el país)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Formulario de Mensajes (Columna Derecha) */}
          <Col lg={7}>
            <div className="contact-card h-100 p-4 p-md-5 rounded-4 shadow-sm">
              <h3 className="h4 fw-bold mb-2" style={{ color: 'var(--color-azul-profundo)' }}>
                Envianos un Mensaje
              </h3>
              <p className="text-muted small mb-4">
                Completá los datos a continuación y responderemos tu mensaje a la brevedad.
              </p>

              {status && (
                <Alert 
                  variant={status.type === 'success' ? 'success' : 'danger'} 
                  dismissible 
                  onClose={() => setStatus(null)}
                  className="mb-4"
                  role="alert"
                >
                  {status.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} className="position-relative">
                {loading && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center rounded-3"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.88)', zIndex: 10, backdropFilter: 'blur(2px)' }}
                    aria-live="polite"
                  >
                    <div className="text-center">
                      <Spinner animation="border" variant="danger" className="mb-2" style={{ color: 'var(--color-terracota)' }} />
                      <div className="fw-semibold small" style={{ color: 'var(--color-azul-profundo)' }}>Enviando tu mensaje a Chunna...</div>
                    </div>
                  </div>
                )}

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formNombre">
                      <Form.Label className="fw-semibold small">Nombre Completo *</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Tu nombre" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="form-control-custom"
                        disabled={loading}
                        autoComplete="name"
                        aria-required="true"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="formEmail">
                      <Form.Label className="fw-semibold small">Correo Electrónico *</Form.Label>
                      <Form.Control 
                        type="email" 
                        placeholder="nombre@ejemplo.com" 
                        value={mail}
                        onChange={(e) => setMail(e.target.value)}
                        className="form-control-custom"
                        disabled={loading}
                        autoComplete="email"
                        aria-required="true"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4" controlId="formMensaje">
                  <Form.Label className="fw-semibold small">Mensaje o Consulta *</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    placeholder="Escribí aquí tu mensaje, duda o consulta de productos..." 
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    className="form-control-custom"
                    style={{ resize: 'vertical' }}
                    disabled={loading}
                    aria-required="true"
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  className="btn-custom-primary w-100 py-3 fs-6 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-pill"
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span>Enviar Mensaje</span>
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ContactForm;
