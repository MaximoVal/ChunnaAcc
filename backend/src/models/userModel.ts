import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/db.js';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'cliente' | 'admin';
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  otp_code?: string | null;
  otp_expires?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'role' | 'phone' | 'address' | 'city' | 'notes' | 'otp_code' | 'otp_expires' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'cliente' | 'admin';
  public phone!: string | null;
  public address!: string | null;
  public city!: string | null;
  public notes!: string | null;
  public otp_code!: string | null;
  public otp_expires!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('cliente', 'admin'),
      allowNull: false,
      defaultValue: 'cliente'
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    otp_code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    otp_expires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export const UserModel = {
  /**
   * Buscar un usuario por su email (insensible a mayúsculas y espacios)
   */
  async findByEmail(email: string): Promise<UserAttributes | null> {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawEmail = String(email || '').trim();

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: rawEmail }
        ]
      }
    });

    return user ? (user.get({ plain: true }) as UserAttributes) : null;
  },

  /**
   * Buscar un usuario por su ID (excluyendo la contraseña)
   */
  async findById(id: number): Promise<UserAttributes | null> {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    return user ? (user.get({ plain: true }) as UserAttributes) : null;
  },

  /**
   * Crear un nuevo usuario
   */
  async create(user: {
    name: string;
    email: string;
    password: string;
    role?: 'cliente' | 'admin';
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    notes?: string | null;
  }): Promise<number> {
    const created = await User.create({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role || 'cliente',
      phone: user.phone || null,
      address: user.address || null,
      city: user.city || null,
      notes: user.notes || null
    });
    return created.id;
  },

  /**
   * Actualizar datos simples del perfil de un usuario
   */
  async updateProfile(
    id: number,
    data: {
      name?: string;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      notes?: string | null;
    }
  ): Promise<boolean> {
    const [affectedCount] = await User.update(data, { where: { id } });
    return affectedCount > 0;
  },

  /**
   * Obtener todos los clientes registrados
   */
  async findAllClients(): Promise<UserAttributes[]> {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
    return users.map((u) => u.get({ plain: true }) as UserAttributes);
  },

  /**
   * Contar cantidad total de usuarios registrados con role 'cliente'
   */
  async countUsers(): Promise<number> {
    return await User.count({ where: { role: 'cliente' } });
  }
};
