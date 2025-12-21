import UserProfile from "../../models/profile/UserProfile.js";
import User from "../../models/User.js";
/**
 * Fetch profile using userId
 * userId comes from frontend (already authenticated)
 */
export const getProfileByUserId = async (req, res) => {
        console.log("Fetching profile for userId:");

  try {
    const { userId } = req.params;
    console.log("Fetching profile for userId:", userId);
    // Try to find the profile
    let profile = await UserProfile.findOne({ userId });
     console.log("****************enter here**********************************");
     console.log("****************enter here**********************************");
     console.log("****************enter here**********************************");
     console.log("****************enter here**********************************");
       console.log("Profile found:", profile);
 console.log("****************enter here**********************************");
 console.log("****************enter here**********************************");
 console.log("****************enter here**********************************");
 console.log("****************enter here**********************************");
 console.log("****************enter here**********************************");


    // If profile doesn't exist, create one with default/empty values
    if (!profile) {
 
        const user = await User.findById(userId);

      profile = new UserProfile({
        userId,
        userType: user?.userType || "student", // default if not available
        name: user?.name || "Unknown Name",
        email: user?.email ,
        phone: user?.phone || "",
        picture: user?.picture || "",
        coverImage: "",
        bio: "",
        stats: {
          profileViews: 0,
          connections: 0,
          endorsements: 0,
          projects: 0
        },
        details: {
          company: "",
          logo: "",
          title: "",
          experience: "",
          location: "",
          ctc: "",
          expectedCTC: "",
          notice: "",
          workMode: "",
          skills: [],
          github: "",
          linkedin: "",
          portfolio: ""
        },
        experience: [],
        projects: [],
        certs: [],
        achievements: [],
        recommendations: []
      });

      await profile.save();
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
/**
 * UPDATE profile using userId
 * userId is User._id
 */
export const updateProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },                 // 🔑 match by userId
      { $set: updateData },       // update only sent fields
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    res.status(200).json({
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};
