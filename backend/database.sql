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
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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
-- 3. TABLA: MATERIALES (materials)
-- Categorías de material para los accesorios (Macramé, Mostacillas, Cristales, etc.)
-- ==========================================================
CREATE TABLE IF NOT EXISTS materials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_materials_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Precargar materiales iniciales
INSERT INTO materials (nombre, slug, activo) VALUES
('Macramé', 'macrame', 1),
('Mostacillas', 'mostacillas', 1),
('Cristales', 'cristales', 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);


-- ==========================================================
-- 4. TABLA: PRODUCTOS (products)
-- Catálogo de pulseras y accesorios
-- ==========================================================
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT DEFAULT NULL,
  precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  imagen VARCHAR(255) DEFAULT NULL,
  categoria VARCHAR(100) DEFAULT 'Pulseras',
  material_id INT UNSIGNED DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_categoria (categoria),
  INDEX idx_products_material (material_id),
  INDEX idx_products_activo (activo),
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 4. TABLA: PEDIDOS (orders)
-- Registro de compras realizadas por clientes e invitados
-- ==========================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(50) NOT NULL UNIQUE,
  cart_items JSON NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
  user_id INT UNSIGNED DEFAULT NULL,
  con_envio BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_code (order_code),
  INDEX idx_orders_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- 5. CUENTA DE ADMINISTRADOR POR DEFECTO (cunna.accs@gmail.com / 2620070212)
-- Password hasheado con bcrypt
-- ==========================================================
INSERT INTO users (name, email, password, role, phone, city, notes) VALUES
('Administrador Chunna', 'cunna.accs@gmail.com', '$2b$10$hO6XWqN.0kgl0OyTc8hrmeQv0.j9a/rLf5x6PfwzdGr/BC.O4YzYu', 'admin', '+54 9 11 0000-0000', 'Córdoba', 'Cuenta de administración principal')
ON DUPLICATE KEY UPDATE role='admin', password='$2b$10$hO6XWqN.0kgl0OyTc8hrmeQv0.j9a/rLf5x6PfwzdGr/BC.O4YzYu';


-- ==========================================================
-- 6. PRODUCTOS DE EJEMPLO INICIALES
-- ==========================================================
INSERT INTO products (nombre, descripcion, precio, stock, imagen, categoria, activo) VALUES
('Pulsera Hilo Encerado Rust', 'Diseño clásico en tonos terracota tejido a mano, ideal para combinar a diario.', 1200.00, 25, '/assets/im1.jpeg', 'macrame', 1),
('Pulsera Cristal Boho', 'Delicada combinación de cristales brillosos y mostacillas seleccionadas.', 1500.00, 20, '/assets/im2.jpeg', 'cristales', 1),
('Pulsera Macramé Tierra', 'Estilo rústico con trenzado artesanal firme y detalles de dijes metálicos.', 1800.00, 15, '/assets/im3.jpeg', 'macrame', 1),
('Pulsera Cuentas de la Selva', 'Contiene aros y cuentas de colores vibrantes inspirados en la naturaleza.', 2200.00, 18, '/assets/im4.jpeg', 'mostacillas', 1),
('Pulsera Multi-Hebra Sunset', 'Varias hebras tejidas en colores cálidos del atardecer con broche regulable.', 1900.00, 12, '/assets/im5.jpeg', 'macrame', 1),
('Pulsera Protección Ojo Turco', 'Fina pulsera con ojo turco de vidrio y cuentas celestes protectoras.', 1600.00, 30, '/assets/im6.jpeg', 'mostacillas', 1)
ON DUPLICATE KEY UPDATE precio=VALUES(precio);
