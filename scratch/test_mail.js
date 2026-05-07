const { Resend } = require('resend');
const nodemailer = require('nodemailer');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function testEmails() {
    const testEmail = process.env.EMAIL_USER; // Test with the owner's email first
    const otp = "123456";

    console.log(`Testing Resend with ${testEmail}...`);
    try {
        const data = await resend.emails.send({
            from: 'Gym App <onboarding@resend.dev>',
            to: testEmail,
            subject: 'Test OTP',
            html: `Test OTP: ${otp}`
        });
        console.log('Resend Success:', data);
    } catch (err) {
        console.error('Resend Error:', err.message);
    }

    console.log(`Testing Nodemailer with ${testEmail}...`);
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: 'Test OTP',
            text: `Test OTP: ${otp}`
        });
        console.log('Nodemailer Success:', info.messageId);
    } catch (err) {
        console.error('Nodemailer Error:', err.message);
    }
}

testEmails();
