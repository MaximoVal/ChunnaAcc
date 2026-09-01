import app from './app.js';
import sequelize from './config/db.js';
import { initDb } from './config/initDb.js';

// Render asigna dinámicamente el puerto mediante la variable de entorno PORT
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

// Validar conexión a MySQL con Sequelize al iniciar el servidor
// Iniciar el servidor Express de inmediato para responder al Health Check de Render en < 1s
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor listo y escuchando en http://${HOST}:${PORT} (Puerto Render: ${PORT})`);
  console.log(`💚 Health Check disponible en: /health`);
  console.log(`👉 Diagnóstico API disponible en: /api/status`);

  // Autenticar la base de datos en segundo plano
  sequelize.authenticate()
    .then(async () => {
      console.log('✅ Conexión con la base de datos MySQL (vía Sequelize) establecida con éxito.');
      await initDb();
    })
    .catch((error: any) => {
      console.warn('\n================================================================');
      console.warn('⚠️ ADVERTENCIA: No se pudo conectar a la base de datos MySQL.');
      console.warn(`Mensaje del error: ${error.message}`);
      console.warn('================================================================\n');
    });
});
