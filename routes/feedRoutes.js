const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFeed, getExplore } = require('../controllers/feedController');

router.get('/', protect, getFeed);
router.get('/explore', protect, getExplore);

module.exports = router;