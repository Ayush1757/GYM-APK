const { Resend } = require("resend");
const paymentEmailTemplate = require("../templates/paymentEmailTemplate");

// Use the API key from .env file
const resend = new Resend(process.env.RESEND_API_KEY);

const sendMembershipPaymentEmail = async (emailData) => {
    try {
        const { memberEmail } = emailData;
        const htmlContent = paymentEmailTemplate(emailData);
        
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || "Tara Fitness Centre <onboarding@resend.dev>",
            to: memberEmail,
            subject: "Membership Payment Confirmation – Tara Fitness Centre",
            html: htmlContent
        });

        console.log(`Payment email sent successfully to ${memberEmail}. ID: ${data?.id || data?.data?.id}`);
        return { success: true, data };
    } catch (error) {
        console.error(`Error sending payment email:`, error);
        return { success: false, error };
    }
};

const sendPasswordResetEmail = async (email, resetLink) => {
    try {
        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || "Tara Fitness Centre <onboarding@resend.dev>",
            to: email,
            subject: "Password Reset Request Approved – Tara Fitness Centre",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #ff1a1a;">Password Reset Approved</h2>
                    <p>Hello,</p>
                    <p>Your request to reset your password has been approved by the administrator.</p>
                    <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #ff1a1a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Reset Password</a>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request this, please contact us immediately.</p>
                </div>
            `
        });

        console.log(`Resend response for ${email}:`, JSON.stringify(response, null, 2));
        
        if (response.error) {
            console.error(`Resend error for ${email}:`, response.error);
            return { success: false, error: response.error };
        }

        return { success: true, data: response.data };
    } catch (error) {
        console.error(`Error sending reset email:`, error);
        return { success: false, error };
    }
};

module.exports = {
    sendMembershipPaymentEmail,
    sendPasswordResetEmail
};
