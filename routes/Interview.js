import express from 'express';
import {
  requestInterview,
  acceptInterview,
  rejectInterview,
  getPendingInterviews,
  getUserInterviews,
  getInterviewDetails,
  cancelInterview,
  completeInterview,
  getAvailableMentors,
  updateMentorProfile
} from '../controller/Interview.js';

import authenticateToken from '../middleware/index.js';

const Router = express.Router();

// All routes require authentication
Router.use(authenticateToken);

// Interview scheduling and management
Router.post('/request', requestInterview);
Router.post('/accept', acceptInterview);
Router.post('/reject', rejectInterview);
Router.post('/cancel', cancelInterview);
Router.post('/complete', completeInterview);

// Get interviews
Router.get('/pending', getPendingInterviews);
Router.get('/user', getUserInterviews);
Router.get('/details/:interviewId', getInterviewDetails);

// Mentor management
Router.get('/mentors', getAvailableMentors);
Router.put('/mentor-profile', updateMentorProfile);

export default Router; 