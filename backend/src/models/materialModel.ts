import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface MaterialAttributes {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'activo' | 'created_at' | 'updated_at'> {}

export class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  declare id: number;
  declare nombre: string;
  declare slug: string;
  declare activo: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'materials',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export const generateSlug = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

export const MaterialModel = {
  async findAll(): Promise<MaterialAttributes[]> {
    const materials = await Material.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });
    return materials.map((m) => m.get({ plain: true }) as MaterialAttributes);
  },

  async findAllAdmin(): Promise<MaterialAttributes[]> {
    const materials = await Material.findAll({
      order: [['id', 'DESC']]
    });
    return materials.map((m) => m.get({ plain: true }) as MaterialAttributes);
  },

  async findById(id: number): Promise<MaterialAttributes | null> {
    const material = await Material.findByPk(id);
    return material ? (material.get({ plain: true }) as MaterialAttributes) : null;
  },

  async create(data: { nombre: string; activo?: boolean }): Promise<number> {
    const slug = generateSlug(data.nombre);
    const created = await Material.create({
      nombre: data.nombre.trim(),
      slug,
      activo: data.activo !== undefined ? data.activo : true
    });
    return created.id;
  },

  async update(
    id: number,
    data: { nombre?: string; activo?: boolean; slug?: string }
  ): Promise<boolean> {
    const updateData: any = {};
    if (data.nombre !== undefined) {
      updateData.nombre = String(data.nombre).trim();
      updateData.slug = data.slug !== undefined ? data.slug : generateSlug(updateData.nombre);
    }
    if (data.activo !== undefined) updateData.activo = Boolean(data.activo);
    if (data.slug !== undefined) updateData.slug = String(data.slug).trim();

    const [affectedCount] = await Material.update(updateData, { where: { id } });
    return affectedCount > 0;
  },

  async delete(id: number): Promise<boolean> {
    const affectedCount = await Material.destroy({ where: { id } });
    return affectedCount > 0;
  }
};
