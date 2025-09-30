import { connectToDatabase } from '@/lib/db';
import userModel from '@/models/userModel';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Get the first admin user (assuming single admin setup)
    const admin = await userModel.findOne({ role: 'admin' });
    
    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: admin.subscription.status,
        startDate: admin.subscription.startDate,
        endDate: admin.subscription.endDate
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin subscription error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin subscription details'
    }, { status: 500 });
  }
}
