const Activity = require('../models/Activity');

exports.logActivity = async (userId, action, details = '') => {
  try {
    await Activity.create({ user: userId, action, details });
  } catch (err) {
    console.error('Activity logging error:', err);
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(20).populate('user', 'name email role');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};
