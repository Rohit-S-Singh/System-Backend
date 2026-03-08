// controllers/adminRequests.js
import User from "../models/User.js";

// Get all pending mentor/recruiter requests
export const getPendingRequests = async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { mentorStatus: "Pending" },
        { recruiterStatus: "Pending" },
      ],
    }).select("name email mentorStatus recruiterStatus");

    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Handle approve/decline request
export const handleRequestAction = async (req, res) => {
  const { userId, role, action } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (role === "mentor") {
      user.mentorStatus = action === "accept" ? "You Are A Mentor" : "Become a Mentor";
      user.isMentor = action === "accept";
    } else if (role === "recruiter") {
      user.recruiterStatus = action === "accept" ? "You Are A Recruiter" : "Become a Recruiter";
      user.isRecruiter = action === "accept";
    } else {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error handling request action:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
