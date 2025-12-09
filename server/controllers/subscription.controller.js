const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const Payment = require('../models/payment.model');

/**
 * Get available subscription plans
 */
exports.getSubscriptionPlans = async (req, res) => {
    try {
        const plans = Subscription.getPlans();

        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Get subscription plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription plans',
            error: error.message
        });
    }
};

/**
 * Create a new subscription
 */
exports.createSubscription = async (req, res) => {
    try {
        const { plan, paymentMethodId } = req.body;
        const userId = req.user._id;

        // Validate plan
        if (!['monthly', 'yearly'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription plan'
            });
        }

        // Check if user already has an active subscription
        const existingSubscription = await Subscription.findOne({
            userId,
            status: { $in: ['active', 'trialing'] }
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Get plan details
        const plans = Subscription.getPlans();
        const selectedPlan = plans.find(p => p.id === plan);

        // TODO: Create Stripe customer and subscription
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const customer = await stripe.customers.create({
        //   email: req.user.email,
        //   payment_method: paymentMethodId,
        //   invoice_settings: {
        //     default_payment_method: paymentMethodId
        //   }
        // });
        //
        // const stripeSubscription = await stripe.subscriptions.create({
        //   customer: customer.id,
        //   items: [{ price: process.env[`${plan.toUpperCase()}_PLAN_PRICE_ID`] }],
        //   expand: ['latest_invoice.payment_intent']
        // });

        // Create subscription record
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        const subscription = new Subscription({
            userId,
            plan,
            status: 'active',
            stripeSubscriptionId: 'sub_' + Date.now(), // TODO: Replace with actual Stripe ID
            stripeCustomerId: 'cus_' + Date.now(), // TODO: Replace with actual Stripe ID
            stripePriceId: 'price_' + Date.now(), // TODO: Replace with actual Stripe ID
            amount: selectedPlan.price,
            currency: selectedPlan.currency,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd
        });

        await subscription.save();

        // Update user
        const user = await User.findById(userId);
        user.subscription = subscription._id;
        user.subscriptionStatus = 'active';
        await user.save();

        // Create payment record
        const payment = new Payment({
            userId,
            amount: selectedPlan.price,
            currency: selectedPlan.currency,
            status: 'completed',
            paymentType: 'subscription',
            subscriptionId: subscription._id,
            completedAt: new Date()
        });
        await payment.save();

        subscription.paymentHistory.push(payment._id);
        await subscription.save();

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating subscription',
            error: error.message
        });
    }
};

/**
 * Get user's subscription status
 */
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ userId })
            .populate('paymentHistory');

        if (!subscription) {
            return res.status(200).json({
                success: true,
                data: {
                    hasSubscription: false,
                    status: 'none'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                hasSubscription: true,
                subscription,
                isActive: subscription.isActive,
                features: subscription.features
            }
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscription status',
            error: error.message
        });
    }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const { reason, immediate } = req.body;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No subscription found'
            });
        }

        if (!subscription.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Subscription is not active'
            });
        }

        // TODO: Cancel Stripe subscription
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        //   cancel_at_period_end: !immediate
        // });
        // if (immediate) {
        //   await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        // }

        await subscription.cancel(reason, immediate);

        // Update user if immediate cancellation
        if (immediate) {
            const user = await User.findById(userId);
            user.subscriptionStatus = 'cancelled';
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: immediate
                ? 'Subscription cancelled immediately'
                : 'Subscription will be cancelled at the end of the billing period',
            data: subscription
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling subscription',
            error: error.message
        });
    }
};

/**
 * Update subscription (upgrade/downgrade)
 */
exports.updateSubscription = async (req, res) => {
    try {
        const { newPlan } = req.body;
        const userId = req.user._id;

        if (!['monthly', 'yearly'].includes(newPlan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription plan'
            });
        }

        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No subscription found'
            });
        }

        if (subscription.plan === newPlan) {
            return res.status(400).json({
                success: false,
                message: 'You are already on this plan'
            });
        }

        // Get new plan details
        const plans = Subscription.getPlans();
        const selectedPlan = plans.find(p => p.id === newPlan);

        // TODO: Update Stripe subscription
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        //   items: [{
        //     id: subscription.items[0].id,
        //     price: process.env[`${newPlan.toUpperCase()}_PLAN_PRICE_ID`]
        //   }],
        //   proration_behavior: 'create_prorations'
        // });

        subscription.plan = newPlan;
        subscription.amount = selectedPlan.price;
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subscription',
            error: error.message
        });
    }
};

/**
 * Handle subscription renewal (called by cron job or webhook)
 */
exports.handleSubscriptionRenewal = async (req, res) => {
    try {
        const { subscriptionId } = req.body;

        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Calculate new period
        const newPeriodStart = subscription.currentPeriodEnd;
        const newPeriodEnd = new Date(newPeriodStart);

        if (subscription.plan === 'monthly') {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        } else {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        }

        await subscription.renew(newPeriodStart, newPeriodEnd);

        // Create payment record for renewal
        const payment = new Payment({
            userId: subscription.userId,
            amount: subscription.amount,
            currency: subscription.currency,
            status: 'completed',
            paymentType: 'subscription',
            subscriptionId: subscription._id,
            completedAt: new Date()
        });
        await payment.save();

        subscription.paymentHistory.push(payment._id);
        await subscription.save();

        res.status(200).json({
            success: true,
            message: 'Subscription renewed successfully',
            data: subscription
        });
    } catch (error) {
        console.error('Handle subscription renewal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error renewing subscription',
            error: error.message
        });
    }
};

/**
 * Get all subscriptions (Admin only)
 */
exports.getAllSubscriptions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, plan } = req.query;

        const query = {};
        if (status) query.status = status;
        if (plan) query.plan = plan;

        const subscriptions = await Subscription.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Subscription.countDocuments(query);

        // Calculate subscription stats
        const stats = await Subscription.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: subscriptions,
            stats,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subscriptions',
            error: error.message
        });
    }
};
