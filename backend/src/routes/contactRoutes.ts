import { Router } from 'express';
import { handleContactForm } from '../controllers/contactController.js';

const router = Router();

// Endpoint público para envío de mensajes de contacto
router.post('/', handleContactForm);

export default router;
