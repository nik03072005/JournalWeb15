import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FAQController from '@/controllers/faqController';

// GET - Fetch all FAQs
export async function GET() {
  try {
    await connectToDatabase();
    const result = await FAQController.getAllFAQs();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        faqs: result.data
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
    console.error('API - Error in GET /api/faq:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new FAQ (Admin only)
export async function POST(request) {
  try {
    await connectToDatabase();
    const { question, answer } = await request.json();

    const result = await FAQController.createFAQ(question, answer);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        faq: result.data
      }, { status: 201 });
    } else {
      const statusCode = result.errors ? 400 : 500;
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          errors: result.errors,
          error: result.error 
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('API - Error in POST /api/faq:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update FAQ (Admin only)
export async function PUT(request) {
  try {
    await connectToDatabase();
    const { id, question, answer } = await request.json();

    const result = await FAQController.updateFAQ(id, question, answer);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        faq: result.data
      });
    } else {
      let statusCode = 500;
      if (result.message === 'FAQ not found') {
        statusCode = 404;
      } else if (result.errors || result.message.includes('required')) {
        statusCode = 400;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          errors: result.errors,
          error: result.error 
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('API - Error in PUT /api/faq:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ (Admin only)
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const result = await FAQController.deleteFAQ(id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        faq: result.data
      });
    } else {
      const statusCode = result.message === 'FAQ not found' ? 404 : 
                        result.message.includes('required') ? 400 : 500;
      
      return NextResponse.json(
        { 
          success: false, 
          message: result.message,
          error: result.error 
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('API - Error in DELETE /api/faq:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
