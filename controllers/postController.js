const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const { serverError, notFoundError, validationError } = require('../utils/errorHandler');
const { s3, uploadPost } = require('../config/s3Config');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    // Image is uploaded via middleware and accessible at req.file
    if (!req.file) {
      return validationError(res, 'Image is required');
    }

    const post = await Post.create({
      userId: req.userId,
      imageUrl: req.file.location,
      caption: req.body.caption,
      location: req.body.location
    });

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get feed posts (from followed users)
exports.getFeedPosts = async (req, res) => {
  try {
    // This would need to be modified to include posts from followed users
    const posts = await Post.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: Like, attributes: ['id', 'userId'] },
        { 
          model: Comment,
          limit: 3,
          order: [['createdAt', 'DESC']],
          include: { model: User, as: 'user', attributes: ['id', 'username'] }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
      offset: parseInt(req.query.offset) || 0
    });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get a specific post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: Like, attributes: ['id', 'userId'] },
        { 
          model: Comment,
          include: { model: User, as: 'user', attributes: ['id', 'username'] }
        }
      ]
    });

    if (!post) {
      return notFoundError(res, 'Post not found');
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return notFoundError(res, 'Post not found');
    }

    // Check if user owns the post
    if (post.userId !== req.userId) {
      return validationError(res, 'Not authorized to delete this post');
    }

    // Delete image from S3
    if (post.imageUrl) {
      const key = post.imageUrl.split('/').slice(3).join('/');
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      }).promise();
    }

    await post.destroy();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return notFoundError(res, 'Post not found');
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      where: { userId: req.userId, postId: post.id }
    });

    if (existingLike) {
      return validationError(res, 'Post already liked');
    }

    // Create like
    await Like.create({
      userId: req.userId,
      postId: post.id
    });

    res.status(200).json({
      success: true,
      message: 'Post liked successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const like = await Like.findOne({
      where: { userId: req.userId, postId: req.params.id }
    });

    if (!like) {
      return notFoundError(res, 'Like not found');
    }

    await like.destroy();

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { userId: req.params.userId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: Like, attributes: ['id'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    serverError(res, error);
  }
};