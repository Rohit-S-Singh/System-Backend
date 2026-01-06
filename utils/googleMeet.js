// utils/googleMeet.js
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "google-credentials.json",
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

export const createGoogleMeetLink = async ({ title, description, startTime, endTime, attendees }) => {
  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startTime, timeZone: "Asia/Kolkata" },
      end: { dateTime: endTime, timeZone: "Asia/Kolkata" },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return event.data.hangoutLink;
};
