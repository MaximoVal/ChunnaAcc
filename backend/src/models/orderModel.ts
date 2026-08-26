import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/db.js';
import { User } from './userModel.js';
import { Product } from './productModel.js';

// Atributos de la nueva tabla orders
export interface OrderAttributes {
  id: number;
  order_code: string;
  cart_items: any; // Objeto o array JSON
  total_price: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  user_id?: number | null; // Opcional para asociar a usuarios registrados
  con_envio?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderCreationAttributes
  extends Optional<OrderAttributes, 'id' | 'status' | 'user_id' | 'created_at' | 'updated_at'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public order_code!: string;
  public cart_items!: any;
  public total_price!: number;
  public status!: 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  public user_id!: number | null;
  public con_envio!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    order_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    cart_items: {
      type: DataTypes.JSON,
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      get() {
        const value = this.getDataValue('total_price');
        return value ? Number(value) : 0;
      }
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING_PAYMENT'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    con_envio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Mantener OrderItem por compatibilidad con código existente que pueda importarlo,
// aunque ahora guardamos los ítems en formato JSON en el campo cart_items.
export interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'created_at'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public cantidad!: number;
  public precio_unitario!: number;
  public subtotal!: number;
  public readonly created_at!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

// Establecer Relaciones / Asociaciones de Sequelize
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Métodos de compatibilidad y manipulación del modelo OrderModel
export const OrderModel = {
  /**
   * Obtener todos los pedidos mapeados para el panel de administración
   */
  async findAll(): Promise<any[]> {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return orders.map((o) => {
      const plain = o.get({ plain: true }) as any;
      
      // Adaptación de los nombres de propiedades para mantener retrocompatibilidad con el Admin Dashboard
      return {
        id: plain.id,
        order_code: plain.order_code,
        user_id: plain.user_id,
        total: plain.total_price, // Mapeado de total_price a total
        estado: this.mapStatusToLegacy(plain.status), // Mapeado a estado español
        metodo_pago: 'transferencia',
        notas: `Código: ${plain.order_code}`,
        created_at: plain.created_at,
        updated_at: plain.updated_at,
        user_name: plain.user?.name || 'Cliente Invitado',
        user_email: plain.user?.email || 'N/A',
        user_phone: plain.user?.phone || 'N/A',
        cart_items: plain.cart_items,
        con_envio: plain.con_envio
      };
    });
  },

  /**
   * Actualizar el estado de un pedido
   */
  async updateStatus(orderId: number, estadoLegacy: string): Promise<boolean> {
    const status = this.mapStatusToNew(estadoLegacy);
    const [affectedRows] = await Order.update({ status }, { where: { id: orderId } });
    return affectedRows > 0;
  },

  /**
   * Crear un nuevo pedido con Sequelize (para retrocompatibilidad, aunque ahora se prefiere raw SQL)
   */
  async create(orderData: {
    userId: number | null;
    total: number;
    order_code: string;
    items: any[];
    con_envio?: boolean;
  }): Promise<number> {
    const order = await Order.create({
      order_code: orderData.order_code,
      cart_items: orderData.items,
      total_price: orderData.total,
      status: 'PENDING_PAYMENT',
      user_id: orderData.userId,
      con_envio: orderData.con_envio || false
    });
    return order.id;
  },

  /**
   * Buscar un pedido por ID con items y detalles de usuario
   */
  async findById(orderId: number): Promise<any | null> {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        }
      ]
    });

    if (!order) return null;

    const plain = order.get({ plain: true }) as any;
    return {
      ...plain,
      total: plain.total_price,
      estado: this.mapStatusToLegacy(plain.status),
      user_name: plain.user?.name || 'Cliente Invitado',
      user_email: plain.user?.email || 'N/A',
      user_phone: plain.user?.phone || 'N/A',
      items: plain.cart_items,
      con_envio: plain.con_envio
    };
  },

  /**
   * Buscar un pedido por código único
   */
  async findByCode(orderCode: string): Promise<any | null> {
    const order = await Order.findOne({
      where: { order_code: orderCode },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone']
        }
      ]
    });

    if (!order) return null;
    return order.get({ plain: true });
  },

  /**
   * Buscar pedidos de un usuario específico
   */
  async findByUserId(userId: number): Promise<any[]> {
    const orders = await Order.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    return orders.map((o) => {
      const plain = o.get({ plain: true }) as any;
      return {
        ...plain,
        total: plain.total_price,
        estado: this.mapStatusToLegacy(plain.status)
      };
    });
  },

  /**
   * Obtener estadísticas de ventas mapeadas a los nuevos estados
   */
  async getSalesStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
  }> {
    const totalOrders = await Order.count();

    const revenueResult = await Order.sum('total_price', {
      where: {
        status: { [Op.ne]: 'CANCELLED' }
      }
    });

    const completedOrders = await Order.count({
      where: {
        status: { [Op.in]: ['PAID', 'SHIPPED', 'DELIVERED'] }
      }
    });

    const pendingOrders = await Order.count({
      where: {
        status: { [Op.in]: ['PENDING_PAYMENT', 'PREPARING'] }
      }
    });

    return {
      totalRevenue: revenueResult || 0,
      totalOrders,
      completedOrders,
      pendingOrders
    };
  },

  // Helpers para mapeo de estados legacy (español) a nuevos (inglés de Meta)
  mapStatusToLegacy(status: string): string {
    const mapping: Record<string, string> = {
      'PENDING_PAYMENT': 'pendiente',
      'PAID': 'pagado',
      'PREPARING': 'preparando',
      'SHIPPED': 'enviado',
      'DELIVERED': 'entregado',
      'CANCELLED': 'cancelado'
    };
    return mapping[status] || 'pendiente';
  },

  mapStatusToNew(legacy: string): 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' {
    const mapping: Record<string, any> = {
      'pendiente': 'PENDING_PAYMENT',
      'pagado': 'PAID',
      'preparando': 'PREPARING',
      'enviado': 'SHIPPED',
      'entregado': 'DELIVERED',
      'cancelado': 'CANCELLED'
    };
    return mapping[legacy] || 'PENDING_PAYMENT';
  }
};
