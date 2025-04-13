const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Post = require('./Post');

const Bookmark = sequelize.define('Bookmark', {}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId']
    }
  ]
});

Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Bookmark.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
User.hasMany(Bookmark, { foreignKey: 'userId' });
Post.hasMany(Bookmark, { foreignKey: 'postId' });

module.exports = Bookmark;