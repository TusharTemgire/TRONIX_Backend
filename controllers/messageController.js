const Message = require('../models/Message');
const { Chat, ChatParticipant } = require('../models/Chat');
const { serverError, notFoundError, validationError } = require('../utils/errorHandler');
const { uploadMessage } = require('../config/s3Config');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    
    // Check if chat exists
    const chat = await Chat.findByPk(chatId);
    
    if (!chat) {
      return notFoundError(res, 'Chat not found');
    }
    
    // Check if user is part of the chat
    const isParticipant = await ChatParticipant.findOne({
      where: { ChatId: chatId, UserId: req.userId }
    });
    
    if (!isParticipant) {
      return validationError(res, 'Not a participant of this chat');
    }

    let mediaUrl = null;
    let mediaType = null;
    
    // If media is included
    if (req.file) {
      mediaUrl = req.file.location;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    } else if (!content) {
      return validationError(res, 'Either content or media is required');
    }
    
    // Create the message
    const message = await Message.create({
      chatId,
      senderId: req.userId,
      content,
      mediaUrl,
      mediaType
    });
    
    // Update chat's lastMessageAt
    await chat.update({ lastMessageAt: new Date() });
    
    // This is where we'd emit a socket event in a real application
    
    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get messages for a chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { before } = req.query;
    
    // Check if chat exists
    const chat = await Chat.findByPk(chatId);
    
    if (!chat) {
      return notFoundError(res, 'Chat not found');
    }
    
    // Check if user is part of the chat
    const isParticipant = await ChatParticipant.findOne({
      where: { ChatId: chatId, UserId: req.userId }
    });
    
    if (!isParticipant) {
      return validationError(res, 'Not a participant of this chat');
    }
    
    // Prepare query
    const query = {
      where: { chatId },
      include: { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] },
      order: [['createdAt', 'DESC']],
      limit: 20
    };
    
    // If pagination is requested
    if (before) {
      query.where.createdAt = { [Op.lt]: new Date(before) };
    }
    
    const messages = await Message.findAll(query);
    
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return validationError(res, 'Message IDs are required');
    }
    
    // Get messages
    const messages = await Message.findAll({
      where: { id: { [Op.in]: messageIds } }
    });
    
    // Check if messages exist and belong to chats where the user is a participant
    for (const message of messages) {
      const isParticipant = await ChatParticipant.findOne({
        where: { ChatId: message.chatId, UserId: req.userId }
      });
      
      if (!isParticipant) {
        return validationError(res, 'Not authorized to mark these messages as read');
      }
      
      // Only mark as read if the user is not the sender
      if (message.senderId !== req.userId) {
        await message.update({ read: true });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    serverError(res, error);
  }
};