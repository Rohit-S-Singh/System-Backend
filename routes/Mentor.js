import express from 'express';
// import { getMentorDetails } from '../controller/interviews/Interview.js';
import { requestBecomeMentor ,getApprovedActiveMentors,getMentorDetails } from '../controller/Mentor/Mentor.js';
const Router = express.Router();



Router.post("/become-mentor", requestBecomeMentor);
Router.get('/show-all-mentor', getApprovedActiveMentors);
Router.get('/mentor/:mentorId', getMentorDetails);
export default Router; 