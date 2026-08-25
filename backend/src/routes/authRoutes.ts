import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../middlewares/validateAuth.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas con middleware de integridad de datos
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Rutas protegidas (requieren token JWT válido)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validateProfileUpdate, updateProfile);

export default router;
