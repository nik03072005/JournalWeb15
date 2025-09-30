import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FAQController from '@/controllers/faqController';

// GET - Search FAQs
export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');

    if (!searchTerm) {
      return NextResponse.json(
        { success: false, message: 'Search term is required' },
        { status: 400 }
      );
    }

    const result = await FAQController.searchFAQs(searchTerm);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        faqs: result.data,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          error: result.error 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API - Error in GET /api/faq/search:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
