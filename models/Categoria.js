const { DataTypes } = require('sequelize');
const sequelize = require('../database'); 
const Categoria = sequelize.define('Categoria', {

  id_categoria: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_categoria: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  
  }
}, {
  tableName: 'categoria', 
  timestamps: false       
});

module.exports = Categoria;