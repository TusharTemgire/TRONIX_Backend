const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  addComment, getComments, deleteComment 
} = require('../controllers/commentController');

router.post('/', protect, addComment);
router.get('/:postId', protect, getComments);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;