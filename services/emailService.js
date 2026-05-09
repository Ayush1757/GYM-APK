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

module.exports = {
    sendMembershipPaymentEmail
};
