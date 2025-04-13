const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createChat, getUserChats, getChat 
} = require('../controllers/chatController');

router.post('/', protect, createChat);
router.get('/', protect, getUserChats);
router.get('/:id', protect, getChat);

module.exports = router;