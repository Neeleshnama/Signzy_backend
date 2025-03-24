const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Search users
router.get('/search', friendController.searchUsers);

// Friend requests
router.post('/requests', friendController.sendFriendRequest);
router.get('/requests', friendController.getFriendRequests);
router.put('/requests/:requestId', friendController.respondToFriendRequest);

// Friends
router.get('/', friendController.getFriends);
router.delete('/:friendId', friendController.removeFriend);

// Recommendations
router.get('/recommendations', friendController.getFriendRecommendations);

module.exports = router;