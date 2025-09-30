import Subject from '@/models/subjectModel';
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function createSubject({ subjectName }) {
  await connectToDatabase();

  try {
    if (!subjectName) {
      throw new Error('Subject name is required');
    }

    const subject = new Subject({ subjectName });
    const savedSubject = await subject.save();

    return NextResponse.json(
      { message: 'Subject created successfully', subject: { id: savedSubject._id, subjectName: savedSubject.subjectName } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function updateSubject(id, { subjectName }) {
  await connectToDatabase();

  try {
    if (!id || !subjectName) {
      throw new Error('Subject ID and name are required');
    }

    const subject = await Subject.findByIdAndUpdate(
      id,
      { subjectName },
      { new: true, runValidators: true }
    );

    if (!subject) {
      throw new Error('Subject not found');
    }

    return NextResponse.json(
      { message: 'Subject updated successfully', subject: { id: subject._id, subjectName: subject.subjectName } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function deleteSubject(id) {
  await connectToDatabase();

  try {
    if (!id) {
      throw new Error('Subject ID is required');
    }

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      throw new Error('Subject not found');
    }

    return NextResponse.json(
      { message: 'Subject deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function getSubjects(id = null) {
  await connectToDatabase();

  try {
    let result;

    if (id) {
      // Get a single subject by ID
      result = await Subject.findById(id);

      if (!result) {
        throw new Error('Subject not found');
      }

      return NextResponse.json(
        { subject: { id: result._id, subjectName: result.subjectName } },
        { status: 200 }
      );
    } else {
      // Get all subjects
      result = await Subject.find({});

      const formattedSubjects = result.map(subject => ({
        id: subject._id,
        subjectName: subject.subjectName,
      }));

      return NextResponse.json(
        { subjects: formattedSubjects },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
