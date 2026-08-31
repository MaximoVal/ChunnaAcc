# 🌸 Chunna Accesorios — Tienda Online Fullstack

Plataforma de comercio electrónico para accesorios artesanales, construida con arquitectura **Fullstack (React + Node.js/Express + Sequelize MySQL)** lista para desplegarse como un servicio web unificado en **Render**.

---

## 🚀 Tecnologías Principales

* **Frontend:** React 18, Vite, TypeScript, React Bootstrap, Context API.
* **Backend:** Node.js (ES Modules), Express, TypeScript, Sequelize ORM.
* **Base de Datos:** MySQL 8.0+ / MariaDB (Aiven, Railway, TiDB Cloud, Clever Cloud, etc.).
* **Autenticación y Seguridad:** JWT con firma centralizada, Bcrypt (Cost 10), Autenticación de Dos Factores (2FA OTP) para Administradores.
* **Servicio de Correos:** Resend SDK (HTTPS REST API — 100% compatible con Render, inmune a bloqueos SMTP).
* **Inteligencia Artificial:** Google Gemini (1.5 Flash) para análisis automático de imágenes de productos y carga masiva al catálogo.

---

## 📋 Estructura del Proyecto

El proyecto está estructurado como un monolito unificado donde el backend sirve la aplicación React compilada (`dist/`) en producción:

```text
ChunnaAcc/
├── backend/                     # Código fuente del servidor
│   ├── src/
│   │   ├── config/              # Conexión a BD, JWT e inicialización
│   │   ├── controllers/         # Controladores (Auth, Admin, Productos, Pedidos)
│   │   ├── middlewares/         # Middlewares (Auth JWT, Admin Role, Validaciones)
│   │   ├── models/              # Modelos Sequelize (User, Product, Order)
│   │   ├── routes/              # Definición de rutas de la API (/api/...)
│   │   ├── services/            # Servicios externos (Resend Email, Gemini AI)
│   │   ├── app.ts               # Configuración de Express, CORS y estáticos
│   │   └── server.ts            # Arranque del servidor y conexión SQL
│   ├── database.sql             # Script SQL de creación completa de la BD
│   ├── migrate_otp_columns.sql  # Script SQL de migración rápida para tablas existentes
│   ├── package.json             # Dependencias del Backend
│   └── tsconfig.json            # Configuración TypeScript del Backend
├── src/                         # Código fuente del Frontend (React/Vite)
│   ├── components/              # Componentes de UI (Modales, Navbar, Admin Dashboard)
│   ├── context/                 # Contextos de React (AuthContext, CartContext)
│   ├── config/                  # Configuración de URLs de la API
│   ├── App.tsx                  # Componente principal
│   └── main.tsx                 # Entrada de Vite
├── public/                      # Recursos estáticos públicos
├── uploads/                     # Directorio de subida de imágenes de productos
├── render.yaml                  # Blueprint de despliegue automatizado en Render
├── package.json                 # Scripts globales de compilación y orquestación
└── tsconfig.json                # Configuración TypeScript del Frontend
```
