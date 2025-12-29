import express from 'express';
import User from '../models/User.js';
import {getPendingRequests ,handleUserRequest ,getAllUsers} from '../controller/Admin/AdminController.js';

const Router = express.Router();



// Coin account management
Router.get('/pending-request', getPendingRequests);
Router.post(
  "/requests/:userId/:role/:action",
  handleUserRequest
);
Router.get('/users', getAllUsers);

export default Router