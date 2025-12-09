const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One subscription per user
    },
    plan: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'past_due', 'trialing'],
        default: 'active'
    },
    // Stripe subscription details
    stripeSubscriptionId: {
        type: String,
        required: true,
        unique: true
    },
    stripeCustomerId: {
        type: String,
        required: true
    },
    stripePriceId: {
        type: String,
        required: true
    },
    // Pricing
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
    // Billing cycle
    currentPeriodStart: {
        type: Date,
        required: true
    },
    currentPeriodEnd: {
        type: Date,
        required: true
    },
    // Cancellation
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String
    },
    // Trial period
    trialStart: {
        type: Date
    },
    trialEnd: {
        type: Date
    },
    // Features included in subscription
    features: {
        unlimitedCourses: {
            type: Boolean,
            default: true
        },
        premiumVideos: {
            type: Boolean,
            default: true
        },
        offlineMode: {
            type: Boolean,
            default: true
        },
        certificatePriority: {
            type: Boolean,
            default: true
        },
        supportPriority: {
            type: Boolean,
            default: false
        }
    },
    // Payment history
    paymentHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }],
    // Metadata
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
    return this.status === 'active' || this.status === 'trialing';
});

// Virtual for checking if subscription has expired
subscriptionSchema.virtual('isExpired').get(function () {
    return this.currentPeriodEnd < new Date() && this.status !== 'active';
});

// Method to cancel subscription
subscriptionSchema.methods.cancel = function (reason, immediate = false) {
    if (immediate) {
        this.status = 'cancelled';
        this.cancelledAt = new Date();
    } else {
        this.cancelAtPeriodEnd = true;
    }
    this.cancellationReason = reason;
    return this.save();
};

// Method to renew subscription
subscriptionSchema.methods.renew = function (newPeriodStart, newPeriodEnd) {
    this.currentPeriodStart = newPeriodStart;
    this.currentPeriodEnd = newPeriodEnd;
    this.status = 'active';
    return this.save();
};

// Method to check if user has access to premium features
subscriptionSchema.methods.hasFeature = function (featureName) {
    return this.isActive && this.features[featureName] === true;
};

// Static method to get subscription plans
subscriptionSchema.statics.getPlans = function () {
    return [
        {
            id: 'monthly',
            name: 'Monthly Plan',
            price: 29.99,
            currency: 'USD',
            interval: 'month',
            features: {
                unlimitedCourses: true,
                premiumVideos: true,
                offlineMode: true,
                certificatePriority: true,
                supportPriority: false
            }
        },
        {
            id: 'yearly',
            name: 'Yearly Plan',
            price: 299.99,
            currency: 'USD',
            interval: 'year',
            savings: '16%',
            features: {
                unlimitedCourses: true,
                premiumVideos: true,
                offlineMode: true,
                certificatePriority: true,
                supportPriority: true
            }
        }
    ];
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
