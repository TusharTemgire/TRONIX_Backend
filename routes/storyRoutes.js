const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadStory } = require('../config/s3Config');
const { 
  createStory, getFeedStories, getUserStories, deleteStory 
} = require('../controllers/storyController');

router.post('/', protect, uploadStory.single('media'), createStory);
router.get('/feed', protect, getFeedStories);
router.get('/user/:userId', protect, getUserStories);
router.delete('/:id', protect, deleteStory);

module.exports = router;