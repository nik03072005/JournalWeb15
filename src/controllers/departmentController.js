import Department from '@/models/departmentModel';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function createDepartment({ departmentName }) {
  await connectToDatabase();
  try {
    if (!departmentName) throw new Error('Department name is required');

    const department = new Department({ departmentName });
    const saved = await department.save();

    return NextResponse.json(
      { message: 'Department created successfully', department: { id: saved._id, departmentName: saved.departmentName } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function updateDepartment(id, { departmentName }) {
  await connectToDatabase();
  try {
    if (!id || !departmentName) throw new Error('Department ID and name are required');

    const updated = await Department.findByIdAndUpdate(
      id,
      { departmentName },
      { new: true, runValidators: true }
    );

    if (!updated) throw new Error('Department not found');

    return NextResponse.json(
      { message: 'Department updated successfully', department: { id: updated._id, departmentName: updated.departmentName } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function deleteDepartment(id) {
  await connectToDatabase();
  try {
    if (!id) throw new Error('Department ID is required');

    const deleted = await Department.findByIdAndDelete(id);
    if (!deleted) throw new Error('Department not found');

    return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function getDepartments(id = null) {
  await connectToDatabase();
  try {
    if (id) {
      const dep = await Department.findById(id);
      if (!dep) throw new Error('Department not found');
      return NextResponse.json({ department: { id: dep._id, departmentName: dep.departmentName } }, { status: 200 });
    }

    const list = await Department.find({}).sort({ departmentName: 1 });
    return NextResponse.json({ departments: list.map(d => ({ id: d._id, departmentName: d.departmentName })) }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
