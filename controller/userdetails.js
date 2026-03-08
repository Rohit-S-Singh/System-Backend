import User from '../models/User.js';

 const getUserDetailsByEmail = async (req, res) => {
  try {

  console.log("Request params:", req.params);




    const email = req.params.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

console.log("-------------------------------------------    ------------------");
console.log(user);
console.log("-------------------------------------------------------------");



    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    console.error("Error fetching user details bddmnd:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default getUserDetailsByEmail;