-- ==========================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS: CHUNNA ACCESORIOS
-- Motor: MySQL 8.0+ / MariaDB
-- ==========================================================

-- 1. Crear la base de datos si no existe con codificación UTF-8
CREATE DATABASE IF NOT EXISTS chunna_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chunna_db;

-- ==========================================================
-- 2. TABLA: USUARIOS (users)
-- Guarda la información de los clientes / compradores y administradores
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  phone VARCHAR(50) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  otp_code VARCHAR(10) DEFAULT NULL,
  otp_expires DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 3. TABLA: PRODUCTOS (products)
-- Catálogo de pulseras y accesorios
-- ==========================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  imagen VARCHAR(255) DEFAULT NULL,
  categoria VARCHAR(100) DEFAULT 'Pulseras',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_categoria (categoria),
  INDEX idx_products_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 4. TABLA: PEDIDOS (orders)
-- Registro de compras realizadas por los usuarios
-- ==========================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estado ENUM('pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  metodo_pago VARCHAR(50) DEFAULT 'transferencia',
  con_envio BOOLEAN NOT NULL DEFAULT FALSE,
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) 
    REFERENCES users (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 5. TABLA: DETALLES DE PEDIDO (order_items)
-- Productos individuales contenidos en cada pedido
-- ==========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) 
    REFERENCES orders (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) 
    REFERENCES products (id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 6. TABLA: ENVÍOS (shipments)
-- Control y seguimiento de envíos asociados a un pedido
-- ==========================================
CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  numero_seguimiento VARCHAR(100) DEFAULT NULL,
  empresa_envio VARCHAR(100) DEFAULT 'Correo Argentino',
  direccion_envio VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(20) DEFAULT NULL,
  estado_envio ENUM('preparacion', 'despachado', 'en_camino', 'en_distribucion', 'entregado', 'devuelto') NOT NULL DEFAULT 'preparacion',
  fecha_estimada DATE DEFAULT NULL,
  fecha_entrega DATETIME DEFAULT NULL,
  notas_entrega TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) 
    REFERENCES orders (id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  INDEX idx_shipments_estado (estado_envio),
  INDEX idx_shipments_tracking (numero_seguimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 7. CUENTA DE ADMINISTRADOR POR DEFECTO (cunna.accs@gmail.com / 2620070212)
-- Password hasheado con bcrypt
-- ==========================================================
INSERT INTO users (name, email, password, role, phone, city, notes) VALUES
('Administrador Chunna', 'cunna.accs@gmail.com', '$2b$10$hO6XWqN.0kgl0OyTc8hrmeQv0.j9a/rLf5x6PfwzdGr/BC.O4YzYu', 'admin', '+54 9 11 0000-0000', 'Córdoba', 'Cuenta de administración principal')
ON DUPLICATE KEY UPDATE role='admin', password='$2b$10$hO6XWqN.0kgl0OyTc8hrmeQv0.j9a/rLf5x6PfwzdGr/BC.O4YzYu';


-- ==========================================================
-- 8. PRODUCTOS INICIALES DE EJEMPLO
-- ==========================================================
INSERT INTO products (nombre, descripcion, precio, stock, imagen, categoria) VALUES
('Pulsera Hilo Encerado Rust', 'Diseño clásico en tonos terracota tejido a mano, ideal para combinar a diario.', 1200.00, 25, '/assets/im1.jpeg', 'Pulseras'),
('Pulsera Cristal Boho', 'Delicada combinación de cristales brillosos y mostacillas seleccionadas.', 1500.00, 20, '/assets/im2.jpeg', 'Pulseras'),
('Pulsera Macramé Tierra', 'Estilo rústico con trenzado artesanal firme y detalles de dijes metálicos.', 1800.00, 15, '/assets/im3.jpeg', 'Pulseras'),
('Pulsera Cuentas de la Selva', 'Contiene aros y cuentas de colores vibrantes inspirados en la naturaleza.', 2200.00, 18, '/assets/im4.jpeg', 'Pulseras'),
('Pulsera Multi-Hebra Sunset', 'Varias hebras tejidas en colores cálidos del atardecer con broche regulable.', 1900.00, 12, '/assets/im5.jpeg', 'Pulseras'),
('Pulsera Protección Ojo Turco', 'Fina pulsera con ojo turco de vidrio y cuentas celestes protectoras.', 1600.00, 30, '/assets/im6.jpeg', 'Pulseras')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);
