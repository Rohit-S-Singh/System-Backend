import express from 'express';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingConnections,
  getSentConnections,
  getConnections,
  removeConnection,
  getConnectionStatus,
  getSuggestedConnections
} from '../controller/Network.js';

import authenticateToken from '../middleware/index.js';

const Router = express.Router();

// All routes require authentication
Router.use(authenticateToken);

// Send connection request
Router.post('/send-request', sendConnectionRequest);

// Accept connection request
Router.post('/accept-request', acceptConnectionRequest);

// Reject connection request
Router.post('/reject-request', rejectConnectionRequest);

// Get pending connection requests
Router.get('/pending-requests', getPendingConnections);

// Get sent connection requests
Router.get('/sent-requests', getSentConnections);

// Get all connections (accepted)
Router.get('/connections', getConnections);

// Remove connection
Router.delete('/remove-connection', removeConnection);

// Get connection status with a specific user
Router.get('/connection-status/:userId', getConnectionStatus);

// Get suggested connections
Router.get('/suggested', getSuggestedConnections);

export default Router; 