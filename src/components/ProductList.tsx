import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button, Modal } from 'react-bootstrap';
import ProductCard, { Product } from './ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL, getImageUrl } from '../config/api';

interface MaterialFilter {
  id: number;
  nombre: string;
  slug: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, nombre: 'Pulsera Hilo Encerado Rust', precio: 1200, imagen: '/assets/im1.jpeg', categoria: 'macrame', descripcion: 'Diseño clásico en tonos terracota tejido a mano, ideal para combinar a diario.', material_nombre: 'Macramé' },
  { id: 2, nombre: 'Pulsera Cristal Boho', precio: 1500, imagen: '/assets/im2.jpeg', categoria: 'cristales', descripcion: 'Delicada combinación de cristales brillosos y mostacillas seleccionadas.', material_nombre: 'Cristales' },
  { id: 3, nombre: 'Pulsera Macramé Tierra', precio: 1800, imagen: '/assets/im3.jpeg', categoria: 'macrame', descripcion: 'Estilo rústico con trenzado artesanal firme y de gran durabilidad con detalles de dijes metálicos.', material_nombre: 'Macramé' },
  { id: 4, nombre: 'Pulsera Cuentas de la Selva', precio: 2200, imagen: '/assets/im4.jpeg', categoria: 'mostacillas', descripcion: 'Contiene aros y cuentas de colores vibrantes inspirados en la naturaleza.', material_nombre: 'Mostacillas' },
  { id: 5, nombre: 'Pulsera Multi-Hebra Sunset', precio: 1900, imagen: '/assets/im5.jpeg', categoria: 'macrame', descripcion: 'Varias hebras tejidas en colores cálidos del atardecer con broche regulable.', material_nombre: 'Macramé' },
  { id: 6, nombre: 'Pulsera Protección Ojo Turco', precio: 1600, imagen: '/assets/im6.jpeg', categoria: 'mostacillas', descripcion: 'Fina pulsera con ojo turco de vidrio y cuentas celestes protectoras.', material_nombre: 'Mostacillas' }
];

export const ProductList: React.FC = () => {
  const { productsRefreshTrigger } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('todos');

  // Lista dinámica de materiales desde la API
  const [materials, setMaterials] = useState<MaterialFilter[]>([]);

  // Estados para Modal de Detalle
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  // Obtener materiales dinámicamente desde la API
  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/materials`);
      if (response.ok) {
        const data = await response.json();
        if (data.materials && Array.isArray(data.materials)) {
          setMaterials(data.materials);
        }
      }
    } catch (err) {
      console.warn('No se pudieron cargar los materiales desde el backend.');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Error al conectar con la base de datos de productos.');
      }
      const data = await response.json();
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        const mappedProducts = data.products.map((p: any) => ({
          ...p,
          imagen: getImageUrl(p.imagen),
          material_nombre: p.material_nombre || p.categoria
        }));
        setProducts(mappedProducts);
        setError(null);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    } catch (err: any) {
      console.warn('Backend de productos no disponible, usando catálogo de respaldo.');
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchProducts();
  }, [productsRefreshTrigger]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleOpenDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  };

  const handleAddFromModal = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, detailQuantity);
      handleCloseDetailModal();
    }
  };

  // Lógica de búsqueda y filtrado combinado
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMaterial = selectedMaterial === 'todos' || 
      (product.material_nombre || '').toLowerCase() === materials.find(m => m.slug === selectedMaterial)?.nombre.toLowerCase();

    return matchesSearch && matchesMaterial;
  });

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  if (loading) {
    return (
      <Container className="text-center my-5 py-5">
        <Spinner animation="border" variant="danger" style={{ color: 'var(--color-principal)', width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Cargando nuestra colección...</p>
      </Container>
    );
  }

  return (
    <Container id="productos" className="my-5 py-4 fade-up-element visible">
      {/* Cabecera de Sección */}
      <div className="text-center mb-5">
        <h2 className="display-6 fw-bold" style={{ color: 'var(--color-azul-profundo)' }}>Nuestra Colección</h2>
        <div 
          className="mx-auto my-3" 
          style={{ width: '60px', height: '3px', backgroundColor: 'var(--color-terracota)', borderRadius: '2px' }}
        ></div>
        <p className="col-md-8 mx-auto" style={{ color: 'var(--color-azul-medio)', fontSize: '1.05rem' }}>
          Piezas artesanales exclusivas, confeccionadas a mano con materiales duraderos y diseños inspiradores.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Row className="mb-4 g-3 align-items-center justify-content-between">
        {/* Filtros de Categoría */}
        <Col md={7} lg={6}>
          <div className="d-flex flex-wrap gap-2">
            {[
              { id: 'todos', label: 'Todos' },
              ...materials.map(m => ({ id: m.slug, label: m.nombre }))
            ].map((cat) => (
              <Button
                key={cat.id}
                variant={selectedMaterial === cat.id ? 'primary' : 'outline-primary'}
                className={selectedMaterial === cat.id ? 'btn-custom-primary' : 'btn-custom-secondary'}
                onClick={() => setSelectedMaterial(cat.id)}
                size="sm"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </Col>

        {/* Buscador */}
        <Col md={5} lg={4}>
          <InputGroup>
            <InputGroup.Text id="search-icon" style={{ backgroundColor: 'transparent', borderRight: 'none', borderColor: 'var(--color-gris)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar pulsera..."
              aria-label="Buscar pulsera"
              aria-describedby="search-icon"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderLeft: 'none', borderColor: 'var(--color-gris)' }}
              className="shadow-none"
            />
          </InputGroup>
        </Col>
      </Row>

      {error && (
        <Alert variant="warning" className="text-center col-md-8 mx-auto mb-4">
          {error}
        </Alert>
      )}

      {/* Resultados */}
      {filteredProducts.length === 0 ? (
        <div className="text-center my-5 py-5 border rounded bg-white shadow-sm">
          <p className="fs-5 text-muted mb-0">No encontramos productos que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredProducts.map((product) => (
            <Col key={product.id}>
              <ProductCard 
                product={product} 
                onAddToCart={handleAddToCart} 
                onViewDetails={handleOpenDetailModal}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Modal de Detalle de Producto */}
      <Modal 
        show={showDetailModal} 
        onHide={handleCloseDetailModal}
        size="lg"
        centered
        className="product-detail-modal"
      >
        {selectedProduct && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold fs-3 text-dark">{selectedProduct.nombre}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-3">
              <Row className="g-4">
                {/* Imagen del Producto */}
                <Col md={6}>
                  <div className="detail-modal-img-container rounded overflow-hidden shadow-sm">
                    <img 
                      src={selectedProduct.imagen} 
                      alt={selectedProduct.nombre} 
                      className="img-fluid w-100" 
                      style={{ maxHeight: '400px', objectFit: 'cover' }}
                    />
                  </div>
                </Col>
                
                {/* Información del Producto */}
                <Col md={6} className="d-flex flex-column justify-content-between">
                  <div>
                    <span 
                      className="badge rounded-pill mb-3 text-uppercase"
                      style={{ 
                        backgroundColor: 'var(--color-texto)', 
                        color: 'var(--color-principal)',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        letterSpacing: '1px'
                      }}
                    >
                      {selectedProduct.material_nombre || selectedProduct.categoria}
                    </span>
                    <h3 className="fs-2 fw-bold mb-3" style={{ color: 'var(--color-principal)' }}>
                      {formatPrice(selectedProduct.precio)}
                    </h3>
                    <p className="text-muted fs-6 mb-4">
                      {selectedProduct.descripcion || 'Accesorio artesanal exclusivo confeccionado a mano con hilos encerados y cuentas de la mejor calidad. Ideal para regalar o regalarte un detalle único.'}
                    </p>
                  </div>

                  {/* Selector de cantidad y agregar */}
                  <div>
                    <div className="d-flex align-items-center mb-3">
                      <span className="me-3 fw-semibold text-dark">Cantidad:</span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                        disabled={detailQuantity <= 1}
                      >
                        -
                      </Button>
                      <span className="mx-3 fw-bold fs-5">{detailQuantity}</span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setDetailQuantity(q => q + 1)}
                      >
                        +
                      </Button>
                    </div>

                    <Button 
                      className="btn-custom-primary w-100 py-2 fs-5 d-flex align-items-center justify-content-center gap-2 shadow"
                      onClick={handleAddFromModal}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                      <span>Agregar al Carrito - {formatPrice(selectedProduct.precio * detailQuantity)}</span>
                    </Button>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default ProductList;
