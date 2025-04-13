const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  type: {
    type: DataTypes.ENUM('like', 'comment', 'follow', 'mention', 'tag'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the resource (post, comment, etc.)'
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of the resource (post, comment, etc.)'
  },
});

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });

User.hasMany(Notification, { foreignKey: 'userId' });

module.exports = Notification;