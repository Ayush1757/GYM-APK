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

const sendPasswordResetEmail = async (email, defaultPassword) => {
    try {
        const mailOptions = {
            from: `"Tara Fitness Centre" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Password Has Been Reset – Tara Fitness Centre",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #ff1a1a; margin: 0;">Password Reset Successful</h2>
                    </div>
                    <p>Hello,</p>
                    <p>Your request to reset your password has been approved by the administrator.</p>
                    <p>Your password has been automatically reset to the following default:</p>
                    <div style="text-align: center; margin: 30px 0; background: #f3f4f6; padding: 20px; border-radius: 8px; border: 1px dashed #d1d5db;">
                        <span style="font-size: 24px; font-family: monospace; font-weight: bold; color: #111; letter-spacing: 2px;">${defaultPassword}</span>
                    </div>
                    <p><strong>Please follow these steps:</strong></p>
                    <ol>
                        <li>Log in using your email and this temporary password.</li>
                        <li>Go to your **Profile** settings once logged in.</li>
                        <li>Change this password to something secure and private.</li>
                    </ol>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://gym-apk.onrender.com/login.html" style="display: inline-block; padding: 14px 28px; background-color: #ff1a1a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Login Now</a>
                    </div>
                    <p style="font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                        If you did not request this change, please contact the administrator immediately.
                    </p>
                    <p style="font-size: 12px; color: #777; text-align: center; margin-top: 10px;">
                        © 2026 Tara Fitness Centre. All rights reserved.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email} with default password. ID: ${info.messageId}`);
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
