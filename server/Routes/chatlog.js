// messageRouter.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/chatlogs');

// Route for creating a new message
router.post('/', messageController.createMessage);

// Route for getting all chat logs
router.get('/', messageController.getAllMessages);


module.exports = router;
