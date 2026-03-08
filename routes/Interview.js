import express from 'express';
import {
  rescheduleInterview,
  cancelScheduledInterview,
  createInterviewRequest,
getScheduledInterviews,
  getPendingInterviews,
  getUserInterviews,
  getInterviewDetails,
  cancelInterview,
  completeInterview,
  getMentorList,
  updateMentorProfile,
  getInterviewHistory,
  updateInterviewFeedback,
  getMentorRequests,
  handleInterviewRequest,
  handleInterviewByEmail
} from '../controller/interviews/Interview.js';

import authenticateToken from '../middleware/index.js';

const Router = express.Router();



Router.get("/interview/:token", handleInterviewByEmail);
Router.get("/interview/:token", handleInterviewByEmail);

// All routes require authentication
// Router.use(authenticateToken);

// Interview scheduling and management
Router.post('/request', createInterviewRequest);
Router.patch("/handle/:requestId", handleInterviewRequest);
// Router.post('/cancel', cancelInterview);



// Get interviews
Router.get('/pending', getPendingInterviews);
Router.get('/user', getUserInterviews);
Router.get('/details/:interviewId', getInterviewDetails);

// Mentor management
Router.get('/mentors', getMentorList);
Router.put('/mentor-profile', updateMentorProfile);

//history

Router.get("/history",  getInterviewHistory);
Router.put("/:id/feedback",  updateInterviewFeedback);

Router.get("/mentor-requests", getMentorRequests);


Router.get("/scheduled", getScheduledInterviews);
Router.patch("/cancel/:interviewId", cancelScheduledInterview);
Router.patch("/reschedule/:interviewId", rescheduleInterview);
Router.post('/complete/:interviewId', completeInterview);

export default Router; 