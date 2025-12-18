import User from '../models/User.js';
import Job from '../models/Job.js';

/**
 * @desc    Search Jobs
 * @route   GET /api/search/jobs
 * @access  Public
 */
export const searchJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      workMode,
      minSalary,
      batch,
      branch,
      page = 1,
      limit = 10
    } = req.query;

    const query = { status: 'Open' };

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (workMode) {
      query.workMode = workMode;
    }

    if (minSalary) {
      query['salary.min'] = { $gte: Number(minSalary) };
    }

    if (batch) {
      query['eligibility.batch'] = { $in: [Number(batch)] };
    }

    if (branch) {
      query['eligibility.branchesAllowed'] = {
        $in: [new RegExp(branch, 'i')]
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const jobs = await Job.find(query)
      .populate('recruiter', 'name email picture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalJobs = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      results: jobs,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalJobs / Number(limit)),
        totalResults: totalJobs,
        hasMore: skip + jobs.length < totalJobs
      }
    });

  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching jobs',
      error: error.message
    });
  }
};

/**
 * @desc    Search People / Users
 * @route   GET /api/search/people
 * @access  Public
 */
export const searchPeople = async (req, res) => {
  try {
    const {
      search,
      location,
      skills,
      userType,
      company,
      college,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentDetails.college': { $regex: search, $options: 'i' } },
        { 'studentDetails.degree': { $regex: search, $options: 'i' } },
        { 'professionalDetails.company': { $regex: search, $options: 'i' } },
        { 'professionalDetails.jobTitle': { $regex: search, $options: 'i' } }
      ];
    }

    if (userType) {
      query.userType = userType;
    }

    if (location) {
      query.$or = [
        { 'studentDetails.preferredLocations': { $in: [new RegExp(location, 'i')] } },
        { 'professionalDetails.preferredLocations': { $in: [new RegExp(location, 'i')] } }
      ];
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.$or = [
        { 'studentDetails.skills': { $in: skillsArray.map(s => new RegExp(s, 'i')) } },
        { 'professionalDetails.skills': { $in: skillsArray.map(s => new RegExp(s, 'i')) } }
      ];
    }

    if (company) {
      query['professionalDetails.company'] = { $regex: company, $options: 'i' };
    }

    if (college) {
      query['studentDetails.college'] = { $regex: college, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .select('-password -accessToken -refreshToken -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      results: users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalUsers / Number(limit)),
        totalResults: totalUsers,
        hasMore: skip + users.length < totalUsers
      }
    });

  } catch (error) {
    console.error('Search people error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching people',
      error: error.message
    });
  }
};

/**
 * @desc    Search Companies
 * @route   GET /api/search/companies
 * @access  Public
 */
export const searchCompanies = async (req, res) => {
  try {
    const { search, location, page = 1, limit = 10 } = req.query;

    const matchStage = { status: 'Open' };

    if (search) {
      matchStage.companyName = { $regex: search, $options: 'i' };
    }

    if (location) {
      matchStage.location = { $regex: location, $options: 'i' };
    }

    const companies = await Job.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$companyName',
          name: { $first: '$companyName' },
          logo: { $first: '$companyLogo' },
          activeJobs: { $sum: 1 },
          locations: { $addToSet: '$location' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          logo: 1,
          activeJobs: 1,
          location: { $arrayElemAt: ['$locations', 0] },
          industry: 'Technology'
        }
      },
      { $sort: { activeJobs: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

    const totalCompanies = await Job.distinct('companyName', matchStage);

    res.status(200).json({
      success: true,
      results: companies,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCompanies.length / Number(limit)),
        totalResults: totalCompanies.length,
        hasMore: companies.length === Number(limit)
      }
    });

  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching companies',
      error: error.message
    });
  }
};

/**
 * @desc    Search Suggestions (Autocomplete)
 * @route   GET /api/search/suggestions
 * @access  Public
 */
export const getSearchSuggestions = async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query || query.length < 2) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    let suggestions = [];

    switch (type) {
      case 'jobs': {
        const titles = await Job.distinct('title', { title: { $regex: query, $options: 'i' } });
        const companies = await Job.distinct('companyName', { companyName: { $regex: query, $options: 'i' } });
        suggestions = [...titles.slice(0, 5), ...companies.slice(0, 5)];
        break;
      }

      case 'people': {
        const users = await User.find({ name: { $regex: query, $options: 'i' } })
          .select('name')
          .limit(10)
          .lean();
        suggestions = users.map(u => u.name);
        break;
      }

      case 'companies': {
        suggestions = await Job.distinct('companyName', {
          companyName: { $regex: query, $options: 'i' }
        });
        break;
      }

      default: {
        const [titles, companies, users] = await Promise.all([
          Job.distinct('title', { title: { $regex: query, $options: 'i' } }),
          Job.distinct('companyName', { companyName: { $regex: query, $options: 'i' } }),
          User.find({ name: { $regex: query, $options: 'i' } }).select('name').limit(5).lean()
        ]);
        suggestions = [
          ...titles.slice(0, 3),
          ...companies.slice(0, 3),
          ...users.map(u => u.name)
        ];
      }
    }

    res.status(200).json({
      success: true,
      suggestions: suggestions.filter(Boolean).slice(0, 10)
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting suggestions',
      error: error.message
    });
  }
};

/**
 * @desc    Get Popular Searches
 * @route   GET /api/search/popular
 * @access  Public
 */
export const getPopularSearches = async (req, res) => {
  try {
    const popularJobs = await Job.aggregate([
      { $match: { status: 'Open' } },
      { $group: { _id: '$title', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const popularCompanies = await Job.aggregate([
      { $match: { status: 'Open' } },
      { $group: { _id: '$companyName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      popularJobs: popularJobs.map(j => j._id),
      popularCompanies: popularCompanies.map(c => c._id)
    });

  } catch (error) {
    console.error('Popular search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting popular searches',
      error: error.message
    });
  }
};
