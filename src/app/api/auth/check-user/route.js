import { connectToDatabase } from "@/lib/db";
import userModel from "@/models/userModel";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    const existingUser = await userModel.findOne({ email });
    
    return NextResponse.json({ 
      exists: !!existingUser 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json({ 
      error: 'Server error' 
    }, { status: 500 });
  }
}
