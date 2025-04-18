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


const createDatabaseIfNotExists = async () => {

  const tempSequelize = new Sequelize(
    '', 
    process.env.DB_USER, 
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );

  try {
    await tempSequelize.authenticate();
    console.log('Connected to MySQL to create database');
    

    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' created successfully`);
    

    await tempSequelize.close();
    return true;
  } catch (error) {
    console.error('Failed to create database:', error.message);
    return false;
  }
};

const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    return { status: 'connected', message: 'Database connected successfully.' };
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    

    const unknownDatabaseError = error.original && 
      (error.original.code === 'ER_BAD_DB_ERROR' || error.original.errno === 1049);
    
    if (unknownDatabaseError) {
      console.log(`Database '${process.env.DB_NAME}' does not exist. Creating it now...`);
      
      const created = await createDatabaseIfNotExists();
      
      if (created) {

        try {
          await sequelize.authenticate();
          console.log('Connected to newly created database.');
          return { 
            status: 'connected', 
            message: `Database '${process.env.DB_NAME}' was created and connected successfully.` 
          };
        } catch (reconnectError) {
          return { 
            status: 'disconnected', 
            message: `Created database but failed to connect: ${reconnectError.message}` 
          };
        }
      }
    }
    
    return { status: 'disconnected', message: `Database connection failed: ${error.message}` };
  }
};

module.exports = { sequelize, checkDatabaseConnection };