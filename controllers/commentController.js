const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { serverError, notFoundError, validationError } = require('../utils/errorHandler');

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    
    if (!content) {
      return validationError(res, 'Comment content is required');
    }
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return notFoundError(res, 'Post not found');
    }
    
    // Check if comments are disabled
    if (post.disableComments) {
      return validationError(res, 'Comments are disabled for this post');
    }
    
    // Create comment
    const comment = await Comment.create({
      postId,
      userId: req.userId,
      content
    });
    
    // Get comment with user info
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'profilePicture']
      }
    });
    
    // Increase post engagement score
    await post.update({
      engagementScore: post.engagementScore + 0.5
    });
    
    res.status(201).json({
      success: true,
      comment: commentWithUser
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Check if post exists
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return notFoundError(res, 'Post not found');
    }
    
    // Check if comments are disabled
    if (post.disableComments) {
      return validationError(res, 'Comments are disabled for this post');
    }
    
    // Get comments
    const comments = await Comment.findAndCountAll({
      where: { postId },
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'profilePicture', 'isVerified']
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    res.status(200).json({
      success: true,
      comments: comments.rows,
      count: comments.count,
      hasMore: offset + limit < comments.count
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return notFoundError(res, 'Comment not found');
    }
    
    // Check if user owns the comment
    if (comment.userId !== req.userId) {
      // Check if user owns the post
      const post = await Post.findByPk(comment.postId);
      if (post.userId !== req.userId) {
        return validationError(res, 'Not authorized to delete this comment');
      }
    }
    
    await comment.destroy();
    
    // Update post engagement score
    const post = await Post.findByPk(comment.postId);
    await post.update({
      engagementScore: Math.max(0, post.engagementScore - 0.5)
    });
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};