const mongoose = require('mongoose')

const tagSchema = new mongoose.Schema({
    name: String,
    color: String
})

module.exports = mongoose.model('Tag', tagSchema);