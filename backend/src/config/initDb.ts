import sequelize from './db.js';
import bcrypt from 'bcryptjs';
import { User, UserModel, normalizeEmail } from '../models/userModel.js';
import { Product } from '../models/productModel.js';

export const initDb = async () => {
  try {
    // 1. Sincronizar modelos (sin alter para evitar conflictos con FK constraints en producción)
    // Si necesitas añadir columnas nuevas, hazlo con ALTER TABLE manual o con migraciones.
    await sequelize.sync();
    console.log('✅ Tablas sincronizadas con Sequelize (sync sin alter).');

    // 2. Crear cuenta de Administrador si no existe
    const officialAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'cunna.accs@gmail.com');
    const existingAdmin = await UserModel.findByEmail(officialAdminEmail);

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const defaultAdminHash = await bcrypt.hash('2620070212', salt);

      await User.create({
        name: 'Administrador Chunna',
        email: officialAdminEmail,
        password: defaultAdminHash,
        role: 'admin',
        phone: '+54 9 11 0000-0000',
        city: 'Córdoba',
        notes: 'Administrador principal de Chunna Accesorios'
      });
      console.log(`👑 Cuenta Administrador creada: ${officialAdminEmail} (Contraseña: 2620070212)`);
    } else {
      // Verificar si la contraseña del admin necesita ser actualizada
      const currentPassword = existingAdmin.password || existingAdmin.getDataValue('password') || '';
      let isDefaultValid = false;
      if (currentPassword.startsWith('$2a$') || currentPassword.startsWith('$2b$') || currentPassword.startsWith('$2y$')) {
        isDefaultValid = await bcrypt.compare('2620070212', currentPassword).catch(() => false);
      }
      
      if (!isDefaultValid && (currentPassword === '2620070212' || currentPassword === '$2b$10$wzW1iP8zKovn/QpU7Kq1s.uE9mF5uXvT5a3N1pYk9b8zLqXy7q1s2')) {
        const salt = await bcrypt.genSalt(10);
        const defaultAdminHash = await bcrypt.hash('2620070212', salt);
        await UserModel.updatePassword(existingAdmin.id, defaultAdminHash);
        console.log(`👑 Contraseña del Administrador actualizada con hash bcrypt válido.`);
      }
      console.log(`👑 Administrador verificado: ${officialAdminEmail}`);
    }

    // 3. Precargar catálogo inicial si la tabla de productos está vacía
    const countProducts = await Product.count();
    if (countProducts === 0) {
      await Product.bulkCreate([
        {
          nombre: 'Pulsera Hilo Encerado Rust',
          descripcion: 'Diseño clásico en tonos terracota tejido a mano, ideal para combinar a diario.',
          precio: 1200.00, stock: 25, imagen: '/assets/im1.jpeg', categoria: 'macrame', activo: true
        },
        {
          nombre: 'Pulsera Cristal Boho',
          descripcion: 'Delicada combinación de cristales brillosos y mostacillas seleccionadas.',
          precio: 1500.00, stock: 20, imagen: '/assets/im2.jpeg', categoria: 'cristales', activo: true
        },
        {
          nombre: 'Pulsera Macramé Tierra',
          descripcion: 'Estilo rústico con trenzado artesanal firme y detalles de dijes metálicos.',
          precio: 1800.00, stock: 15, imagen: '/assets/im3.jpeg', categoria: 'macrame', activo: true
        },
        {
          nombre: 'Pulsera Cuentas de la Selva',
          descripcion: 'Contiene aros y cuentas de colores vibrantes inspirados en la naturaleza.',
          precio: 2200.00, stock: 18, imagen: '/assets/im4.jpeg', categoria: 'mostacillas', activo: true
        },
        {
          nombre: 'Pulsera Multi-Hebra Sunset',
          descripcion: 'Varias hebras tejidas en colores cálidos del atardecer con broche regulable.',
          precio: 1900.00, stock: 12, imagen: '/assets/im5.jpeg', categoria: 'macrame', activo: true
        },
        {
          nombre: 'Pulsera Protección Ojo Turco',
          descripcion: 'Fina pulsera con ojo turco de vidrio y cuentas celestes protectoras.',
          precio: 1600.00, stock: 30, imagen: '/assets/im6.jpeg', categoria: 'mostacillas', activo: true
        }
      ]);
      console.log('✅ Catálogo inicial de productos precargado.');
    }

    console.log('✅ Inicialización de base de datos completada.');
  } catch (error: any) {
    console.error('❌ Error en initDb:', error.message);
    // No lanzamos el error — el servidor sigue funcionando aunque initDb falle
  }
};
