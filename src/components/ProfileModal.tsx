import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

/**
 * Interfaz para los items comprados dentro de un pedido
 */
interface OrderItem {
  id: number;
  product_id: number;
  product_nombre?: string;
  product_imagen?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/**
 * Interfaz para los pedidos del usuario
 */
interface Order {
  id: number;
  total: number;
  estado: 'pendiente' | 'pagado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
  metodo_pago: string;
  notas?: string | null;
  created_at: string;
  items?: OrderItem[];
}

/**
 * Componente modal para la gestión del perfil de usuario y seguimiento de pedidos en tiempo real.
 * Incluye pestañas interactivas y comentarios educativos para fácil mantenimiento.
 */
export const ProfileModal: React.FC = () => {
  const {
    user,
    token,
    profileModalOpen,
    setProfileModalOpen,
    updateProfile,
    logout
  } = useAuth();

  // Estado para la pestaña activa ('datos' | 'pedidos')
  const [activeTab, setActiveTab] = useState<'datos' | 'pedidos'>('datos');

  // --- ESTADOS DEL FORMULARIO DE PERFIL ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- ESTADOS DE PEDIDOS Y SEGUIMIENTO ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Estado para almacenar los detalles de pedidos desplegados (orderId -> list of items)
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);
  const [orderDetailsMap, setOrderDetailsMap] = useState<Record<number, OrderItem[]>>({});
  const [loadingDetailsMap, setLoadingDetailsMap] = useState<Record<number, boolean>>({});

  // Cargar datos actuales del usuario cuando se abre el modal
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setNotes(user.notes || '');
    }
  }, [user, profileModalOpen]);

  // Cargar los pedidos del usuario al abrir el modal o cambiar a la pestaña 'pedidos'
  useEffect(() => {
    if (profileModalOpen && activeTab === 'pedidos' && token) {
      fetchUserOrders();
    }
  }, [profileModalOpen, activeTab, token]);

  /**
   * Función para obtener el historial de pedidos del usuario autenticado
   */
  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    setOrdersError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setOrdersError(data.message || 'No se pudieron cargar los pedidos.');
      }
    } catch (err: any) {
      console.error('Error al cargar pedidos:', err);
      setOrdersError('Error de conexión con el servidor de pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  };

  /**
   * Función para obtener el detalle de productos de un pedido específico (Accordion desplegable)
   */
  const toggleOrderDetails = async (orderId: number) => {
    // Si ya está desplegado, lo ocultamos
    if (expandedOrderIds.includes(orderId)) {
      setExpandedOrderIds(expandedOrderIds.filter(id => id !== orderId));
      return;
    }

    // Desplegamos la tarjeta
    setExpandedOrderIds([...expandedOrderIds, orderId]);

    // Si ya tenemos cargados los items en memoria, no volvemos a consultar la API
    if (orderDetailsMap[orderId]) return;

    setLoadingDetailsMap(prev => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok && data.success && data.order?.items) {
        setOrderDetailsMap(prev => ({
          ...prev,
          [orderId]: data.order.items
        }));
      }
    } catch (err) {
      console.error(`Error al cargar detalles del pedido #${orderId}:`, err);
    } finally {
      setLoadingDetailsMap(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    setValidationErrors([]);
    setSuccessMsg(null);
    setProfileModalOpen(false);
  };

  /**
   * Guardar cambios en el perfil del usuario
   */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setValidationErrors([]);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('El nombre no puede estar vacío.');
      return;
    }

    setSavingProfile(true);
    const result = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      notes: notes.trim()
    });
    setSavingProfile(false);

    if (result.success) {
      setSuccessMsg(result.message || '¡Tus datos fueron actualizados correctamente!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(result.message || 'No se pudo actualizar el perfil.');
      if (result.errors && result.errors.length > 0) {
        setValidationErrors(result.errors);
      }
    }
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  /**
   * Mapeo de estados del pedido para el stepper de seguimiento visual
   */
  const getStepperStage = (estado: Order['estado']) => {
    switch (estado) {
      case 'pendiente': return 1;
      case 'pagado': return 2;
      case 'preparando': return 3;
      case 'enviado': return 4;
      case 'entregado': return 5;
      case 'cancelado': return -1;
      default: return 1;
    }
  };

  if (!user) return null;

  return (
    <Modal
      show={profileModalOpen}
      onHide={handleClose}
      centered
      size="lg"
      className="custom-profile-modal"
    >
      <div className="profile-modal-wrapper">
        <Modal.Header closeButton className="border-0 pb-2 profile-modal-header px-4 pt-4">
          <div className="d-flex align-items-center gap-3">
            <div className="user-avatar-circle">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <Modal.Title className="profile-modal-title">Mi Cuenta Chunna</Modal.Title>
              <div className="text-muted small d-flex align-items-center gap-2">
                <span>{user.email}</span>
                <Badge bg="success" className="profile-badge">Cliente Registrado</Badge>
              </div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="px-4 py-3">
          {/* Navegación por Pestañas (Tabs) */}
          <div className="profile-tab-nav">
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'datos' ? 'active' : ''}`}
              onClick={() => setActiveTab('datos')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Mis Datos Personales
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pedidos')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              Mis Pedidos y Seguimiento
            </button>
          </div>

          {/* ========================================================
             PESTAÑA 1: DATOS PERSONALES
             ======================================================== */}
          {activeTab === 'datos' && (
            <div>
              <div className="profile-info-banner mb-3 p-3 rounded">
                <div className="small text-muted d-flex align-items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-principal)' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <span><strong>Información de envío:</strong> Estos datos se completarán automáticamente en tus compras.</span>
                </div>
              </div>

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

              <Form onSubmit={handleSaveProfile}>
                <Form.Group className="mb-3">
                  <Form.Label className="auth-label">Nombre y Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control-custom"
                    required
                  />
                </Form.Group>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <Form.Label className="auth-label">Teléfono / WhatsApp</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Ej: +54 9 11 1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-control-custom"
                    />
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="auth-label">Ciudad / Localidad</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: Córdoba Capital"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-control-custom"
                    />
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="auth-label">Dirección de Entrega</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Calle, número, piso, dpto..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-control-custom"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="auth-label">Notas de Entrega / Preferencias</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Ej: Tocar timbre 2B, entregar por la tarde, coordinar entrega por WhatsApp..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-control-custom"
                  />
                </Form.Group>

                <div className="d-flex gap-2 pt-2 border-top">
                  <Button
                    type="submit"
                    className="btn-custom-primary flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <Spinner size="sm" animation="border" />
                        <span>Guardando datos...</span>
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-danger"
                    className="px-3"
                    onClick={handleLogout}
                    title="Cerrar sesión"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              </Form>
            </div>
          )}

          {/* ========================================================
             PESTAÑA 2: MIS PEDIDOS Y SEGUIMIENTO EN TIEMPO REAL
             ======================================================== */}
          {activeTab === 'pedidos' && (
            <div>
              {loadingOrders ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="danger" />
                  <p className="text-muted small mt-2">Cargando tu historial de pedidos...</p>
                </div>
              ) : ordersError ? (
                <Alert variant="danger" className="py-2 px-3 small border-0 auth-alert">
                  {ordersError}
                </Alert>
              ) : orders.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3 text-muted" style={{ fontSize: '2.5rem' }}>🛍️</div>
                  <h6 className="fw-bold">Aún no has realizado pedidos</h6>
                  <p className="text-muted small">¡Explora el catálogo de Chunna y agrega tus accesorios favoritos al carrito!</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {orders.map((ord) => {
                    const currentStage = getStepperStage(ord.estado);
                    const isExpanded = expandedOrderIds.includes(ord.id);
                    const orderItems = orderDetailsMap[ord.id];
                    const isLoadingItems = loadingDetailsMap[ord.id];

                    // Calcular ancho porcentual de la barra de progreso
                    const progressWidth = currentStage === -1 ? 0 : `${((currentStage - 1) / 4) * 100}%`;

                    return (
                      <div key={ord.id} className="order-history-card">
                        {/* Cabecera del pedido */}
                        <div className="order-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                            <span className="order-id-badge me-2">#PEDIDO-{ord.id}</span>
                            <span className="text-muted small">
                              {new Date(ord.created_at).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-3">
                            <span className="fw-bold text-dark fs-6">
                              ${Number(ord.total).toLocaleString('es-AR')}
                            </span>

                            <span className={`status-badge status-badge-${ord.estado}`}>
                              {ord.estado === 'pendiente' && '⏳ Pendiente'}
                              {ord.estado === 'pagado' && '💳 Pago Confirmado'}
                              {ord.estado === 'preparando' && '📦 En Preparación'}
                              {ord.estado === 'enviado' && '🚚 Enviado'}
                              {ord.estado === 'entregado' && '✅ Entregado'}
                              {ord.estado === 'cancelado' && '❌ Cancelado'}
                            </span>
                          </div>
                        </div>

                        {/* Línea de Tiempo / Stepper de Seguimiento (si no está cancelado) */}
                        {ord.estado !== 'cancelado' ? (
                          <div className="order-stepper-container">
                            <div className="order-stepper">
                              <div
                                className="stepper-progress-bar"
                                style={{ width: progressWidth }}
                              ></div>

                              {/* Etapa 1: Pendiente */}
                              <div className={`stepper-step ${currentStage > 1 ? 'completed' : currentStage === 1 ? 'active' : ''}`}>
                                <div className="stepper-circle">
                                  {currentStage > 1 ? '✓' : '1'}
                                </div>
                                <span className="stepper-label">Registrado</span>
                              </div>

                              {/* Etapa 2: Pagado */}
                              <div className={`stepper-step ${currentStage > 2 ? 'completed' : currentStage === 2 ? 'active' : ''}`}>
                                <div className="stepper-circle">
                                  {currentStage > 2 ? '✓' : '2'}
                                </div>
                                <span className="stepper-label">Pago Ok</span>
                              </div>

                              {/* Etapa 3: Preparando */}
                              <div className={`stepper-step ${currentStage > 3 ? 'completed' : currentStage === 3 ? 'active' : ''}`}>
                                <div className="stepper-circle">
                                  {currentStage > 3 ? '✓' : '3'}
                                </div>
                                <span className="stepper-label">Armando</span>
                              </div>

                              {/* Etapa 4: Enviado */}
                              <div className={`stepper-step ${currentStage > 4 ? 'completed' : currentStage === 4 ? 'active' : ''}`}>
                                <div className="stepper-circle">
                                  {currentStage > 4 ? '✓' : '4'}
                                </div>
                                <span className="stepper-label">En camino</span>
                              </div>

                              {/* Etapa 5: Entregado */}
                              <div className={`stepper-step ${currentStage === 5 ? 'completed active' : ''}`}>
                                <div className="stepper-circle">
                                  {currentStage === 5 ? '✓' : '5'}
                                </div>
                                <span className="stepper-label">Entregado</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 text-center text-muted small bg-light">
                            Este pedido fue cancelado. Si tienes dudas, contáctanos por WhatsApp.
                          </div>
                        )}

                        {/* Botón para desplegar lista de productos */}
                        <div className="px-3 pb-2 d-flex justify-content-between align-items-center">
                          <span className="text-muted small">
                            Método de pago: <strong className="text-capitalize">{ord.metodo_pago}</strong>
                          </span>

                          <button
                            type="button"
                            className="order-details-toggle"
                            onClick={() => toggleOrderDetails(ord.id)}
                          >
                            <span>{isExpanded ? 'Ocultar productos' : 'Ver productos comprados'}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                        </div>

                        {/* Contenido desplegable con los items del pedido */}
                        {isExpanded && (
                          <div className="order-items-list">
                            {isLoadingItems ? (
                              <div className="text-center py-3">
                                <Spinner size="sm" animation="border" variant="danger" />
                                <span className="ms-2 small text-muted">Cargando productos...</span>
                              </div>
                            ) : orderItems && orderItems.length > 0 ? (
                              <div>
                                <div className="fw-bold small text-muted mb-2">Detalle de Productos:</div>
                                {orderItems.map((item) => (
                                  <div key={item.id} className="order-item-row">
                                    <img
                                      src={item.product_imagen || '/assets/im1.jpeg'}
                                      alt={item.product_nombre || 'Producto'}
                                      className="order-item-thumb"
                                    />
                                    <div className="flex-grow-1">
                                      <div className="fw-semibold small text-dark">
                                        {item.product_nombre || `Producto #${item.product_id}`}
                                      </div>
                                      <div className="text-muted small">
                                        {item.cantidad} x ${Number(item.precio_unitario).toLocaleString('es-AR')}
                                      </div>
                                    </div>
                                    <div className="fw-bold small text-dark">
                                      ${Number(item.subtotal).toLocaleString('es-AR')}
                                    </div>
                                  </div>
                                ))}

                                {ord.notas && (
                                  <div className="mt-2 pt-2 border-top text-muted small">
                                    <strong>Notas de entrega:</strong> {ord.notas}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-muted small py-2">No hay información disponible sobre los productos de este pedido.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
};

export default ProfileModal;
