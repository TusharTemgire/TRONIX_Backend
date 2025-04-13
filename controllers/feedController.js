const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const { serverError } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get feed posts (from followed users + suggested posts)
exports.getFeed = async (req, res) => {
  try {
    // Pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get users that the current user follows
    const following = await Follow.findAll({
      where: { followerId: req.userId },
      attributes: ['followingId']
    });
    
    const followingIds = following.map(follow => follow.followingId);
    
    // Get followed users' posts
    let posts = [];
    if (followingIds.length > 0) {
      posts = await Post.findAll({
        where: {
          userId: { [Op.in]: followingIds }
        },
        include: [
          { 
            model: User, 
            as: 'user', 
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'isVerified'] 
          },
          { model: Like, attributes: ['userId'] },
          { 
            model: Comment,
            limit: 3,
            order: [['createdAt', 'DESC']],
            include: { model: User, as: 'user', attributes: ['id', 'username'] }
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    }
    
    // If not enough posts from followed users, add suggested posts
    if (posts.length < limit) {
      // Get additional posts from users not followed
      followingIds.push(req.userId); // Also exclude user's own posts
      
      const additionalPosts = await Post.findAll({
        where: {
          userId: { [Op.notIn]: followingIds }
        },
        include: [
          { 
            model: User, 
            as: 'user', 
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'isVerified'] 
          },
          { model: Like, attributes: ['userId'] },
          { 
            model: Comment,
            limit: 3,
            order: [['createdAt', 'DESC']],
            include: { model: User, as: 'user', attributes: ['id', 'username'] }
          }
        ],
        order: [
          ['engagementScore', 'DESC'], // Show high engagement posts first
          ['createdAt', 'DESC']
        ],
        limit: limit - posts.length
      });
      
      posts = [...posts, ...additionalPosts];
    }
    
    // Process each post to add user-specific info
    const processedPosts = await Promise.all(posts.map(async (post) => {
      // Check if current user liked this post
      const liked = post.Likes.some(like => like.userId === req.userId);
      
      // Check if current user saved this post
      const saved = await Bookmark.findOne({
        where: {
          userId: req.userId,
          postId: post.id
        }
      });
      
      // Count likes
      const likesCount = post.Likes.length;
      
      return {
        ...post.toJSON(),
        liked,
        saved: !!saved,
        likesCount,
        Likes: post.hideLikes ? [] : post.Likes // Hide likes if setting enabled
      };
    }));
    
    // Get suggested users to follow
    const suggested = await User.findAll({
      where: {
        id: {
          [Op.notIn]: [...followingIds, req.userId]
        }
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'isVerified'],
      order: sequelize.random(), // Random order for variety
      limit: 5
    });

    res.status(200).json({
      success: true,
      posts: processedPosts,
      suggestedUsers: suggested,
      hasMore: posts.length === limit
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get explore page (posts from users not followed, trending, etc.)
exports.getExplore = async (req, res) => {
  try {
    // Pagination parameters
    const limit = parseInt(req.query.limit) || 24; // More posts for grid view
    const offset = parseInt(req.query.offset) || 0;
    
    // Get users that the current user follows
    const following = await Follow.findAll({
      where: { followerId: req.userId },
      attributes: ['followingId']
    });
    
    const followingIds = following.map(follow => follow.followingId);
    followingIds.push(req.userId); // Also exclude user's own posts
    
    // Get posts from users not followed
    const posts = await Post.findAll({
      where: {
        userId: { [Op.notIn]: followingIds }
      },
      attributes: ['id', 'imageUrl', 'userId'],
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['username'] 
        }
      ],
      order: [
        ['engagementScore', 'DESC'], // High engagement posts first
        sequelize.literal('RAND()') // Random factor for variety
      ],
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      posts,
      hasMore: posts.length === limit
    });
  } catch (error) {
    serverError(res, error);
  }
};