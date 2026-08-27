import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
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

export interface UserSafeAttributes {
  id: number;
  name: string;
  email: string;
  role: 'cliente' | 'admin';
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'role' | 'phone' | 'address' | 'city' | 'notes' | 'otp_code' | 'otp_expires' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: 'cliente' | 'admin';
  declare phone: string | null;
  declare address: string | null;
  declare city: string | null;
  declare notes: string | null;
  declare otp_code: string | null;
  declare otp_expires: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  /**
   * Retorna una versión segura del usuario sin datos sensibles (password, otp_code, otp_expires)
   */
  public toSafeObject(): UserSafeAttributes {
    const plain = this.get({ plain: true }) as any;
    const { password, otp_code, otp_expires, ...safeUser } = plain;
    return safeUser as UserSafeAttributes;
  }
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
      // Sin set() hook — la normalización se maneja en la capa de servicio/controlador
      // para evitar interferencia con el WHERE clause interno de Sequelize
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
      allowNull: true,
      defaultValue: null
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    otp_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null
    },
    otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // No underscored — los campos ya están explícitamente en snake_case
    underscored: false
  }
);

/**
 * Normaliza cualquier email a minúsculas sin espacios.
 * SIEMPRE usar esto antes de guardar o buscar por email.
 */
export const normalizeEmail = (email: string): string => {
  return String(email || '').trim().toLowerCase();
};

export const UserModel = {
  /**
   * Buscar un usuario por su email.
   * Usa LOWER() en la query SQL para búsqueda case-insensitive a nivel de base de datos.
   * Retorna la instancia completa de Sequelize (incluyendo password y otp para verificaciones).
   */
  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) return null;

    return await User.findOne({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('email')),
        cleanEmail
      )
    });
  },

  /**
   * Buscar un usuario por su ID (sin password ni datos de OTP)
   */
  async findById(id: number): Promise<UserSafeAttributes | null> {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'otp_code', 'otp_expires'] }
    });
    return user ? (user.get({ plain: true }) as UserSafeAttributes) : null;
  },

  /**
   * Crear un nuevo usuario con email normalizado
   */
  async create(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'cliente' | 'admin';
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    notes?: string | null;
  }): Promise<User> {
    return await User.create({
      name: userData.name.trim(),
      email: normalizeEmail(userData.email),
      password: userData.password,
      role: userData.role || 'cliente',
      phone: userData.phone ? userData.phone.trim() : null,
      address: userData.address ? userData.address.trim() : null,
      city: userData.city ? userData.city.trim() : null,
      notes: userData.notes ? userData.notes.trim() : null
    });
  },

  /**
   * Guardar/actualizar el código OTP y su tiempo de expiración
   */
  async setOtp(id: number, otpCode: string, otpExpires: Date): Promise<boolean> {
    const [affected] = await User.update(
      { otp_code: otpCode, otp_expires: otpExpires },
      { where: { id } }
    );
    return affected > 0;
  },

  /**
   * Eliminar el código OTP después de haberlo verificado
   */
  async clearOtp(id: number): Promise<boolean> {
    const [affected] = await User.update(
      { otp_code: null, otp_expires: null },
      { where: { id } }
    );
    return affected > 0;
  },

  /**
   * Actualizar la contraseña de un usuario
   */
  async updatePassword(id: number, newPasswordHash: string): Promise<boolean> {
    const [affectedCount] = await User.update({ password: newPasswordHash }, { where: { id } });
    return affectedCount > 0;
  },

  /**
   * Actualizar datos simples del perfil
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
   * Obtener todos los clientes (excluyendo admins y datos sensibles)
   */
  async findAllClients(): Promise<UserSafeAttributes[]> {
    const users = await User.findAll({
      where: { role: 'cliente' },
      attributes: { exclude: ['password', 'otp_code', 'otp_expires'] },
      order: [['created_at', 'DESC']]
    });
    return users.map((u) => u.get({ plain: true }) as UserSafeAttributes);
  },

  /**
   * Contar usuarios con rol 'cliente'
   */
  async countUsers(): Promise<number> {
    return await User.count({ where: { role: 'cliente' } });
  }
};
