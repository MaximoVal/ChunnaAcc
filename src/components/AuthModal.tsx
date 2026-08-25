import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner, Nav, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register
  } = useAuth();

  // Estados de formularios
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regNotes, setRegNotes] = useState('');

  // Estados de UI y validación
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetFormState = () => {
    setErrorMsg(null);
    setValidationErrors([]);
    setSuccessMsg(null);
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const handleClose = () => {
    resetFormState();
    setAuthModalOpen(false);
  };

  const handleSwitchMode = (mode: 'login' | 'register') => {
    resetFormState();
    setAuthModalMode(mode);
  };

  // Manejo de Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Inicio de sesión exitoso.');
      setTimeout(() => {
        handleClose();
      }, 1000);
    } else {
      setErrorMsg(result.message || 'Credenciales inválidas.');
      if (result.errors && result.errors.length > 0) {
        setValidationErrors(result.errors);
      }
    }
  };

  // Manejo de Registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    // Validaciones del cliente
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('El nombre, correo y contraseña son obligatorios.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);
    const result = await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim() || undefined,
      address: regAddress.trim() || undefined,
      city: regCity.trim() || undefined,
      notes: regNotes.trim() || undefined
    });
    setLoading(false);

    if (result.success) {
      setSuccessMsg(result.message || '¡Cuenta creada con éxito!');
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      setErrorMsg(result.message || 'No se pudo crear la cuenta.');
      if (result.errors && result.errors.length > 0) {
        setValidationErrors(result.errors);
      }
    }
  };

  const isRegister = authModalMode === 'register';

  return (
    <Modal
      show={authModalOpen}
      onHide={handleClose}
      centered
      backdrop="static"
      size={isRegister ? 'xl' : undefined}
      dialogClassName={isRegister ? 'custom-auth-modal-dialog-xl' : 'custom-auth-modal-dialog'}
      className="custom-auth-modal"
    >
      <div className="auth-modal-wrapper">
        <Modal.Header closeButton className="border-0 pb-0 auth-modal-header pt-4 px-4">
          <Modal.Title className="w-100 text-center">
            <div className="mb-2">
              <BrandLogo variant="stacked" starSize={22} textColor="var(--color-terracota)" subColor="var(--color-azul-profundo)" />
            </div>
            <p className="text-muted small mb-0 fw-normal">
              {isRegister
                ? 'Regístrate para comprar y hacer seguimiento de tus pedidos'
                : 'Accede a tu cuenta y gestiona tus pedidos'}
            </p>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-4">
          {/* Navegación por pestañas */}
          <Nav variant="pills" className="auth-nav-tabs mb-4 justify-content-center mx-auto" style={{ maxWidth: '340px' }}>
            <Nav.Item>
              <Nav.Link
                active={!isRegister}
                onClick={() => handleSwitchMode('login')}
                className="auth-tab-link"
              >
                Iniciar Sesión
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={isRegister}
                onClick={() => handleSwitchMode('register')}
                className="auth-tab-link"
              >
                Crear Cuenta
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Mensajes de Alerta / Errores */}
          {errorMsg && (
            <Alert variant="danger" className="py-2 px-3 small border-0 auth-alert mb-3">
              <strong>Error:</strong> {errorMsg}
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="warning" className="py-2 px-3 small border-0 auth-alert mb-3">
              <ul className="mb-0 ps-3">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}

          {successMsg && (
            <Alert variant="success" className="py-2 px-3 small border-0 auth-alert-success mb-3 d-flex align-items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{successMsg}</span>
            </Alert>
          )}

          {/* Formulario de Login */}
          {!isRegister ? (
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
              <Form onSubmit={handleLoginSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="auth-label">Correo Electrónico *</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="form-control-custom"
                    required
                    autoFocus
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="auth-label">Contraseña *</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="form-control-custom"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="btn-custom-primary w-100 py-2 fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    'Ingresar a mi Cuenta'
                  )}
                </Button>

                <div className="text-center mt-3 pt-2">
                  <span className="text-muted small">¿Aún no tienes cuenta? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0 small auth-link-btn"
                    onClick={() => handleSwitchMode('register')}
                  >
                    Regístrate aquí
                  </button>
                </div>
              </Form>
            </div>
          ) : (
            /* Formulario de Registro Espacioso y Organizado */
            <Form onSubmit={handleRegisterSubmit}>
              <Row className="g-4 mb-3">
                {/* Columna Izquierda: Datos de Acceso */}
                <Col md={6}>
                  <div className="auth-section-card p-4 rounded h-100">
                    <h6 className="auth-section-title d-flex align-items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <span>Datos de Acceso</span>
                    </h6>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label">Nombre y Apellido *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: María González"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="form-control-custom"
                        required
                        autoFocus
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label">Correo Electrónico *</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="nombre@ejemplo.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label">Contraseña *</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="auth-label">Confirmar Contraseña *</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Repite la contraseña"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="form-control-custom"
                        required
                      />
                    </Form.Group>
                  </div>
                </Col>

                {/* Columna Derecha: Datos de Envío y Contacto */}
                <Col md={6}>
                  <div className="auth-section-card p-4 rounded h-100">
                    <h6 className="auth-section-title d-flex align-items-center gap-2 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17 12 22.08"></polygon><polygon points="12 12 21 6.92 21 17 12 22.08"></polygon><polygon points="12 1.92 21 6.92 12 12 3 6.92 12 1.92"></polygon></svg>
                      <span>Datos de Envío & Compras</span>
                    </h6>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label">Teléfono / WhatsApp</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Ej: +54 9 11 1234-5678"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="form-control-custom"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label">Ciudad / Localidad</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Córdoba Capital"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="form-control-custom"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label">Dirección de Entrega</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Calle, número, depto, barrio..."
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="form-control-custom"
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="auth-label">Notas / Observaciones</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Tocar timbre 2B, horario preferido..."
                        value={regNotes}
                        onChange={(e) => setRegNotes(e.target.value)}
                        className="form-control-custom"
                      />
                    </Form.Group>
                  </div>
                </Col>
              </Row>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="btn-custom-primary w-100 py-3 fs-6 d-flex align-items-center justify-content-center gap-2 shadow"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      <span>Creando tu cuenta...</span>
                    </>
                  ) : (
                    'Crear mi Cuenta de Comprador/a'
                  )}
                </Button>
              </div>

              <div className="text-center mt-3">
                <span className="text-muted small">¿Ya tienes una cuenta registrada? </span>
                <button
                  type="button"
                  className="btn btn-link p-0 small auth-link-btn"
                  onClick={() => handleSwitchMode('login')}
                >
                  Inicia sesión aquí
                </button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
};

export default AuthModal;
