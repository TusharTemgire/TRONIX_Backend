const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const feedRoutes = require('./routes/feedRoutes');
const commentRoutes = require('./routes/commentRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

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
app.use('/api/users', userRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);

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
  
  // For notifications
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  // When a user gets a like, comment, follow, etc.
  socket.on('notify_user', ({ userId, notification }) => {
    socket.to(`user_${userId}`).emit('user_notification', notification);
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

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();