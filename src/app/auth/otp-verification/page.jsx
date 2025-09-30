"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { sendWelcomeEmailAuto } from '@/lib/emailUtils';

function OTPVerificationContent() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const userData = searchParams.get('userData');

  useEffect(() => {
    if (!email || !userData) {
      router.push('/auth');
      return;
    }

    // Validate userData
    try {
      JSON.parse(decodeURIComponent(userData));
    } catch (error) {
      console.error('Invalid userData:', error);
      router.push('/auth');
      return;
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, userData, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First verify OTP
      const verifyResponse = await axios.post(`/api/verify-otp`, {
        email,
        otp
      });

      if (verifyResponse.data.verified) {
        // If OTP is verified, complete the registration
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userData));
          
          const registerResponse = await axios.post(`/api/auth/register`, parsedUserData);
          
          // Send welcome email after successful registration
          try {
            const welcomeResult = await sendWelcomeEmailAuto(
              parsedUserData.email, 
              parsedUserData, 
              `${window.location.origin}/auth?tab=signin`
            );
            
            if (welcomeResult.success) {
              console.log('Welcome email sent successfully');
            } else {
              console.error('Failed to send welcome email:', welcomeResult.message);
            }
          } catch (welcomeEmailError) {
            console.error('Failed to send welcome email:', welcomeEmailError);
            // Don't fail the registration if welcome email fails
          }
          
          setSuccess('Registration completed successfully! Welcome email sent. Redirecting to login...');
          
          setTimeout(() => {
            router.push('/auth?tab=signin');
          }, 3000);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          setError('Registration data is invalid. Please start the registration process again.');
          setTimeout(() => {
            router.push('/auth?tab=signup');
          }, 2000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`/api/send-mail`, {
        email,
        firstName: email.split('@')[0] // Extract firstName from email for personalization
      });

      setSuccess('OTP resent successfully!');
      setCountdown(60);
      setCanResend(false);
      
      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit verification code to
            <span className="font-medium text-[#003366]"> {email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="sr-only">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 text-center text-xl tracking-widest"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center font-medium">
              {success}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || otp.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400'
              } transition-all duration-200`}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="font-medium text-[#003366] hover:text-[#002244] focus:outline-none focus:underline"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <span className="text-gray-400">
                  Resend in {countdown}s
                </span>
              )}
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
            >
              Back to Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function OTPVerification() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OTPVerificationContent />
    </Suspense>
  );
}
