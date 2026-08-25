import { Router } from 'express';
import {
  getAdminStats,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  createAdminProduct,
  analyzeProductImage,
  bulkCreateAdminProducts
} from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Todas las rutas de administración requieren autenticación y rol 'admin'
router.use(authMiddleware, adminMiddleware);

// 1. Estadísticas de ventas, pedidos, clientes y catálogo
router.get('/stats', getAdminStats);

// 2. Gestión de pedidos
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);

// 3. Seguimiento de clientes y compradores
router.get('/users', getAdminUsers);

// 4. Carga de nuevos productos individuales
router.post('/products', createAdminProduct);

// 5. Subida de imágenes de productos
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha proporcionado ninguna imagen.' });
    }
    
    // Generar la URL completa resolviendo el host de la petición
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      url: fileUrl
    });
  });
});

// 6. Análisis de imagen con Inteligencia Artificial (Google Gemini)
router.post('/ai/analyze-image', upload.single('image'), analyzeProductImage);

// 7. Carga masiva de productos analizados
router.post('/ai/bulk-create', bulkCreateAdminProducts);

export default router;


