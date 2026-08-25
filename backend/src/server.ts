import app from './app.js';
import sequelize from './config/db.js';
import { initDb } from './config/initDb.js';

// Render asigna dinámicamente el puerto mediante la variable de entorno PORT
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

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
    console.warn(' 1. Tener tu servidor MySQL activo o configurado en la nube.');
    console.warn(' 2. Configurar las variables de entorno de base de datos en Render o en tu archivo .env.');
    console.warn('================================================================\n');
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor listo y escuchando en http://${HOST}:${PORT} (Puerto Render: ${PORT})`);
    console.log(`👉 Diagnóstico API disponible en: /api/status`);
  });
};

runServer();
