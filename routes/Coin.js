import express from 'express';
import {
  getUserCoinInfo,
  getTransactionHistory,
  processReferral,
  purchaseSubscriptionWithCoins,
  getSubscriptionPlans,
  getUserSubscriptions,
  getReferralStats
} from '../controller/coins/Coin.js';

import authenticateToken from '../middleware/index.js';

const Router = express.Router();

// All routes require authentication
Router.use(authenticateToken);

// Coin account management
Router.get('/balance', getUserCoinInfo);
Router.get('/transactions', getTransactionHistory);

// Referral system
Router.post('/referral', processReferral);
Router.get('/referral-stats', getReferralStats);

// Subscription management
Router.get('/subscription-plans', getSubscriptionPlans);
Router.post('/purchase-subscription', purchaseSubscriptionWithCoins);
Router.get('/subscriptions', getUserSubscriptions);

export default Router; 