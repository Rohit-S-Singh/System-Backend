// communityController.js

const Community = require('../models/communitySchema');

// Create a new community
exports.createCommunity = async (req, res) => {
    try {
        const community = await Community.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                community
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Get all communities
exports.getAllCommunities = async (req, res) => {
    try {
        const communities = await Community.find();
        res.status(200).json({
            status: 'success',
            results: communities.length,
            data: {
                communities
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
