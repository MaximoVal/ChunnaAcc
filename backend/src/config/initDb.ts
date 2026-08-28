import sequelize from './db.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, UserModel, normalizeEmail } from '../models/userModel.js';
import { Product } from '../models/productModel.js';
import { Material } from '../models/materialModel.js';

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

  // 2. Precargar / Sincronizar ÚNICA cuenta de Administrador: cunna.accs@gmail.com
  try {
    const officialAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'cunna.accs@gmail.com');

    const salt = await bcrypt.genSalt(10);
    const defaultAdminHash = await bcrypt.hash('2620070212', salt);

    // Asegurar que cunna.accs@gmail.com exista y tenga rol 'admin'
    const existingAdmin = await UserModel.findByEmail(officialAdminEmail);

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
      console.log(`👑 [INIT DB] Cuenta de Administrador creada exitosamente: ${officialAdminEmail} (Contraseña: 2620070212)`);
    } else {
      await existingAdmin.update({
        role: 'admin',
        password: defaultAdminHash
      });
      console.log(`👑 [INIT DB] Administrador oficial sincronizado: ${officialAdminEmail} (Rol: 'admin', Contraseña: 2620070212)`);
    }

    // Degradar cualquier otra cuenta antigua a rol 'cliente' para garantizar que SOLO cunna.accs@gmail.com sea admin
    const otherAdmins = await User.findAll({
      where: {
        role: 'admin',
        email: { [Op.ne]: officialAdminEmail }
      }
    });

    if (otherAdmins.length > 0) {
      for (const user of otherAdmins) {
        await user.update({ role: 'cliente' });
        console.log(`🔒 [INIT DB] Cuenta degradada a cliente (solo ${officialAdminEmail} es admin): ${user.email}`);
      }
    }
  } catch (adminError: any) {
    console.error('❌ [INIT DB] Error asegurando cuenta de Administrador:', adminError.message);
  }

  // 2.5 Seed initial materials
  try {
    const countMaterials = await Material.count();
    if (countMaterials === 0) {
      await Material.bulkCreate([
        { nombre: 'Macramé', slug: 'macrame' },
        { nombre: 'Mostacillas', slug: 'mostacillas' },
        { nombre: 'Cristales', slug: 'cristales' }
      ]);
      console.log('✅ [INIT DB] Materiales iniciales precargados con éxito.');
      
      // Migrate existing products
      const materials = await Material.findAll();
      for (const material of materials) {
        await Product.update(
          { material_id: material.id },
          { where: { categoria: material.slug } }
        );
      }
      console.log('✅ [INIT DB] Productos existentes migrados a material_id con éxito.');
    }
  } catch (materialError: any) {
    console.error('❌ [INIT DB] Error precargando o migrando materiales:', materialError.message);
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
