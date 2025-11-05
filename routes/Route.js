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
  getAllLogsByUser,
  fetchTemplateByEmail,
  saveTemplateByEmail,
  getEmailThreadLogs,
  setPasswordForOAuthUser,
  getUserByEmail
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


import {getAllMentors, becomeMentor} from '../controller/mentors.js'


import { saveFollowUpTemplate, fetchFollowUpTemplate } from '../controller/Email-Sender.js';

import authenticateToken from '../middleware/index.js';
import recruiterRoutes from './Recruiter.js'; // ✅ Import recruiter routes
import networkRoutes from './Network.js'; // ✅ Import network routes
import notificationRoutes from './Notification.js'; // ✅ Import notification routes
import interviewRoutes from './Interview.js'; // ✅ Import interview routes
import coinRoutes from './Coin.js'; // ✅ Import coin routes

import multer from "multer";
import jobRoutes from './JobAdmin.js'; // ✅ Import job-related routes
import verifyToken from '../controller/verifyautologin.js' // ✅ Import job-related routes

const upload = multer();


const Router = express.Router();

// ✅ Health Check
Router.get('/health-check', (req, res) => {
  console.log("Server health check triggered");
  res.json({ status: 200, message: "Server is working" });
});
Router.post('/verifyToken', verifyToken);


// ✅ Auth routes
Router.post('/login', LoginUser);
Router.post('/register', RegisterUser);
Router.post('/set-password', setPasswordForOAuthUser);
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
Router.post("/save-html-template",saveTemplateByEmail);
Router.get("/get-html-template",fetchTemplateByEmail);
Router.get("/email-journey", getEmailThreadLogs); // Ensure this route is protected
Router.post('/save-followup-template', saveFollowUpTemplate);
Router.get('/fetch-followup-templates/:email', fetchFollowUpTemplate);

Router.get("/email-logs/", getEmailLogs);

// ✅ Recruiter Routes
Router.use('/recruiters', recruiterRoutes); // e.g., POST /api/recruiters/add
// ✅ Job Routes
Router.use('/jobs', jobRoutes); // e.g., GET /api/jobs/list, POST /api/jobs/add
// ✅ Network Routes
Router.use('/network', networkRoutes); // e.g., POST /api/network/send-request, GET /api/network/connections
// ✅ Notification Routes
Router.use('/notifications', notificationRoutes); // e.g., GET /api/notifications, POST /api/notifications/mark-read
// ✅ Interview Routes
Router.use('/interviews', interviewRoutes); // e.g., POST /api/interviews/request, GET /api/interviews/pending
// ✅ Coin Routes
Router.use('/coins', coinRoutes); // e.g., GET /api/coins/balance, POST /api/coins/referral


Router.get('/getAllLogs', getAllLogsByUser); // e.g., POST /api/recruiters/add



Router.get('/get-all-mentors', getAllMentors);
Router.get('/become-mentor/:id', becomeMentor);

// ✅ Get user data by email
Router.get('/get-user-by-email', getUserByEmail);



Router.get('/get-html-template', fetchFollowUpTemplate)

// ✅ Fallback
Router.use('*', (req, res) => {
  res.status(404).json({ error: "Requested Endpoint not Found!" });
});

export default Router;


// https://system-backend-hprl.onrender.com/api/oauth2/callback