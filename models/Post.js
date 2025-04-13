const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Post = sequelize.define('Post', {
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Adding hashtags field to store hashtags
  hashtags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('hashtags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('hashtags', JSON.stringify(value));
    }
  },
  // Adding tagged users
  taggedUsers: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('taggedUsers');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('taggedUsers', JSON.stringify(value));
    }
  },
  // Hide like count option
  hideLikes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Disable comments option
  disableComments: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // For algorithm ranking
  engagementScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  }
});

Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Post, { foreignKey: 'userId' });

module.exports = Post;