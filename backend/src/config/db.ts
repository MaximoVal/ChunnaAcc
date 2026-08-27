import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const rawDatabaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

// Limpiar parámetros ssl-mode de la URL que MySQL2 no entiende
const databaseUrl = rawDatabaseUrl
  ? rawDatabaseUrl.replace(/([?&])ssl-mode=[^&]*/gi, '$1').replace(/[?&]$/, '')
  : undefined;

const dbName = process.env.DB_NAME || 'chunna_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);

// SSL solo si está explícitamente configurado o en producción con DATABASE_URL
const useSSL = process.env.DB_SSL !== undefined
  ? (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1')
  : (process.env.NODE_ENV === 'production' && Boolean(databaseUrl));

const dialectOptions = useSSL
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

const sharedOptions = {
  dialect: 'mysql' as const,
  logging: false, // Sin logging SQL en producción — activar solo para debug local
  dialectOptions,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false // Los campos ya están en snake_case explícitamente en cada modelo
  }
};

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sharedOptions)
  : new Sequelize(dbName, dbUser, dbPassword, {
      ...sharedOptions,
      host: dbHost,
      port: dbPort
    });

export default sequelize;
