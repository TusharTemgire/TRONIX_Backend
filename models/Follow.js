const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Follow = sequelize.define('Follow', {}, {
  indexes: [
    {
      unique: true,
      fields: ['followerId', 'followingId']
    }
  ]
});

Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

module.exports = Follow;