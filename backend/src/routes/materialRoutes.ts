import { Router } from 'express';
import { getPublicMaterials } from '../controllers/materialController.js';

const router = Router();

router.get('/', getPublicMaterials);

export default router;
