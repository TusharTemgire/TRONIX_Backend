const { Chat, ChatParticipant } = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { serverError, notFoundError, validationError } = require('../utils/errorHandler');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    // participants should be an array of user IDs
    const { participants } = req.body;
    
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return validationError(res, 'Participants are required');
    }

    // Make sure the current user is included
    if (!participants.includes(req.userId)) {
      participants.push(req.userId);
    }

    // Check if participants exist
    const usersCount = await User.count({
      where: { id: { [Op.in]: participants } }
    });

    if (usersCount !== participants.length) {
      return notFoundError(res, 'One or more users do not exist');
    }

    // Check if a chat between these users already exists
    // This is more complex and would require a custom query in a real application
    
    const result = await sequelize.transaction(async (t) => {
      // Create the chat
      const chat = await Chat.create({}, { transaction: t });
      
      // Add participants
      const participantPromises = participants.map(userId => 
        ChatParticipant.create({
          ChatId: chat.id,
          UserId: userId
        }, { transaction: t })
      );
      
      await Promise.all(participantPromises);
      
      return chat;
    });

    // Fetch the created chat with participants
    const chat = await Chat.findByPk(result.id, {
      include: {
        model: User,
        attributes: ['id', 'username', 'firstName', 'lastName'],
        through: { attributes: [] }
      }
    });

    res.status(201).json({
      success: true,
      chat
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return notFoundError(res, 'User not found');
    }

    const chats = await user.getChats({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName'],
          through: { attributes: [] }
        },
        {
          model: Message,
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: { model: User, as: 'sender', attributes: ['id', 'username'] }
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    serverError(res, error);
  }
};

// Get a specific chat
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id, {
      include: {
        model: User,
        attributes: ['id', 'username', 'firstName', 'lastName'],
        through: { attributes: [] }
      }
    });

    if (!chat) {
      return notFoundError(res, 'Chat not found');
    }

    // Check if user is a participant
    const isParticipant = await ChatParticipant.findOne({
      where: { ChatId: chat.id, UserId: req.userId }
    });

    if (!isParticipant) {
      return validationError(res, 'Not authorized to access this chat');
    }

    // Get messages
    const messages = await Message.findAll({
      where: { chatId: chat.id },
      include: { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.status(200).json({
      success: true,
      chat,
      messages
    });
  } catch (error) {
    serverError(res, error);
  }
};