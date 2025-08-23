import { createNotification } from '../controller/Notification.js';

// Notification service for creating different types of notifications
export class NotificationService {
  
  // Connection-related notifications
  static async sendConnectionRequest(senderId, receiverId, senderName, message = '') {
    return await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${senderName || 'Someone'} sent you a connection request`,
      data: {
        senderName,
        message
      },
      actionUrl: '/connections/pending',
      actionText: 'View Request',
      priority: 'medium'
    });
  }

  static async connectionAccepted(senderId, receiverId, receiverName) {
    return await createNotification({
      recipient: senderId,
      sender: receiverId,
      type: 'connection_accepted',
      title: 'Connection Request Accepted',
      message: `${receiverName || 'Someone'} accepted your connection request`,
      data: {
        receiverName
      },
      actionUrl: '/connections',
      actionText: 'View Connection',
      priority: 'medium'
    });
  }

  static async connectionRejected(senderId, receiverId, receiverName) {
    return await createNotification({
      recipient: senderId,
      sender: receiverId,
      type: 'connection_rejected',
      title: 'Connection Request Rejected',
      message: `${receiverName || 'Someone'} rejected your connection request`,
      data: {
        receiverName
      },
      priority: 'low'
    });
  }

  // Message-related notifications
  static async newMessage(senderId, receiverId, senderName, messagePreview) {
    return await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: 'message_received',
      title: 'New Message',
      message: `${senderName || 'Someone'} sent you a message: ${messagePreview}`,
      data: {
        senderName,
        messagePreview
      },
      actionUrl: '/messages',
      actionText: 'View Message',
      priority: 'high'
    });
  }

  static async groupInvitation(senderId, receiverId, senderName, groupName) {
    return await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: 'group_invitation',
      title: 'Group Invitation',
      message: `${senderName || 'Someone'} invited you to join "${groupName}"`,
      data: {
        senderName,
        groupName
      },
      actionUrl: '/groups/invitations',
      actionText: 'View Invitation',
      priority: 'medium'
    });
  }

  // Job-related notifications
  static async jobApplication(userId, jobTitle, companyName) {
    return await createNotification({
      recipient: userId,
      type: 'job_application',
      title: 'Job Application Update',
      message: `Your application for "${jobTitle}" at ${companyName} has been received`,
      data: {
        jobTitle,
        companyName
      },
      actionUrl: '/jobs/applications',
      actionText: 'View Application',
      priority: 'medium'
    });
  }

  // Interview-related notifications
  static async interviewRequest(mentorId, candidateId, candidateName, interviewType, scheduledDate) {
    return await createNotification({
      recipient: mentorId,
      sender: candidateId,
      type: 'interview_request',
      title: 'New Interview Request',
      message: `${candidateName} has requested a ${interviewType} interview`,
      data: {
        interviewType,
        scheduledDate,
        candidateName
      },
      actionUrl: '/interviews/pending',
      actionText: 'View Request',
      priority: 'high'
    });
  }

  static async interviewAccepted(candidateId, mentorId, mentorName, interviewType, scheduledDate, meetingLink) {
    return await createNotification({
      recipient: candidateId,
      sender: mentorId,
      type: 'interview_accepted',
      title: 'Interview Request Accepted',
      message: `${mentorName} has accepted your interview request`,
      data: {
        interviewType,
        scheduledDate,
        mentorName,
        meetingLink
      },
      actionUrl: '/interviews/accepted',
      actionText: 'View Details',
      priority: 'high'
    });
  }

  static async interviewRejected(candidateId, mentorId, mentorName, interviewType, scheduledDate, reason) {
    return await createNotification({
      recipient: candidateId,
      sender: mentorId,
      type: 'interview_rejected',
      title: 'Interview Request Rejected',
      message: `${mentorName} has rejected your interview request`,
      data: {
        interviewType,
        scheduledDate,
        mentorName,
        reason
      },
      priority: 'medium'
    });
  }

  static async interviewCancelled(recipientId, senderId, senderName, interviewType, scheduledDate, reason) {
    return await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: `${senderName} has cancelled the interview`,
      data: {
        interviewType,
        scheduledDate,
        reason
      },
      priority: 'high'
    });
  }

  // Coin-related notifications
  static async referralBonus(userId, coins, referredUser) {
    return await createNotification({
      recipient: userId,
      type: 'referral_bonus',
      title: 'Referral Bonus Earned!',
      message: `You earned ${coins} coins for a successful referral`,
      data: { coins, referredUser },
      priority: 'medium'
    });
  }

  static async welcomeBonus(userId, coins, referrer) {
    return await createNotification({
      recipient: userId,
      type: 'welcome_bonus',
      title: 'Welcome Bonus!',
      message: `You earned ${coins} coins for using a referral code`,
      data: { coins, referrer },
      priority: 'medium'
    });
  }

  static async interviewCoinsEarned(userId, coins, interviewId) {
    return await createNotification({
      recipient: userId,
      type: 'interview_completed',
      title: 'Interview Completed!',
      message: `You earned ${coins} coins for completing the interview`,
      data: { coins, interviewId },
      priority: 'medium'
    });
  }

  static async subscriptionPurchased(userId, plan, coinsUsed) {
    return await createNotification({
      recipient: userId,
      type: 'subscription_purchase',
      title: 'Subscription Purchased!',
      message: `Successfully purchased ${plan} subscription using ${coinsUsed} coins`,
      data: { plan, coinsUsed },
      priority: 'medium'
    });
  }

  static async jobStatusUpdate(userId, jobTitle, status) {
    return await createNotification({
      recipient: userId,
      type: 'job_application',
      title: 'Job Application Status Update',
      message: `Your application for "${jobTitle}" has been ${status}`,
      data: {
        jobTitle,
        status
      },
      actionUrl: '/jobs/applications',
      actionText: 'View Details',
      priority: 'high'
    });
  }

  // Email-related notifications
  static async emailSent(userId, recipientEmail, subject) {
    return await createNotification({
      recipient: userId,
      type: 'email_sent',
      title: 'Email Sent Successfully',
      message: `Email "${subject}" sent to ${recipientEmail}`,
      data: {
        recipientEmail,
        subject
      },
      actionUrl: '/email/logs',
      actionText: 'View Logs',
      priority: 'low'
    });
  }

  static async emailFailed(userId, recipientEmail, subject, error) {
    return await createNotification({
      recipient: userId,
      type: 'email_sent',
      title: 'Email Failed to Send',
      message: `Failed to send email "${subject}" to ${recipientEmail}`,
      data: {
        recipientEmail,
        subject,
        error
      },
      actionUrl: '/email/logs',
      actionText: 'View Error',
      priority: 'high'
    });
  }

  // Profile-related notifications
  static async profileUpdate(userId, updateType) {
    return await createNotification({
      recipient: userId,
      type: 'profile_update',
      title: 'Profile Updated',
      message: `Your ${updateType} has been updated successfully`,
      data: {
        updateType
      },
      actionUrl: '/profile',
      actionText: 'View Profile',
      priority: 'low'
    });
  }

  // System notifications
  static async systemAlert(userId, title, message, priority = 'medium') {
    return await createNotification({
      recipient: userId,
      type: 'system_alert',
      title,
      message,
      data: {},
      priority
    });
  }

  static async welcomeNotification(userId, userName) {
    return await createNotification({
      recipient: userId,
      type: 'welcome',
      title: 'Welcome to Our Platform!',
      message: `Welcome ${userName}! We're excited to have you on board.`,
      data: {
        userName
      },
      actionUrl: '/onboarding',
      actionText: 'Get Started',
      priority: 'medium'
    });
  }

  // Bulk notifications
  static async sendBulkNotifications(userIds, notificationData) {
    const notifications = [];
    for (const userId of userIds) {
      try {
        const notification = await createNotification({
          ...notificationData,
          recipient: userId
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }
    return notifications;
  }

  // Custom notification
  static async sendCustomNotification(recipientId, senderId, type, title, message, data = {}, options = {}) {
    return await createNotification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      data,
      actionUrl: options.actionUrl,
      actionText: options.actionText,
      priority: options.priority || 'medium'
    });
  }
}

export default NotificationService; 