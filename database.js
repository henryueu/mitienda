const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgresql://neondb_owner:npg_HYmkhXM1yW7g@ep-nameless-wildflower-adt2ir8f-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require', {
  dialect: 'postgres',
  logging: false, 
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    }
  }
});

module.exports = sequelize;