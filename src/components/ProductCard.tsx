import React from 'react';
import { Card, Button } from 'react-bootstrap';

export interface Product {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  categoria: string;
  descripcion?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  // Formatear precio en ARS
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  return (
    <Card className="product-card h-100 shadow-sm border-0">
      <div 
        className="product-card-img-container position-relative" 
        onClick={() => onViewDetails(product)}
        style={{ cursor: 'pointer' }}
      >
        <Card.Img 
          variant="top" 
          src={product.imagen} 
          className="product-card-img" 
          alt={product.nombre} 
        />
        <div className="product-card-overlay d-flex align-items-center justify-content-center">
          <Button variant="light" size="sm" className="fw-semibold px-3 py-2 shadow-sm rounded-pill d-inline-flex align-items-center gap-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Ver Detalles</span>
          </Button>
        </div>
      </div>
      <Card.Body className="d-flex flex-column justify-content-between p-4">
        <div>
          <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
            <Card.Title className="fs-5 mb-0 fw-bold" style={{ color: 'var(--color-azul-profundo)' }}>{product.nombre}</Card.Title>
            <span 
              className="badge rounded-pill text-uppercase px-2 py-1" 
              style={{ 
                fontSize: '0.68rem', 
                backgroundColor: 'var(--color-rosa-soft)', 
                color: 'var(--color-terracota)',
                border: '1px solid var(--color-rosa-pastel)',
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-body)'
              }}
            >
              {product.categoria}
            </span>
          </div>
          <Card.Text className="text-muted small mb-3">
            {product.descripcion || 'Accesorio artesanal de diseño exclusivo hecho a mano con materiales seleccionados.'}
          </Card.Text>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top gap-2">
          <span className="product-price fs-4 fw-bold">{formatPrice(product.precio)}</span>
          <Button 
            className="btn-custom-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3 py-2" 
            onClick={(e) => {
              e.stopPropagation(); // Evitar que el clic abra el modal de detalle
              onAddToCart(product);
            }}
            title={`Añadir ${product.nombre} al carrito`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span>Agregar</span>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
