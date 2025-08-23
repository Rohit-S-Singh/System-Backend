import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  updateNotificationSettings,
  getNotificationSettings,
  clearAllNotifications,
  getNotificationStats
} from '../controller/Notification.js';

import authenticateToken from '../middleware/index.js';

const Router = express.Router();

// All routes require authentication
Router.use(authenticateToken);

// Get user notifications
Router.get('/', getUserNotifications);

// Get unread notification count
Router.get('/unread-count', getUnreadCount);

// Get notification settings
Router.get('/settings', getNotificationSettings);

// Get notification statistics
Router.get('/stats', getNotificationStats);

// Mark notification as read
Router.post('/mark-read', markNotificationAsRead);

// Mark all notifications as read
Router.post('/mark-all-read', markAllNotificationsAsRead);

// Update notification settings
Router.put('/settings', updateNotificationSettings);

// Delete notification
Router.delete('/delete', deleteNotification);

// Clear all notifications
Router.delete('/clear-all', clearAllNotifications);

export default Router; 