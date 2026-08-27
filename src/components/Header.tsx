import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import BrandLogo from './BrandLogo';

export const Header: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    setAuthModalOpen,
    setAuthModalMode,
    setProfileModalOpen,
    setAdminDashboardOpen,
    logout
  } = useAuth();

  const { totalItems, openCart } = useCart();

  const [showContacts, setShowContacts] = React.useState(false);
  const [showUser, setShowUser] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [isTop, setIsTop] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const contactsTimeoutRef = React.useRef<number | null>(null);
  const userTimeoutRef = React.useRef<number | null>(null);
  const lastScrollYRef = React.useRef(0);

  // Efecto para controlar el comportamiento del scroll (Navbar Inteligente)
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Umbrales configurables
      const SCROLL_TOP_THRESHOLD = 50;  // Umbral para pasar de transparente a coloreado
      const SCROLL_HIDE_THRESHOLD = 400; // Umbral a partir del cual el navbar se puede ocultar al bajar

      // 1. Determinar si estamos en el tope de la pantalla
      setIsTop(currentScrollY < SCROLL_TOP_THRESHOLD);

      // 2. Determinar si ocultamos o mostramos el Navbar
      if (currentScrollY > lastScrollYRef.current && currentScrollY > SCROLL_HIDE_THRESHOLD) {
        // Hacia abajo y superado el umbral -> ocultar
        setVisible(false);
      } else {
        // Hacia arriba -> mostrar
        setVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (contactsTimeoutRef.current) window.clearTimeout(contactsTimeoutRef.current);
      if (userTimeoutRef.current) window.clearTimeout(userTimeoutRef.current);
    };
  }, []);

  const handleContactsMouseEnter = () => {
    if (window.innerWidth >= 992) {
      if (contactsTimeoutRef.current) window.clearTimeout(contactsTimeoutRef.current);
      setShowContacts(true);
    }
  };

  const handleContactsMouseLeave = () => {
    if (window.innerWidth >= 992) {
      contactsTimeoutRef.current = window.setTimeout(() => {
        setShowContacts(false);
      }, 150);
    }
  };

  const handleUserMouseEnter = () => {
    if (window.innerWidth >= 992) {
      if (userTimeoutRef.current) window.clearTimeout(userTimeoutRef.current);
      setShowUser(true);
    }
  };

  const handleUserMouseLeave = () => {
    if (window.innerWidth >= 992) {
      userTimeoutRef.current = window.setTimeout(() => {
        setShowUser(false);
      }, 150);
    }
  };

  const handleContactsToggle = (isOpen: boolean) => {
    if (window.innerWidth < 992) {
      setShowContacts(isOpen);
    }
  };

  const handleUserToggle = (isOpen: boolean) => {
    if (window.innerWidth < 992) {
      setShowUser(isOpen);
    }
  };

  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleOpenProfile = () => {
    setProfileModalOpen(true);
  };

  const handleOpenAdminDashboard = () => {
    setAdminDashboardOpen(true);
  };

  const navbarClasses = [
    'custom-navbar',
    visible ? '' : 'navbar-hidden',
    isTop ? 'navbar-at-top' : 'navbar-scrolled',
    isExpanded ? 'navbar-expanded-mobile' : ''
  ].filter(Boolean).join(' ');

  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      variant="dark"
      className={navbarClasses}
      expanded={isExpanded}
      onToggle={(isOpen) => setIsExpanded(isOpen)}
    >
      <Container>
        <Navbar.Brand href="#home" className="custom-brand d-flex align-items-center">
          <BrandLogo variant="navbar" textColor="#f6f1ea" subColor="var(--color-rosa-pastel)" />
        </Navbar.Brand>

        {/* Botón Carrito visible en móvil al lado del toggle */}
        <div className="d-flex align-items-center gap-2 d-lg-none ms-auto me-2">
          <button
            type="button"
            className="nav-cart-btn position-relative"
            onClick={openCart}
            title="Ver carrito"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="nav-svg-icon"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {totalItems > 0 && (
              <span className="nav-cart-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-lg-center gap-lg-2">
            <Nav.Link href="#productos" className="custom-nav-link">Productos</Nav.Link>
            
            <NavDropdown
              title={
                <span className="d-inline-flex align-items-center">
                  Contactos
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className={`dropdown-arrow-icon ${showContacts ? 'open' : ''}`}
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              }
              id="collasible-nav-dropdown"
              className="custom-nav-link"
              show={showContacts}
              onToggle={handleContactsToggle}
              onMouseEnter={handleContactsMouseEnter}
              onMouseLeave={handleContactsMouseLeave}
            >
              <NavDropdown.Item
                href="https://www.instagram.com/chunna.accs/"
                target="_blank"
                rel="noopener noreferrer"
                className="dropdown-item-custom"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nav-svg-icon me-2"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                Instagram
              </NavDropdown.Item>
              <NavDropdown.Item
                href="https://wa.me/549341000000"
                target="_blank"
                rel="noopener noreferrer"
                className="dropdown-item-custom"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nav-svg-icon me-2"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                WhatsApp
              </NavDropdown.Item>
              <NavDropdown.Item
                href="mailto:chunna.accs@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="dropdown-item-custom"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nav-svg-icon me-2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Correo Electrónico
              </NavDropdown.Item>
            </NavDropdown>
            
            <Nav.Link href="#contacto" className="custom-nav-link">Escríbenos</Nav.Link>

            {/* Botón Carrito en Desktop */}
            <div className="d-none d-lg-block mx-2">
              <button
                type="button"
                className="nav-cart-btn-desktop d-flex align-items-center gap-2 position-relative"
                onClick={openCart}
                title="Ver carrito"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nav-svg-icon"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>Carrito</span>
                {totalItems > 0 && (
                  <Badge bg="danger" pill className="nav-cart-badge-pill">
                    {totalItems}
                  </Badge>
                )}
              </button>
            </div>

            {/* Sección de Autenticación / Perfil de Usuario */}
            <div className="ms-lg-2 my-2 my-lg-0 d-flex align-items-center gap-2">
              {isAuthenticated && user ? (
                <div className="d-flex align-items-center gap-2">
                  {isAdmin && (
                    <Button
                      variant="warning"
                      size="sm"
                      className="nav-admin-quick-btn d-none d-md-inline-flex align-items-center gap-1 shadow-sm"
                      onClick={handleOpenAdminDashboard}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="nav-svg-icon"
                      >
                        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path>
                        <path d="M3 20h18"></path>
                      </svg>
                      <span>Panel Admin</span>
                    </Button>
                  )}

                  <NavDropdown
                    title={
                      <span className="d-inline-flex align-items-center gap-2 text-decoration-none">
                        <span className={`navbar-user-avatar ${isAdmin ? 'admin-avatar' : ''}`}>
                          {isAdmin ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="admin-crown-icon"
                            >
                              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path>
                              <path d="M3 20h18"></path>
                            </svg>
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="d-inline-block text-truncate" style={{ maxWidth: '120px' }}>
                          {user.name.split(' ')[0]}
                        </span>
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          className={`dropdown-arrow-icon ${showUser ? 'open' : ''}`}
                        >
                          <path
                            d="M1 1L5 5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    }
                    id="user-profile-dropdown"
                    className="custom-user-dropdown"
                    align="end"
                    show={showUser}
                    onToggle={handleUserToggle}
                    onMouseEnter={handleUserMouseEnter}
                    onMouseLeave={handleUserMouseLeave}
                  >
                    <div className="px-3 py-2 border-bottom user-dropdown-header">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <span className="fw-bold small text-truncate">{user.name}</span>
                        <Badge bg={isAdmin ? 'danger' : 'success'} style={{ fontSize: '0.65rem' }}>
                          {isAdmin ? 'ADMIN' : 'CLIENTE'}
                        </Badge>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                    </div>

                    {isAdmin && (
                      <NavDropdown.Item
                        onClick={handleOpenAdminDashboard}
                        className="dropdown-item-custom py-2 fw-semibold text-warning-emphasis"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="nav-svg-icon me-2 text-warning"
                        >
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Panel de Administración
                      </NavDropdown.Item>
                    )}

                    <NavDropdown.Item onClick={handleOpenProfile} className="dropdown-item-custom py-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="nav-svg-icon me-2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Mi Perfil & Datos
                    </NavDropdown.Item>

                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logout} className="dropdown-item-custom py-2 text-danger">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="nav-svg-icon me-2 text-danger"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Cerrar Sesión
                    </NavDropdown.Item>
                  </NavDropdown>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="nav-auth-btn nav-auth-btn-outline"
                    onClick={handleOpenLogin}
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    size="sm"
                    className="nav-auth-btn nav-auth-btn-solid"
                    onClick={handleOpenRegister}
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
