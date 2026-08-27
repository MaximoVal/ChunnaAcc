import { Router } from 'express';
import {
  register,
  login,
  verifyAdminLogin,
  resendAdminOtp,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../middlewares/validateAuth.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/verify-admin', verifyAdminLogin);
router.post('/resend-otp', resendAdminOtp);

// Rutas protegidas (requieren token JWT válido)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validateProfileUpdate, updateProfile);

export default router;
