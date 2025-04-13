const Notification = require('../models/Notification');
const User = require('../models/User');
const { serverError } = require('../utils/errorHandler');

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await Notification.findAll({
      where: { userId: req.userId },
      include: {
        model: User,
        as: 'fromUser',
        attributes: ['id', 'username', 'profilePicture']
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Mark notifications as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.update(
        { read: true },
        { where: { id: notificationIds, userId: req.userId } }
      );
    } else {
      // Mark all notifications as read
      await Notification.update(
        { read: true },
        { where: { userId: req.userId, read: false } }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Create notification helper function
exports.createNotification = async (type, userId, fromUserId, content = null, resourceId = null, resourceType = null) => {
  try {
    await Notification.create({
      type,
      userId,
      fromUserId,
      content,
      resourceId,
      resourceType
    });
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};