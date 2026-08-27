-- ============================================================
-- MIGRACIÓN / REPARACIÓN: Chunna Accesorios
-- 1. Agregar columnas otp_code y otp_expires a users
-- 2. Asegurar esquema moderno para la tabla orders
-- 3. Asegurar que ÚNICAMENTE cunna.accs@gmail.com sea Administrador
-- ============================================================

-- 1. Agregar columnas OTP a users si no existen
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10) DEFAULT NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS otp_expires DATETIME DEFAULT NULL AFTER otp_code;

-- 2. Asegurar columnas modernas en la tabla orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_code VARCHAR(50) DEFAULT NULL AFTER id,
  ADD COLUMN IF NOT EXISTS cart_items JSON DEFAULT NULL AFTER order_code,
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0.00 AFTER cart_items,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING_PAYMENT' AFTER total_price,
  MODIFY COLUMN user_id INT UNSIGNED DEFAULT NULL;

-- 3. Asegurar que ÚNICAMENTE cunna.accs@gmail.com tenga rol 'admin'
UPDATE users 
SET role = 'cliente' 
WHERE role = 'admin' AND LOWER(TRIM(email)) != 'cunna.accs@gmail.com';

UPDATE users 
SET role = 'admin' 
WHERE LOWER(TRIM(email)) = 'cunna.accs@gmail.com';

-- 4. Verificar el resultado
SELECT id, name, email, role, otp_code, otp_expires FROM users WHERE role = 'admin';
DESCRIBE users;
DESCRIBE orders;
