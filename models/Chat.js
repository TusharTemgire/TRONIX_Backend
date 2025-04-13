const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Chat = sequelize.define('Chat', {
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const ChatParticipant = sequelize.define('ChatParticipant', {});

Chat.belongsToMany(User, { through: ChatParticipant });
User.belongsToMany(Chat, { through: ChatParticipant });

module.exports = { Chat, ChatParticipant };