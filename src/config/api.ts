/// <reference types="vite/client" />

/**
 * Configuración dinámica de la URL base del Backend para despliegue en Render y entorno local.
 */
export const getApiBaseUrl = (): string => {
  const metaEnv = (import.meta as any).env;

  // 1. Si existe la variable de entorno de Vite (ej. VITE_API_URL en Render Static Site)
  if (metaEnv && metaEnv.VITE_API_URL) {
    let url = (metaEnv.VITE_API_URL as string).trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  // 2. Si la aplicación está corriendo en el navegador y servida por el propio Express en Render
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/api`;
  }

  // 3. Entorno de desarrollo local por defecto
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * URL raíz del servidor (sin /api) para recursos estáticos como /uploads o /assets
 */
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Helper para construir la URL completa de una imagen de producto
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '/assets/im1.jpeg';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads')) {
    return `${SERVER_BASE_URL}${imagePath}`;
  }
  return imagePath;
};
