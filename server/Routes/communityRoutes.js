// communityRoutes.js

const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community');

// Route for creating a new community
router.post('/', communityController.createCommunity);

// Route for getting all communities
router.get('/', communityController.getAllCommunities);

module.exports = router;
