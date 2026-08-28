import { Router } from 'express';
import {
  getAdminStats,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
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

// 3. Gestión de clientes y usuarios (CRUD)
router.get('/users', getAdminUsers);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

// 4. Gestión de catálogo de productos (CRUD)
router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

// 5. Subida de imágenes de productos (Convertidas a Data URI Base64 para persistencia total en MySQL/Render)
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha proporcionado ninguna imagen.' });
    }
    
    // Convertir el buffer en memoria a Data URI Base64 persistente
    const base64Data = req.file.buffer.toString('base64');
    const fileUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    
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

// 8. Gestión de materiales (CRUD)
import { getAdminMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controllers/materialController.js';
router.get('/materials', getAdminMaterials);
router.post('/materials', createMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);

export default router;
