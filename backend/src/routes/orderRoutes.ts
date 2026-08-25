import { Router } from 'express';
import { createOrder, getMyOrders, getOrderDetails } from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Creación de pedido: no requiere token obligatorio para soportar flujos conversacionales e invitados
router.post('/', createOrder);

// Rutas de administración y consulta personal sí requieren token
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getOrderDetails);

export default router;
