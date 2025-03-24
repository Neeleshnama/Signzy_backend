const User = require('../models/User');

const getRecommendations = async (userId) => {
  try {
    // Get current user's friends
    const user = await User.findById(userId).populate('friends');
    const userFriends = user.friends.map(friend => friend._id.toString());

    // Find friends of friends (mutual connections)
    const friendsOfFriends = await User.aggregate([
      { $match: { _id: { $in: user.friends } } },
      { $unwind: '$friends' },
      { $match: { friends: { $ne: userId, $nin: user.friends } } },
      { $group: { _id: '$friends', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $project: {
          _id: 1,
          username: '$userDetails.username',
          mutualFriends: '$count'
        }
      }
    ]);

    return friendsOfFriends;
  } catch (err) {
    throw err;
  }
};

module.exports = { getRecommendations };