const { Sequelize } = require('sequelize');

// IMPORTANTE: Aquí debes poner TU cadena de conexión de Render (la que empieza con postgres://...)
// Si la tienes en una variable de entorno, úsala así: process.env.DATABASE_URL
const sequelize = new Sequelize('postgresql://neondb_owner:npg_HYmkhXM1yW7g@ep-nameless-wildflower-adt2ir8f-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require', {
  dialect: 'postgres',
  logging: false, // Para que no llene la consola de mensajes SQL
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Necesario para Neon/Render
    }
  }
});

module.exports = sequelize;