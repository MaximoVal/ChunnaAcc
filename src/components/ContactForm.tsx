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
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            <div className="contact-card">
              <div className="text-center mb-4">
                <h2 id="contact-heading" className="display-6 mb-2">Contacto</h2>
                <p className="text-muted-custom" style={{ color: 'var(--color-texto)' }}>
                  ¿Tienes alguna duda o quieres realizar un pedido especial? Envíanos tu mensaje.
                </p>
              </div>

              {status && (
                <Alert 
                  variant={status.type === 'success' ? 'success' : 'danger'} 
                  dismissible 
                  onClose={() => setStatus(null)}
                  className="text-center"
                  role="alert"
                >
                  {status.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} className="position-relative">
                {loading && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center rounded"
                    style={{ backgroundColor: 'rgba(117, 34, 15, 0.7)', zIndex: 10 }}
                    aria-live="polite"
                  >
                    <div className="text-center text-white">
                      <Spinner animation="border" variant="light" className="mb-2" />
                      <div>Enviando tu mensaje a Chunna...</div>
                    </div>
                  </div>
                )}

                <Form.Group className="mb-3" controlId="formNombre">
                  <Form.Label className="fw-semibold">Nombre *</Form.Label>
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

                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label className="fw-semibold">Email *</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="Tu correo electrónico" 
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                    className="form-control-custom"
                    disabled={loading}
                    autoComplete="email"
                    aria-required="true"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formMensaje">
                  <Form.Label className="fw-semibold">Mensaje *</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    placeholder="Escribe tu consulta aquí..." 
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    className="form-control-custom"
                    style={{ resize: 'vertical' }}
                    disabled={loading}
                    aria-required="true"
                    required
                  />
                </Form.Group>

                <div className="text-center">
                  <Button 
                    type="submit" 
                    className="btn-custom-primary px-5 py-2 fs-5"
                    disabled={loading}
                  >
                    Enviar Mensaje
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ContactForm;
