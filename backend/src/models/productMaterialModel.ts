import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

export class ProductMaterial extends Model {
  declare product_id: number;
  declare material_id: number;
}

ProductMaterial.init(
  {
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    material_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'materials',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    sequelize,
    tableName: 'product_materials',
    timestamps: false
  }
);

export default ProductMaterial;
