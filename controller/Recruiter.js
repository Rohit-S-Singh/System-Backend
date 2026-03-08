import Recruiter from '../models/Recruiter.js';
import User from '../models/User.js'; // assuming you have a User model

export const requestRecruiter = async (req, res) => {
  try {
 

    const email = req.params.email;   // email from param
    const recruiterData = req.body;   // recruiter form data


    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update recruiter flags
    user.isRecruiter = true;
    user.recruiterStatus = "Pending";

    // Store recruiter profile
    user.recruiterProfile = {
      companyName: recruiterData.companyName || "",
      position: recruiterData.position || "",
      experienceYears: recruiterData.experienceYears || "",
      website: recruiterData.website || "",
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Recruiter request submitted successfully",
      recruiterStatus: user.recruiterStatus,
    });

  } catch (err) {
    console.error("Error in requestRecruiter:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
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

export const createRecruiter = async (req, res) => {
  try {
    const { name, email, userEmail } = req.body;

    if (!name || !email || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "name, email, and userEmail are required",
      });
    }

    // 1️⃣ Find the user who is adding the recruiter
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided userEmail",
      });
    }

    // 2️⃣ Create recruiter with the user's ObjectId
    const recruiter = await Recruiter.create({
      name,
      email,
      addedBy: user._id,
      status: "No Response",
      sentAt: null
    });

    return res.status(201).json({
      success: true,
      message: "Recruiter created successfully",
      data: recruiter,
    });

  } catch (error) {
    console.error("Error creating recruiter:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

