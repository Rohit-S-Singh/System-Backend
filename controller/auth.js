import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { registerSchemaValidation, LoginschemaValidation } from '../validations/index.js';
import pkg from 'bcryptjs';
import EmailLog from "../models/EmailLogs.js";
import Recruiter from '../models/Recruiter.js';
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
        avatar: picture, // Add this field to your User schema
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
  const { name, email, password, phone } = req.body;
  const { error } = registerSchemaValidation.validate({ name, email, password, phone });

  if (error) return res.json({ success: false, message: error.details[0].message.replace(/['"]+/g, '') });

  try {
    const ifExist = await User.findOne({ email });
    if (ifExist) return res.json({ success: false, message: "User Already Exists" });

    const hashedPassword = await hash(password, 12);
    await User.create({ email, name, password: hashedPassword, phone });

    return res.json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("RegisterUser error:", error);
    return res.json({ success: false, message: "Something went wrong" });
  }
};

export const LoginUser = async (req, res) => {
  const { email, password } = req.body;
  const { error } = LoginschemaValidation.validate({ email, password });

  if (error) return res.json({ success: false, message: error.details[0].message.replace(/['"]+/g, '') });

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser) return res.json({ success: false, message: "Account not found" });

    const isMatch = await compare(password, checkUser.password);
    if (!isMatch) return res.json({ success: false, message: "Incorrect password" });

    const token = jwt.sign({ id: checkUser._id, email: checkUser.email }, JWT_SECRET, { expiresIn: '1d' });

    return res.json({ token, username: email });
  } catch (error) {
    console.error("LoginUser error:", error);
    return res.json({ success: false, message: "Something went wrong" });
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
