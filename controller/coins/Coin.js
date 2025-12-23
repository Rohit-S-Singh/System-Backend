import { Coin, CoinTransaction } from '../../models/Coin.js';
import User from '../../models/User.js';
import Subscription from '../../models/Subscription.js';
// import Interview from '../../models/interview/Interview.js';

import { createNotification } from '../Notification.js';
import crypto from 'crypto';
// Generate unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Initialize coin account for user
export const initializeCoinAccount = async (userId) => {
  try {
    let userCoin = await Coin.findOne({ user: userId });
    
    if (!userCoin) {
      // Generate unique referral code
      let referralCode;
      let isUnique = false;
      
      while (!isUnique) {
        referralCode = generateReferralCode();
        const existingCode = await Coin.findOne({ referralCode });
        if (!existingCode) {
          isUnique = true;
        }
      }

      userCoin = new Coin({
        user: userId,
        referralCode,
        balance: 0
      });

      await userCoin.save();

      // Update user
      await User.findByIdAndUpdate(userId, {
        hasCoinAccount: true,
        referralCode
      });
    }

    return userCoin;
  } catch (error) {
    console.error('Error initializing coin account:', error);
    throw error;
  }
};

// Add coins to user account
export const addCoins = async (userId, amount, type, description, reference = null, metadata = {}) => {
  try {
    let userCoin = await Coin.findOne({ user: userId });
    
    if (!userCoin) {
      userCoin = await initializeCoinAccount(userId);
    }

    const newBalance = userCoin.balance + amount;
    
    // Update coin balance
    userCoin.balance = newBalance;
    userCoin.totalEarned += amount;
    userCoin.lastActivity = new Date();
    
    if (type === 'referral') {
      userCoin.referralEarnings += amount;
    }
    
    await userCoin.save();

    // Create transaction record
    const transaction = new CoinTransaction({
      user: userId,
      type,
      amount,
      balance: newBalance,
      description,
      reference,
      metadata
    });

    await transaction.save();

    return { userCoin, transaction };
  } catch (error) {
    console.error('Error adding coins:', error);
    throw error;
  }
};

// Deduct coins from user account
export const deductCoins = async (userId, amount, type, description, reference = null, metadata = {}) => {
  try {
    const userCoin = await Coin.findOne({ user: userId });
    
    if (!userCoin) {
      throw new Error('Coin account not found');
    }

    if (userCoin.balance < amount) {
      throw new Error('Insufficient coin balance');
    }

    const newBalance = userCoin.balance - amount;
    
    // Update coin balance
    userCoin.balance = newBalance;
    userCoin.totalRedeemed += amount;
    userCoin.lastActivity = new Date();
    await userCoin.save();

    // Create transaction record
    const transaction = new CoinTransaction({
      user: userId,
      type,
      amount: -amount, // Negative amount for deductions
      balance: newBalance,
      description,
      reference,
      metadata
    });

    await transaction.save();

    return { userCoin, transaction };
  } catch (error) {
    console.error('Error deducting coins:', error);
    throw error;
  }
};

// Get user coin balance and transactions
export const getUserCoinInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    let userCoin = await Coin.findOne({ user: userId });
    
    if (!userCoin) {
      userCoin = await initializeCoinAccount(userId);
    }

    // Get recent transactions
    const transactions = await CoinTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        balance: userCoin.balance,
        totalEarned: userCoin.totalEarned,
        totalRedeemed: userCoin.totalRedeemed,
        referralCode: userCoin.referralCode,
        referralCount: userCoin.referralCount,
        referralEarnings: userCoin.referralEarnings,
        lastActivity: userCoin.lastActivity,
        recentTransactions: transactions
      }
    });

  } catch (error) {
    console.error('Error fetching user coin info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get coin transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;

    let query = { user: userId };

    if (type) {
      query.type = type;
    }

    const transactions = await CoinTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalCount = await CoinTransaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Process referral
export const processReferral = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const userId = req.user.id;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    // Check if user already has a referrer
    const userCoin = await Coin.findOne({ user: userId });
    if (userCoin && userCoin.referredBy) {
      return res.status(400).json({
        success: false,
        message: 'User already has a referrer'
      });
    }

    // Find referrer
    const referrerCoin = await Coin.findOne({ referralCode });
    if (!referrerCoin) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    if (referrerCoin.user.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot refer yourself'
      });
    }

    // Initialize coin account if not exists
    let userCoinAccount = userCoin;
    if (!userCoinAccount) {
      userCoinAccount = await initializeCoinAccount(userId);
    }

    // Update referral relationship
    userCoinAccount.referredBy = referrerCoin.user;
    await userCoinAccount.save();

    // Update referrer's referral count
    referrerCoin.referralCount += 1;
    await referrerCoin.save();

    // Update user model
    await User.findByIdAndUpdate(userId, {
      referredBy: referrerCoin.user
    });

    // Award bonus coins to both users
    const referralBonus = 50; // 50 coins for successful referral
    
    await addCoins(
      referrerCoin.user,
      referralBonus,
      'referral',
      `Referral bonus for ${referralCode}`,
      userId.toString(),
      { referredUser: userId }
    );

    await addCoins(
      userId,
      referralBonus,
      'bonus',
      'Welcome bonus for using referral code',
      referrerCoin.user.toString(),
      { referrer: referrerCoin.user }
    );

    // Create notifications
    await createNotification({
      recipient: referrerCoin.user,
      sender: userId,
      type: 'referral_bonus',
      title: 'Referral Bonus Earned!',
      message: `You earned ${referralBonus} coins for a successful referral`,
      data: { coins: referralBonus, referredUser: userId },
      priority: 'medium'
    });

    await createNotification({
      recipient: userId,
      sender: referrerCoin.user,
      type: 'welcome_bonus',
      title: 'Welcome Bonus!',
      message: `You earned ${referralBonus} coins for using a referral code`,
      data: { coins: referralBonus },
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Referral processed successfully',
      data: {
        referrerId: referrerCoin.user,
        bonusCoins: referralBonus
      }
    });

  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Award coins for interview completion
// export const awardInterviewCoins = async (interviewId, candidateId, mentorId) => {
//   try {
//     const interviewBonus = 25; // 25 coins for completing interview
    
//     // Award coins to candidate
//     await addCoins(
//       candidateId,
//       interviewBonus,
//       'interview_completed',
//       'Coins earned for completing interview',
//       interviewId,
//       { interviewType: 'completed' }
//     );

//     // Award coins to mentor
//     await addCoins(
//       mentorId,
//       interviewBonus,
//       'interview_completed',
//       'Coins earned for conducting interview',
//       interviewId,
//       { interviewType: 'conducted' }
//     );

//     // Create notifications
//     await createNotification({
//       recipient: candidateId,
//       type: 'interview_completed',
//       title: 'Interview Completed!',
//       message: `You earned ${interviewBonus} coins for completing the interview`,
//       data: { coins: interviewBonus, interviewId },
//       priority: 'medium'
//     });

//     await createNotification({
//       recipient: mentorId,
//       type: 'interview_completed',
//       title: 'Interview Completed!',
//       message: `You earned ${interviewBonus} coins for conducting the interview`,
//       data: { coins: interviewBonus, interviewId },
//       priority: 'medium'
//     });

//   } catch (error) {
//     console.error('Error awarding interview coins:', error);
//     throw error;
//   }
// };
export const awardInterviewCoins = async (interviewId) => {
  const interview = await Interview.findById(interviewId);

  const mentorReward = 20;
  const candidateReward = 10;

  await createTransaction(interview.mentor, mentorReward, "mentor");
  await createTransaction(interview.candidate, candidateReward, "candidate");
};

const createTransaction = async (userId, amount, role) => {
  let coin = await Coin.findOne({ user: userId });
  if (!coin) coin = await Coin.create({ user: userId });

  coin.balance += amount;
  coin.totalEarned += amount;
  await coin.save();

  await CoinTransaction.create({
    user: userId,
    amount,
    type: "interview_completed",
    balance: coin.balance,
    role,
    description: "Interview completed"
  });
};


// Purchase subscription with coins
export const purchaseSubscriptionWithCoins = async (req, res) => {
  try {
    const { plan, duration } = req.body;
    const userId = req.user.id;

    // Subscription plans and their coin costs
    const subscriptionPlans = {
      basic: { coins: 100, features: ['basic_interviews', 'basic_support'] },
      premium: { coins: 250, features: ['unlimited_interviews', 'priority_support', 'advanced_analytics'] },
      pro: { coins: 500, features: ['unlimited_interviews', 'priority_support', 'advanced_analytics', 'custom_branding'] },
      enterprise: { coins: 1000, features: ['unlimited_interviews', 'priority_support', 'advanced_analytics', 'custom_branding', 'dedicated_manager'] }
    };

    const planDetails = subscriptionPlans[plan];
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Calculate duration in months
    const durationMonths = duration || 1;
    const totalCoins = planDetails.coins * durationMonths;

    // Check if user has enough coins
    const userCoin = await Coin.findOne({ user: userId });
    if (!userCoin || userCoin.balance < totalCoins) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You need ${totalCoins} coins for this subscription.`
      });
    }

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      plan,
      paymentMethod: 'coins',
      coinsUsed: totalCoins,
      amount: 0, // Free with coins
      startDate,
      endDate,
      features: planDetails.features
    });

    await subscription.save();

    // Deduct coins
    await deductCoins(
      userId,
      totalCoins,
      'subscription_purchase',
      `Purchased ${plan} subscription for ${durationMonths} month(s)`,
      subscription._id.toString(),
      { plan, duration: durationMonths }
    );

    res.json({
      success: true,
      message: 'Subscription purchased successfully',
      data: {
        subscription,
        coinsUsed: totalCoins,
        remainingBalance: userCoin.balance - totalCoins
      }
    });

  } catch (error) {
    console.error('Error purchasing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = {
      basic: {
        name: 'Basic',
        coins: 100,
        duration: '1 month',
        features: ['5 interviews per month', 'Basic support', 'Standard features'],
        description: 'Perfect for getting started'
      },
      premium: {
        name: 'Premium',
        coins: 250,
        duration: '1 month',
        features: ['Unlimited interviews', 'Priority support', 'Advanced analytics', 'Mock interviews'],
        description: 'Great for active job seekers'
      },
      pro: {
        name: 'Pro',
        coins: 500,
        duration: '1 month',
        features: ['Unlimited interviews', 'Priority support', 'Advanced analytics', 'Custom branding', 'Resume review'],
        description: 'For professionals and mentors'
      },
      enterprise: {
        name: 'Enterprise',
        coins: 1000,
        duration: '1 month',
        features: ['Unlimited interviews', 'Priority support', 'Advanced analytics', 'Custom branding', 'Dedicated manager', 'Team features'],
        description: 'For teams and organizations'
      }
    };

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get referral statistics
export const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const userCoin = await Coin.findOne({ user: userId });
    if (!userCoin) {
      return res.status(404).json({
        success: false,
        message: 'Coin account not found'
      });
    }

    // Get referred users
    const referredUsers = await Coin.find({ referredBy: userId })
      .populate('user', 'name email givenName familyName picture');

    // Get referral transactions
    const referralTransactions = await CoinTransaction.find({
      user: userId,
      type: 'referral'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        referralCode: userCoin.referralCode,
        referralCount: userCoin.referralCount,
        referralEarnings: userCoin.referralEarnings,
        referredUsers,
        referralTransactions
      }
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 