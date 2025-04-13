const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Story = sequelize.define('Story', {
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video'),
    defaultValue: 'image',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
});

Story.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Story, { foreignKey: 'userId' });

module.exports = Story;