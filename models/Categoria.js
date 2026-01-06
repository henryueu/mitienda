const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Importamos la conexión que acabas de arreglar

// Definimos el modelo "Categoria"
const Categoria = sequelize.define('Categoria', {
  // Aquí mapeamos las columnas exactas de tu tabla en Neon
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
    // allow_null es true por defecto, así que no es obligatorio ponerlo
  }
}, {
  tableName: 'categoria', // ¡Importante! El nombre real de la tabla en tu BD (puede ser mayúsculas o minúsculas)
  timestamps: false       // Le decimos que no busque columnas createdAt/updatedAt
});

module.exports = Categoria;