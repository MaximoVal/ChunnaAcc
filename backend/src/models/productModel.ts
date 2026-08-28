import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/db.js';
import { Material } from './materialModel.js';
import ProductMaterial from './productMaterialModel.js';

export interface ProductAttributes {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagen?: string | null;
  categoria: string;
  material_id?: number | null;
  material_nombre?: string;
  materials?: Array<{ id: number; nombre: string; slug: string }>;
  material_ids?: number[];
  activo: boolean | number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductCreationAttributes
  extends Optional<ProductAttributes, 'id' | 'descripcion' | 'imagen' | 'categoria' | 'material_id' | 'materials' | 'material_ids' | 'activo' | 'created_at' | 'updated_at'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: number;
  declare nombre: string;
  declare descripcion: string | null;
  declare precio: number;
  declare stock: number;
  declare imagen: string | null;
  declare categoria: string;
  declare material_id: number | null;
  declare materials?: Array<{ id: number; nombre: string; slug: string }>;
  declare material_ids?: number[];
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
    material_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'materials',
        key: 'id'
      }
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

// Relaciones con Materiales (N:M a través de product_materials y 1:N legacy)
Product.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });
Product.belongsToMany(Material, {
  through: ProductMaterial,
  foreignKey: 'product_id',
  otherKey: 'material_id',
  as: 'materials'
});
Material.belongsToMany(Product, {
  through: ProductMaterial,
  foreignKey: 'material_id',
  otherKey: 'product_id',
  as: 'products'
});

const formatProductPlain = (p: Product): ProductAttributes => {
  const plain = p.get({ plain: true }) as any;
  if (plain.material) {
    plain.material_nombre = plain.material.nombre;
    delete plain.material;
  }
  if (!plain.materials) {
    plain.materials = [];
  }
  if (plain.materials.length === 0 && plain.material_id && plain.material_nombre) {
    plain.materials = [{ id: plain.material_id, nombre: plain.material_nombre, slug: plain.material_nombre.toLowerCase() }];
  }
  return plain as ProductAttributes;
};

export const ProductModel = {
  /**
   * Obtener todos los productos activos
   */
  async findAll(): Promise<ProductAttributes[]> {
    const products = await Product.findAll({
      where: { activo: true },
      order: [['id', 'DESC']],
      include: [
        { model: Material, as: 'material', attributes: ['nombre'] },
        { model: Material, as: 'materials', attributes: ['id', 'nombre', 'slug'], through: { attributes: [] } }
      ]
    });
    return products.map(formatProductPlain);
  },

  /**
   * Obtener un producto por ID
   */
  async findById(id: number): Promise<ProductAttributes | null> {
    const product = await Product.findByPk(id, {
      include: [
        { model: Material, as: 'material', attributes: ['nombre'] },
        { model: Material, as: 'materials', attributes: ['id', 'nombre', 'slug'], through: { attributes: [] } }
      ]
    });
    if (!product) return null;
    return formatProductPlain(product);
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
    material_id?: number | null;
    material_ids?: number[];
    activo?: boolean | number;
  }): Promise<number> {
    const firstMatId = data.material_ids && data.material_ids.length > 0 ? data.material_ids[0] : (data.material_id || null);

    const created = await Product.create({
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      precio: data.precio,
      stock: data.stock,
      imagen: data.imagen || '/assets/im1.jpeg',
      categoria: data.categoria || 'Pulseras',
      material_id: firstMatId,
      activo: data.activo !== undefined ? Boolean(data.activo) : true
    });

    const mIds = data.material_ids && data.material_ids.length > 0 ? data.material_ids : (firstMatId ? [firstMatId] : []);
    if (mIds.length > 0) {
      await (created as any).setMaterials(mIds);
    }

    return created.id;
  },

  /**
   * Crear múltiples productos en una sola operación de base de datos
   */
  async createMany(
    productsList: Array<{
      nombre: string;
      descripcion?: string | null;
      precio: number;
      stock: number;
      imagen?: string | null;
      categoria?: string;
      material_id?: number | null;
      material_ids?: number[];
      activo?: boolean | number;
    }>
  ): Promise<number> {
    if (!productsList || productsList.length === 0) return 0;

    let count = 0;
    for (const p of productsList) {
      await this.create(p);
      count++;
    }
    return count;
  },

  /**
   * Obtener todos los productos (activos e inactivos) para el panel de administración
   */
  async findAllAdmin(): Promise<ProductAttributes[]> {
    const products = await Product.findAll({
      order: [['id', 'DESC']],
      include: [
        { model: Material, as: 'material', attributes: ['nombre'] },
        { model: Material, as: 'materials', attributes: ['id', 'nombre', 'slug'], through: { attributes: [] } }
      ]
    });
    return products.map(formatProductPlain);
  },

  /**
   * Actualizar un producto existente
   */
  async update(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string | null;
      precio?: number;
      stock?: number;
      imagen?: string | null;
      categoria?: string;
      material_id?: number | null;
      material_ids?: number[];
      activo?: boolean | number;
    }
  ): Promise<boolean> {
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = String(data.nombre).trim();
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion ? String(data.descripcion).trim() : null;
    if (data.precio !== undefined) updateData.precio = Number(data.precio);
    if (data.stock !== undefined) updateData.stock = Number(data.stock);
    if (data.imagen !== undefined) updateData.imagen = String(data.imagen).trim();
    if (data.categoria !== undefined) updateData.categoria = String(data.categoria).trim();
    if (data.material_ids !== undefined && data.material_ids.length > 0) {
      updateData.material_id = data.material_ids[0];
    } else if (data.material_id !== undefined) {
      updateData.material_id = data.material_id;
    }
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);

    const [affectedCount] = await Product.update(updateData, { where: { id } });

    if (data.material_ids !== undefined) {
      const productInstance = await Product.findByPk(id);
      if (productInstance) {
        await (productInstance as any).setMaterials(data.material_ids);
      }
    }

    return affectedCount > 0 || data.material_ids !== undefined;
  },

  /**
   * Eliminar un producto permanentemente
   */
  async delete(id: number): Promise<boolean> {
    const affectedCount = await Product.destroy({ where: { id } });
    return affectedCount > 0;
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
