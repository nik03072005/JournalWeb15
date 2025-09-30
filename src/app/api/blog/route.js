import { NextResponse } from 'next/server';
import { createBlog, getBlogs, updateBlog, deleteBlog } from '@/controllers/blogController';

export async function POST(req) {
  try {
    const body = await req.json();
    return await createBlog(body);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    return await getBlogs(slug);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { slug, title, content, bannerImage } = body;
    return await updateBlog(slug, { title, content, bannerImage });
  } catch (err) {
    console.error('Error in PUT:', err);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(req) {
  try {
    const { slug } = await req.json();
    return await deleteBlog(slug);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}