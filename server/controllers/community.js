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


// Delete a community by ID
exports.deleteCommunity = async (req, res) => {
    try {
        // Find the community by ID and delete it
        console.log("dscsdv");
        const deletedCommunity = await Community.findByIdAndDelete(req.params.id);

        if (!deletedCommunity) {
            return res.status(404).json({
                status: 'fail',
                message: 'Community not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Community deleted successfully',
            data: {} // No content to return
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
