const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/Activity');
const auth = require('../middleware/auth');

router.use(auth)

router.get('/', auth, async (req, res) => {
  const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
  res.json(logs)
});

module.exports = router;
