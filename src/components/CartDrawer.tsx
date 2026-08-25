import React, { useState } from 'react';
import { Offcanvas, Button, Badge, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    openCart,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    lastAddedItem,
    dismissNotification,
    checkoutInstagram,
    createDatabaseOrder
  } = useCart();

  const { isAuthenticated, setAuthModalOpen, setAuthModalMode } = useAuth();

  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [conEnvio, setConEnvio] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbSuccessMsg, setDbSuccessMsg] = useState<string | null>(null);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);
  const [showInstagramModal, setShowInstagramModal] = useState(false);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const handleInstagramCheckout = async () => {
    setLoadingDb(true);
    setDbSuccessMsg(null);
    setDbErrorMsg(null);

    try {
      const result = await checkoutInstagram(orderNotes, conEnvio);
      if (result.success) {
        setDbSuccessMsg(result.message);
        setOrderNotes('');
        setShowInstagramModal(true); // Abrir el modal explicativo
      } else {
        setDbErrorMsg(result.message);
      }
    } catch (err: any) {
      setDbErrorMsg('Error al procesar el pedido para Instagram.');
    } finally {
      setLoadingDb(false);
    }
  };

  const handleDatabaseCheckout = async () => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    setLoadingDb(true);
    setDbSuccessMsg(null);
    setDbErrorMsg(null);

    const result = await createDatabaseOrder(paymentMethod, orderNotes, conEnvio);
    setLoadingDb(false);

    if (result.success) {
      setDbSuccessMsg(result.message);
      setOrderNotes('');
      setTimeout(() => {
        setDbSuccessMsg(null);
        closeCart();
      }, 4000);
    } else {
      setDbErrorMsg(result.message);
    }
  };

  return (
    <>
      <Offcanvas
        show={isCartOpen}
        onHide={closeCart}
        placement="end"
        className="custom-cart-offcanvas"
      >
        <Offcanvas.Header closeButton className="cart-header border-bottom">
          <Offcanvas.Title className="d-flex align-items-center gap-2">
            <span className="cart-icon-title d-inline-flex align-items-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </span>
            <span className="fw-bold fs-5">Tu Carrito de Compras</span>
            <Badge bg="danger" pill className="ms-1 px-2 py-1 cart-count-badge">
              {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
            </Badge>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column justify-content-between p-0">
          {/* Contenido Principal */}
          {cart.length === 0 && !dbSuccessMsg ? (
            <div className="text-center my-auto p-4 empty-cart-container">
              <div className="empty-cart-icon mb-3 d-flex justify-content-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
              <h5 className="fw-bold mb-2">Tu carrito está vacío</h5>
              <p className="text-muted small mb-4">
                Explora nuestras colecciones de pulseras artesanales y añade tus piezas favoritas.
              </p>
              <Button
                variant="outline-danger"
                className="btn-custom-outline px-4 py-2"
                onClick={closeCart}
              >
                Ver Catálogo
              </Button>
            </div>
          ) : (
            <div className="cart-items-scroll flex-grow-1 p-3">
              {dbSuccessMsg ? (
                <div className="text-center py-5">
                  <div className="text-success mb-3" style={{ fontSize: '3.5rem' }}>
                    ✅
                  </div>
                  <h5 className="fw-bold mb-3">¡Pedido Registrado!</h5>
                  <Alert variant="success" className="py-3 px-3 small border-0 mb-4 shadow-sm text-start">
                    {dbSuccessMsg}
                  </Alert>
                  <Button
                    variant="outline-danger"
                    className="btn-custom-outline px-4 py-2"
                    onClick={closeCart}
                  >
                    Volver al Catálogo
                  </Button>
                </div>
              ) : (
                <>
                  {dbErrorMsg && (
                    <Alert variant="danger" className="py-2 px-3 small border-0 mb-3 d-flex align-items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      <span>{dbErrorMsg}</span>
                    </Alert>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <span className="small text-muted fw-semibold">Productos seleccionados</span>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-danger p-0 text-decoration-none small"
                      onClick={clearCart}
                    >
                      Vaciar carrito
                    </button>
                  </div>

                  {/* Lista de productos */}
                  <div className="cart-items-list d-flex flex-column gap-3">
                    {cart.map((item) => (
                      <div key={item.id} className="cart-item-card d-flex align-items-center gap-3 p-2 rounded">
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="cart-item-img rounded"
                        />

                        <div className="flex-grow-1 min-w-0">
                          <h6 className="cart-item-name text-truncate mb-1">{item.nombre}</h6>
                          <div className="cart-item-price fw-bold small text-muted">
                            {formatPrice(item.precio)}
                          </div>

                          {/* Selector de Cantidad */}
                          <div className="d-flex align-items-center gap-2 mt-2">
                            <div className="cart-qty-control d-flex align-items-center">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                title="Disminuir cantidad"
                              >
                                -
                              </button>
                              <span className="qty-number">{item.quantity}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                title="Aumentar cantidad"
                              >
                                +
                              </button>
                            </div>
                            <span className="cart-item-subtotal small ms-auto fw-bold">
                              {formatPrice(item.precio * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Botón de Eliminar */}
                        <button
                          type="button"
                          className="btn-remove-item text-muted"
                          onClick={() => removeFromCart(item.id)}
                          title="Eliminar producto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Opciones de envío y pago */}
                  <div className="mt-4 pt-3 border-top">
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="envio-checkbox"
                        label="Quiero envío a domicilio"
                        checked={conEnvio}
                        onChange={(e) => setConEnvio(e.target.checked)}
                        className="small fw-semibold text-muted"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-muted mb-1 d-flex align-items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Observaciones o medidas especiales (opcional):</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Ej: Medida de muñeca 17cm, envoltorio para regalo..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="form-control-custom small"
                      />
                    </Form.Group>

                    {isAuthenticated && (
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-semibold text-muted mb-1">
                          Método de pago preferido:
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="form-control-custom"
                        >
                          <option value="transferencia">💳 Transferencia Bancaria</option>
                          <option value="mercadopago">📱 Mercado Pago (Dinero en cuenta / Tarjetas)</option>
                        </Form.Select>
                      </Form.Group>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer del Carrito con Totales y Botones de Compra */}
          {cart.length > 0 && (
            <div className="cart-footer p-3 border-top bg-light">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Subtotal estimado:</span>
                <span className="fw-semibold">{formatPrice(totalPrice)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold fs-5">Total a pagar:</span>
                <span className="fw-bold fs-4 cart-total-highlight">{formatPrice(totalPrice)}</span>
              </div>

              <div className="d-flex flex-column gap-2">
                {/* Botón Principal: Instagram Directo */}
                <Button
                  className="btn-checkout-instagram w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={handleInstagramCheckout}
                  disabled={loadingDb}
                >
                  {loadingDb ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      <span>Procesando pedido...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>Pedir por Instagram</span>
                    </>
                  )}
                </Button>

                {/* Opción Secundaria: Guardar Pedido en Sistema */}
                {isAuthenticated ? (
                  <Button
                    variant="outline-secondary"
                    className="btn-checkout-db w-100 py-2 d-flex align-items-center justify-content-center gap-2 small"
                    onClick={handleDatabaseCheckout}
                    disabled={loadingDb}
                  >
                    {loadingDb ? (
                      <>
                        <Spinner size="sm" animation="border" />
                        <span>Guardando pedido...</span>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        <span>Guardar pedido en mi cuenta</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-center text-muted small mb-0 mt-1 d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.78rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-titulo)' }}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1 3a6 6 0 0 0 2 2.5V18a3 3 0 0 0 6 0v-4.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>
                    <span>Inicia sesión para guardar tu pedido y hacerle seguimiento.</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Mini Notificación Toast en Esquina Inferior Derecha (No bloqueante) */}
      {lastAddedItem && (
        <div className="cart-toast-card shadow-lg d-flex align-items-center gap-3 p-2 rounded-3 animate-fade-in-up">
          <img
            src={lastAddedItem.product.imagen}
            alt={lastAddedItem.product.nombre}
            className="cart-toast-img rounded"
          />
          <div className="cart-toast-info flex-grow-1 min-w-0">
            <div className="d-flex align-items-center gap-1 text-success fw-bold small">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>¡Añadido al carrito!</span>
            </div>
            <div className="cart-toast-title text-truncate fw-semibold">
              {lastAddedItem.product.nombre}
            </div>
            <div className="cart-toast-price small text-muted">
              {formatPrice(lastAddedItem.product.precio)}
            </div>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            <button
              type="button"
              className="btn-toast-close"
              onClick={dismissNotification}
              title="Cerrar notificación"
            >
              ✕
            </button>
            
          </div>
        </div>
      )}

      {/* Botón Flotante de Carrito (FAB) */}
      <button
        type="button"
        className={`floating-cart-btn ${totalItems > 0 ? 'has-items' : ''}`}
        onClick={() => (isCartOpen ? closeCart() : openCart())}
        title="Ver Carrito de Compras"
      >
        <span className="floating-cart-icon d-inline-flex align-items-center justify-content-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </span>
        {totalItems > 0 && (
          <span className="floating-cart-badge">{totalItems}</span>
        )}
      </button>

      {/* Modal Instructivo para Redirección de Instagram */}
      <Modal
        show={showInstagramModal}
        onHide={() => {
          setShowInstagramModal(false);
          setDbSuccessMsg(null);
        }}
        centered
        backdrop="static"
        keyboard={false}
        className="instagram-redirect-modal"
      >
        <Modal.Header className="border-bottom-0 pb-0" closeButton>
          <Modal.Title className="fw-bold text-center w-100 fs-4 pt-2">
            ✨ ¡Pedido Listo!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center px-4 py-3">
          <div className="mb-3" style={{ fontSize: '3rem' }}>
            📋
          </div>
          <p className="fs-6 text-dark" style={{ lineHeight: '1.6' }}>
            Para continuar con el pedido te vamos a redirigir al chat de Instagram, en el cual debes copiar la información que está en tu portapapeles para realizar el pedido.
          </p>
          <div className="alert alert-secondary text-start small py-2 px-3 border-0 mt-3 mb-0">
            <strong>💡 Ayuda:</strong> En el chat de Instagram, mantén presionado el cuadro de texto, presiona <strong>"Pegar"</strong> y luego <strong>"Enviar"</strong>.
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 pb-4 justify-content-center">
          <Button
            variant="danger"
            className="px-4 py-2 fw-semibold"
            style={{ backgroundColor: 'var(--color-terracota)', borderColor: 'var(--color-terracota)' }}
            onClick={() => {
              setShowInstagramModal(false);
              setDbSuccessMsg(null);
              closeCart();
              window.location.href = 'https://ig.me/m/chunna.accs';
            }}
          >
            Aceptar e Ir a Instagram
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CartDrawer;
