// const { Sequelize } = require('sequelize');
// require('dotenv').config();


// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: 'mysql',
//     logging: false,
//   }
// );


// const createDatabaseIfNotExists = async () => {

//   const tempSequelize = new Sequelize(
//     '', 
//     process.env.DB_USER, 
//     process.env.DB_PASSWORD,
//     {
//       host: process.env.DB_HOST,
//       dialect: 'mysql',
//       logging: false,
//     }
//   );

//   try {
//     await tempSequelize.authenticate();
//     console.log('Connected to MySQL to create database');
    

//     await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
//     console.log(`Database '${process.env.DB_NAME}' created successfully`);
    

//     await tempSequelize.close();
//     return true;
//   } catch (error) {
//     console.error('Failed to create database:', error.message);
//     return false;
//   }
// };

// const checkDatabaseConnection = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connected successfully.');
//     return { status: 'connected', message: 'Database connected successfully.' };
//   } catch (error) {
//     console.error('Unable to connect to the database:', error.message);
    

//     const unknownDatabaseError = error.original && 
//       (error.original.code === 'ER_BAD_DB_ERROR' || error.original.errno === 1049);
    
//     if (unknownDatabaseError) {
//       console.log(`Database '${process.env.DB_NAME}' does not exist. Creating it now...`);
      
//       const created = await createDatabaseIfNotExists();
      
//       if (created) {

//         try {
//           await sequelize.authenticate();
//           console.log('Connected to newly created database.');
//           return { 
//             status: 'connected', 
//             message: `Database '${process.env.DB_NAME}' was created and connected successfully.` 
//           };
//         } catch (reconnectError) {
//           return { 
//             status: 'disconnected', 
//             message: `Created database but failed to connect: ${reconnectError.message}` 
//           };
//         }
//       }
//     }
    
//     return { status: 'disconnected', message: `Database connection failed: ${error.message}` };
//   }
// };

// module.exports = { sequelize, checkDatabaseConnection };

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


const setupDatabaseAndUser = async () => {

  const rootSequelize = new Sequelize(
    '', 
    'root', 
    process.env.ROOT_PASSWORD || process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );

  try {
    await rootSequelize.authenticate();
    console.log('Connected to MySQL as root to set up database and user');

    await rootSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' created successfully`);
    
    try {

      const userCreationQuery = `
        CREATE USER IF NOT EXISTS '${process.env.DB_USER}'@'%' IDENTIFIED BY '${process.env.DB_PASSWORD}';
        GRANT ALL PRIVILEGES ON \`${process.env.DB_NAME}\`.* TO '${process.env.DB_USER}'@'%';
        FLUSH PRIVILEGES;
      `;
      
      await rootSequelize.query(userCreationQuery);
      console.log(`User '${process.env.DB_USER}' created/configured successfully`);
    } catch (userError) {
      console.error('Failed to create/configure user:', userError.message);

    }

    await rootSequelize.close();
    return true;
  } catch (error) {
    console.error('Failed to set up database and user:', error.message);

    return await createDatabaseIfNotExists();
  }
};

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
    
    const accessDeniedError = error.original &&
      (error.original.code === 'ER_ACCESS_DENIED_ERROR' || error.original.errno === 1045);
    
    if (unknownDatabaseError || accessDeniedError) {
      console.log(`Database or user issue detected. Setting up database and user...`);
      
      const created = await setupDatabaseAndUser();
      
      if (created) {
        try {
          await sequelize.authenticate();
          console.log('Connected to newly configured database.');
          return { 
            status: 'connected', 
            message: `Database and user were configured successfully.` 
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