import express from "express";
import { getAllMentors, requestMentor  } from "../controller/mentors.js";

const Router = express.Router();

// ✅ Fetch all mentors
Router.get("/get-all-mentors", getAllMentors);

// ✅ Request to become a mentor
Router.post("/request-mentor/:email", requestMentor );

export default Router;
