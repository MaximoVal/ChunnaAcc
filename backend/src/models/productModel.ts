import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/db.js';

export interface ProductAttributes {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen?: string | null;
  categoria: string;
  activo: boolean | number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCreationAttributes
  extends Optional<ProductAttributes, 'id' | 'descripcion' | 'imagen' | 'categoria' | 'activo' | 'created_at' | 'updated_at'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare nombre: string;
  declare descripcion: string | null;
  declare precio: number;
  declare stock: number;
  declare imagen: string | null;
  declare categoria: string;
  declare activo: boolean | number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      get() {
        const rawValue = this.getDataValue('precio');
        return rawValue ? Number(rawValue) : 0;
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    imagen: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '/assets/im1.jpeg'
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Pulseras'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export const ProductModel = {
  /**
   * Obtener todos los productos activos
   */
  async findAll(): Promise<ProductAttributes[]> {
    const products = await Product.findAll({
      where: { activo: true },
      order: [['id', 'DESC']]
    });
    return products.map((p) => p.get({ plain: true }) as ProductAttributes);
  },

  /**
   * Obtener un producto por ID
   */
  async findById(id: number): Promise<ProductAttributes | null> {
    const product = await Product.findByPk(id);
    return product ? (product.get({ plain: true }) as ProductAttributes) : null;
  },

  /**
   * Crear un nuevo producto (para administrador)
   */
  async create(data: {
    nombre: string;
    descripcion?: string | null;
    precio: number;
    stock: number;
    imagen?: string | null;
    categoria?: string;
    activo?: boolean | number;
  }): Promise<number> {
    const created = await Product.create({
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      precio: data.precio,
      stock: data.stock,
      imagen: data.imagen || '/assets/im1.jpeg',
      categoria: data.categoria || 'Pulseras',
      activo: data.activo !== undefined ? Boolean(data.activo) : true
    });
    return created.id;
  },

  /**
   * Crear múltiples productos en una sola operación de base de datos (Carga Masiva con bulkCreate)
   */
  async createMany(
    productsList: Array<{
      nombre: string;
      descripcion?: string | null;
      precio: number;
      stock: number;
      imagen?: string | null;
      categoria?: string;
      activo?: boolean | number;
    }>
  ): Promise<number> {
    if (!productsList || productsList.length === 0) return 0;

    const formatted = productsList.map((p) => ({
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      precio: p.precio || 0,
      stock: p.stock || 10,
      imagen: p.imagen || '/assets/im1.jpeg',
      categoria: p.categoria || 'Pulseras',
      activo: p.activo !== undefined ? Boolean(p.activo) : true
    }));

    const createdList = await Product.bulkCreate(formatted);
    return createdList.length;
  },

  /**
   * Contar total de productos activos y stock acumulado
   */
  async getStats(): Promise<{ totalProducts: number; totalStock: number }> {
    const totalProducts = await Product.count({ where: { activo: true } });
    const sumResult = await Product.sum('stock', { where: { activo: true } });
    return {
      totalProducts,
      totalStock: sumResult || 0
    };
  }
};
