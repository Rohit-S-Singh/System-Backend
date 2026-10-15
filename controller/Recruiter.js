import axios from 'axios';
import Recruiter from '../models/Recruiter.js';
import User from '../models/User.js'; // assuming you have a User model

// The shared recruiter directory's source-of-truth spreadsheet. Must be
// shared as "Anyone with the link" (Viewer) for the CSV export to work
// without OAuth.
const RECRUITER_SHEET_ID = "1-1EOmtgYqH9cFotUrJVECqzn5Ao4BNA13VdYxLdKezM";

// Minimal CSV parser — good enough for simple exports without embedded
// newlines, but still handles quoted fields with commas/escaped quotes.
const parseCsv = (text) =>
  text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
      const cells = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cells.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      cells.push(cur);
      return cells.map((c) => c.trim());
    });

export const syncRecruitersFromSheet = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const user = userEmail ? await User.findOne({ email: userEmail }) : null;

    const csvUrl = `https://docs.google.com/spreadsheets/d/${RECRUITER_SHEET_ID}/export?format=csv`;

    let csvText;
    try {
      const response = await axios.get(csvUrl, { responseType: 'text' });
      csvText = response.data;
    } catch (fetchError) {
      console.error('Sheet fetch failed:', fetchError.message);
      return res.status(502).json({
        success: false,
        message: 'Could not reach the Google Sheet. Make sure it\'s shared as "Anyone with the link" (Viewer).',
      });
    }

    const rows = parseCsv(csvText);
    if (rows.length <= 1) {
      return res.json({ success: true, added: 0, updated: 0, skipped: 0 });
    }

    const header = rows[0].map((h) => h.toLowerCase());
    const companyIdx = header.findIndex((h) => h.includes('company'));
    const emailIdx = header.findIndex((h) => h.includes('email'));
    const nameIdx = header.findIndex((h) => h.includes('name'));

    if (emailIdx === -1) {
      return res.status(400).json({ success: false, message: 'The sheet needs an Email column.' });
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows.slice(1)) {
      const email = row[emailIdx]?.trim();
      if (!email || !email.includes('@')) {
        skipped++;
        continue;
      }

      const name = (nameIdx !== -1 ? row[nameIdx]?.trim() : '') || email;
      const company = companyIdx !== -1 ? row[companyIdx]?.trim() || '' : '';

      const existing = await Recruiter.findOne({ email });
      if (existing) {
        let changed = false;
        if (name && existing.name !== name) {
          existing.name = name;
          changed = true;
        }
        if (company && existing.company !== company) {
          existing.company = company;
          changed = true;
        }
        if (changed) {
          await existing.save();
          updated++;
        }
      } else if (user) {
        await Recruiter.create({
          name,
          email,
          company,
          addedBy: user._id,
          status: 'No Response',
          sentAt: null,
        });
        added++;
      } else {
        // No logged-in user to attribute a brand-new row to — skip rather
        // than violate the schema's required addedBy field.
        skipped++;
      }
    }

    return res.json({ success: true, added, updated, skipped });
  } catch (error) {
    console.error('Sheet sync error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync from Google Sheet.' });
  }
};

export const requestRecruiter = async (req, res) => {
  try {
 

    const email = req.params.email;   // email from param
    const recruiterData = req.body;   // recruiter form data


    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update recruiter flags
    user.isRecruiter = true;
    user.recruiterStatus = "Pending";

    // Store recruiter profile
    user.recruiterProfile = {
      companyName: recruiterData.companyName || "",
      position: recruiterData.position || "",
      experienceYears: recruiterData.experienceYears || "",
      website: recruiterData.website || "",
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Recruiter request submitted successfully",
      recruiterStatus: user.recruiterStatus,
    });

  } catch (err) {
    console.error("Error in requestRecruiter:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};








export const getUserRecruiters = async (req, res) => {
  try {
    // Recruiter contacts are a shared directory — anyone's upload is visible
    // to everyone. Per-user outreach status is derived separately from each
    // user's own EmailLog entries (see getEmailLogs), so this stays safe to
    // share without leaking who-emailed-who.
    const recruiters = await Recruiter.find({}).sort({ createdAt: -1 });
    res.json({ success: true, recruiters });
  } catch (err) {
    console.error("Error fetching recruiters:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recruiters" });
  }
};

export const createRecruiter = async (req, res) => {
  try {
    const { name, email, userEmail, company } = req.body;

    if (!name || !email || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "name, email, and userEmail are required",
      });
    }

    // 1️⃣ Find the user who is adding the recruiter
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with provided userEmail",
      });
    }

    // 2️⃣ Recruiters are a shared directory now, so dedupe globally by email
    // (not per-user) — otherwise two users uploading the same recruiter
    // would create two rows for the same inbox, splitting the email history
    // across two different recruiterIds. Re-adding an existing recruiter
    // (e.g. to fill in their company) updates that row instead of silently
    // discarding the new info — there's no separate "edit recruiter" UI, so
    // this doubles as the edit path.
    const existing = await Recruiter.findOne({ email });
    if (existing) {
      if (name) existing.name = name;
      if (company) existing.company = company;
      await existing.save();

      return res.status(200).json({
        success: true,
        message: "Recruiter updated",
        data: existing,
      });
    }

    const recruiter = await Recruiter.create({
      name,
      email,
      company: company || "",
      addedBy: user._id,
      status: "No Response",
      sentAt: null
    });

    return res.status(201).json({
      success: true,
      message: "Recruiter created successfully",
      data: recruiter,
    });

  } catch (error) {
    console.error("Error creating recruiter:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Kept in sync with navbar.js's showAdminLink check — same account counts
// as admin on both the frontend and here, plus anyone with role: "admin".
const ADMIN_FALLBACK_EMAIL = "rohitshekrsingh@gmail.com";

const isRequesterAdmin = async (req) => {
  const requester = req.user?.userId ? await User.findById(req.user.userId) : null;
  return requester?.role === 'admin' || requester?.email?.toLowerCase() === ADMIN_FALLBACK_EMAIL;
};

export const deleteRecruiter = async (req, res) => {
  try {
    if (!(await isRequesterAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Only admins can delete recruiters.' });
    }

    const { id } = req.params;
    const deleted = await Recruiter.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Recruiter not found.' });
    }

    return res.json({ success: true, message: 'Recruiter deleted.' });
  } catch (error) {
    console.error('Delete recruiter error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete recruiter.' });
  }
};

export const bulkDeleteRecruiters = async (req, res) => {
  try {
    if (!(await isRequesterAdmin(req))) {
      return res.status(403).json({ success: false, message: 'Only admins can delete recruiters.' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No recruiter ids provided.' });
    }

    const result = await Recruiter.deleteMany({ _id: { $in: ids } });
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Bulk delete recruiters error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete recruiters.' });
  }
};

