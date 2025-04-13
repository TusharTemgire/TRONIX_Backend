const Story = require('../models/Story');
const User = require('../models/User');
const Follow = require('../models/Follow');
const { serverError, notFoundError } = require('../utils/errorHandler');
const { s3, uploadStory } = require('../config/s3Config');
const { Op } = require('sequelize');

// Create a new story
exports.createStory = async (req, res) => {
  try {
    if (!req.file) {
      return validationError(res, 'Media is required');
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const story = await Story.create({
      userId: req.userId,
      mediaUrl: req.file.location,
      mediaType,
      expiresAt
    });

    res.status(201).json({
      success: true,
      story
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get stories for feed (from followed users and self)
exports.getFeedStories = async (req, res) => {
  try {
    // Get users that the current user follows
    const follows = await Follow.findAll({
      where: { followerId: req.userId },
      attributes: ['followingId']
    });

    const followingIds = follows.map(follow => follow.followingId);
    
    // Add current user's ID to get their stories too
    followingIds.push(req.userId);

    // Get active stories
    const stories = await Story.findAll({
      where: {
        userId: { [Op.in]: followingIds },
        expiresAt: { [Op.gt]: new Date() } // Only get stories that haven't expired
      },
      include: { 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username', 'firstName', 'lastName'] 
      },
      order: [['createdAt', 'DESC']]
    });

    // Group stories by user
    const storiesByUser = {};
    stories.forEach(story => {
      if (!storiesByUser[story.userId]) {
        storiesByUser[story.userId] = {
          user: story.user,
          stories: []
        };
      }
      storiesByUser[story.userId].stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt
      });
    });

    res.status(200).json({
      success: true,
      stories: Object.values(storiesByUser)
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get stories of a specific user
exports.getUserStories = async (req, res) => {
  try {
    const stories = await Story.findAll({
      where: {
        userId: req.params.userId,
        expiresAt: { [Op.gt]: new Date() } // Only get stories that haven't expired
      },
      include: { 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username', 'firstName', 'lastName'] 
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Delete a story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findByPk(req.params.id);

    if (!story) {
      return notFoundError(res, 'Story not found');
    }

    // Check if user owns the story
    if (story.userId !== req.userId) {
      return validationError(res, 'Not authorized to delete this story');
    }

    // Delete media from S3
    if (story.mediaUrl) {
      const key = story.mediaUrl.split('/').slice(3).join('/');
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      }).promise();
    }

    await story.destroy();

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    serverError(res, error);
  }
};