const nodemailer = require("nodemailer");
const paymentEmailTemplate = require("../templates/paymentEmailTemplate");

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Google App Password
    }
});

const sendMembershipPaymentEmail = async (emailData) => {
    try {
        const { memberEmail } = emailData;
        const htmlContent = paymentEmailTemplate(emailData);
        
        const mailOptions = {
            from: `"Tara Fitness Centre" <${process.env.EMAIL_USER}>`,
            to: memberEmail,
            subject: "Membership Payment Confirmation – Tara Fitness Centre",
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Payment email sent successfully to ${memberEmail}. ID: ${info.messageId}`);
        return { success: true, data: info };
    } catch (error) {
        console.error(`Error sending payment email:`, error);
        return { success: false, error };
    }
};

const sendPasswordResetEmail = async (email, resetLink) => {
    try {
        const mailOptions = {
            from: `"Tara Fitness Centre" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Request Approved – Tara Fitness Centre",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff1a1a; text-align: center;">Password Reset Approved</h2>
                    <p>Hello,</p>
                    <p>Your request to reset your password for your Tara Fitness Centre account has been approved by the administrator.</p>
                    <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #ff1a1a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(255,26,26,0.2);">Reset My Password</a>
                    </div>
                    <p style="font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px;">
                        If you did not request this change, please ignore this email or contact support if you have concerns.
                    </p>
                    <p style="font-size: 12px; color: #777; text-align: center; margin-top: 10px;">
                        © 2026 Tara Fitness Centre. All rights reserved.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}. ID: ${info.messageId}`);
        return { success: true, data: info };
    } catch (error) {
        console.error(`Error sending reset email:`, error);
        return { success: false, error };
    }
};

module.exports = {
    sendMembershipPaymentEmail,
    sendPasswordResetEmail
};
