import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOTP } from '../utils/generateOTP.js';
import { sendOTPEmail } from '../services/emailService.js';

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Token expires in 30 days
    });
};

/**
 * @desc    Register a new user & send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error('Please provide all required fields');
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            if (userExists.isVerified) {
                res.status(400);
                throw new Error('User already exists and is verified');
            } else {
                // If user exists but not verified, we can allow re-registration by updating password & OTP
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                userExists.password = hashedPassword;
                userExists.name = name;
                userExists.otp = otp;
                userExists.otpExpiry = otpExpiry;
                await userExists.save();

                await sendOTPEmail(email, otp, 'Verification');

                return res.status(200).json({
                    message: 'Verification OTP resent to existing unverified account',
                    email
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            isVerified: false
        });

        // Send Email
        await sendOTPEmail(user.email, otp, 'Verification');

        res.status(201).json({
            message: 'User registered successfully. Please verify your OTP sent to email.',
            email: user.email
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify OTP for Registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400);
            throw new Error('Please provide email and OTP');
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.isVerified) {
            res.status(400);
            throw new Error('User is already verified');
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp) {
            res.status(400);
            throw new Error('Invalid OTP');
        }

        if (user.otpExpiry < Date.now()) {
            res.status(400);
            throw new Error('OTP has expired');
        }

        // Verify user and clear OTP
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.status(200).json({
            message: 'Email verified successfully! You can now log in.',
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Authenticate a user (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Please provide email and password');
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        if (!user.isVerified) {
            res.status(401);
            throw new Error('Please verify your email before logging in');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        res.status(200).json({
            message: 'Login successful',
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Resend Verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400);
            throw new Error('Please provide an email');
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.isVerified) {
            res.status(400);
            throw new Error('User is already verified');
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOTPEmail(user.email, otp, 'Verification');

        res.status(200).json({
            message: 'A new OTP has been sent to your email'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400);
            throw new Error('Please provide an email');
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOTPEmail(user.email, otp, 'Password Reset');

        res.status(200).json({
            message: 'Password reset OTP has been sent to your email'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset Password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            res.status(400);
            throw new Error('Please provide email, OTP, and new password');
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp) {
            res.status(400);
            throw new Error('Invalid OTP');
        }

        if (user.otpExpiry < Date.now()) {
            res.status(400);
            throw new Error('OTP has expired');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.status(200).json({
            message: 'Password has been reset successfully. You can now log in.'
        });

    } catch (error) {
        next(error);
    }
};
