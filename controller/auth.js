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

const { hash, compare } = pkg;
dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, JWT_SECRET } = process.env;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// ============================================
// OAUTH & GMAIL CONNECTION
// ============================================

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
    const { data } = await oauth2.userinfo.get();

    const { email, name, given_name, family_name, picture, locale } = data;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email });
    }

    user.gmailAccessToken = tokens.access_token;
    user.gmailRefreshToken = tokens.refresh_token;
    user.gmailTokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Store profile info
    user.name = name;
    user.givenName = given_name;
    user.familyName = family_name;
    user.picture = picture;
    user.locale = locale;

    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}/email-sender?gmail=connected`);
  } catch (err) {
    console.error("Callback error:", err.response?.data || err.message);
    return res.status(500).json({ message: "OAuth callback failed" });
  }
};

export const CheckEmailConnection = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ success: false, message: "Email is required" });

  try {
    const user = await User.findOne({ email }).lean();
    if (user?.gmailRefreshToken) {
      return res.json({ success: true, connected: true, user });
    }
    return res.json({ success: false, message: "Email not connected" });
  } catch (error) {
    console.error("CheckEmailConnection error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// ============================================
// TOKEN REFRESH
// ============================================

const refreshAccessToken = async (user) => {
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({
    refresh_token: user.gmailRefreshToken,
  });

  try {
    const { credentials } = await oAuth2Client.refreshAccessToken();
    user.gmailAccessToken = credentials.access_token;
    user.gmailTokenExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
    await user.save();
    return credentials.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }
};

// ============================================
// SEND EMAIL
// ============================================

export const sendEmail = async (req, res) => {
  const { to, subject, body, from, threadId } = req.body;
  const attachment = req.file;

  console.log("=== SEND EMAIL SERVER DEBUG ===");
  console.log("From:", from);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Has attachment:", !!attachment);
  console.log("ThreadId:", threadId);

  try {
    // Validate inputs
    if (!from || !to || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: from, to, subject, or body" 
      });
    }

    // Find user
    const user = await User.findOne({ email: from });
    if (!user) {
      console.error("User not found:", from);
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (!user.gmailRefreshToken) {
      console.error("Gmail not connected for user:", from);
      return res.status(401).json({ 
        success: false, 
        message: "Gmail account not connected. Please connect your Gmail account first.",
        requiresAuth: true
      });
    }

    // Check and refresh token if needed
    let accessToken = user.gmailAccessToken;
    const now = new Date();
    const expiryDate = user.gmailTokenExpiry ? new Date(user.gmailTokenExpiry) : null;

    // Refresh if token doesn't exist, is expired, or will expire in next 5 minutes
    if (!accessToken || !expiryDate || now >= new Date(expiryDate.getTime() - 5 * 60 * 1000)) {
      console.log('Token expired or missing, refreshing...');
      try {
        accessToken = await refreshAccessToken(user);
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return res.status(401).json({ 
          success: false, 
          message: "Gmail authentication expired. Please reconnect your Gmail account.",
          requiresReauth: true
        });
      }
    }

    // Set up OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: user.gmailRefreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Build email
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

    // Add attachment if present
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

    // Send email
    console.log("Sending email via Gmail API...");
    const response = await gmail.users.messages.send(gmailRequest);
    console.log("Email sent successfully:", response.data.id);

    // Find recruiter
    const recruiter = await Recruiter.findOne({ email: to }).lean();
    if (!recruiter) {
      console.warn("Recruiter not found for email:", to);
      // Don't fail the request, but log the warning
    }

    const threadIdToSave = response.data.threadId;

    // Save email log
    if (recruiter) {
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
      console.log("Email log saved");
    }

    return res.json({
      success: true,
      message: "Email sent successfully",
      threadId: threadIdToSave,
      messageId: response.data.id
    });

  } catch (error) {
    console.error("=== EMAIL SENDING ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    
    // Handle specific Gmail API errors
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({ 
        success: false, 
        message: "Gmail authentication failed. Please reconnect your Gmail account.",
        requiresReauth: true,
        error: error.message
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: "Failed to send email: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
};

// ============================================
// EMAIL LOGS
// ============================================

export const getEmailLogs = async (req, res) => {
  let { userEmail, recruiterId } = req.query;
  userEmail = decodeURIComponent(userEmail);

  try {
    const logs = await EmailLog.find({ sentBy: userEmail, recruiterId }).lean();

    if (!logs.length) {
      return res.status(404).json({ success: false, message: "No email logs found." });
    }

    const logsWithThreadId = logs.map(log => ({
      ...log,
      threadId: log.threadId || null,
    }));

    res.json({ success: true, logs: logsWithThreadId });
  } catch (err) {
    console.error("Failed to fetch email logs:", err);
    res.status(500).json({ success: false, message: "Server error" });
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

export const getEmailThreadLogs = async (req, res) => {
  const { email, threadId } = req.query;

  if (!email || !threadId) {
    return res.status(400).json({ success: false, message: "Email and threadId are required." });
  }

  try {
    const logs = await EmailLog.find({
      sentBy: email,
      threadId: threadId,
    }).sort({ createdAt: 1 });

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

// ============================================
// EMAIL TEMPLATES
// ============================================

export const saveTemplateByEmail = async (req, res) => {
  try {
    const { email, finalHtml, followUpTemplates } = req.body;

    if (!email || !finalHtml) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.htmlEmailTemplate = { finalHtml };

    if (followUpTemplates) {
      user.followUpTemplates = followUpTemplates;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Template saved successfully",
      mainTemplate: user.htmlEmailTemplate,
      followUps: user.followUpTemplates
    });

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

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return empty template structure if none exists
    if (!user.htmlEmailTemplate) {
      return res.status(200).json({
        success: true,
        mainTemplate: null,
        followUps: user.followUpTemplates || []
      });
    }

    return res.status(200).json({
      success: true,
      mainTemplate: user.htmlEmailTemplate,
      followUps: user.followUpTemplates || []
    });

  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const saveFollowUpTemplates = async (req, res) => {
  try {
    const { email, followupTemplate } = req.body;

    if (!email || !followupTemplate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.followUpTemplates = followupTemplate;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Follow-up templates saved successfully",
      followUpTemplates: user.followUpTemplates
    });

  } catch (err) {
    console.error("Error saving follow-up templates:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchFollowUpTemplates = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      followupTemplates: user.followUpTemplates || []
    });

  } catch (err) {
    console.error("Error fetching follow-up templates:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ============================================
// GOOGLE AUTH
// ============================================

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
        picture: picture,
        oauthProvider: "google",
        locale,
        emailVerified: email_verified
      });
    }

    const jwtToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      success: true,
      token: jwtToken,
      email: user.email,
      username: user.name,
      avatar: picture,
    });
  } catch (err) {
    console.error("Error verifying Google token", err);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};

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

    if (user.password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password already set for this account" 
      });
    }

    const hashedPassword = await hash(password, 12);
    user.password = hashedPassword;
    await user.save();

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

// ============================================
// USER REGISTRATION & LOGIN
// ============================================

export const RegisterUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Validation
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

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        errorMessage: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: userName,
      email,
      password: hashedPassword,
      role: "user",
      userType: "None",
      mentorStatus: "None",
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
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        errorMessage: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({
        errorMessage: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        errorMessage: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update login state
    user.online = true;
    user.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

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

// ============================================
// USER DATA
// ============================================

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

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

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

    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error("Get User Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ success: false, message: "Mentor ID is required" });
    }

    const mentor = await Mentor.findById(mentorId).populate("user", "_id name email picture");

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    const mentorData = {
      _id: mentor._id,
      user: mentor.user,
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