const mongoose = require('mongoose');

// Define schema for message
const messageSchema = new mongoose.Schema({
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Create model based on schema
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
