import User from '../models/User.js';


// Route to save follow-up template by email
const saveFollowUpTemplate = async (req, res) => {
    try {
        const { email, followupTemplate } = req.body;

        if (!email || !followupTemplate) {
            return res.status(400).json({ message: 'Email and follow-up template are required.' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Ensure followupTemplate is an array
        if (!Array.isArray(user.followupTemplate)) {
            user.followupTemplate = [];
        }

        // Add the new follow-up template to the array
        user.followupTemplate.push(followupTemplate);
        await user.save();

        res.status(200).json({ message: 'Follow-up template saved successfully.', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Route to fetch all follow-up templates of a specific user by email
const fetchFollowUpTemplate = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        // Find the user by email
        const user = await User.findOne({ email }, 'followupTemplate');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ followupTemplates: user.followupTemplate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


export { saveFollowUpTemplate, fetchFollowUpTemplate };