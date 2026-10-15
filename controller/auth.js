import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import { registerSchemaValidation, LoginschemaValidation } from '../validations/index.js';
import pkg from 'bcryptjs';
import EmailLog from "../models/EmailLogs.js";
import Recruiter from '../models/Recruiter.js';
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Resume from "../models/Resume.js";
import { generateIndustryResume } from "../services/resumeGenerator.js";

/**
 * @desc    Register new user
 * @route   POST /api/register
 * @access  Public
 */

const { hash, compare } = pkg;
dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, JWT_SECRET } = process.env;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export const getAuthUrl = (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    redirect_uri: REDIRECT_URI,
  });

  res.json({ url: authUrl });
};

export const oauthCallback = async (req, res) => {
  const { code, error: oauthError } = req.query;
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";

  if (oauthError) {
    return res.redirect(`${frontendBase}/email-sender?gmail=denied`);
  }

  if (!code) {
    return res.redirect(`${frontendBase}/email-sender?gmail=error`);
  }

  try {
    const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get(); // contains profile

    const { email, name, given_name, family_name, picture, locale } = data;

    if (!email) {
      throw new Error("Google did not return an email for this account");
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    user.accessToken = tokens.access_token;
    // Google only returns refresh_token on first consent (or when prompt=consent
    // forces re-consent, which getAuthUrl already sets) — don't clobber an
    // existing refresh token if this particular response omitted it.
    if (tokens.refresh_token) {
      user.refreshToken = tokens.refresh_token;
    }
    user.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Optional: Store profile info
    user.name = user.name || name;
    user.givenName = given_name;
    user.familyName = family_name;
    user.picture = user.picture || picture;
    user.locale = locale;

    await user.save();

    return res.redirect(`${frontendBase}/email-sender?gmail=connected`);
  } catch (err) {
    console.error("Callback error:", err.response?.data || err.message);
    return res.redirect(`${frontendBase}/email-sender?gmail=error`);
  }
};


import fs from "fs";
import path from "path";
import { log } from 'console';

export const sendEmail = async (req, res) => {
  const { to, subject, body, from, threadId, recruiterId } = req.body;
  const attachment = req.file;

  try {
    const user = await User.findOne({ email: from });
    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, message: "Email not connected" });
    }

    // Resolve the recruiter *before* sending anything. Recruiters are a
    // shared directory, so any user can email any recruiter in it — not
    // just ones they personally added. Matching by recruiterId (when the
    // caller has it) avoids ambiguity when two recruiter rows share the
    // same email address; by email is kept only as a fallback for older
    // callers.
    const recruiter = recruiterId
      ? await Recruiter.findOne({ _id: recruiterId }).lean()
      : await Recruiter.findOne({ email: to }).lean();

    if (!recruiter) {
      return res.status(404).json({ success: false, message: "Recruiter not found" });
    }

    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    
    oAuth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const boundary = "boundary_" + Date.now();
    
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      "",
      body,
    ];

    if (attachment) {
      const attachmentBase64 = attachment.buffer.toString("base64");
      messageParts.push(
        "",
        `--${boundary}`,
        `Content-Type: ${attachment.mimetype}; name="${attachment.originalname}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${attachment.originalname}"`,
        "",
        attachmentBase64
      );
    }

    messageParts.push(`--${boundary}--`);

    const rawMessage = Buffer.from(messageParts.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const gmailRequest = {
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    };

    if (threadId) {
      gmailRequest.requestBody.threadId = threadId;
    }

    const response = await gmail.users.messages.send(gmailRequest);

    const threadIdToSave = response.data.threadId;

    await EmailLog.create({
      sentBy: from,
      sentTo: to,
      recruiterId: recruiter._id,
      subject,
      body,
      attachmentName: attachment?.originalname || null,
      status: threadId == null ? "thread_start" : 'follow_up',
      threadId: threadIdToSave,
    });

    return res.json({
      success: true,
      message: "Email sent successfully",
      threadId: threadIdToSave,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
};



export const getEmailLogs = async (req, res) => {
  let { userEmail, recruiterId } = req.query;
  // Optional, not required in Express:
  userEmail = decodeURIComponent(userEmail);

  try {
    const logs = await EmailLog.find({ sentBy: userEmail, recruiterId }).lean();

    // An empty result is a normal state (recruiter hasn't been emailed yet),
    // not an error — always respond 200 so callers don't have to treat it
    // as a failure.
    const logsWithThreadId = logs.map(log => ({
      ...log,
      threadId: log.threadId || null, // Include threadId if it exists
    }));

    res.json({ success: true, logs: logsWithThreadId });
  } catch (err) {
    console.error("Failed to fetch email logs:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const CheckEmailConnection = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ success: false, message: "Email is required" });

  try {
    const user = await User.findOne({ email }).lean();
    if (user?.accessToken) {
      return res.json({ success: true, connected: true, user });
    }
    return res.json({ success: false, message: "Email not connected" });
  } catch (error) {
    console.error("CheckEmailConnection error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const GoogleAuthHandler = async (req, res) => {

  
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: "Token missing" });

  const client = new OAuth2Client(CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID });
    const payload = ticket.getPayload();    
    const { email, name, picture, locale, email_verified } = payload;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name,
        picture: picture, // Add this field to your User schema
        oauthProvider: "google",
        locale, // Optional
        emailVerified: email_verified // Optional
      });
    }

    const jwtToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      success: true,
      token: jwtToken,
      email: user.email,
      username: user.name,
      avatar: picture, // Return avatar in response
    });
  } catch (err) {
    console.error("Error verifying Google token", err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};

// export const RegisterUser = async (req, res) => {
//   try {
//     const { userName, email, password } = req.body;
//     console.log("---------------------------------------------------------------------------------------------")
//     console.log("---------------------------------------------------------------------------------------------")
//     console.log("---------------------------------------------------------------------------------------------")
//      console.log(req.body);
//     console.log("---------------------------------------------------------------------------------------------")
//     console.log("---------------------------------------------------------------------------------------------")
//     console.log("---------------------------------------------------------------------------------------------")
 
//     // 🔒 Validation
//     if (!email || !password) {
//       return res.status(400).json({
//         errorMessage: "Email and password are required",
//       });
//     }

//     if (password.length < 8) {
//       return res.status(400).json({
//         errorMessage: "Password must be at least 8 characters",
//       });
//     }

//     // 🔍 Check existing user
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         errorMessage: "Email already registered",
//       });
//     }

//     // 🔐 Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 🎯 Mentor logic
//     let isMentor = false;
//     let mentorStatus = "Become a Mentor";

//     if (accountType === "Mentor Account") {
//       isMentor = true;
//       mentorStatus = "Pending";
//     }

//     // 🧠 Create user (ONLY schema fields)
//     const user = await User.create({
//       name: userName,
//       email,
//       password: hashedPassword,

//       isMentor,
//       mentorStatus,

//       online: false,
//       hasCoinAccount: false,
//       referralCode: uuidv4().slice(0, 8),

//       notificationSettings: {
//         emailNotifications: true,
//         pushNotifications: true,
//         connectionRequests: true,
//         messages: true,
//         jobUpdates: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "User registered successfully",
//       user: {
//         id: user._id,
//         email: user.email,
//         isMentor: user.isMentor,
//         mentorStatus: user.mentorStatus,
//         userType: user.userType,
//       },
//     });

//   } catch (error) {
//     console.error("Register Error:", error);
//     return res.status(500).json({
//       errorMessage: "Server error during registration",
//     });
//   }
// };


export const RegisterUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // 🔒 Validation
    if (!email || !password) {
      return res.status(400).json({
        errorMessage: "Email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        errorMessage: "Password must be at least 8 characters",
      });
    }

    // 🔍 Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        errorMessage: "Email already registered",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧠 Create user (ONLY schema fields)
    const user = await User.create({
      name: userName,
      email,
      password: hashedPassword,
      role: "user",          // default but explicit
      userType: "None",      // schema default
      mentorStatus: "None",  // schema default
      recruiterStatus: "None"
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        mentorStatus: user.mentorStatus,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      errorMessage: "Server error during registration",
    });
  }
};


export const LoginUser = async (req, res) => {
  try {
    console.log("reached");

    const { email, password } = req.body;
    console.log(req.body);

    // 🔒 Validation
    if (!email || !password) {
      return res.status(400).json({
        errorMessage: "Email and password are required",
      });
    }

    // 🔍 Find user
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      console.log("check");
      return res.status(401).json({
        errorMessage: "Invalid email or password",
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        errorMessage: "Invalid email or password",
      });
    }

    // 🔑 Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🟢 Update login state
    user.online = true;
    user.accessToken = token;
    user.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ❌ AUTO-GENERATED RESUME LOGIC REMOVED
    // ❌ ACTIVE RESUME AUTO-ASSIGNMENT REMOVED

    await user.save();

    // ✅ Final response
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        picture: user.picture,
        isMentor: user.isMentor,
        mentorStatus: user.mentorStatus,
        isRecruiter: user.isRecruiter,
        userType: user.userType,
        activeResume: user.activeResume || null,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      errorMessage: "Server error during login",
    });
  }
};








export const getAllLogsByUser = async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).json({ success: false, message: "User email is required" });
  }

  try {
    const logs = await EmailLog.find({ sentBy: userEmail }).lean();

    // No logs yet is a normal state, not an error.
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching logs by user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const saveTemplateByEmail = async (req, res) => {
  try {
    const { email, rawTemplate, placeholders, finalHtml, subject } = req.body;

    if (!email || !finalHtml) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.htmlEmailTemplate = {
      finalHtml,
      subject: subject || user.htmlEmailTemplate?.subject || "",
    };

    await user.save();

    res.status(200).json({ message: "Template saved successfully", htmlEmailTemplate: user.htmlEmailTemplate });
  } catch (err) {
    console.error("Error saving template:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchTemplateByEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).lean();
    if (!user || !user.htmlEmailTemplate) {
      return res.status(404).json({ success: false, message: "Template not found for this user" });
    }

    res.status(200).json({ success: true, htmlEmailTemplate: user.htmlEmailTemplate });
  } catch (err) {
    console.error("Error fetching template by email:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Route handler — registered as GET /api/email/journey, so params come
// from the query string, not the body.
export const getEmailThreadLogs = async (req, res) => {
  const { email, threadId } = req.query;

  if (!email || !threadId) {
    return res.status(400).json({ success: false, message: "Email and threadId are required." });
  }

  try {
    const logs = await EmailLog.find({
      // `email` here is the logged-in job-seeker (the sender), not the
      // recruiter, so it must match `sentBy`, not `sentTo`.
      sentBy: email,
      threadId: threadId,
    }).sort({ createdAt: 1 }); // Sorted by time

    // No logs yet is a normal state, not an error.
    // Keep threadId/messageId on every entry — callers (e.g. "take
    // follow-up") need it to reply on the same Gmail thread instead of
    // starting a new one.
    const formattedLogs = (logs || []).flatMap(log => {
      const formattedLog = {
        status: log.status,
        createdAt: log.createdAt,
        threadId: log.threadId || null,
      };
      if (log.status === 'follow_up') {
        return [
          { status: 'no-reply', createdAt: null, threadId: log.threadId || null },
          formattedLog,
        ];
      }
      return [formattedLog];
    });

    return res.json({ success: true, logs: formattedLogs });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching logs." });
  }
};

// Set password for OAuth users
export const setPasswordForOAuthUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required" 
    });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user already has a password
    if (user.password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password already set for this account" 
      });
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);
    
    // Set the password
    user.password = hashedPassword;
    await user.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    return res.json({ 
      success: true, 
      message: "Password set successfully. You can now login with email and password.",
      token,
      username: user.email,
      id: user._id,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error("Error setting password for OAuth user:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Something went wrong while setting password" 
    });
  }
};

// Get user data by email
export const getUserByEmail = async (req, res) => {

  // if(!req?.user?.email){
  //   req["user"]["email"] = 'rohitshekrsingh@gmail.com';
  // }
  // const { email } = req.user;

  const email = "rohitshekrsingh@gmail.com"

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: "Email is required" 
    });
  }

  try {
    const user = await User.findOne({ email }).select('-password -accessToken -refreshToken').lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture,
        phone: user.phone,
        online: user.online,
        locale: user.locale,
        connections: user.connections,
        connectionCount: user.connectionCount,
        pendingConnections: user.pendingConnections,
        sentConnectionRequests: user.sentConnectionRequests,
        notificationSettings: user.notificationSettings,
        lastNotificationRead: user.lastNotificationRead,
        unreadNotificationCount: user.unreadNotificationCount,
        isMentor: user.isMentor,
        mentorProfile: user.mentorProfile,
        mentorStatus: user.mentorStatus,
        hasCoinAccount: user.hasCoinAccount,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error("Error fetching user by email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Something went wrong while fetching user data" 
    });
  }
};



// GET /api/users/:userId
export const getUserById = async (req, res) => {
  try {


  
    
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Fetch user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return only the fields you need (optional)
    const userData = {
      _id: user._id,
      name: user.name,
      givenName: user.givenName,
      familyName: user.familyName,
      picture: user.picture,
      email: user.email,
      userType: user.userType,
      studentDetails: user.studentDetails,
      professionalDetails: user.professionalDetails,
    };
  console.log("oyeee");
    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error("Get User Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// GET /api/mentors/:mentorId
export const getMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ success: false, message: "Mentor ID is required" });
    }

    // Find mentor by ID and populate the 'user' field
    const mentor = await Mentor.findById(mentorId).populate("user", "_id name email picture");

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    // Prepare data to return
    const mentorData = {
      _id: mentor._id,
      user: mentor.user, // contains user _id, name, email, picture
      expertise: mentor.expertise,
      experience: mentor.experience,
      bio: mentor.bio,
      pricePerHour: mentor.pricePerHour,
      interviewTypes: mentor.interviewTypes,
      availability: mentor.availability,
      rating: mentor.rating,
      completedInterviews: mentor.completedInterviews,
    };

    return res.status(200).json({ success: true, mentor: mentorData });
  } catch (error) {
    console.error("Get Mentor Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
