import Recruiter from '../models/Recruiter.js';
import User from '../models/User.js'; // assuming you have a User model

export const addRecruiter = async (req, res) => {
  const { name, email: recruiterEmail, userEmail } = req.body;

  if (!name || !recruiterEmail || !userEmail) {
    return res.status(400).json({ success: false, message: "Name, recruiter email, and user email are required" });
  }

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const recruiter = await Recruiter.create({
      name,
      email: recruiterEmail,
      addedBy: user._id,
    });

    res.status(201).json({ success: true, recruiter });
  } catch (err) {
    console.error("Error adding recruiter:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUserRecruiters = async (req, res) => {
  const userEmail = req.query?.userEmail;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: "User email is required" });
  }

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const recruiters = await Recruiter.find({ addedBy: user._id }).sort({ createdAt: -1 });
    res.json({ success: true, recruiters });
  } catch (err) {
    console.error("Error fetching recruiters:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recruiters" });
  }
};
