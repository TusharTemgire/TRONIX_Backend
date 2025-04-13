const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadMessage } = require('../config/s3Config');
const { 
  sendMessage, getChatMessages, markAsRead 
} = require('../controllers/messageController');

router.post('/', protect, uploadMessage.single('media'), sendMessage);
router.get('/chat/:chatId', protect, getChatMessages);
router.patch('/read', protect, markAsRead);

module.exports = router;