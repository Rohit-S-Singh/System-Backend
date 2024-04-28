// communityController.js

const Community = require('../models/communitySchema');
const User = require('../models/user')

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



// Join a community
exports.joinCommunity = async (req, res) => {
    try {
        const communityId = req.params.id;
        const userId = req.body.userId; // Assuming you send the user ID in the request body

        // Find the community by ID
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({
                status: 'fail',
                message: 'Community not found'
            });
        }

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Check if the user is already a member of the community
        if (community.members.includes(userId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'User is already a member of this community'
            });
        }

        // Add the user to the community's members
        community.members.push(userId);
        await community.save();

        res.status(200).json({
            status: 'success',
            message: 'User joined the community successfully',
            data: {
                community
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};