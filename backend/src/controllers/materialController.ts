import { Request, Response } from 'express';
import { MaterialModel } from '../models/materialModel.js';
import { Product } from '../models/productModel.js';

export const getPublicMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const materials = await MaterialModel.findAll();
    res.status(200).json({ success: true, materials });
  } catch (error: any) {
    console.error('Error in getPublicMaterials:', error);
    res.status(500).json({ success: false, message: 'Error al obtener materiales.' });
  }
};

export const getAdminMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const materials = await MaterialModel.findAllAdmin();
    res.status(200).json({ success: true, materials });
  } catch (error: any) {
    console.error('Error in getAdminMaterials:', error);
    res.status(500).json({ success: false, message: 'Error al obtener materiales.' });
  }
};

export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, activo } = req.body;
    
    if (!nombre) {
      res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
      return;
    }

    const id = await MaterialModel.create({ nombre, activo });
    res.status(201).json({ success: true, message: 'Material creado exitosamente.', id });
  } catch (error: any) {
    console.error('Error in createMaterial:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ success: false, message: 'Ya existe un material con ese nombre o slug.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Error al crear material.' });
  }
};

export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID de material inválido.' });
      return;
    }

    const { nombre, slug, activo } = req.body;
    
    const updated = await MaterialModel.update(id, { nombre, slug, activo });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Material no encontrado.' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Material actualizado exitosamente.' });
  } catch (error: any) {
    console.error('Error in updateMaterial:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ success: false, message: 'Ya existe un material con ese nombre o slug.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Error al actualizar material.' });
  }
};

export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'ID de material inválido.' });
      return;
    }

    // Check if any products use it. If products use it, set their material_id to null, then delete.
    await Product.update({ material_id: null }, { where: { material_id: id } });

    const deleted = await MaterialModel.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Material no encontrado.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Material eliminado exitosamente.' });
  } catch (error: any) {
    console.error('Error in deleteMaterial:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar material.' });
  }
};
