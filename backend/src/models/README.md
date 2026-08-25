# Carpeta de Modelos (/src/models)

Aquí debes definir la interacción con la base de datos MySQL (por ejemplo, consultas `SELECT`, `INSERT`, `UPDATE`, `DELETE`). Importarás el objeto `pool` desde `../config/db.js`.

## Ejemplo de estructura de modelo (`productoModel.ts`):

```typescript
import pool from '../config/db.js';

export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  imagen: string;
  descripcion?: string;
}

// Obtener todos los productos
export const getAll = async (): Promise<Producto[]> => {
  const [rows] = await pool.query('SELECT * FROM productos');
  return rows as Producto[];
};

// Insertar un nuevo producto
export const create = async (producto: Producto): Promise<number> => {
  const { nombre, precio, imagen, descripcion } = producto;
  const [result] = await pool.query(
    'INSERT INTO productos (nombre, precio, imagen, descripcion) VALUES (?, ?, ?, ?)',
    [nombre, precio, imagen, descripcion]
  );
  return (result as any).insertId;
};
```
