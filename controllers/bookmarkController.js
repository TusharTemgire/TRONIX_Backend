const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');
const User = require('../models/User');
const { serverError, notFoundError, validationError } = require('../utils/errorHandler');

// Save post (bookmark)
exports.savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return notFoundError(res, 'Post not found');
    }
    
    // Check if already saved
    const existingBookmark = await Bookmark.findOne({
      where: { userId: req.userId, postId }
    });
    
    if (existingBookmark) {
      return validationError(res, 'Post already saved');
    }
    
    // Create bookmark
    await Bookmark.create({
      userId: req.userId,
      postId
    });
    
    res.status(200).json({
      success: true,
      message: 'Post saved successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Unsave post (remove bookmark)
exports.unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const bookmark = await Bookmark.findOne({
      where: { userId: req.userId, postId }
    });
    
    if (!bookmark) {
      return notFoundError(res, 'Bookmark not found');
    }
    
    await bookmark.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Post unsaved successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const offset = parseInt(req.query.offset) || 0;
    
    const bookmarks = await Bookmark.findAll({
      where: { userId: req.userId },
      include: {
        model: Post,
        as: 'post',
        include: { 
          model: User, 
          as: 'user',
          attributes: ['id', 'username', 'profilePicture', 'isVerified']
        }
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Extract posts from bookmarks
    const posts = bookmarks.map(bookmark => bookmark.post);
    
    res.status(200).json({
      success: true,
      posts,
      hasMore: bookmarks.length === limit
    });
  } catch (error) {
    serverError(res, error);
  }
};