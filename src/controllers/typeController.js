import Type from '@/models/typeModel';
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function createType({ typeName }) {
  await connectToDatabase();

  try {
    if (!typeName) {
      throw new Error('Type name is required');
    }

    const type = new Type({ typeName });
    const savedType = await type.save();

    return NextResponse.json(
      { message: 'Type created successfully', type: { _id: savedType._id, typeName: savedType.typeName } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function updateType(id, { typeName }) {
  await connectToDatabase();

  try {
    if (!id || !typeName) {
      throw new Error('Type ID and name are required');
    }

    const type = await Type.findByIdAndUpdate(
      id,
      { typeName },
      { new: true, runValidators: true }
    );

    if (!type) {
      throw new Error('Type not found');
    }

    return NextResponse.json(
      { message: 'Type updated successfully', type: { id: type._id, typeName: type.typeName } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function deleteType(id) {
  await connectToDatabase();

  try {
    // console.log(id,"condel")
    if (!id) {
      throw new Error('Type ID is required');
    }

    const type = await Type.findByIdAndDelete(id);

    if (!type) {
      throw new Error('Type not found');
    }

    return NextResponse.json(
      { message: 'Type deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function getAllTypes() {
  await connectToDatabase();

  try {
    const types = await Type.find({});
    return NextResponse.json(
      { message: 'Types fetched successfully', types },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function getTypeById(id) {
  await connectToDatabase();

  try {
    if (!id) {
      throw new Error('Type ID is required');
    }

    const type = await Type.findById(id);

    if (!type) {
      throw new Error('Type not found');
    }

    return NextResponse.json(
      { message: 'Type fetched successfully', type },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}