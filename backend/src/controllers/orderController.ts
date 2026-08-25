import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { Order, OrderModel } from '../models/orderModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chunna_secreto_super_seguro_2026';

/**
 * Crear un nuevo pedido (soporta invitados y usuarios registrados)
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Autenticación opcional: obtener userId si el token está presente
    let userId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
      } catch (err) {
        console.warn('Token provisto pero inválido (procesando pedido como invitado).');
      }
    }

    const { items, cart_items, total, total_price, con_envio } = req.body;

    // Aceptar tanto 'items' (frontend viejo) como 'cart_items' (payload del webhook/conversacional)
    const activeItems = items || cart_items;
    if (!activeItems || !Array.isArray(activeItems) || activeItems.length === 0) {
      res.status(400).json({
        success: false,
        message: 'El pedido debe contener al menos un producto en el carrito.'
      });
      return;
    }

    // Aceptar tanto 'total' como 'total_price'
    const activeTotal = total !== undefined ? total : total_price;
    if (activeTotal === undefined || isNaN(Number(activeTotal)) || Number(activeTotal) <= 0) {
      res.status(400).json({
        success: false,
        message: 'El total del pedido no es válido.'
      });
      return;
    }

    // 2. Generar un código de pedido único de formato '#PED-XXXX' usando Sequelize
    let orderCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const codeNum = Math.floor(1000 + Math.random() * 9000); // Número de 4 dígitos
      orderCode = `#PED-${codeNum}`;

      // Comprobar unicidad con Sequelize
      const existing = await Order.findOne({ where: { order_code: orderCode } });
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      res.status(500).json({
        success: false,
        message: 'No se pudo generar un código de pedido único. Intenta nuevamente.'
      });
      return;
    }

    // 3. Insertar el registro de pedido usando Sequelize
    const order = await Order.create({
      order_code: orderCode,
      cart_items: activeItems, // Sequelize maneja la serialización JSON automáticamente
      total_price: Number(activeTotal),
      status: 'PENDING_PAYMENT',
      user_id: userId,
      con_envio: Boolean(con_envio)
    });

    res.status(201).json({
      success: true,
      message: `¡Pedido ${orderCode} registrado con éxito! Envía este código por Instagram DM para recibir las instrucciones de pago.`,
      orderId: order.id,
      orderCode
    });
  } catch (error: any) {
    console.error('Error al crear pedido con Sequelize:', error);
    res.status(500).json({
      success: false,
      message: 'Ocurrió un error en el servidor al registrar tu pedido.'
    });
  }
};

/**
 * Obtener historial de pedidos del usuario autenticado
 */
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autorizado.' });
      return;
    }

    // Delegamos la búsqueda y formateo a nuestro OrderModel de Sequelize
    const orders = await OrderModel.findByUserId(userId);

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error: any) {
    console.error('Error al obtener pedidos del usuario con Sequelize:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar el historial de pedidos.'
    });
  }
};

/**
 * Obtener detalles de un pedido específico
 */
export const getOrderDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = Number(req.params.id);
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    // Delegamos a la consulta optimizada de Sequelize en OrderModel
    const order = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
      return;
    }

    // Solo el dueño del pedido o un administrador pueden consultarlo
    if (!isAdmin && order.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver la información de este pedido.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error: any) {
    console.error('Error al obtener detalle de pedido con Sequelize:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar la información del pedido.'
    });
  }
};
export default createOrder;
