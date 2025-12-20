const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'E-Learn Pro <noreply@elearnpro.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to avoid breaking the application flow, but log it
        return null;
    }
};

/**
 * Send instructor application status email
 * @param {Object} user - User document
 * @param {String} status - 'approved' or 'rejected'
 */
const sendInstructorStatusEmail = async (user, status) => {
    const isApproved = status === 'approved';
    const subject = isApproved
        ? 'Congratulations! Your Instructor Application was Approved'
        : 'Update regarding your Instructor Application';

    const message = isApproved
        ? `Hi ${user.name},\n\nWe are excited to inform you that your instructor application has been approved! You can now start creating courses on our platform.\n\nBest regards,\nThe E-Learn Pro Team`
        : `Hi ${user.name},\n\nThank you for your interest in becoming an instructor. After reviewing your application, we regret to inform you that we cannot approve it at this time. Feel free to apply again in the future.\n\nBest regards,\nThe E-Learn Pro Team`;

    const html = isApproved
        ? `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #6d28d9;">Welcome to the Team, ${user.name}!</h2>
                <p>We are excited to inform you that your instructor application has been <strong>approved</strong>!</p>
                <p>You can now access your instructor dashboard and start sharing your knowledge with the world.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/instructor/dashboard" 
                       style="background: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; rounded: 8px; font-weight: bold;">
                        Go to Dashboard
                    </a>
                </div>
                <p>Best regards,<br/>The E-Learn Pro Team</p>
            </div>
        `
        : `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #333;">Update regarding your Instructor Application</h2>
                <p>Hi ${user.name},</p>
                <p>Thank you for your interest in becoming an instructor on E-Learn Pro.</p>
                <p>After a careful review of your CV and recommendation letter, we regret to inform you that your application has been <strong>rejected</strong> at this time.</p>
                <p>We appreciate your interest and wish you the best in your teaching journey.</p>
                <p>Best regards,<br/>The E-Learn Pro Team</p>
            </div>
        `;

    return sendEmail({
        email: user.email,
        subject,
        message,
        html
    });
};

module.exports = {
    sendEmail,
    sendInstructorStatusEmail
};
