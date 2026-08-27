import sequelize from './db.js';
import bcrypt from 'bcryptjs';
import { User, UserModel, normalizeEmail } from '../models/userModel.js';
import { Product } from '../models/productModel.js';

export const initDb = async () => {
  try {
    // 1. Sincronizar y actualizar modelos con la base de datos mediante Sequelize
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Tablas sincronizadas y actualizadas ({ alter: true }) con Sequelize.');
    } catch (alterError: any) {
      console.warn('⚠️ No se pudieron alterar las tablas con { alter: true }. Reintentando con sync normal:', alterError.message);
      await sequelize.sync();
    }

    // 2. Precargar o actualizar la cuenta de Administrador oficial: cunna.accs@gmail.com
    const officialAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'cunna.accs@gmail.com');

    const salt = await bcrypt.genSalt(10);
    const defaultAdminHash = await bcrypt.hash('2620070212', salt);

    // Buscar si ya existe la cuenta admin
    let existingAdmin = await UserModel.findByEmail(officialAdminEmail);

    // Si no existe, revisar si existe una cuenta antigua (admin@chunna.com) para migrarla a cunna.accs@gmail.com
    if (!existingAdmin) {
      const legacyAdmin = await UserModel.findByEmail('admin@chunna.com');
      if (legacyAdmin) {
        await legacyAdmin.update({
          email: officialAdminEmail,
          role: 'admin',
          password: defaultAdminHash
        });
        existingAdmin = legacyAdmin;
        console.log(`👑 Cuenta legacy migrada a: ${officialAdminEmail}`);
      }
    }

    if (!existingAdmin) {
      await User.create({
        name: 'Administrador Chunna',
        email: officialAdminEmail,
        password: defaultAdminHash,
        role: 'admin',
        phone: '+54 9 11 0000-0000',
        city: 'Córdoba',
        notes: 'Administrador principal de Chunna Accesorios'
      });
      console.log(`👑 Cuenta Administrador precargada con éxito: ${officialAdminEmail} (Contraseña: 2620070212)`);
    } else {
      // Asegurar que tenga rol admin y contraseña sincronizada
      await existingAdmin.update({
        role: 'admin',
        password: defaultAdminHash
      });
      console.log(`👑 Rol y credenciales de Administrador actualizados: ${officialAdminEmail} (Contraseña: 2620070212)`);
    }

    // 3. Precargar catálogo de productos de ejemplo si la tabla está vacía
    const countProducts = await Product.count();
    if (countProducts === 0) {
      await Product.bulkCreate([
        {
          nombre: 'Pulsera Hilo Encerado Rust',
          descripcion: 'Diseño clásico en tonos terracota tejido a mano, ideal para combinar a diario.',
          precio: 1200.00,
          stock: 25,
          imagen: '/assets/im1.jpeg',
          categoria: 'macrame',
          activo: true
        },
        {
          nombre: 'Pulsera Cristal Boho',
          descripcion: 'Delicada combinación de cristales brillosos y mostacillas seleccionadas.',
          precio: 1500.00,
          stock: 20,
          imagen: '/assets/im2.jpeg',
          categoria: 'cristales',
          activo: true
        },
        {
          nombre: 'Pulsera Macramé Tierra',
          descripcion: 'Estilo rústico con trenzado artesanal firme y detalles de dijes metálicos.',
          precio: 1800.00,
          stock: 15,
          imagen: '/assets/im3.jpeg',
          categoria: 'macrame',
          activo: true
        },
        {
          nombre: 'Pulsera Cuentas de la Selva',
          descripcion: 'Contiene aros y cuentas de colores vibrantes inspirados en la naturaleza.',
          precio: 2200.00,
          stock: 18,
          imagen: '/assets/im4.jpeg',
          categoria: 'mostacillas',
          activo: true
        },
        {
          nombre: 'Pulsera Multi-Hebra Sunset',
          descripcion: 'Varias hebras tejidas en colores cálidos del atardecer con broche regulable.',
          precio: 1900.00,
          stock: 12,
          imagen: '/assets/im5.jpeg',
          categoria: 'macrame',
          activo: true
        },
        {
          nombre: 'Pulsera Protección Ojo Turco',
          descripcion: 'Fina pulsera con ojo turco de vidrio y cuentas celestes protectoras.',
          precio: 1600.00,
          stock: 30,
          imagen: '/assets/im6.jpeg',
          categoria: 'mostacillas',
          activo: true
        }
      ]);
      console.log('✅ Catálogo inicial de productos precargado con Sequelize.');
    }

    console.log('✅ Inicialización completa de la base de datos con Sequelize.');
  } catch (error: any) {
    console.warn('⚠️ Nota sobre la inicialización de base de datos con Sequelize:', error.message);
  }
};
