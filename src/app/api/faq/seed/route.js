import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FAQSeeder from '@/lib/faqSeeder';

// POST - Seed FAQ database
export async function POST(request) {
  try {
    await connectToDatabase();
    const { action } = await request.json();
    
    let result;
    
    if (action === 'reset') {
      result = await FAQSeeder.reset();
    } else {
      result = await FAQSeeder.seed();
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          error: result.error 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API - Error in POST /api/faq/seed:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
