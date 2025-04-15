const express = require('express');
const cors = require('cors');
const { sequelize, checkDatabaseConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);


app.get('/api/db-status', async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  res.json(dbStatus);
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (dbStatus.status === 'disconnected') {
      console.error('Server startup aborted due to database connection failure.');
      process.exit(1); 
    }


    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');


    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();