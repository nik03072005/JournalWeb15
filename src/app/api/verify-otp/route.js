import { verifyOTP } from '@/lib/otpUtils';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return Response.json({ 
        error: 'Email and OTP are required' 
      }, { status: 400 });
    }

    const result = await verifyOTP(email, otp);

    if (!result.success) {
      return Response.json({ 
        error: result.message 
      }, { status: 400 });
    }

    return Response.json({ 
      message: result.message,
      verified: true
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return Response.json({ 
      error: 'Failed to verify OTP' 
    }, { status: 500 });
  }
}
