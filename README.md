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

---

## 🛠️ Guía de Despliegue en Render (Paso a Paso Desde Cero)

### Paso 1: Subir los cambios a GitHub

Asegúrate de confirmar y enviar todos los cambios a tu repositorio de GitHub:

```bash
git add .
git commit -m "feat: refactor auth, case-insensitive queries, Resend SDK integration and deployment setup"
git push origin main
```

---

### Paso 2: Configurar la Base de Datos MySQL

Puedes utilizar cualquier proveedor de base de datos MySQL administrada en la nube (ej. **Aiven**, **Railway**, **TiDB Cloud**, **Clever Cloud**):

1. **Si es una Base de Datos Nueva:**
   * Abre la consola SQL de tu proveedor de base de datos.
   * Ejecuta todo el contenido del archivo [`backend/database.sql`](backend/database.sql).
2. **Si ya tienes una Base de Datos Existente con datos:**
   * Ejecuta el script de migración [`backend/migrate_otp_columns.sql`](backend/migrate_otp_columns.sql) para asegurar que la tabla `users` contenga las columnas de 2FA (`otp_code` y `otp_expires`).

---

### Paso 3: Crear el Servicio Web en Render

1. Ingresa a tu panel de **[Render Dashboard](https://dashboard.render.com/)**.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub (`ChunnaAcc`).
4. Configura los parámetros básicos del servicio:
   * **Name:** `chunna-accesorios`
   * **Region:** `Oregon (US West)` o la más cercana a tu base de datos.
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:**
     ```bash
     npm install --include=dev && npm run build
     ```
   * **Start Command:**
     ```bash
     npm start
     ```
   * **Plan:** `Free` (o el de tu preferencia).

---

### Paso 4: Configurar Variables de Entorno en Render

En la pestaña **Environment** de tu servicio web en Render, agrega las siguientes variables:

| Variable | Valor Requerido / Ejemplo | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Modo de producción de Node.js |
| `JWT_SECRET` | *Generar una clave larga y segura* (ej. `chunna_secret_2026_x89a...`) | Clave secreta para firmar tokens JWT |
| `JWT_EXPIRES_IN` | `365d` | Duración de la sesión de los usuarios |
| `ADMIN_EMAIL` | `cunna.accs@gmail.com` | Email oficial del Administrador |
| `DATABASE_URL` | `mysql://usuario:password@host.com:3306/defaultdb` | URL de conexión MySQL (Opción A) |
| `DB_SSL` | `true` | Habilitar SSL para conexiones seguras a MySQL |
| `RESEND_API_KEY` | `re_123456789abcdef...` | API Key obtenida en [Resend.com](https://resend.com) |
| `RESEND_FROM` | `Chunna Accesorios <onboarding@resend.dev>` | Remitente de los correos de verificación 2FA |
| `GEMINI_API_KEY` | *Tu API Key de Google AI Studio* | Clave gratis en [Google AI Studio](https://aistudio.google.com) |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Modelo de IA para análisis de imágenes |

> 💡 **Nota sobre Base de Datos:** Si tu proveedor no te da una `DATABASE_URL` completa, puedes configurar individualmente: `DB_HOST`, `DB_PORT` (3306), `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`chunna_db`) y `DB_SSL` (`true`).

---

### Paso 5: Desplegar y Verificar

1. Haz clic en **Create Web Service** (o **Manual Deploy** -> **Deploy latest commit**).
2. Render ejecutará la instalación de dependencias, compilará el Frontend con Vite (`dist/`), compilará el Backend TypeScript (`backend/dist/`) y levantará el servidor Node en el puerto asignado.
3. Puedes validar el estado del servidor accediendo a:
   ```text
   https://tu-servicio.onrender.com/api/status
   ```

---

## 👑 Acceso y Credenciales de Administrador

El sistema cuenta con una cuenta de Administrador principal sincronizada automáticamente al inicializar la base de datos:

* **Email:** `cunna.accs@gmail.com` (o `admin@chunna.com`)
* **Contraseña:** `2620070212`

### Flujo de Acceso 2FA para Administradores:
1. Ingresa las credenciales de administrador en la ventana de **Iniciar Sesión**.
2. El sistema detectará el rol `admin` y solicitará un **Código de Verificación de 6 dígitos**.
3. **Recepción del Código:**
   * **En Producción con Resend:** El código se envía automáticamente a la bandeja de entrada del correo.
   * **Modo de Rescate / Logs de Render:** Por seguridad y facilidad en desarrollo, el código OTP se imprime también en los logs de la consola de Render:
     ```text
     🔑 [ADMIN 2FA - CÓDIGO DE VERIFICACIÓN GENERADO]
        Destinatario: cunna.accs@gmail.com
        Código OTP:   >>> 847291 <<<
        Validez:      10 minutos
     ```
4. Ingresa el código de 6 dígitos para acceder al **Panel de Control de Administrador** (Estadísticas, Catálogo, Carga con IA, Pedidos y Clientes).

---

## 💻 Desarrollo Local

Para correr el proyecto localmente en tu máquina:

### 1. Clonar e instalar dependencias
```bash
# Instalar dependencias del frontend (raíz)
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..
```

### 2. Configurar variables locales
Copia el archivo `.env.example` a `.env` en la raíz (y/o dentro de `backend/.env`) con tus credenciales locales de MySQL y tus claves de API.

### 3. Iniciar en modo desarrollo
```bash
# Terminal 1: Backend con recarga automática
cd backend
npm run dev

# Terminal 2: Frontend con Vite HMR
npm run dev
```

---

## 📦 Scripts Disponibles

* `npm run build` — Compila tanto el Frontend (Vite) como el Backend (TypeScript).
* `npm run build:frontend` — Compila únicamente la aplicación React con Vite.
* `npm run build:backend` — Compila el código TypeScript del backend a JavaScript (`backend/dist`).
* `npm start` — Inicia el servidor de producción (`node backend/dist/server.js`).
