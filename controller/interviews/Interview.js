import Mentor from "../../models/Mentor.js";
import Interview from '../../models/Interview.js';
import User from '../../models/User.js';
import { createNotification } from '../Notification.js';
import { awardInterviewCoins } from '../coins/Coin.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

// Create Google Calendar event
const createCalendarEvent = async (user, interview) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oAuth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const event = {
      summary: interview.title,
      description: interview.description || 'Interview scheduled via our platform',
      start: {
        dateTime: interview.scheduledDate.toISOString(),
        timeZone: interview.timezone,
      },
      end: {
        dateTime: new Date(interview.scheduledDate.getTime() + interview.duration * 60000).toISOString(),
        timeZone: interview.timezone,
      },
      attendees: [
        { email: interview.candidate.email },
        { email: interview.mentor.email }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `interview-${interview._id}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Send interview request
// export const requestInterview = async (req, res) => {
//   try {
//     const {
//       mentorId,
//       interviewType,
//       scheduledDate,
//       duration,
//       timezone,
//       title,
//       description,
//       candidateNotes
//     } = req.body;

//     const candidateId = req.user.id;

//     // Validate input
//     if (!mentorId || !interviewType || !scheduledDate || !title) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: mentorId, interviewType, scheduledDate, title'
//       });
//     }

//     // Check if candidate and mentor are the same
//     if (candidateId === mentorId) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot schedule an interview with yourself'
//       });
//     }

//     // Check if mentor exists and is active
//     const mentor = await User.findById(mentorId);
//     if (!mentor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Mentor not found'
//       });
//     }

//     if (!mentor.isMentor || mentor.mentorStatus !== 'active') {
//       return res.status(400).json({
//         success: false,
//         message: 'Mentor is not available for interviews'
//       });
//     }

//     // Check if mentor supports this interview type
//     if (mentor.mentorProfile?.interviewTypes && 
//         !mentor.mentorProfile.interviewTypes.includes(interviewType)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Mentor does not offer this type of interview'
//       });
//     }

//     // Check for scheduling conflicts
//     const scheduledDateObj = new Date(scheduledDate);
//     const interviewDuration = duration || 60;
//     const endTime = new Date(scheduledDateObj.getTime() + interviewDuration * 60000);

//     // Find any existing interviews that might conflict
//     const existingInterviews = await Interview.find({
//       mentor: mentorId,
//       status: { $in: ['pending', 'accepted'] }
//     });

//     // Check for conflicts manually
//     const conflictingInterview = existingInterviews.find(existing => {
//       const existingEndTime = new Date(existing.scheduledDate.getTime() + existing.duration * 60000);
      
//       // Check if interviews overlap
//       return (
//         (scheduledDateObj < existingEndTime && endTime > existing.scheduledDate) ||
//         (existing.scheduledDate < endTime && existingEndTime > scheduledDateObj)
//       );
//     });

//     if (conflictingInterview) {
//       return res.status(400).json({
//         success: false,
//         message: 'Mentor has a conflicting interview at this time'
//       });
//     }

//     // Create interview request
//     const interview = new Interview({
//       candidate: candidateId,
//       mentor: mentorId,
//       interviewType,
//       scheduledDate: scheduledDateObj,
//       duration: duration || 60,
//       timezone: timezone || 'UTC',
//       title,
//       description,
//       candidateNotes
//     });

//     await interview.save();

//     // Populate user details
//     await interview.populate('candidate', 'name email givenName familyName');
//     await interview.populate('mentor', 'name email givenName familyName');

//     // Create notification for mentor
//     await createNotification({
//       recipient: mentorId,
//       sender: candidateId,
//       type: 'interview_request',
//       title: 'New Interview Request',
//       message: `${interview.candidate.name || interview.candidate.email} has requested a ${interviewType} interview`,
//       data: {
//         interviewId: interview._id,
//         interviewType,
//         scheduledDate: interview.scheduledDate,
//         candidateName: interview.candidate.name,
//         candidateEmail: interview.candidate.email
//       },
//       actionUrl: `/interviews/pending`,
//       actionText: 'View Request',
//       priority: 'high'
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Interview request sent successfully',
//       data: interview
//     });

//   } catch (error) {
//     console.error('Error requesting interview:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };
export const requestInterview = async (req, res) => {
  try {
    const {
      mentorId,
      interviewType,
      scheduledDate,
      duration,
      title,
      description,
      candidateNotes
    } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor || mentor.status !== "active") {
      return res.status(400).json({ message: "Mentor not available" });
    }

    const interview = await Interview.create({
      candidate: req.user._id,
      mentor: mentor.user,
      interviewType,
      scheduledDate,
      duration,
      title,
      description,
      candidateNotes
    });

    await Notification.create({
      recipient: mentor.user,
      sender: req.user._id,
      type: "interview_request",
      title: "New Interview Request",
      message: `${req.user.name} requested an interview`,
      interview: interview._id,
      actionUrl: `/mentor/interviews`
    });

    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Accept interview request
// export const acceptInterview = async (req, res) => {
//   try {
//     const { interviewId, mentorNotes, meetingLink } = req.body;
//     const mentorId = req.user.id;

//     const interview = await Interview.findById(interviewId)
//       .populate('candidate', 'name email givenName familyName')
//       .populate('mentor', 'name email givenName familyName accessToken refreshToken');

//     if (!interview) {
//       return res.status(404).json({
//         success: false,
//         message: 'Interview not found'
//       });
//     }

//     if (interview.mentor._id.toString() !== mentorId) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only accept interviews assigned to you'
//       });
//     }

//     if (interview.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'Interview is not in pending status'
//       });
//     }

//     // Update interview status
//     interview.status = 'accepted';
//     interview.acceptedAt = new Date();
//     interview.mentorNotes = mentorNotes;
//     interview.meetingLink = meetingLink;

//     // Create calendar event if mentor has OAuth setup
//     if (interview.mentor.accessToken && interview.mentor.refreshToken) {
//       try {
//         const calendarEvent = await createCalendarEvent(interview.mentor, interview);
//         interview.calendarEventId = calendarEvent.id;
//         interview.meetingLink = calendarEvent.hangoutLink || meetingLink;
//       } catch (calendarError) {
//         console.error('Calendar event creation failed:', calendarError);
//         // Continue without calendar event
//       }
//     }

//     await interview.save();

//     // Create notification for candidate
//     await createNotification({
//       recipient: interview.candidate._id,
//       sender: mentorId,
//       type: 'interview_accepted',
//       title: 'Interview Request Accepted',
//       message: `${interview.mentor.name || interview.mentor.email} has accepted your interview request`,
//       data: {
//         interviewId: interview._id,
//         interviewType: interview.interviewType,
//         scheduledDate: interview.scheduledDate,
//         mentorName: interview.mentor.name,
//         meetingLink: interview.meetingLink
//       },
//       actionUrl: `/interviews/${interview._id}`,
//       actionText: 'View Details',
//       priority: 'high'
//     });

//     res.json({
//       success: true,
//       message: 'Interview accepted successfully',
//       data: interview
//     });

//   } catch (error) {
//     console.error('Error accepting interview:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };
export const acceptInterview = async (req, res) => {
  const { interviewId, mentorNotes } = req.body;

  const interview = await Interview.findById(interviewId);
  if (!interview) return res.status(404).json({ message: "Not found" });

  interview.status = "accepted";
  interview.acceptedAt = new Date();
  interview.mentorNotes = mentorNotes;
  await interview.save();

  await Notification.create({
    recipient: interview.candidate,
    sender: req.user._id,
    type: "interview_accepted",
    title: "Interview Accepted",
    message: "Your interview request was accepted",
    interview: interview._id
  });

  res.json(interview);
};



// Reject interview request
// export const rejectInterview = async (req, res) => {
//   try {
//     const { interviewId, reason } = req.body;
//     const mentorId = req.user.id;

//     const interview = await Interview.findById(interviewId)
//       .populate('candidate', 'name email givenName familyName')
//       .populate('mentor', 'name email givenName familyName');

//     if (!interview) {
//       return res.status(404).json({
//         success: false,
//         message: 'Interview not found'
//       });
//     }

//     if (interview.mentor._id.toString() !== mentorId) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only reject interviews assigned to you'
//       });
//     }

//     if (interview.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'Interview is not in pending status'
//       });
//     }

//     // Update interview status
//     interview.status = 'rejected';
//     interview.rejectedAt = new Date();
//     interview.mentorNotes = reason;

//     await interview.save();

//     // Create notification for candidate
//     await createNotification({
//       recipient: interview.candidate._id,
//       sender: mentorId,
//       type: 'interview_rejected',
//       title: 'Interview Request Rejected',
//       message: `${interview.mentor.name || interview.mentor.email} has rejected your interview request`,
//       data: {
//         interviewId: interview._id,
//         interviewType: interview.interviewType,
//         scheduledDate: interview.scheduledDate,
//         mentorName: interview.mentor.name,
//         reason: reason
//       },
//       priority: 'medium'
//     });

//     res.json({
//       success: true,
//       message: 'Interview rejected successfully',
//       data: interview
//     });

//   } catch (error) {
//     console.error('Error rejecting interview:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };
export const rejectInterview = async (req, res) => {
  const { interviewId, reason } = req.body;

  const interview = await Interview.findById(interviewId);
  interview.status = "rejected";
  interview.rejectedAt = new Date();
  interview.mentorNotes = reason;
  await interview.save();

  await Notification.create({
    recipient: interview.candidate,
    sender: req.user._id,
    type: "interview_rejected",
    title: "Interview Rejected",
    message: reason,
    interview: interview._id
  });

  res.json(interview);
};






// Get pending interviews for mentor
export const getPendingInterviews = async (req, res) => {
  try {
    const mentorId = req.user.id;

    const interviews = await Interview.find({
      mentor: mentorId,
      status: 'pending'
    })
    .populate('candidate', 'name email givenName familyName picture')
    .populate('mentor', 'name email givenName familyName')
    .sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: interviews
    });

  } catch (error) {
    console.error('Error fetching pending interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all interviews for user (candidate or mentor)
export const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, role } = req.query;

    let query = {
      $or: [
        { candidate: userId },
        { mentor: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (role === 'candidate') {
      query = { candidate: userId };
    } else if (role === 'mentor') {
      query = { mentor: userId };
    }

    const interviews = await Interview.find(query)
      .populate('candidate', 'name email givenName familyName picture')
      .populate('mentor', 'name email givenName familyName picture')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      data: interviews
    });

  } catch (error) {
    console.error('Error fetching user interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get interview details
export const getInterviewDetails = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findById(interviewId)
      .populate('candidate', 'name email givenName familyName picture')
      .populate('mentor', 'name email givenName familyName picture');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user is part of this interview
    if (interview.candidate._id.toString() !== userId && 
        interview.mentor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this interview'
      });
    }

    res.json({
      success: true,
      data: interview
    });

  } catch (error) {
    console.error('Error fetching interview details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Cancel interview
export const cancelInterview = async (req, res) => {
  try {
    const { interviewId, reason } = req.body;
    const userId = req.user.id;

    const interview = await Interview.findById(interviewId)
      .populate('candidate', 'name email givenName familyName')
      .populate('mentor', 'name email givenName familyName');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user is part of this interview
    const isCandidate = interview.candidate._id.toString() === userId;
    const isMentor = interview.mentor._id.toString() === userId;

    if (!isCandidate && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this interview'
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Interview is already cancelled'
      });
    }

    // Update interview status
    interview.status = 'cancelled';
    interview.cancelledAt = new Date();
    interview.cancelledBy = isCandidate ? 'candidate' : 'mentor';
    interview.cancellationReason = reason;

    await interview.save();

    // Create notification for the other party
    const notificationRecipient = isCandidate ? interview.mentor._id : interview.candidate._id;
    const notificationSender = isCandidate ? interview.candidate._id : interview.mentor._id;
    const senderName = isCandidate ? interview.candidate.name : interview.mentor.name;

    await createNotification({
      recipient: notificationRecipient,
      sender: notificationSender,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      message: `${senderName} has cancelled the interview`,
      data: {
        interviewId: interview._id,
        interviewType: interview.interviewType,
        scheduledDate: interview.scheduledDate,
        reason: reason
      },
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      data: interview
    });

  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark interview as completed and award coins
// export const completeInterview = async (req, res) => {
//   try {
//     const { interviewId } = req.body;
//     const userId = req.user.id;

//     const interview = await Interview.findById(interviewId)
//       .populate('candidate', 'name email givenName familyName')
//       .populate('mentor', 'name email givenName familyName');

//     if (!interview) {
//       return res.status(404).json({
//         success: false,
//         message: 'Interview not found'
//       });
//     }

//     // Check if user is part of this interview
//     const isCandidate = interview.candidate._id.toString() === userId;
//     const isMentor = interview.mentor._id.toString() === userId;

//     if (!isCandidate && !isMentor) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to complete this interview'
//       });
//     }

//     if (interview.status !== 'accepted') {
//       return res.status(400).json({
//         success: false,
//         message: 'Interview must be accepted before it can be completed'
//       });
//     }

//     // Update interview status
//     interview.status = 'completed';
//     interview.completedAt = new Date();
//     await interview.save();

//     // Award coins to both parties
//     try {
//       await awardInterviewCoins(interviewId, interview.candidate._id, interview.mentor._id);
//     } catch (coinError) {
//       console.error('Error awarding coins:', coinError);
//       // Continue even if coin awarding fails
//     }

//     res.json({
//       success: true,
//       message: 'Interview completed successfully. Coins have been awarded to both parties.',
//       data: interview
//     });

//   } catch (error) {
//     console.error('Error completing interview:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };
export const completeInterview = async (req, res) => {
  const { interviewId } = req.body;

  const interview = await Interview.findById(interviewId);
  interview.status = "completed";
  interview.completedAt = new Date();
  await interview.save();

  await awardInterviewCoins(interview._id);

  res.json({ message: "Interview completed & coins awarded" });
};




/**
 * =========================================
 * 1️⃣ Get List of Mentors
 * =========================================
 * Filters supported:
 * - expertise
 * - interviewType
 * - minExperience
 * - verified
 * - status
 * Pagination:
 * - page, limit
 */
export const getMentorList = async (req, res) => {
  try {
    const {
      expertise,
      interviewType,
      minExperience,
      verified,
      status = "active",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Only active mentors by default
    if (status) filter.status = status;

    if (verified !== undefined) {
      filter.isVerified = verified === "true";
    }

    if (expertise) {
      filter.expertise = { $in: expertise.split(",") };
    }

    if (interviewType) {
      filter.interviewTypes = interviewType;
    }

    if (minExperience) {
      filter.experience = { $gte: Number(minExperience) };
    }

    const mentors = await Mentor.find(filter)
      .populate("user", "name email picture")
      .sort({ rating: -1, experience: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Mentor.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      mentors,
    });
  } catch (error) {
    console.error("Get Mentor List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentors",
    });
  }
};

/**
 * =========================================
 * 2️⃣ Get Mentor Details by ID
 * =========================================
 */
export const getMentorDetails = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const mentor = await Mentor.findById(mentorId)
      .populate("user", "name email picture");

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    return res.status(200).json({
      success: true,
      mentor,
    });
  } catch (error) {
    console.error("Get Mentor Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor details",
    });
  }
};







// Update mentor profile
export const updateMentorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      expertise,
      experience,
      bio,
      hourlyRate,
      availability,
      interviewTypes,
      mentorStatus
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update mentor profile
    user.isMentor = true;
    user.mentorProfile = {
      expertise: expertise || user.mentorProfile?.expertise || [],
      experience: experience || user.mentorProfile?.experience || 0,
      bio: bio || user.mentorProfile?.bio || '',
      hourlyRate: hourlyRate || user.mentorProfile?.hourlyRate,
      availability: availability || user.mentorProfile?.availability || [],
      interviewTypes: interviewTypes || user.mentorProfile?.interviewTypes || []
    };

    if (mentorStatus) {
      user.mentorStatus = mentorStatus;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Mentor profile updated successfully',
      data: {
        isMentor: user.isMentor,
        mentorProfile: user.mentorProfile,
        mentorStatus: user.mentorStatus
      }
    });

  } catch (error) {
    console.error('Error updating mentor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 