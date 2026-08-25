import { Request, Response } from 'express';
import { ProductModel } from '../models/productModel.js';

/**
 * Obtener listado de productos activos para la tienda
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.findAll();
    res.status(200).json({
      success: true,
      products
    });
  } catch (error: any) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los productos de la tienda.'
    });
  }
};
