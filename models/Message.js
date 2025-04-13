const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const { Chat } = require('./Chat');

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
User.hasMany(Message, { foreignKey: 'senderId' });
Chat.hasMany(Message, { foreignKey: 'chatId' });

module.exports = Message;