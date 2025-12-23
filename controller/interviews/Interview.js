import Mentor from "../../models/Mentor.js";
import RequestInterview from '../../models/interview/InterviewRequest.js';
import InterviewScheduled from "../../models/interview/interviewSchedule.js";
import InterviewHistory from "../../models/interview/InterviewHistory.js";
// import Interview from '../../models/interview/Interview.js';
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


export const createInterviewRequest = async (req, res) => {
  try {
    const { mentor, user, date, day, time, duration, message, additionalDetails } = req.body;

    // Validate required fields
    if (!mentor || !user || !date || !day || !time || !duration || !message) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    // Create new interview request
    const newRequest = new RequestInterview({
      mentor,
      user,
      date,
      day,
      time,
      duration,
      message,
      additionalDetails,
    });

    const savedRequest = await newRequest.save();
console.log("hi");
    return res.status(201).json({
      success: true,
      message: "Interview request created successfully.",
      request: savedRequest,
    });
    
    
  } catch (error) {
    console.error("Error creating interview request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create interview request.",
    });
  }
};



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



// // export const getMentorList = async (req, res) => {
// //   console.log("mentorlist");
  
// //   try {
// //     const {
// //       expertise,
// //       interviewType,
// //       minExperience,
// //       verified,
// //       status = "active",
// //       page = 1,
// //       limit = 10,
// //     } = req.query;

// //     const filter = {};

// //     // Only active mentors by default
// //     if (status) filter.status = status;

// //     if (verified !== undefined) {
// //       filter.isVerified = verified === "true";
// //     }

// //     if (expertise) {
// //       filter.expertise = { $in: expertise.split(",") };
// //     }

// //     if (interviewType) {
// //       filter.interviewTypes = interviewType;
// //     }

// //     if (minExperience) {
// //       filter.experience = { $gte: Number(minExperience) };
// //     }

// //     const mentors = await Mentor.find(filter)
// //       .populate("user", "name email picture")
// //       .sort({ rating: -1, experience: -1 })
// //       .skip((page - 1) * limit)
// //       .limit(Number(limit));

// //     const total = await Mentor.countDocuments(filter);

// //     return res.status(200).json({
// //       success: true,
// //       total,
// //       page: Number(page),
// //       totalPages: Math.ceil(total / limit),
// //       mentors,
// //     });
// //   } catch (error) {
// //     console.error("Get Mentor List Error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch mentors",
// //     });
// //   }
// // };

// export const getMentorList = async (req, res) => {
//   console.log("mentorlist");

//   try {
//     const {
//       expertise,
//       interviewType,
//       minExperience,
//       verified,
//       status = "active",
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const filter = {};

//     // Only active mentors by default
//     if (status) filter.status = status;

//     if (verified !== undefined) {
//       filter.isVerified = verified === "true";
//     }

//     if (expertise) {
//       filter.expertise = { $in: expertise.split(",") };
//     }

//     if (interviewType) {
//       filter.interviewTypes = interviewType;
//     }

//     if (minExperience) {
//       filter.experience = { $gte: Number(minExperience) };
//     }

//     const mentors = await Mentor.find(filter)
//       // ✅ INCLUDE _id EXPLICITLY
//       .populate("user", "_id name email picture")
//       .sort({ rating: -1, experience: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const total = await Mentor.countDocuments(filter);

//     return res.status(200).json({
//       success: true,
//       total,
//       page: Number(page),
//       totalPages: Math.ceil(total / limit),
//       mentors,
//     });
//   } catch (error) {
//     console.error("Get Mentor List Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch mentors",
//     });
//   }
// };


export const getMentorList = async (req, res) => {
  console.log("mentorlist");

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

    // Fetch mentors WITHOUT populating user
    const mentors = await Mentor.find(filter)
      .select("_id user expertise experience bio pricePerHour interviewTypes availability rating completedInterviews") // return only required fields
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




/**
 * UPDATE FEEDBACK (CANDIDATE NOTES)
 * PUT /api/interviews/:id/feedback
 */
export const updateInterviewFeedback = async (req, res) => {
  try {
    const candidateId = req.user.userId;
    const interviewId = req.params.id;
    const { candidateNotes } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      candidate: candidateId,
      status: "completed"
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found or not completed"
      });
    }

    interview.candidateNotes = candidateNotes;
    await interview.save();

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback"
    });
  }
};

export const getMentorRequests = async (req, res) => {
  try {
    const { mentorUserId } = req.query;

    if (!mentorUserId) {
      return res.status(400).json({
        success: false,
        message: "mentorUserId is required",
      });
    }

    // 1. Find the mentor document for this user
    const mentor = await Mentor.findOne({ user: mentorUserId });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    // 2. Find all interview requests for this mentor
    const requests = await RequestInterview.find({ mentor: mentor._id })
      .populate("user", "_id name email picture") // populate requester info
      .sort({ createdAt: -1 });

    // 3. Send response
    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error("Get mentor requests error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



export const handleInterviewRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" or "reject"

    const request = await RequestInterview.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (action === "accept") {
      // Create a new scheduled interview
      const scheduled = await InterviewScheduled.create({
        mentor: request.mentor,
        user: request.user,
        date: request.date,
        day: request.day,
        time: request.time,
        duration: request.duration,
        message: request.message,
        additionalDetails: request.additionalDetails,
        status: "scheduled",
      });

      // Calculate time until 1 hour after scheduled interview
      const interviewDate = new Date(request.date); // Assuming request.date has full date & time
      const deleteTime = interviewDate.getTime() + 60 * 60 * 1000; // 1 hour later
      const delay = deleteTime - Date.now();

      // Schedule deletion
      if (delay > 0) {
        setTimeout(async () => {
          try {
            await InterviewScheduled.findByIdAndDelete(scheduled._id);
            console.log(`Scheduled interview ${scheduled._id} deleted after 1 hour.`);
          } catch (err) {
            console.error("Failed to delete scheduled interview:", err);
          }
        }, delay);
      }
    }

    // Remove the request from RequestInterview (for both accept & reject)
    await RequestInterview.findByIdAndDelete(requestId);

    return res.json({
      success: true,
      message: action === "accept" ? "Interview accepted and scheduled" : "Interview rejected",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




// controllers/interviewScheduledController.js

// Get scheduled interviews for a logged-in user
export const getScheduledInterviews = async (req, res) => {
  try {
    const { userId } = req.query; // user id sent from frontend

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Fetch interviews where user is either mentor or user
    const interviews = await InterviewScheduled.find({
      $or: [{ mentor: userId }, { user: userId }],
    })
      .populate("mentor", "user") // populate mentor's user reference
      .populate("user", "name email") // populate user details
      .sort({ date: 1 });

    return res.json({ success: true, interviews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




// controllers/interviewScheduledController.js
export const cancelScheduledInterview = async (req, res) => {
  try {
    console.log("llllllllllllllllll");
    
    const { interviewId } = req.params;

    const interview = await InterviewScheduled.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    // Option 1: Remove the interview completely
    await InterviewScheduled.findByIdAndDelete(interviewId);

    // Option 2 (alternative): Mark as cancelled instead
    // interview.status = "cancelled";
    // await interview.save();

    return res.json({ success: true, message: "Interview cancelled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



// controllers/interviewScheduledController.js
export const rescheduleInterview = async (req, res) => {
  console.log("l;l;");
  
  try {
    const { interviewId } = req.params;
    const { date, time, duration } = req.body;

    const interview = await InterviewScheduled.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    interview.date = date || interview.date;
    interview.time = time || interview.time;
    interview.duration = duration || interview.duration;

    await interview.save();

    return res.json({ success: true, message: "Interview rescheduled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


export const completeInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: "Feedback is required",
      });
    }

    const interview = await InterviewScheduled.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Scheduled interview not found",
      });
    }

    // 1️⃣ Add to InterviewHistory
    await InterviewHistory.create({
      mentor: interview.mentor,
      user: interview.user,
      date: interview.date,
      day: interview.day,
      time: interview.time,
      duration: interview.duration,
      message: interview.message,
      additionalDetails: interview.additionalDetails,
      feedback,
      status: "completed",
    });

    // 2️⃣ Remove from InterviewScheduled
    await InterviewScheduled.findByIdAndDelete(interviewId);

    return res.json({
      success: true,
      message: "Interview marked as completed",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }};



export const getInterviewHistory = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const history = await InterviewHistory.find({
      $or: [{ user: userId }, { mentor: userId }],
    })
      .populate("user", "name email")
      .populate("mentor")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      interviews: history,
    });
  } catch (error) {
    console.error("Interview history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
