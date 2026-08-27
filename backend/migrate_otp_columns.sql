-- ============================================================
-- MIGRACIÓN: Agregar columnas otp_code y otp_expires a users
-- Ejecutar SOLO si la tabla users no tiene estas columnas aún.
-- ============================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10) DEFAULT NULL AFTER notes,
  ADD COLUMN IF NOT EXISTS otp_expires DATETIME DEFAULT NULL AFTER otp_code;

-- Verificar el resultado
DESCRIBE users;
