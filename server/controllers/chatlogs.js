// messageController.js
const Chatlogs = require('../models/chatlogs');

exports.createMessage = async (data) => {
    try {
        const { communityId, userId, content } = data;
        const message = new Chatlogs({ communityId, userId, content });
        await message.save();
        // res.status(201).json({message,message:"Message saved successful!"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Chatlogs.find();
        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};


