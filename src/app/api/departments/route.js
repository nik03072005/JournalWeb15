import { createDepartment, updateDepartment, deleteDepartment, getDepartments } from '@/controllers/departmentController';

export async function POST(req) {
  try {
    const { departmentName } = await req.json();
    return await createDepartment({ departmentName });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  try {
    const { id, departmentName } = await req.json();
    return await updateDepartment(id, { departmentName });
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
    return await deleteDepartment(id);
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
  return await getDepartments(id);
}
