import express from 'express';
import User from '../models/User.js';
import {getPendingRequests ,handleUserRequest ,getAllUsers} from '../controller/Admin/AdminController.js';
import { getAdminAnalytics } from "../controller/adminAnalyticsController.js";

const Router = express.Router();



// Coin account management
Router.get('/pending-request', getPendingRequests);
Router.post(
  "/requests/:userId/:role/:action",
  handleUserRequest
);
Router.get('/users', getAllUsers);
Router.get("/analytics", getAdminAnalytics);


export default Router