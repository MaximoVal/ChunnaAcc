import multer from 'multer';

// Configuración de almacenamiento en memoria para Multer (para convertir a Base64 y guardar en MySQL de forma persistente)
const storage = multer.memoryStorage();

// Filtro de validación para tipo de archivos (solo imágenes)
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (.jpeg, .png, .gif, .webp)'), false);
  }
};

// Middleware exportable de Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de tamaño: 10MB
  }
});
