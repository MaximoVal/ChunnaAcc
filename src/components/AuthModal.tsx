import React, { useState, useEffect } from 'react';
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
    verifyAdmin,
    resendAdminOtp,
    register
  } = useAuth();

  // Estados de formularios
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [is2FAPending, setIs2FAPending] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regNotes, setRegNotes] = useState('');

  // Estados de UI y validación
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Contador regresivo para reenvío de OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const resetFormState = () => {
    setErrorMsg(null);
    setValidationErrors([]);
    setSuccessMsg(null);
    setLoginPassword('');
    setShowLoginPassword(false);
    setOtpCode('');
    setIs2FAPending(false);
    setResendingOtp(false);
    setResendCooldown(0);
    setRegPassword('');
    setShowRegPassword(false);
    setRegConfirmPassword('');
    setShowRegConfirmPassword(false);
  };

  const handleClose = () => {
    resetFormState();
    setAuthModalOpen(false);
  };

  const handleSwitchMode = (mode: 'login' | 'register') => {
    resetFormState();
    setAuthModalMode(mode);
  };

  const handleCancel2FA = () => {
    setIs2FAPending(false);
    setOtpCode('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Manejo de Reenvío de Código OTP
  const handleResendOtp = async () => {
    if (resendingOtp || resendCooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setResendingOtp(true);

    const result = await resendAdminOtp(loginEmail, loginPassword);
    setResendingOtp(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Código reenviado con éxito. Revisa tu correo.');
      setResendCooldown(30);
    } else {
      setErrorMsg(result.message || 'No se pudo reenviar el código.');
    }
  };

  // Manejo de Login y Verificación 2FA
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setValidationErrors([]);
    setSuccessMsg(null);

    // Paso 2: Verificación de código 2FA
    if (is2FAPending) {
      const cleanOtp = otpCode.replace(/\D/g, '').trim();
      if (!cleanOtp || cleanOtp.length !== 6) {
        setErrorMsg('Por favor ingresa el código de verificación de 6 dígitos.');
        return;
      }
      setLoading(true);
      const result = await verifyAdmin(loginEmail, loginPassword, cleanOtp);
      setLoading(false);

      if (result.success) {
        setSuccessMsg(result.message || 'Verificación exitosa. ¡Bienvenido!');
        setTimeout(() => handleClose(), 1000);
      } else {
        setErrorMsg(result.message || 'Código inválido.');
      }
      return;
    }

    // Paso 1: Ingreso de credenciales
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (result.requires2FA) {
      setSuccessMsg(result.message || 'Se ha generado tu código de seguridad.');
      setIs2FAPending(true);
      setResendCooldown(30); // 30s de enfriamiento para reenvío
    } else if (result.success) {
      setSuccessMsg(result.message || 'Inicio de sesión exitoso.');
      setTimeout(() => handleClose(), 1000);
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
                : is2FAPending
                ? 'Verificación de Seguridad en 2 Pasos'
                : 'Accede a tu cuenta y gestiona tus pedidos'}
            </p>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-4">
          {/* Navegación por pestañas (solo visible si no estamos en paso 2FA) */}
          {!is2FAPending && (
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
          )}

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
                {!is2FAPending ? (
                  <>
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
                      <div className="password-input-wrapper">
                        <Form.Control
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="form-control-custom"
                          required
                        />
                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          tabIndex={-1}
                        >
                          {showLoginPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </Form.Group>
                  </>
                ) : (
                  /* Panel de 2FA con Código OTP */
                  <div className="text-center mb-4">
                    <div className="p-3 bg-light rounded-3 mb-3 border text-start">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-danger text-white">2FA Admin</span>
                        <strong className="small text-dark">{loginEmail}</strong>
                      </div>
                      <p className="text-muted small mb-0">
                        Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
                      </p>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label className="auth-label fw-bold text-dark d-block text-center mb-2">
                        Código de Verificación (6 dígitos)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="form-control-custom text-center fw-bold fs-2 letter-spacing-3 py-2"
                        style={{ letterSpacing: '8px', fontFamily: 'monospace' }}
                        required
                        autoFocus
                        autoComplete="one-time-code"
                      />
                    </Form.Group>

                    {/* Botón para Reenviar Código */}
                    <div className="d-flex justify-content-between align-items-center pt-1 mb-2">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none p-0 small text-muted"
                        onClick={handleCancel2FA}
                        disabled={loading}
                      >
                        ← Volver
                      </button>

                      <button
                        type="button"
                        className="btn btn-link text-decoration-none p-0 small text-primary"
                        onClick={handleResendOtp}
                        disabled={resendingOtp || resendCooldown > 0 || loading}
                      >
                        {resendingOtp ? (
                          <span className="d-flex align-items-center gap-1">
                            <Spinner size="sm" animation="border" />
                            <span>Reenviando...</span>
                          </span>
                        ) : resendCooldown > 0 ? (
                          `Reenviar en ${resendCooldown}s`
                        ) : (
                          '🔄 Reenviar código'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="btn-custom-primary w-100 py-2 fs-6 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      <span>{is2FAPending ? 'Verificando código...' : 'Iniciando sesión...'}</span>
                    </>
                  ) : (
                    is2FAPending ? 'Verificar y Entrar como Administrador' : 'Ingresar a mi Cuenta'
                  )}
                </Button>

                {!is2FAPending && (
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
                )}
              </Form>
            </div>
          ) : (
            /* Formulario de Registro */
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
                      <div className="password-input-wrapper">
                        <Form.Control
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="form-control-custom"
                          required
                        />
                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          tabIndex={-1}
                        >
                          {showRegPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="auth-label">Confirmar Contraseña *</Form.Label>
                      <div className="password-input-wrapper">
                        <Form.Control
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          placeholder="Repite la contraseña"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="form-control-custom"
                          required
                        />
                        <button
                          type="button"
                          className="btn-password-toggle"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          title={showRegConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          tabIndex={-1}
                        >
                          {showRegConfirmPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
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
