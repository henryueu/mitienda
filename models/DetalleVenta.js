const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Venta = require('./Venta');
const Producto = require('./Producto');

const DetalleVenta = sequelize.define('DetalleVenta', {
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_venta: {
    type: DataTypes.INTEGER,
    references: {
      model: 'VENTA',
      key: 'id_venta'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    references: {
      model: 'PRODUCTO',
      key: 'id_producto'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'detalle_venta',
  timestamps: false
});

// Relaciones: Una Venta tiene muchos Detalles
Venta.hasMany(DetalleVenta, { foreignKey: 'id_venta' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'id_venta' });

module.exports = DetalleVenta;