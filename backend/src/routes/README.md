# Carpeta de Rutas (/src/routes)

Aquí debes definir tus enrutadores de Express utilizando `express.Router()`. Cada archivo en este directorio representará un grupo de endpoints relacionados (ej. productos, usuarios, compras).

## Ejemplo de estructura de ruta (`productos.ts`):

```typescript
import { Router } from 'express';
import { getProductos, getProductoById } from '../controllers/productosController.js';

const router = Router();

// GET /api/productos
router.get('/', getProductos);

// GET /api/productos/:id
router.get('/:id', getProductoById);

export default router;
```

Una vez que definas tu ruta, deberás importarla y registrarla en el archivo `src/app.ts` usando:
`app.use('/api/productos', productoRouter);`
