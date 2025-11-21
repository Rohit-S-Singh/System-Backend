
import User from '../models/User.js';

// 📌 Controller: Get All Approved Mentors
const getAllMentors = async (req, res) => {
  try {

    console.log("12345666666666666666");
    
    // Find all users whose mentorStatus is "You Are A Mentor"
    const mentors = await User.find(
      { mentorStatus: "You Are A Mentor" },
      { name: 1, email: 1, picture: 1 } // return only required fields
    );

    // Format the response
    const result = mentors.map(m => ({
      name: m.name,
      email: m.email,
      avatar: m.picture || "",
    }));

    res.status(200).json({
      success: true,
      total: result.length,
      mentors: result
    });

  } catch (err) {
    console.error("❌ Error fetching approved mentors:", err);
    res.status(500).json({
      success: false,
      message: "Server Error while fetching mentors"
    });
  }
};







// POST /api/mentors/request-mentor/:email

const requestMentor = async (req, res) => {
  try {

console.log("Full Params:", req.params);
console.log("URL:", req.originalUrl);


    console.log("Mentor request received...");

    const email = req.params.email; // <-- email from URL
    const mentorProfile = req.body; // <-- mentor form data

    console.log("Email:", email);
    console.log("Mentor Data:", mentorProfile);

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update mentor fields
    user.isMentor = true;
    user.mentorStatus = "Pending";

    // (Optional) Save mentor profile if needed
    user.mentorProfile = {
      expertise: mentorProfile.expertise || "",
      experienceYears: mentorProfile.experienceYears || "",
      linkedIn: mentorProfile.linkedIn || "",
      availability: mentorProfile.availability || "",
      description: mentorProfile.description || "",
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Mentor request submitted successfully",
      mentorStatus: user.mentorStatus,
    });
  } catch (error) {
    console.error("Error in requestMentor:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};









export { getAllMentors, requestMentor  };