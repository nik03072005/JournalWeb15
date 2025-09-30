import Journal from '@/models/journelModel';
import Detail from '@/models/detailModel';
import Subject from '@/models/subjectModel';
import Type from '@/models/typeModel';
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function createJournal({ type, fileUrl, subjectId, detail }) {
  await connectToDatabase();

  try {
    // Debug: Log the schema to verify
    // console.log('Journal Schema:', Journal.schema.paths);

    // Validate required fields
    // console.log(detail, "Detail data for journal creation:");
    // console.log(type, fileUrl, subjectId, detail, "Creating journal with details:");
    if (!type || !fileUrl || !subjectId || !detail) {
      throw new Error('Missing required fields');
    }

    // Check if subject exists
    const existingSubject = await Subject.findById(subjectId);
    if (!existingSubject) {
      throw new Error('Invalid subject ID');
    }

    // Create new Detail document based on type
    // console.log('createJournal incoming course fields:', {
    //   courseName: detail.courseName,
    //   courseCode: detail.courseCode,
    // });
    const newDetail = new Detail({
      title: detail.title || '',
      abstract: detail.abstract || '',
      creators: detail.creators || [],
      guides: detail.guides || [],
      status: detail.status || 'In Press',
      volume: detail.volume || null,
      number: detail.number || null,
      pageRange: detail.pageRange || '',
      date: detail.date || new Date(),
      references: detail.references || '',
      keywords: detail.keywords || '',
      journalOrPublicationTitle: detail.journalOrPublicationTitle || '',
      issn: detail.issn || '',
      officialURL: detail.officialURL || '',
      doi: detail.doi || '',
      conference: detail.conference || '',
      bookName: detail.bookName || '',
      isbn: detail.isbn || '',
      publisher: detail.publisher || '',
      preface: detail.preface || '',
      department: detail.department || '',
      semester: detail.semester || '',
      university: detail.university || '',
      courseName: detail.courseName || '',
      courseCode: detail.courseCode || '',
      year: detail.year || '',
    });

    const savedDetail = await newDetail.save();
    // console.log('createJournal saved detail course fields:', {
    //   courseName: savedDetail.courseName,
    //   courseCode: savedDetail.courseCode,
    // });
    const detailId = savedDetail._id;

    // Create new Journal document with the saved Detail ID and subjectId
    const journal = new Journal({
      type, // Should be a string like "Conference"
      fileUrl,
      detail: detailId,
      subject: subjectId,
    });

    const savedJournal = await journal.save();
    // console.log(savedDetail,"dd")

    // Send email notification for new item
    try {
      const emailResponse = await axios.post(`/api/send-mail/new-item-notification`, {
        itemDetails: {
          _id: savedJournal._id,
          title: detail.title,
          type: type,
          abstract: detail.abstract,
          creators: detail.creators,
          date: detail.date || new Date().toISOString(),
        }
      });
      console.log('Email notification sent successfully:', emailResponse.data);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError.message);
      // Don't fail the journal creation if email fails
    }

    

    // Return success response
    return NextResponse.json(
      { 
        message: 'Journal created successfully',
        journal: { 
          id: savedJournal._id, 
          type: savedJournal.type, 
          fileUrl: savedJournal.fileUrl, 
          detail: savedJournal.detail, 
          subject: savedJournal.subject 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function deleteJournal(id) {
  await connectToDatabase();

  try {
    // Validate ID
    if (!id) {
      throw new Error('Journal ID is required');
    }

    // Find the journal to get the detail ID
    const journal = await Journal.findById(id);

    if (!journal) {
      throw new Error('Journal not found');
    }

    // Delete the associated Detail
    if (journal.detail) {
      await Detail.findByIdAndDelete(journal.detail);
    }

    // Delete the journal
    await Journal.findByIdAndDelete(id);

    // Return success response
    return NextResponse.json(
      { message: 'Journal and associated detail deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function getJournals(id = null) {
  await connectToDatabase();

  try {
    if (id) {
      console.log(id, "ID from search DBBB params");
     const journal = await Journal.findById(id)
 .populate({
    path: 'subject',
  })
  .populate({
    path: 'detail',
    
  });

  
  if (!journal) {
    throw new Error('Journal not found');
  }
  return NextResponse.json({ journal }, { status: 200 });
 
    }

    const journals = await Journal.find()
      .select('-createdAt -updatedAt -__v')
      .populate({
        path: 'subject',
        select: '-createdAt -updatedAt -__v'
      })
      .populate({
        path: 'detail',
        select: '-createdAt -updatedAt -__v'
      });

    return NextResponse.json({ journals }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function updateJournal(id, { type, fileUrl, subjectId, detail }) {
  await connectToDatabase();

  try {
    // Validate required fields
    console.log(id, type, fileUrl, subjectId, detail, "Updating journal with details:");
    if (!id || !type || !fileUrl || !subjectId || !detail) {
      throw new Error('Missing required fields');
    }

    // Check if referenced document exists
    const subject = await Subject.findById(subjectId);
    const journal = await Journal.findById(id);

    if (!subject) {
      throw new Error('Invalid subject ID');
    }
    if (!journal) {
      throw new Error('Journal not found');
    }

    console.log(detail, "Detail data for update:");
    console.log('updateJournal incoming course fields:', {
      courseName: detail.courseName,
      courseCode: detail.courseCode,
    });

    // Update Detail document with all possible fields
    const detailUpdate = {
      title: detail.title || '',
      abstract: detail.abstract || '',
      creators: detail.creators || [{ firstName: '', lastName: '', email: '' }],
      guides: detail.guides || [],
      status: detail.status || '',
      volume: detail.volume || '',
      number: detail.number || '',
      pageRange: detail.pageRange || '',
      date: detail.date || new Date(),
      references: detail.references || '',
      keywords: detail.keywords || '',
      journalOrPublicationTitle: detail.journalOrPublicationTitle || '',
      issn: detail.issn || '',
      officialURL: detail.officialURL || '',
      doi: detail.doi || '',
      conference: detail.conference || '',
      bookName: detail.bookName || '',
      isbn: detail.isbn || '',
      publisher: detail.publisher || '',
      preface: detail.preface || '',
      department: detail.department || '',
      semester: detail.semester || '',
      university: detail.university || '',
  courseName: detail.courseName || '',
  courseCode: detail.courseCode || '',
      year: detail.year || '',
    };

    const updatedDetail = await Detail.findByIdAndUpdate(
      journal.detail,
      detailUpdate,
      { new: true, runValidators: true }
    );
    console.log('updateJournal updated detail course fields:', {
      courseName: updatedDetail.courseName,
      courseCode: updatedDetail.courseCode,
    });

    // Update Journal document
    const updatedJournal = await Journal.findByIdAndUpdate(
      id,
      {
        type,
        fileUrl,
        subject: subjectId,
        detail: updatedDetail._id,
      },
      { new: true, runValidators: true }
    );

    // Return success response
    return NextResponse.json(
      {
        message: 'Journal updated successfully',
        journal: {
          id: updatedJournal._id,
          type: updatedJournal.type,
          fileUrl: updatedJournal.fileUrl,
          detail: updatedDetail,
          subject: updatedJournal.subject,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

