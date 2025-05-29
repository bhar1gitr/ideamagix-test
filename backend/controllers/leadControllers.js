const Lead = require('../models/Leads')
const { logActivity } = require('../utils/logger');

exports.createLead = async (req,res) => {
    const lead = await Lead.create(req.body)
    await logActivity({
      user: req.user.id,
      action: 'Created Lead',
      route: req.originalUrl,
      method: req.method,
      details: req.body
    });
    res.status(201).json(lead)
}

exports.getLeads = async (req,res) => {
    const leads = await Lead.find().populate('tags assignedTo')
    res.json(leads)
}

exports.updateLead = async (req,res) => {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {new:true})
    await logActivity({
      user: req.user.id,
      action: 'Updated Lead',
      route: req.originalUrl,
      method: req.method,
      details: req.body
    });
    res.json(lead)
}

exports.deleteLead = async (req, res) => {
    const lead = await Lead.findByIdAndDelete(req.params.id)
    await logActivity({
      user: req.user.id,
      action: 'Deleted Lead',
      route: req.originalUrl,
      method: req.method,
      details: req.body
    });
    res.json({message:"lead deleted"})
}