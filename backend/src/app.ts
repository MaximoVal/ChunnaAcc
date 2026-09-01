import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración dinámica de CORS para Render / Desarrollo
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl
  ? [frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Servir directorio de archivos multimedia subidos (/uploads)
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Health check ultra-liviano para Render / Uptime monitors (sin queries ni middleware pesado)
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Endpoint de diagnóstico del estado del backend en Render
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de Chunna Accesorios ejecutándose en Render correctamente.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

import authRouter from './routes/authRoutes.js';
import productRouter from './routes/productRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import contactRouter from './routes/contactRoutes.js';
import materialRouter from './routes/materialRoutes.js';

// Registro de rutas API
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter);
app.use('/api/contact', contactRouter);
app.use('/api/contacto', contactRouter);
app.use('/api/materials', materialRouter);

// Rutas explícitas SEO para sitemap.xml y robots.txt (evita que el fallback SPA responda HTML)
app.get('/sitemap.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');

  const possibleSitemapPaths = [
    path.join(process.cwd(), 'dist', 'sitemap.xml'),
    path.join(process.cwd(), '../dist', 'sitemap.xml'),
    path.join(process.cwd(), 'public', 'sitemap.xml'),
    path.join(process.cwd(), '../public', 'sitemap.xml')
  ];

  const sitemapPath = possibleSitemapPaths.find(p => fs.existsSync(p));
  if (sitemapPath) {
    return res.sendFile(path.resolve(sitemapPath));
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://chunna-accesorios.onrender.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  return res.send(xml);
});

app.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');

  const possibleRobotsPaths = [
    path.join(process.cwd(), 'dist', 'robots.txt'),
    path.join(process.cwd(), '../dist', 'robots.txt'),
    path.join(process.cwd(), 'public', 'robots.txt'),
    path.join(process.cwd(), '../public', 'robots.txt')
  ];

  const robotsPath = possibleRobotsPaths.find(p => fs.existsSync(p));
  if (robotsPath) {
    return res.sendFile(path.resolve(robotsPath));
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://chunna-accesorios.onrender.com';
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/sitemap.xml`;
  return res.send(content);
});

// Servir la aplicación React (Vite dist) en producción cuando se despliega como servicio web único en Render
const possibleDistPaths = [
  path.join(process.cwd(), '../dist'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'public')
];

const distPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (distPath) {
  console.log(`📦 Sirviendo cliente estático desde: ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/health') ||
      req.path === '/sitemap.xml' ||
      req.path === '/robots.txt'
    ) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
