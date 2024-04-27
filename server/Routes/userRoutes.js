const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user');

// Route for creating a new user
router.post('/signup', UserController.createUser);

// Route for logging in a user
router.post('/login', UserController.loginUser);

module.exports = router;
