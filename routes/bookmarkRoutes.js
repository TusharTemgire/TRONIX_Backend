const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  savePost, unsavePost, getSavedPosts 
} = require('../controllers/bookmarkController');

router.post('/:postId', protect, savePost);
router.delete('/:postId', protect, unsavePost);
router.get('/', protect, getSavedPosts);

module.exports = router;