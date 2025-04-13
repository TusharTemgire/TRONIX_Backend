const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  
  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
  });
  
  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });
  
  // Send message
  socket.on('send_message', (message) => {
    io.to(`chat_${message.chatId}`).emit('receive_message', message);
  });
  
  // User typing
  socket.on('typing', ({ chatId, userId }) => {
    socket.to(`chat_${chatId}`).emit('user_typing', userId);
  });

    // User stopped typing
    socket.on('stop_typing', ({ chatId, userId }) => {
      socket.to(`chat_${chatId}`).emit('user_stop_typing', userId);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();