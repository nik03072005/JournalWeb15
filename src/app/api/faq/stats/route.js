import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FAQController from '@/controllers/faqController';

// GET - Get FAQ statistics
export async function GET() {
  try {
    await connectToDatabase();
    const result = await FAQController.getFAQStats();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        stats: result.data,
        message: result.message
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
    console.error('API - Error in GET /api/faq/stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
