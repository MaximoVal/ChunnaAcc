-- ============================================================
-- MIGRACIÓN / REPARACIÓN: Chunna Accesorios
-- 1. Agregar columnas otp_code y otp_expires a users
-- 2. Asegurar tipo de columna INT UNSIGNED
-- 3. Forzar rol 'admin' a la cuenta oficial
-- ============================================================

-- 1. Agregar columnas OTP si no existen
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10) DEFAULT NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS otp_expires DATETIME DEFAULT NULL AFTER otp_code;

-- 2. Asegurar que la cuenta de administrador tenga rol 'admin'
UPDATE users 
SET role = 'admin' 
WHERE LOWER(TRIM(email)) IN ('cunna.accs@gmail.com', 'cunn.accs@gmail.com', 'chunna.accs@gmail.com', 'admin@chunna.com');

-- 3. Verificar el resultado
SELECT id, name, email, role, otp_code, otp_expires FROM users WHERE role = 'admin';
DESCRIBE users;
