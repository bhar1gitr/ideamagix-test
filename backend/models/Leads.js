const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    source: String,
    status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Won'], default: 'New'},
    tags: [{type:mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    notes: [{ text:String, createdAt:Date}],
    assignedTo: {type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, {timestamps:true})

module.exports = mongoose.model('Lead', leadSchema);