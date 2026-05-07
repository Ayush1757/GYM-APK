const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_NAME = 'Gym Management System';

/**
 * Sends an OTP email using Resend
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit code
 * @param {string} type - 'Registration', 'Login', or 'Password Reset'
 */
async function sendOTPEmail(email, otp, type = 'Verification') {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ff1a1a; border-radius: 12px; background-color: #050505; color: #ffffff; }
                .header { color: #ff1a1a; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                .code-box { background: #1a1a1a; padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0; border: 1px dashed #444; }
                .otp-code { font-size: 38px; font-weight: bold; letter-spacing: 12px; color: #ff1a1a; }
                .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #222; padding-top: 15px; }
                .support { font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px; }
                .expiry { color: #ff4d4d; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">${APP_NAME}</div>
                <p>Hello,</p>
                <p>Your <strong>${type}</strong> request is being processed. Please use the following one-time password (OTP) to proceed:</p>
                
                <div class="code-box">
                    <span class="otp-code">${otp}</span>
                </div>
                
                <p class="support">This code is valid for <span class="expiry">5 minutes</span>. For your security, do not share this code with anyone.</p>
                
                <p class="support">If you did not request this, please contact our support team immediately or ignore this email.</p>
                
                <div class="footer">
                    &copy; 2026 ${APP_NAME}. All rights reserved.<br>
                    Premium Fitness Management Solutions.
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        console.log(`[Resend] Sending ${type} OTP to: ${email}`);
        const { data, error } = await resend.emails.send({
            from: `${APP_NAME} <${EMAIL_FROM}>`,
            to: email,
            subject: `${type} Code - ${APP_NAME}`,
            html: htmlContent,
        });

        if (error) {
            console.error(`[Resend Error] ${error.name}: ${error.message}`);
            return { success: false, error: error.message };
        }

        console.log(`[Resend Success] Email sent. ID: ${data.id}`);
        return { success: true, data };
    } catch (err) {
        console.error(`[Resend Exception] ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * Generates a secure 6-digit random OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    sendOTPEmail,
    generateOTP
};
