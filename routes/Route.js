import express from "express";
import multer from "multer";

// ---------- Controllers ----------
import {
  LoginUser,
  RegisterUser,
  GoogleAuthHandler,
  getAuthUrl,
  setPasswordForOAuthUser,
  CheckEmailConnection,
  sendEmail,
  getEmailLogs,
  getAllLogsByUser,
  fetchTemplateByEmail,
  saveTemplateByEmail,
  getEmailThreadLogs,
  getUserByEmail
} from "../controller/auth.js";



import JobRouter from "./JobAdmin.js"

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
} from "../controller/chat.js";

import {
  getMyResume,
  getAllResumes,
  setActiveResume,
  getActiveResume,
  uploadResume
} from "../controller/resumeController.js";

import {
  searchJobs,
  searchPeople,
  searchCompanies,
  getSearchSuggestions,
  getPopularSearches
} from "../controller/SearchController.js";

import verifyToken from "../controller/verifyautologin.js";
import authenticateToken from "../middleware/index.js";
import uploadResumeMiddleware from "../middleware/uploadResume.js";

// ---------- Route Groups ----------
import recruiterRoutes from "./Recruiter.js";
import jobRoutes from "./JobAdmin.js";
import networkRoutes from "./Network.js";
import notificationRoutes from "./Notification.js";
import interviewRoutes from "./Interview.js";
import coinRoutes from "./Coin.js";
import Mentor from "./Mentor.js";
import updateUserCategory  from "../controller/userCategoryController.js"; 
import AdminRoutes from "./AdminRoutes.js";
import {getUserById , getMentorById} from "../controller/auth.js";
import profileRoutes from "./profile.routes.js";
import {setupProfile ,updateUserProfile } from "../controller/Profile/profile.controller.js";


// ---------- Setup ----------
const Router = express.Router();
const upload = multer();

// =======================================================
// 🔹 PUBLIC ROUTES (NO AUTH)
// =======================================================

Router.get("/health-check", (req, res) => {
  res.json({ status: 200, message: "Server is working" });
});

Router.post("/login", LoginUser);
Router.post("/register", RegisterUser);
Router.post("/verifytoken", verifyToken);

Router.get("/authUrl", getAuthUrl);
Router.post("/oauth2/callback", GoogleAuthHandler);
Router.post("/set-password", setPasswordForOAuthUser);

// =======================================================
// 🔹 AUTHENTICATED USER ROUTES
// =======================================================

//Router.use(authenticateToken); // 🔐 everything below is protected

// ---------- User ----------
Router.post("/first-time-details-fill", setupProfile);
Router.get("/get-user-by-email", authenticateToken, getUserByEmail);
Router.put("/update", updateUserProfile);
Router.get("/get-user-by-email", authenticateToken, getUserByEmail);
Router.post("/enter-updateUserCategory", updateUserCategory);
Router.get("/users/:userId", getUserById);
// ---------- Resume ----------
Router.get("/resume/my", authenticateToken, getMyResume);
Router.get("/resume/all", getAllResumes);
Router.post("/resume/set-active", setActiveResume);
Router.get("/resume/active", getActiveResume);
Router.post(
  "/resume/upload",
  authenticateToken,
  uploadResumeMiddleware.single("resume"),
  uploadResume
);

// ---------- Chat ----------
Router.get("/users", getAllUsers);
Router.get("/chat", getChat);
Router.post("/chat/message", sendMessage);

Router.post("/groups", createGroup);
Router.get("/groups", getAllGroups);
Router.get("/groups/chat", getGroupChat);
Router.post("/groups/message", sendGroupMessage);
Router.delete("/groups", deleteGroup);
Router.delete("/groups/message", deleteMessageFromMe);

// ---------- Email ----------
Router.post("/email/check-connection", CheckEmailConnection);
Router.post("/email/send", upload.single("attachment"), sendEmail);
Router.get("/email/logs", getEmailLogs);
Router.get("/email/journey", getEmailThreadLogs);
Router.get("/email/logs/all", getAllLogsByUser);

Router.post("/email/template", saveTemplateByEmail);
Router.get("/email/template", fetchTemplateByEmail);

// ---------- Search ----------
Router.get("/search/jobs", searchJobs);
Router.get("/search/people", searchPeople);
Router.get("/search/companies", searchCompanies);
Router.get("/search/suggestions", getSearchSuggestions);
Router.get("/search/popular", getPopularSearches);

// =======================================================
// 🔹 MODULE ROUTES (ALREADY PROTECTED)
// =======================================================
Router.use("/profile", profileRoutes);
Router.use("/recruiters", recruiterRoutes);
Router.use("/jobs", jobRoutes);
Router.use("/network", networkRoutes);
Router.use("/notifications", notificationRoutes);
Router.use("/interviews", interviewRoutes);
Router.use("/coins", coinRoutes);
Router.use("/mentors", Mentor);
Router.use("/Admin", AdminRoutes);

// =======================================================
// ❌ FALLBACK
// =======================================================

Router.use("*", (req, res) => {
  res.status(404).json({ error: "Requested Endpoint not Found!" });
});

export default Router;
