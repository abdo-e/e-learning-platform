const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'credit_card', 'bank_transfer'],
        default: 'stripe'
    },
    // Stripe transaction details
    stripePaymentIntentId: {
        type: String,
        sparse: true
    },
    stripeChargeId: {
        type: String,
        sparse: true
    },
    // What the payment is for
    paymentType: {
        type: String,
        enum: ['course_purchase', 'subscription', 'instructor_payout'],
        required: true
    },
    // Reference to what was purchased
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    // Refund tracking
    refundAmount: {
        type: Number,
        default: 0
    },
    refundReason: {
        type: String
    },
    refundedAt: {
        type: Date
    },
    // Payment metadata
    metadata: {
        type: Map,
        of: String
    },
    // Error tracking
    errorMessage: {
        type: String
    },
    // Timestamps
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ status: 1 });

// Virtual for checking if payment is successful
paymentSchema.virtual('isSuccessful').get(function () {
    return this.status === 'completed';
});

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function () {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function (amount, reason) {
    this.status = 'refunded';
    this.refundAmount = amount || this.amount;
    this.refundReason = reason;
    this.refundedAt = new Date();
    return this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
