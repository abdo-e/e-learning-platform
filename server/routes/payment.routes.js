const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

// Create payment intent (protected)
router.post('/create-intent', protect, paymentController.createPaymentIntent);

// Confirm payment (protected)
router.post('/confirm', protect, paymentController.confirmPayment);

// Get payment history (protected)
router.get('/history', protect, paymentController.getPaymentHistory);

// Request refund (protected)
router.post('/refund/:paymentId', protect, paymentController.processRefund);

// Stripe webhook (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhookHandler);

// Admin routes (protected)
router.get('/all', protect, paymentController.getAllPayments); // TODO: Add admin middleware

module.exports = router;
