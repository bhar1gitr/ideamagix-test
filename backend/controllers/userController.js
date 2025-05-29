const User = require('../models/User')
const { logActivity } = require('../utils/logger');

exports.createUser = async (req, res) => {
    const user = await User.create(req.body);
    await logActivity({
        user: req.user.id,
        action: 'Created User',
        route: req.originalUrl,
        method: req.method,
        details: req.body
    });
    res.status(201).json(user)
}

exports.getUsers = async (req, res) => {
    const users = await User.find().select('-password')
    res.json(users)
}

exports.updateUser = async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    await logActivity({
        user: req.user.id,
        action: 'Updated User',
        route: req.originalUrl,
        method: req.method,
        details: req.body
    });
    res.json(user)
}

exports.deleteUser = async (req, res) => {
    await User.findByIdAndDelete(req.params.id)
    await logActivity({
        user: req.user.id,
        action: 'Deleted User',
        route: req.originalUrl,
        method: req.method,
        details: req.body
    });
    res.json({ message: "user deleted" })
}