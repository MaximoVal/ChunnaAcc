import app from './app.js';
import sequelize from './config/db.js';
import { initDb } from './config/initDb.js';

const PORT = process.env.PORT || 5000;

// Validar conexión a MySQL con Sequelize al iniciar el servidor
const runServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión con la base de datos MySQL (vía Sequelize) establecida con éxito.');
    await initDb();
  } catch (error: any) {
    console.warn('\n================================================================');
    console.warn('⚠️ ADVERTENCIA: No se pudo conectar a la base de datos MySQL.');
    console.warn(`Mensaje del error: ${error.message}`);
    console.warn('El servidor seguirá corriendo, pero las operaciones con la base de datos fallarán.');
    console.warn('Por favor, asegúrate de:');
    console.warn(' 1. Tener tu servidor MySQL encendido.');
    console.warn(' 2. Crear la base de datos definida en tu archivo .env.');
    console.warn(' 3. Configurar correctamente tus credenciales en el archivo .env.');
    console.warn('================================================================\n');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto: ${PORT}`);
    console.log(`👉 Puedes testear el estado de la API en: http://localhost:${PORT}/api/status`);
  });
};

runServer();
