import express from 'express';
import {
    registerUser,
    verifyOTP,
    loginUser,
    resendOTP,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js';

const router = express.Router();

// Route: /api/auth/register
router.post('/register', registerUser);

// Route: /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// Route: /api/auth/login
router.post('/login', loginUser);

// Route: /api/auth/resend-otp
router.post('/resend-otp', resendOTP);

// Route: /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// Route: /api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;
