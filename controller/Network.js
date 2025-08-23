import User from '../models/User.js';
import Connection from '../models/Connection.js';
import { createNotification } from './Notification.js';

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    // Validate input
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    // Check if sender and receiver are the same
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send connection request to yourself'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'Connection request already exists or users are already connected'
      });
    }

    // Create new connection request
    const connection = new Connection({
      sender: senderId,
      receiver: receiverId,
      message: message || ''
    });

    await connection.save();

    // Update sender's sent requests
    await User.findByIdAndUpdate(senderId, {
      $addToSet: { sentConnectionRequests: receiverId }
    });

    // Update receiver's pending connections
    await User.findByIdAndUpdate(receiverId, {
      $addToSet: { pendingConnections: senderId }
    });

    // Create notification for receiver
    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${connection.sender.name || 'Someone'} sent you a connection request`,
      data: {
        connectionId: connection._id,
        senderName: connection.sender.name,
        message: connection.message
      },
      actionUrl: '/connections/pending',
      actionText: 'View Request'
    });

    // Populate sender and receiver details
    await connection.populate('sender', 'name email picture');
    await connection.populate('receiver', 'name email picture');

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: connection
    });

  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.body;
    const userId = req.user.id;

    // Find the connection request
    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Verify the user is the receiver
    if (connection.receiver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept connection requests sent to you'
      });
    }

    // Check if already accepted
    if (connection.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Connection request already accepted'
      });
    }

    // Update connection status
    connection.status = 'accepted';
    connection.acceptedAt = new Date();
    await connection.save();

    // Update both users' connections
    await User.findByIdAndUpdate(connection.sender, {
      $addToSet: { connections: connection.receiver },
      $inc: { connectionCount: 1 },
      $pull: { sentConnectionRequests: connection.receiver }
    });

    await User.findByIdAndUpdate(connection.receiver, {
      $addToSet: { connections: connection.sender },
      $inc: { connectionCount: 1 },
      $pull: { pendingConnections: connection.sender }
    });

    // Create notification for sender
    await createNotification({
      recipient: connection.sender,
      sender: connection.receiver,
      type: 'connection_accepted',
      title: 'Connection Request Accepted',
      message: `${connection.receiver.name || 'Someone'} accepted your connection request`,
      data: {
        connectionId: connection._id,
        receiverName: connection.receiver.name
      },
      actionUrl: '/connections',
      actionText: 'View Connection'
    });

    // Populate user details
    await connection.populate('sender', 'name email picture');
    await connection.populate('receiver', 'name email picture');

    res.json({
      success: true,
      message: 'Connection request accepted successfully',
      data: connection
    });

  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reject connection request
export const rejectConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.body;
    const userId = req.user.id;

    // Find the connection request
    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Verify the user is the receiver
    if (connection.receiver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject connection requests sent to you'
      });
    }

    // Update connection status
    connection.status = 'rejected';
    connection.rejectedAt = new Date();
    await connection.save();

    // Remove from pending connections
    await User.findByIdAndUpdate(connection.receiver, {
      $pull: { pendingConnections: connection.sender }
    });

    // Remove from sent requests
    await User.findByIdAndUpdate(connection.sender, {
      $pull: { sentConnectionRequests: connection.receiver }
    });

    // Create notification for sender
    await createNotification({
      recipient: connection.sender,
      sender: connection.receiver,
      type: 'connection_rejected',
      title: 'Connection Request Rejected',
      message: `${connection.receiver.name || 'Someone'} rejected your connection request`,
      data: {
        connectionId: connection._id,
        receiverName: connection.receiver.name
      },
      priority: 'low'
    });

    res.json({
      success: true,
      message: 'Connection request rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting connection request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get pending connection requests
export const getPendingConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingConnections = await Connection.find({
      receiver: userId,
      status: 'pending'
    }).populate('sender', 'name email picture givenName familyName');

    res.json({
      success: true,
      data: pendingConnections
    });

  } catch (error) {
    console.error('Error fetching pending connections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get sent connection requests
export const getSentConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    const sentConnections = await Connection.find({
      sender: userId,
      status: 'pending'
    }).populate('receiver', 'name email picture givenName familyName');

    res.json({
      success: true,
      data: sentConnections
    });

  } catch (error) {
    console.error('Error fetching sent connections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all connections (accepted)
export const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    const connections = await Connection.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' }
      ]
    }).populate('sender', 'name email picture givenName familyName')
      .populate('receiver', 'name email picture givenName familyName');

    // Format the response to show connected users
    const connectedUsers = connections.map(connection => {
      const connectedUser = connection.sender._id.toString() === userId 
        ? connection.receiver 
        : connection.sender;
      
      return {
        connectionId: connection._id,
        user: connectedUser,
        connectedAt: connection.acceptedAt
      };
    });

    res.json({
      success: true,
      data: connectedUsers
    });

  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove connection
export const removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.body;
    const userId = req.user.id;

    // Find the connection
    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Verify the user is part of this connection
    if (connection.sender.toString() !== userId && connection.receiver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove your own connections'
      });
    }

    // Remove connection from both users
    await User.findByIdAndUpdate(connection.sender, {
      $pull: { connections: connection.receiver },
      $inc: { connectionCount: -1 }
    });

    await User.findByIdAndUpdate(connection.receiver, {
      $pull: { connections: connection.sender },
      $inc: { connectionCount: -1 }
    });

    // Delete the connection
    await Connection.findByIdAndDelete(connectionId);

    res.json({
      success: true,
      message: 'Connection removed successfully'
    });

  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get connection status with a specific user
export const getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId === userId) {
      return res.json({
        success: true,
        data: { status: 'self' }
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    if (!connection) {
      return res.json({
        success: true,
        data: { status: 'none' }
      });
    }

    res.json({
      success: true,
      data: { 
        status: connection.status,
        connectionId: connection._id,
        isSender: connection.sender.toString() === currentUserId
      }
    });

  } catch (error) {
    console.error('Error fetching connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get suggested connections (users not connected)
export const getSuggestedConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's connections and pending requests
    const user = await User.findById(userId);
    const connectedUserIds = [
      ...user.connections,
      ...user.pendingConnections,
      ...user.sentConnectionRequests,
      userId
    ];

    // Find users not connected
    const suggestedUsers = await User.find({
      _id: { $nin: connectedUserIds }
    })
    .select('name email picture givenName familyName connectionCount')
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ connectionCount: -1, createdAt: -1 });

    res.json({
      success: true,
      data: suggestedUsers,
      pagination: {
        page,
        limit,
        hasMore: suggestedUsers.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching suggested connections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
