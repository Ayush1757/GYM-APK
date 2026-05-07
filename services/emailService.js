import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an OTP email using Resend
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} type - "Verification" or "Password Reset"
 */
export const sendOTPEmail = async (email, otp, type = 'Verification') => {
    try {
        const subject = type === 'Verification' 
            ? 'Verify Your Gym Account' 
            : 'Reset Your Password';

        const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #333333; margin: 0;">Gym Management App</h2>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                    <h3 style="color: #333333; margin-top: 0;">${type} OTP</h3>
                    <p style="color: #555555; font-size: 16px;">
                        Please use the following 6-digit OTP to complete your ${type.toLowerCase()}. 
                        This OTP is valid for <strong>5 minutes</strong>.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background-color: #e6f2ff; padding: 10px 20px; border-radius: 5px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #777777; font-size: 14px; margin-bottom: 0;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #aaaaaa; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Gym Management App. All rights reserved.
                </div>
            </div>
        `;

        const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Fallback for testing

        const data = await resend.emails.send({
            from: `Gym App <${fromEmail}>`,
            to: email,
            subject: subject,
            html: htmlTemplate
        });

        console.log(\`OTP Email sent to \${email}: \${data.id}\`);
        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP email');
    }
};
