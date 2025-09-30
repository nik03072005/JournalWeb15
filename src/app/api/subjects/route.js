import { createSubject, updateSubject, deleteSubject, getSubjects } from '@/controllers/subjectController';

export async function POST(req) {
  try {
    const { subjectName } = await req.json();
    return await createSubject({ subjectName });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  try {
    const { id, subjectName } = await req.json();
    return await updateSubject(id, { subjectName });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    return await deleteSubject(id);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  return await getSubjects(id);
}