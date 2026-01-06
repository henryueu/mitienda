const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Proveedor = sequelize.define('Proveedor', {
  id_proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_proveedor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  calle: DataTypes.STRING,
  numero: DataTypes.STRING,
  colonia: DataTypes.STRING,
  codigo_postal: DataTypes.STRING,
  telefono: DataTypes.STRING
}, {
  tableName: 'PROVEEDOR',
  timestamps: false
});

module.exports = Proveedor;