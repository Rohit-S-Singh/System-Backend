
import User from '../models/User.js';

const getAllMentors = async (req, res) => {
  try {



   console.log("Fetching all mentors...");
    /*  
    ------------------------------
    🔴 ORIGINAL CODE (TEMP HIDDEN)
    ------------------------------
    
    const mentors = await User.find({ isMentor: true });

    const result = mentors.map((m) => {
      return {
        profile: m.mentorProfile,
        avatar: m.picture || "",
        name: m.name,
        email: m.email,
        online: m.online
      };
    });

    return res.json([...result]);
    */

    // -----------------------------------------
    // 🟢 TEMPORARY DUMMY DATA (FOR TESTING UI)
    // -----------------------------------------
    const dummyMentors = [
      {
        profile: {
          experience: "5 years in Web Development",
          skills: ["React", "Node.js", "MongoDB"],
          bio: "Passionate mentor helping students grow."
        },
        avatar: "https://i.pravatar.cc/150?img=1",
        name: "John Doe",
        email: "john@example.com",
        online: true
      },
      {
        profile: {
          experience: "3 years in Data Science",
          skills: ["Python", "Machine Learning", "Pandas"],
          bio: "Loves guiding beginners in ML."
        },
        avatar: "https://i.pravatar.cc/150?img=2",
        name: "Priya Sharma",
        email: "priya@example.com",
        online: false
      },
      {
        profile: {
          experience: "7 years in Cybersecurity",
          skills: ["Ethical Hacking", "Networking"],
          bio: "Cybersecurity mentor with industry expertise."
        },
        avatar: "https://i.pravatar.cc/150?img=3",
        name: "Arjun Kumar",
        email: "arjun@example.com",
        online: true
      }
    ];

    return res.json(dummyMentors);
  } catch (error) {
    console.error("Error returning mentors:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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