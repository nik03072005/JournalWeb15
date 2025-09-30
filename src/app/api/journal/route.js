import { createJournal, deleteJournal, getJournals, updateJournal } from "@/controllers/journelController";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    const body = await req.json();
    return await createJournal(body); // Pass body to controller
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
    return await deleteJournal(id);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id'); 
  return await getJournals(id);
}

export async function PUT(request) {
  try {
    const body = await request.json(); // Parse the request body
    const { type, fileUrl, subjectId, detail,id } = body;
    console.log(type, fileUrl, subjectId, detail, id, "put data");  

    // Call the updateJournal controller
    const response = await updateJournal(id, { type, fileUrl, subjectId, detail });
    return response;
  } catch (error) {
    console.error('Error in PUT', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}