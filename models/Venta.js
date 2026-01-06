const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Venta = sequelize.define('Venta', {
  id_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW // Guarda la fecha/hora actual automáticamente
  },
  monto_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'VENTA',
  timestamps: false
});

module.exports = Venta;