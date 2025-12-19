import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
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
  const { code } = req.query;

  if (!code) return res.status(400).json({ message: "Code not provided" });

  try {
    const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data } = await oauth2.userinfo.get(); // contains profile

    const { email, name, given_name, family_name, picture, locale } = data;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    user.accessToken = tokens.access_token;
    user.refreshToken = tokens.refresh_token;
    user.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Optional: Store profile info
    user.name = name;
    user.givenName = given_name;
    user.familyName = family_name;
    user.picture = picture;
    user.locale = locale;

    await user.save();

    return res.send("✅ Gmail connected successfully!");
  } catch (err) {
    console.error("Callback error:", err.response?.data || err.message);
    return res.status(500).json({ message: "OAuth callback failed" });
  }
};


import fs from "fs";
import path from "path";

export const sendEmail = async (req, res) => {
  const { to, subject, body, from, threadId } = req.body;
  const attachment = req.file;

  try {
    const user = await User.findOne({ email: from });
    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, message: "Email not connected" });
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

    const recruiter = await Recruiter.findOne({ email: to }).lean();
    
    if (!recruiter) {
      return res.status(404).json({ success: false, message: "Recruiter not found" });
    }

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

    if (!logs.length) {
      return res.status(404).json({ success: false, message: "No email logs found." });
    }

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

export const RegisterUser = async (req, res) => {
  try {
    const { userName, email, password, accountType } = req.body;

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

    // 🎯 Mentor logic
    let isMentor = false;
    let mentorStatus = "Become a Mentor";

    if (accountType === "Mentor Account") {
      isMentor = true;
      mentorStatus = "Pending";
    }

    // 🧠 Create user (ONLY schema fields)
    const user = await User.create({
      name: userName,
      email,
      password: hashedPassword,

      isMentor,
      mentorStatus,

      online: false,
      hasCoinAccount: false,
      referralCode: uuidv4().slice(0, 8),

      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        connectionRequests: true,
        messages: true,
        jobUpdates: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        isMentor: user.isMentor,
        mentorStatus: user.mentorStatus,
        userType: user.userType,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      errorMessage: "Server error during registration",
    });
  }
};



// export const RegisterUser = async (req, res) => {

//   console.log(req);
  
//   const { name, email, password, phone } = req.body;
//   const { error } = registerSchemaValidation.validate({ name, email, password, phone });

//   if (error) return res.json({ success: false, message: error.details[0].message.replace(/['"]+/g, '') });

//   try {
//     const ifExist = await User.findOne({ email });
//     if (ifExist) return res.json({ success: false, message: "User Already Exists" });

//     const hashedPassword = await hash(password, 12);
//     await User.create({ email, name, password: hashedPassword, phone });

//     return res.json({ success: true, message: "Account created successfully" });
//   } catch (error) {
//     console.error("RegisterUser error:", error);
//     return res.json({ success: false, message: "Something went wrong" });
//   }
// };

// export const LoginUser = async (req, res) => {
//   const { email, password } = req.body;
//   const { error } = LoginschemaValidation.validate({ email, password });

//   if (error) return res.json({ success: false, message: error.details[0].message.replace(/['"]+/g, '') });

//   try {
//     const checkUser = await User.findOne({ email });
//     if (!checkUser) return res.json({ success: false, message: "Account not found" });

//     // Check if user has a password set (OAuth users might not have password)
//     if (!checkUser.password) {
//       return res.json({ 
//         success: false, 
//         message: "Please set a password to login. You previously signed in using OAuth.",
//         requiresPasswordSetup: true,
//         email: checkUser.email
//       });
//     }

//     const isMatch = await compare(password, checkUser.password);
//     if (!isMatch) return res.json({ success: false, message: "Incorrect password" });

//     const token = jwt.sign({ id: checkUser._id, email: checkUser.email }, JWT_SECRET, { expiresIn: '1d' });

//     return res.json({ 
//       token, 
//       username: email,
//       id: checkUser._id,
//       user: {
//         id: checkUser._id,
//         email: checkUser.email,
//         name: checkUser.name,
//         givenName: checkUser.givenName,
//         familyName: checkUser.familyName,
//         picture: checkUser.picture
//       }
//     });
//   } catch (error) {
//     console.error("LoginUser error:", error);
//     return res.json({ success: false, message: "Something went wrong" });
//   }
// };

export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔒 Validation
    if (!email || !password) {
      return res.status(400).json({
        errorMessage: "Email and password are required",
      });
    }

    // 🔍 Find user
    const user = await User.findOne({ email });
    if (!user || !user.password) {
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

    /**
     * -------------------------------------------------------
     * 🧠 PHASE 1 — AUTO-GENERATED RESUME (ONCE)
     * -------------------------------------------------------
     */
    let autoGeneratedResume = await Resume.findOne({
      userId: user._id,
      type: "auto-generated",
    });

    if (!autoGeneratedResume) {
      const resumeContent = generateIndustryResume(user);

      autoGeneratedResume = await Resume.create({
        userId: user._id,
        type: "auto-generated",
        content: resumeContent,
      });
    }

    /**
     * -------------------------------------------------------
     * 🧠 PHASE 2.5 — SET ACTIVE RESUME (IF NOT SET)
     * -------------------------------------------------------
     */
    if (!user.activeResume) {
      user.activeResume = autoGeneratedResume._id;
    }

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
        activeResume: user.activeResume, // 🔑 important for frontend
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

    if (!logs.length) {
      return res.status(404).json({ success: false, message: "No logs found for this user." });
    }

    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching logs by user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const saveTemplateByEmail = async (req, res) => {
  try {
    const { email, rawTemplate, placeholders, finalHtml } = req.body;

    if (!email || !finalHtml) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.htmlEmailTemplate = {
      finalHtml,
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

// Route handler
export const getEmailThreadLogs = async (req, res) => {
  const { email, threadId } = req.body; // or req.query for GET

  if (!email || !threadId) {
    return res.status(400).json({ success: false, message: "Email and threadId are required." });
  }

  try {
    const logs = await EmailLog.find({
      sentTo: email,
      threadId: threadId,
    }).sort({ createdAt: 1 }); // Sorted by time

    if (!logs || logs.length === 0) {
      return res.status(404).json({ success: false, message: "No logs found for this thread." });
    }

    const formattedLogs = logs.flatMap(log => {
      const formattedLog = { status: log.status, createdAt: log.createdAt };
      if (log.status === 'follow_up') {
        return [
          { status: 'no-reply', createdAt: null },
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
  const { email } = req.user;

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
