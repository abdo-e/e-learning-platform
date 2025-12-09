const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');

// Get subscription plans (public)
router.get('/plans', subscriptionController.getSubscriptionPlans);

// Create subscription (protected)
router.post('/subscribe', protect, subscriptionController.createSubscription);

// Get user's subscription status (protected)
router.get('/status', protect, subscriptionController.getSubscriptionStatus);

// Cancel subscription (protected)
router.delete('/cancel', protect, subscriptionController.cancelSubscription);

// Update subscription (protected)
router.put('/update', protect, subscriptionController.updateSubscription);

// Handle subscription renewal (protected)
router.post('/renew', protect, subscriptionController.handleSubscriptionRenewal);

// Admin routes (protected)
router.get('/all', protect, subscriptionController.getAllSubscriptions); // TODO: Add admin middleware

module.exports = router;
