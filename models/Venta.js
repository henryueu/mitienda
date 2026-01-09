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
    defaultValue: DataTypes.NOW 
  },
  monto_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'venta',
  timestamps: false
});

module.exports = Venta;