const Payment = require('../models/payment.model');
const User = require('../models/user.model');
const Course = require('../models/course.model');
const Subscription = require('../models/subscription.model');

// Note: Stripe integration requires the 'stripe' package
// Install with: npm install stripe
// This controller provides the structure - Stripe SDK will be added during dependency installation

/**
 * Create a payment intent for course purchase or subscription
 */
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency, paymentType, courseId, subscriptionPlan } = req.body;
        const userId = req.user._id; // Assumes auth middleware sets req.user

        // Validate payment type
        if (!['course_purchase', 'subscription'].includes(paymentType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment type'
            });
        }

        // Validate course purchase
        if (paymentType === 'course_purchase') {
            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required for course purchase'
                });
            }

            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if user already purchased this course
            const user = await User.findById(userId);
            const alreadyPurchased = user.purchasedCourses.some(
                pc => pc.courseId.toString() === courseId
            );

            if (alreadyPurchased) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already purchased this course'
                });
            }
        }

        // Create payment record
        const payment = new Payment({
            userId,
            amount,
            currency: currency || 'USD',
            paymentType,
            courseId: paymentType === 'course_purchase' ? courseId : undefined,
            status: 'pending'
        });

        await payment.save();

        // TODO: Create Stripe payment intent
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: Math.round(amount * 100), // Stripe uses cents
        //   currency: currency || 'usd',
        //   metadata: {
        //     paymentId: payment._id.toString(),
        //     userId: userId.toString(),
        //     paymentType
        //   }
        // });
        // payment.stripePaymentIntentId = paymentIntent.id;
        // await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment intent created',
            data: {
                paymentId: payment._id,
                // clientSecret: paymentIntent.client_secret,
                amount: payment.amount,
                currency: payment.currency
            }
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment intent',
            error: error.message
        });
    }
};

/**
 * Confirm payment after successful Stripe payment
 */
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentId, stripePaymentIntentId } = req.body;
        const userId = req.user._id;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify payment belongs to user
        if (payment.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // TODO: Verify payment with Stripe
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        // if (paymentIntent.status !== 'succeeded') {
        //   throw new Error('Payment not successful');
        // }

        // Mark payment as completed
        await payment.markCompleted();

        // Process based on payment type
        if (payment.paymentType === 'course_purchase') {
            // Add course to user's purchased courses
            const user = await User.findById(userId);
            user.purchasedCourses.push({
                courseId: payment.courseId,
                price: payment.amount,
                paymentId: payment._id
            });
            await user.save();

            // Update course revenue and enrollment
            const course = await Course.findById(payment.courseId);
            course.totalRevenue += payment.amount;
            course.totalEnrollments += 1;
            await course.save();

            // Update instructor earnings
            if (course.instructor) {
                const instructor = await User.findById(course.instructor);
                if (instructor && instructor.instructorProfile) {
                    const instructorShare = payment.amount * 0.7; // 70% to instructor
                    instructor.instructorProfile.totalEarnings += instructorShare;
                    instructor.instructorProfile.availableBalance += instructorShare;
                    instructor.instructorProfile.totalStudents += 1;
                    await instructor.save();
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment confirmed successfully',
            data: payment
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming payment',
            error: error.message
        });
    }
};

/**
 * Process refund
 */
exports.processRefund = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason, amount } = req.body;
        const userId = req.user._id;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify payment belongs to user or user is admin
        if (payment.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only refund completed payments'
            });
        }

        // TODO: Process refund with Stripe
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // await stripe.refunds.create({
        //   payment_intent: payment.stripePaymentIntentId,
        //   amount: amount ? Math.round(amount * 100) : undefined
        // });

        await payment.processRefund(amount, reason);

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: payment
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing refund',
            error: error.message
        });
    }
};

/**
 * Get payment history for user
 */
exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate('courseId', 'title')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: payments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment history',
            error: error.message
        });
    }
};

/**
 * Stripe webhook handler
 */
exports.webhookHandler = async (req, res) => {
    try {
        // TODO: Implement Stripe webhook handling
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const sig = req.headers['stripe-signature'];
        // const event = stripe.webhooks.constructEvent(
        //   req.body,
        //   sig,
        //   process.env.STRIPE_WEBHOOK_SECRET
        // );

        // Handle different event types
        // switch (event.type) {
        //   case 'payment_intent.succeeded':
        //     // Handle successful payment
        //     break;
        //   case 'payment_intent.payment_failed':
        //     // Handle failed payment
        //     break;
        //   default:
        //     console.log(`Unhandled event type ${event.type}`);
        // }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({
            success: false,
            message: 'Webhook error',
            error: error.message
        });
    }
};

/**
 * Get all payments (Admin only)
 */
exports.getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, paymentType } = req.query;

        const query = {};
        if (status) query.status = status;
        if (paymentType) query.paymentType = paymentType;

        const payments = await Payment.find(query)
            .populate('userId', 'name email')
            .populate('courseId', 'title')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        // Calculate total revenue
        const revenueStats = await Payment.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: payments,
            stats: revenueStats[0] || { totalRevenue: 0, count: 0 },
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
};
