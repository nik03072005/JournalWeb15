import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FAQController from '@/controllers/faqController';

// POST - Bulk create FAQs
export async function POST(request) {
  try {
    await connectToDatabase();
    const { faqs } = await request.json();

    if (!faqs || !Array.isArray(faqs)) {
      return NextResponse.json(
        { success: false, message: 'Invalid FAQ data. Expected an array of FAQs.' },
        { status: 400 }
      );
    }

    const result = await FAQController.bulkCreateFAQs(faqs);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message
      }, { status: 201 });
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
    console.error('API - Error in POST /api/faq/bulk:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
