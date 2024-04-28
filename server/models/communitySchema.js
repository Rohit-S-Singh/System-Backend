const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Assuming 'User' is the name of your user model
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
