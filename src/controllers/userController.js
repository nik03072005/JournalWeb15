import { connectToDatabase } from "@/lib/db";
import userModel from "@/models/userModel";
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function registerUser({ firstName, lastName, email, mobileNumber, password, role }) {
    try {
        const db = await connectToDatabase();
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }
        const newUser = {
            firstname: firstName,
            lastname: lastName,
            email,
            mobileNumber,
            password,
            role: role || 'user',
        };
        const user = new userModel(newUser);
        await user.save();
        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Register user error:', error.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function getAllUsers() {
    try {
        await connectToDatabase();
        const users = await userModel.find().select('firstname lastname email mobileNumber role _id');
        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error('Get all users error:', error.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function getUser(userId) {
    try {
        await connectToDatabase();
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Get user error:', error.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function updateUser(userId, updates) {
    try {
        await connectToDatabase();
        const allowedUpdates = ['firstname', 'lastname', 'mobileNumber', 'role', 'password'];
        const updateFields = Object.keys(updates).reduce((acc, key) => {
            if (allowedUpdates.includes(key)) {
                if (key === 'password' && updates[key]) {
                    acc[key] = bcrypt.hashSync(updates[key], 10);
                } else {
                    acc[key] = updates[key];
                }
            }
            return acc;
        }, {});
        
        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        return NextResponse.json({ user, message: 'User updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Update user error:', error.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function deleteUser(userId) {
    try {
        await connectToDatabase();
        const user = await userModel.findByIdAndDelete(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Delete user error:', error.message);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}