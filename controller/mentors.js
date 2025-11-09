
import User from '../models/User.js';


const getAllMentors = async (req, res) => {
  const mentors = await User.find({ isMentor: true });
  const result  = mentors.map((m)=>{
    return {"profile": m.mentorProfile, avatar: m.picture || "", "name":m.name, "email": m.email , online: m.online }
  })
  res.json( [...result] );
};










const becomeMentor = async (req, res) => {
  try {

console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");


    const userId = req.params?._id// from auth or request
    console.log(userId);
    
    const { profile } = req.body;
    console.log(profile);
    

    if (!profile) {
      return res.status(400).json({ message: "Profile details are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    user.mentorStatus = "Pending";

    // // Update user to become mentor
    // user.isMentor = true;
    // user.mentorProfile = {
    //   expertise: profile.expertise || [],
    //   experience: profile.experience || 0,
    //   bio: profile.bio || "",
    //   hourlyRate: profile.hourlyRate || 0,
    //   availability: profile.availability || [],
    //   interviewTypes: profile.interviewTypes || [],
    // };

    await user.save();

    res.status(200).json({
      message: "request to become mentor submitted successfully",
      mentor: {
        status: user.mentorStatus,
        // name: user.name,
        // email: user.email,
        // avatar: user.picture || "",
        // profile: user.mentorProfile,
      },
    });
  } catch (error) {
    console.error("Error in becomeMentor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};









export { getAllMentors, becomeMentor };