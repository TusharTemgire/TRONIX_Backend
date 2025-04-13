const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { serverError, notFoundError, validationError } = require('../utils/errorHandler');
const { uploadAvatar } = require('../config/s3Config');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      where: { username },
      attributes: [
        'id', 'username', 'firstName', 'lastName', 'bio', 
        'profilePicture', 'website', 'isPrivate', 'isVerified', 'createdAt'
      ]
    });

    if (!user) {
      return notFoundError(res, 'User not found');
    }

    // Get posts count
    const postsCount = await Post.count({ where: { userId: user.id } });

    // Get followers count
    const followersCount = await Follow.count({ 
      where: { followingId: user.id } 
    });

    // Get following count
    const followingCount = await Follow.count({
      where: { followerId: user.id }
    });

    // Check if the current user follows this user
    let isFollowing = false;
    if (req.userId) {
      const followRecord = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: user.id
        }
      });
      isFollowing = !!followRecord;
    }

    // Check if this user follows the current user
    let followsYou = false;
    if (req.userId) {
      const followRecord = await Follow.findOne({
        where: {
          followerId: user.id,
          followingId: req.userId
        }
      });
      followsYou = !!followRecord;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        postsCount,
        followersCount,
        followingCount,
        isFollowing,
        followsYou
      }
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get user posts (grid view)
exports.getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    // Check if the user is private and not followed by current user
    if (user.isPrivate && user.id !== req.userId) {
      const isFollower = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: user.id
        }
      });

      if (!isFollower) {
        return validationError(res, 'This account is private');
      }
    }

    const posts = await Post.findAll({
      where: { userId: user.id },
      attributes: ['id', 'imageUrl', 'createdAt'],
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

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    const { firstName, lastName, bio, website, username, isPrivate } = req.body;
    
    // Check if username is taken (if being updated)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return validationError(res, 'Username is already taken');
      }
    }

    // If profile picture is uploaded
    if (req.file) {
      user.profilePicture = req.file.location;
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (username) user.username = username;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        website: user.website,
        isPrivate: user.isPrivate,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const userToFollow = await User.findByPk(userId);
    
    if (!userToFollow) {
      return notFoundError(res, 'User not found');
    }

    // Check if user is trying to follow themselves
    if (req.userId.toString() === userId) {
      return validationError(res, 'You cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      where: { followerId: req.userId, followingId: userId }
    });

    if (existingFollow) {
      return validationError(res, 'Already following this user');
    }

    // Create follow relationship
    await Follow.create({
      followerId: req.userId,
      followingId: userId
    });

    res.status(200).json({
      success: true,
      message: `You are now following ${userToFollow.username}`
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const userToUnfollow = await User.findByPk(userId);
    
    if (!userToUnfollow) {
      return notFoundError(res, 'User not found');
    }

    // Check if actually following
    const followRecord = await Follow.findOne({
      where: { followerId: req.userId, followingId: userId }
    });

    if (!followRecord) {
      return validationError(res, 'You are not following this user');
    }

    // Delete follow relationship
    await followRecord.destroy();

    res.status(200).json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.username}`
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get user's followers
exports.getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    const followers = await Follow.findAll({
      where: { followingId: user.id },
      include: {
        model: User,
        as: 'follower',
        attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
      }
    });

    // For each follower, check if current user follows them
    const enhancedFollowers = await Promise.all(followers.map(async (follow) => {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: follow.follower.id
        }
      });
      
      return {
        ...follow.follower.toJSON(),
        isFollowing: !!isFollowing
      };
    }));

    res.status(200).json({
      success: true,
      followers: enhancedFollowers
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get users the user is following
exports.getFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    const following = await Follow.findAll({
      where: { followerId: user.id },
      include: {
        model: User,
        as: 'following',
        attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
      }
    });

    // For each user being followed, check if current user follows them
    const enhancedFollowing = await Promise.all(following.map(async (follow) => {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: follow.following.id
        }
      });
      
      return {
        ...follow.following.toJSON(),
        isFollowing: !!isFollowing
      };
    }));

    res.status(200).json({
      success: true,
      following: enhancedFollowing
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return validationError(res, 'Search query is required');
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { firstName: { [Op.like]: `%${query}%` } },
          { lastName: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'isVerified'],
      limit: 20
    });

    // Check if current user follows each result
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const isFollowing = await Follow.findOne({
        where: {
          followerId: req.userId,
          followingId: user.id
        }
      });
      
      return {
        ...user.toJSON(),
        isFollowing: !!isFollowing
      };
    }));

    res.status(200).json({
      success: true,
      users: enhancedUsers
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get suggested users (not followed by current user)
exports.getSuggestedUsers = async (req, res) => {
  try {
    // Get users that current user follows
    const following = await Follow.findAll({
      where: { followerId: req.userId },
      attributes: ['followingId']
    });

    const followingIds = following.map(follow => follow.followingId);
    followingIds.push(req.userId); // Add current user to exclude from suggestions

    // Find users not followed by current user
    const suggestedUsers = await User.findAll({
      where: {
        id: { [Op.notIn]: followingIds }
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'isVerified'],
      order: sequelize.random(), // Random order for variety
      limit: 5
    });

    res.status(200).json({
      success: true,
      suggestedUsers
    });
  } catch (error) {
    serverError(res, error);
  }
};