const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Categoria = require('./Categoria'); 

const Producto = sequelize.define('Producto', {
  id_producto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_producto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  marca: DataTypes.STRING,
  precio_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_categoria: {
    type: DataTypes.INTEGER,
 
    references: {
      model: Categoria,
      key: 'id_categoria'
    }
  }
}, {
  tableName: 'producto',
  timestamps: false
});

Producto.belongsTo(Categoria, { foreignKey: 'id_categoria' });
Categoria.hasMany(Producto, { foreignKey: 'id_categoria' });

module.exports = Producto;