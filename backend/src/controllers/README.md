# Carpeta de Controladores (/src/controllers)

Aquí debes escribir las funciones controladoras de Express. Los controladores se encargan de manejar las peticiones HTTP (`Request`), procesar la lógica de negocio básica (a menudo llamando al Modelo correspondiente) y retornar la respuesta HTTP (`Response`).

## Ejemplo de estructura de controlador (`productosController.ts`):

```typescript
import { Request, Response } from 'express';
import * as ProductoModel from '../models/productoModel.js';

export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await ProductoModel.getAll();
    res.json(productos);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Error al obtener los productos de la base de datos.',
      details: error.message 
    });
  }
};
```
