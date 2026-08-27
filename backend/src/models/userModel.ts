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

  /**
   * Retorna una versión segura del usuario sin datos sensibles
   */
  public toSafeObject(): UserSafeAttributes {
    const plain = this.get({ plain: true });
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
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      set(val: string) {
        this.setDataValue('email', String(val || '').trim().toLowerCase());
      }
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

/**
 * Normaliza cualquier cadena de email a minúsculas sin espacios
 */
export const normalizeEmail = (email: string): string => {
  return String(email || '').trim().toLowerCase();
};

export const UserModel = {
  /**
   * Buscar un usuario por su email normalizado retornando la instancia de Sequelize
   */
  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) return null;

    return await User.findOne({
      where: {
        email: cleanEmail
      }
    });
  },

  /**
   * Buscar un usuario por su ID (excluyendo password y OTP)
   */
  async findById(id: number): Promise<UserSafeAttributes | null> {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'otp_code', 'otp_expires'] }
    });
    return user ? (user.get({ plain: true }) as UserSafeAttributes) : null;
  },

  /**
   * Buscar un usuario por su ID incluyendo el password (para operaciones de verificación)
   */
  async findByIdWithPassword(id: number): Promise<User | null> {
    return await User.findByPk(id);
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
  }): Promise<User> {
    return await User.create({
      name: user.name.trim(),
      email: normalizeEmail(user.email),
      password: user.password,
      role: user.role || 'cliente',
      phone: user.phone ? user.phone.trim() : null,
      address: user.address ? user.address.trim() : null,
      city: user.city ? user.city.trim() : null,
      notes: user.notes ? user.notes.trim() : null
    });
  },

  /**
   * Actualizar código OTP y tiempo de expiración
   */
  async setOtp(id: number, otpCode: string, otpExpires: Date): Promise<boolean> {
    const [affected] = await User.update(
      { otp_code: otpCode, otp_expires: otpExpires },
      { where: { id } }
    );
    return affected > 0;
  },

  /**
   * Limpiar código OTP
   */
  async clearOtp(id: number): Promise<boolean> {
    const [affected] = await User.update(
      { otp_code: null, otp_expires: null },
      { where: { id } }
    );
    return affected > 0;
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
   * Obtener todos los clientes registrados (excluyendo administradores y datos sensibles)
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
   * Contar cantidad total de usuarios registrados con role 'cliente'
   */
  async countUsers(): Promise<number> {
    return await User.count({ where: { role: 'cliente' } });
  }
};
