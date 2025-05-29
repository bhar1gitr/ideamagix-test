const Tag = require('../models/Tag')
const { logActivity } = require('../utils/logger');

exports.createTag = async (req, res) => {
    const tag = await Tag.create(req.body)
    await logActivity({
        user: req.user.id,
        action: 'Created Tag',
        route: req.originalUrl,
        method: req.method,
        details: req.body
    });
    res.status(201).json(tag)
}

exports.getTags = async (req, res) => {
    const tags = await Tag.find()
    res.json(tags)
}

exports.updateTag = async (req, res) => {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true })
    await logActivity({
        user: req.user.id,
        action: 'Updated Tag',
        route: req.originalUrl,
        method: req.method,
        details: req.body
    });
    res.json(tag)
}

exports.deleteTag = async (req, res) => {
    await Tag.findByIdAndDelete(req.params.id)
    await logActivity({
        user: req.user.id,
        action: 'Deleted Tag',
        route: req.originalUrl,
        method: req.method,
        details: req.body
    });
    res.json({ message: 'tag deleted' })
}