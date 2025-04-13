const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../config/s3Config');
const { 
  getUserProfile, getUserPosts, updateProfile, 
  followUser, unfollowUser, getFollowers, 
  getFollowing, searchUsers, getSuggestedUsers 
} = require('../controllers/userController');

// Profile routes
router.get('/profile/:username', protect, getUserProfile);
router.get('/posts/:username', protect, getUserPosts);
router.put('/profile', protect, uploadAvatar.single('profilePicture'), updateProfile);

// Follow routes
router.post('/follow/:userId', protect, followUser);
router.delete('/follow/:userId', protect, unfollowUser);
router.get('/followers/:username', protect, getFollowers);
router.get('/following/:username', protect, getFollowing);

// Search and discovery
router.get('/search', protect, searchUsers);
router.get('/suggested', protect, getSuggestedUsers);

module.exports = router;