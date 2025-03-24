const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { getRecommendations } = require('../utils/reccomendations');

// Search users
const searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.userId },
    }).select('username');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send friend request
const sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;

  try {
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    const user = await User.findById(req.userId);
    if (user.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      sender: req.userId,
      recipient: recipientId,
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Create new request
    const friendRequest = new FriendRequest({
      sender: req.userId,
      recipient: recipientId,
    });

    await friendRequest.save();

    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get friend requests
const getFriendRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      recipient: req.userId,
      status: 'pending',
    }).populate('sender', 'username');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Respond to friend request
const respondToFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // 'accept' or 'reject'

  try {
    const request = await FriendRequest.findById(requestId);

    if (!request || request.recipient.toString() !== req.userId.toString()) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    if (action === 'accept') {
      // Add each other as friends
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { friends: request.sender },
      });

      await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: req.userId },
      });

      request.status = 'accepted';
    } else {
      request.status = 'rejected';
    }

    await request.save();

    res.json({ message: `Friend request ${action}ed` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get friend list
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username');
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove friend
const removeFriend = async (req, res) => {
  const { friendId } = req.params;

  try {
    // Remove from both users' friend lists
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId },
    });

    // Delete any friend requests between them
    await FriendRequest.deleteMany({
      $or: [
        { sender: req.userId, recipient: friendId },
        { sender: friendId, recipient: req.userId },
      ],
    });

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get friend recommendations
const getFriendRecommendations = async (req, res) => {
  try {
    const recommendations = await getRecommendations(req.userId);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  respondToFriendRequest,
  getFriends,
  removeFriend,
  getFriendRecommendations,
};