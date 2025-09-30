import { NextResponse } from 'next/server';
import { uploadImage } from '@/controllers/blogController';

export async function POST(req) {
  try {
    const formData = await req.formData();
    return await uploadImage(formData);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}