import crypto from 'crypto';

/**
 * Generates a secure 6-digit random OTP.
 * @returns {string} The 6-digit OTP
 */
export const generateOTP = () => {
    // Generate a cryptographically secure 6-digit number
    const otp = crypto.randomInt(100000, 999999);
    return otp.toString();
};
