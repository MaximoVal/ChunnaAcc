import { Router } from 'express';
import { getProducts } from '../controllers/productController.js';

const router = Router();

// Endpoint público para obtener productos del catálogo
router.get('/', getProducts);

export default router;
