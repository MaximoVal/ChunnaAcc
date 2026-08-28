import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { UserModel } from '../models/userModel.js';
import { ProductModel } from '../models/productModel.js';
import { OrderModel } from '../models/orderModel.js';
import { analyzeProductImageWithAI } from '../services/aiService.js';

/**
 * Obtener estadísticas globales de ventas, clientes, pedidos y productos
 */
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [salesStats, productStats, totalUsers] = await Promise.all([
      OrderModel.getSalesStats(),
      ProductModel.getStats(),
      UserModel.countUsers()
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: salesStats.totalRevenue,
        totalOrders: salesStats.totalOrders,
        completedOrders: salesStats.completedOrders,
        pendingOrders: salesStats.pendingOrders,
        totalUsers,
        totalProducts: productStats.totalProducts,
        totalStock: productStats.totalStock
      }
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar las estadísticas de la tienda.'
    });
  }
};

/**
 * Obtener todos los pedidos para el panel de administración
 */
export const getAdminOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await OrderModel.findAll();
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error: any) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el listado de pedidos.'
    });
  }
};

/**
 * Actualizar el estado de un pedido
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = Number(req.params.id);
    const { estado } = req.body;

    const validStates = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];
    if (!validStates.includes(estado)) {
      res.status(400).json({
        success: false,
        message: 'Estado de pedido no válido.'
      });
      return;
    }

    const updated = await OrderModel.updateStatus(orderId, estado);
    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Pedido no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Estado del pedido #${orderId} actualizado a "${estado}".`
    });
  } catch (error: any) {
    console.error('Error actualizando estado del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del pedido.'
    });
  }
};

/**
 * =====================================================================
 * GESTIÓN DE CLIENTES / USUARIOS (CRUD)
 * =====================================================================
 */

/**
 * Obtener lista de clientes registrados
 */
export const getAdminUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAllClients();
    res.status(200).json({
      success: true,
      users
    });
  } catch (error: any) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de clientes.'
    });
  }
};

/**
 * Actualizar datos de un cliente
 */
export const updateAdminUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.id);
    const { name, email, phone, address, city, notes } = req.body;

    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
      return;
    }

    // No permitir modificar cuenta de administrador a través de este endpoint
    if (existingUser.role === 'admin' && req.user?.id !== userId) {
      res.status(403).json({
        success: false,
        message: 'No puedes modificar la cuenta de un administrador desde esta sección.'
      });
      return;
    }

    const updated = await UserModel.updateUserByAdmin(userId, {
      name,
      email,
      phone,
      address,
      city,
      notes
    });

    if (!updated) {
      res.status(400).json({
        success: false,
        message: 'No se pudieron actualizar los datos del cliente.'
      });
      return;
    }

    const updatedUser = await UserModel.findById(userId);

    res.status(200).json({
      success: true,
      message: 'Datos del cliente actualizados con éxito.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el cliente.'
    });
  }
};

/**
 * Eliminar una cuenta de cliente
 */
export const deleteAdminUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.id);

    const userToDelete = await UserModel.findById(userId);
    if (!userToDelete) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
      return;
    }

    // Seguridad: Impedir borrar cuentas de administrador
    if (userToDelete.role === 'admin' || userToDelete.email === 'cunna.accs@gmail.com') {
      res.status(403).json({
        success: false,
        message: 'Por seguridad, no está permitido eliminar la cuenta del Administrador principal.'
      });
      return;
    }

    const deleted = await UserModel.deleteUser(userId);
    if (!deleted) {
      res.status(400).json({
        success: false,
        message: 'No se pudo eliminar el cliente.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cuenta del cliente eliminada correctamente.'
    });
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la cuenta del cliente.'
    });
  }
};

/**
 * =====================================================================
 * GESTIÓN DE PRODUCTOS (CRUD)
 * =====================================================================
 */

/**
 * Obtener todos los productos (activos e inactivos) para el panel de administración
 */
export const getAdminProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.findAllAdmin();
    res.status(200).json({
      success: true,
      products
    });
  } catch (error: any) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de productos del catálogo.'
    });
  }
};

/**
 * Crear un nuevo producto individual desde el panel de administración
 */
export const createAdminProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, precio, stock, imagen, categoria, material_id, activo } = req.body;

    if (!nombre || !precio || isNaN(Number(precio))) {
      res.status(400).json({
        success: false,
        message: 'El nombre y el precio del producto son obligatorios y deben ser válidos.'
      });
      return;
    }

    const productId = await ProductModel.create({
      nombre: String(nombre).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      precio: Number(precio),
      stock: stock !== undefined && !isNaN(Number(stock)) ? Number(stock) : 10,
      imagen: imagen ? String(imagen).trim() : '/assets/im1.jpeg',
      categoria: categoria ? String(categoria).trim() : 'Pulseras',
      material_id: material_id ? Number(material_id) : null,
      activo: activo !== undefined ? Boolean(activo) : true
    });

    const newProduct = await ProductModel.findById(productId);

    res.status(201).json({
      success: true,
      message: '¡Producto creado y agregado al catálogo con éxito!',
      product: newProduct
    });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar el producto en el catálogo.'
    });
  }
};

/**
 * Actualizar un producto existente
 */
export const updateAdminProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const { nombre, descripcion, precio, stock, imagen, categoria, material_id, activo } = req.body;

    if (precio !== undefined && isNaN(Number(precio))) {
      res.status(400).json({
        success: false,
        message: 'El precio debe ser un número válido.'
      });
      return;
    }

    const updated = await ProductModel.update(productId, {
      nombre,
      descripcion,
      precio: precio !== undefined ? Number(precio) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      imagen,
      categoria,
      material_id: material_id !== undefined ? (material_id ? Number(material_id) : null) : undefined,
      activo
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
      return;
    }

    const product = await ProductModel.findById(productId);

    res.status(200).json({
      success: true,
      message: 'Producto actualizado con éxito.',
      product
    });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto.'
    });
  }
};

/**
 * Eliminar un producto del catálogo
 */
export const deleteAdminProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const deleted = await ProductModel.delete(productId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente del catálogo.'
    });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el producto.'
    });
  }
};

/**
 * =====================================================================
 * CONTROLADORES DE INTELIGENCIA ARTIFICIAL & CARGA MASIVA
 * =====================================================================
 */

/**
 * 1. Analizar imagen con IA para autocompletar campos (nombre, descripción, categoría, precio)
 */
export const analyzeProductImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo de imagen para analizar.'
      });
      return;
    }

    // Ejecutamos el análisis con Google Gemini Multimodal
    const analysis = await analyzeProductImageWithAI(req.file.path, req.file.mimetype);

    // Resolvemos la URL accesible públicamente para el frontend
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Imagen analizada con éxito por la Inteligencia Artificial.',
      analysis,
      imageUrl
    });
  } catch (error: any) {
    console.error('Error al analizar imagen con IA:', error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error al intentar analizar la imagen con Inteligencia Artificial.'
    });
  }
};

/**
 * 2. Carga Masiva: Crear un lote de múltiples productos en la base de datos de una sola vez
 */
export const bulkCreateAdminProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debes enviar una lista de al menos un producto para realizar la carga masiva.'
      });
      return;
    }

    // Filtrar y sanear productos válidos
    const validProducts = products.filter((p) => p.nombre && p.precio !== undefined && !isNaN(Number(p.precio)));

    if (validProducts.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Ninguno de los productos en la lista cuenta con un nombre y precio válidos.'
      });
      return;
    }

    const insertedCount = await ProductModel.createMany(validProducts);

    res.status(201).json({
      success: true,
      message: `¡Se agregaron con éxito ${insertedCount} productos al catálogo de Chunna!`,
      insertedCount
    });
  } catch (error: any) {
    console.error('Error en carga masiva de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el lote de productos en la base de datos.'
    });
  }
};
