import sequelize from './db.js';
import bcrypt from 'bcryptjs';
import { User, UserModel, normalizeEmail } from '../models/userModel.js';
import { Product } from '../models/productModel.js';

export const initDb = async () => {
  console.log('\n================================================================');
  console.log('🔄 [INIT DB] Iniciando verificación e inicialización de la base de datos...');
  console.log('================================================================');

  // 1. Sincronizar modelos con Sequelize (sin romper si las tablas ya existen)
  try {
    await sequelize.sync();
    console.log('✅ [INIT DB] Tablas y relaciones sincronizadas con Sequelize.');
  } catch (syncError: any) {
    console.warn('⚠️ [INIT DB] Advertencia en sequelize.sync():', syncError.message);
    console.warn('   (Las tablas existentes seguirán operativas)');
  }

  // 2. Precargar / Sincronizar cuentas de Administrador
  try {
    const adminEmails = [
      process.env.ADMIN_EMAIL,
      'cunna.accs@gmail.com',
      'cunn.accs@gmail.com',
      'chunna.accs@gmail.com',
      'admin@chunna.com'
    ]
      .filter(Boolean)
      .map((e) => normalizeEmail(e as string));

    const uniqueAdminEmails = Array.from(new Set(adminEmails));

    const salt = await bcrypt.genSalt(10);
    const defaultAdminHash = await bcrypt.hash('2620070212', salt);

    for (const adminEmail of uniqueAdminEmails) {
      const existingUser = await UserModel.findByEmail(adminEmail);

      if (!existingUser) {
        await User.create({
          name: 'Administrador Chunna',
          email: adminEmail,
          password: defaultAdminHash,
          role: 'admin',
          phone: '+54 9 11 0000-0000',
          city: 'Córdoba',
          notes: 'Administrador principal de Chunna Accesorios'
        });
        console.log(`👑 [INIT DB] Cuenta de Administrador creada exitosamente: ${adminEmail} (Contraseña: 2620070212)`);
      } else {
        // Asegurar que tenga ROL ADMIN y contraseña actualizada (incluso si se registró antes como cliente)
        await existingUser.update({
          role: 'admin',
          password: defaultAdminHash
        });
        console.log(`👑 [INIT DB] Rol y credenciales de Administrador forzados a 'admin': ${adminEmail} (Contraseña: 2620070212)`);
      }
    }
  } catch (adminError: any) {
    console.error('❌ [INIT DB] Error asegurando cuentas de Administrador:', adminError.message);
  }

  // 3. Precargar catálogo inicial si la tabla de productos está vacía
  try {
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
      console.log('✅ [INIT DB] Catálogo inicial de productos precargado con éxito.');
    }
  } catch (productError: any) {
    console.error('❌ [INIT DB] Error precargando catálogo de productos:', productError.message);
  }

  console.log('================================================================');
  console.log('✅ [INIT DB] Inicialización completada.');
  console.log('================================================================\n');
};
