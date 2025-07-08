import express from 'express';
import {
  oauthCallback,
  getAuthUrl,
  GoogleAuthHandler,
  LoginUser,
  RegisterUser,
  CheckEmailConnection,
  sendEmail,
  getEmailLogs,
  getAllLogsByUser
} from '../controller/auth.js';

import {
  getAllUsers,
  getChat,
  sendMessage,
  createGroup,
  getAllGroups,
  sendGroupMessage,
  getGroupChat,
  deleteMessageFromMe,
  deleteGroup
} from '../controller/chat.js';

import authenticateToken from '../middleware/index.js';
import recruiterRoutes from './Recruiter.js'; // ✅ Import recruiter routes

import multer from "multer";
const upload = multer();


const Router = express.Router();

// ✅ Health Check
Router.get('/health-check', (req, res) => {
  console.log("Server health check triggered");
  res.json({ status: 200, message: "Server is working" });
});

// ✅ Auth routes
Router.post('/login', LoginUser);
Router.post('/register', RegisterUser);
Router.post('/oauth2/callback', GoogleAuthHandler);
Router.get('/authUrl', getAuthUrl);
Router.get('/oauth2/callback', oauthCallback);
Router.post('/check-email-connection', CheckEmailConnection);
Router.post("/send-email", upload.single("attachment"), sendEmail);

// ✅ User and chat routes
Router.get('/get-all-users', authenticateToken, getAllUsers);
Router.get('/get-user-chat', authenticateToken, getChat);
Router.post('/send-user-message', sendMessage);
Router.post('/create-group', authenticateToken, createGroup);
Router.get('/get-user-group', authenticateToken, getAllGroups);
Router.post('/send-group-message', authenticateToken, sendGroupMessage);
Router.get('/get-group-chat', authenticateToken, getGroupChat);
Router.delete('/delete-group', authenticateToken, deleteGroup);
Router.delete('/delete-group-message-from-me', authenticateToken, deleteMessageFromMe);

Router.get("/email-logs/", getEmailLogs);

// ✅ Recruiter Routes
Router.use('/recruiters', recruiterRoutes); // e.g., POST /api/recruiters/add


Router.get('/getAllLogs', getAllLogsByUser); // e.g., POST /api/recruiters/add


// ✅ Fallback
Router.use('*', (req, res) => {
  res.status(404).json({ error: "Requested Endpoint not Found!" });
});

export default Router;
