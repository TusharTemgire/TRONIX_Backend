const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadPost } = require('../config/s3Config');
const { 
  createPost, getFeedPosts, getPost, deletePost, 
  likePost, unlikePost, getUserPosts 
} = require('../controllers/postController');

router.post('/', protect, uploadPost.single('image'), createPost);
router.get('/feed', protect, getFeedPosts);
router.get('/user/:userId', protect, getUserPosts);
router.get('/:id', protect, getPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);

module.exports = router;