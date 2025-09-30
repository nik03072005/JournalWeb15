import { connectToDatabase } from '@/lib/db';
import OTP from '@/models/otpModel';

/**
 * Verify OTP for a given email
 * @param {string} email - User's email address
 * @param {string} otp - OTP to verify
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyOTP(email, otp) {
  try {
    await connectToDatabase();
    
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }

    const result = await OTP.verifyOTP(email.toLowerCase(), otp.toString());
    return result;
    
  } catch (error) {
    console.error('Error in verifyOTP helper:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
}

/**
 * Generate and store OTP for a given email
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, otp?: string, message: string}>}
 */
export async function generateAndStoreOTP(email) {
  try {
    await connectToDatabase();
    
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    // Clean up old OTPs for this email
    await OTP.cleanupOldOTPs(email);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP in database
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      otp: otp.toString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });

    await otpRecord.save();

    return { 
      success: true, 
      otp: otp.toString(), 
      message: 'OTP generated and stored successfully' 
    };
    
  } catch (error) {
    console.error('Error in generateAndStoreOTP helper:', error);
    return { success: false, message: 'Failed to generate OTP' };
  }
}

/**
 * Check if there's a valid OTP for the given email
 * @param {string} email - User's email address
 * @returns {Promise<{hasValidOTP: boolean, expiresAt?: Date}>}
 */
export async function hasValidOTP(email) {
  try {
    await connectToDatabase();
    
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    return {
      hasValidOTP: !!otpRecord,
      expiresAt: otpRecord?.expiresAt
    };
    
  } catch (error) {
    console.error('Error in hasValidOTP helper:', error);
    return { hasValidOTP: false };
  }
}
