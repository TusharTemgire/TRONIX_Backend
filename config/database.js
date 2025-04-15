const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);


const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    return { status: 'connected', message: 'Database connected successfully.' };
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    return { status: 'disconnected', message: `Database connection failed: ${error.message}` };
  }
};

module.exports = { sequelize, checkDatabaseConnection };