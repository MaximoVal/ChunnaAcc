import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

const dbName = process.env.DB_NAME || 'chunna_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);

// Opción de SSL para bases de datos MySQL administradas en la nube (Aiven, Railway, TiDB, etc.)
const useSSL = process.env.DB_SSL !== undefined
  ? (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1')
  : (process.env.NODE_ENV === 'production' && Boolean(databaseUrl));

const dialectOptions = useSSL
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : {};

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    })
  : new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    });

export default sequelize;
