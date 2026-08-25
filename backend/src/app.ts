import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Endpoint de prueba/diagnóstico
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de Chunna Accesorios corriendo correctamente.',
    timestamp: new Date()
  });
});

import authRouter from './routes/authRoutes.js';
import productRouter from './routes/productRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import orderRouter from './routes/orderRoutes.js';

// Registro de rutas
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter);

export default app;

