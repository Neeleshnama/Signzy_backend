const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/authMiddleware'), authController.getMe);

module.exports = router;