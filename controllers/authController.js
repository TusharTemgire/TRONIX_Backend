const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationError, serverError } = require('../utils/errorHandler');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return validationError(res, 'Passwords do not match');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return validationError(res, 'Email already exists');
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return validationError(res, 'Username already exists');
    }

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return validationError(res, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return validationError(res, 'Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};