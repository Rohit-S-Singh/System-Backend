import express from "express";
import {
  getProfileByUserId,
  updateProfileByUserId
} from "../controller/Profile/profile.controller.js";

const Router = express.Router();

/** Fetch profile */
Router.get("/user/:userId", getProfileByUserId);

/** Update profile */
Router.put("/user/:userId", updateProfileByUserId);

export default Router;
