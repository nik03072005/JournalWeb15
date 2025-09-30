import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

export async function GET(request) {
    try {
        await connectToDatabase();
        
        // Get user from token
        const cookieHeader = request.headers.get('cookie');
        const cookies = Object.fromEntries(
            cookieHeader?.split('; ').map(c => c.split('=')) || []
        );
        
        const token = cookies.token || request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return Response.json({ 
                success: false, 
                message: 'No authentication token provided' 
            }, { status: 401 });
        }

        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
        } catch (joseError) {
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }

        let userId = decoded.userId || decoded.id;

        // Convert ObjectId to string if it's an ObjectId object
        if (userId && typeof userId === 'object' && userId.buffer) {
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            userId = new mongoose.Types.ObjectId(Buffer.from(bufferData)).toString();
        }

        // Validate userId format
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return Response.json({
                success: false,
                message: 'Invalid user ID in token'
            }, { status: 401 });
        }

        // Get user details (excluding password)
        const user = await User.findById(userId).select('-password').lean();

        if (!user) {
            return Response.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Transform user data to include name field
        const transformedUser = {
            ...user,
            name: `${user.firstname || ''} ${user.lastname || ''}`.trim()
        };

        return Response.json({
            success: true,
            data: transformedUser
        });

    } catch (error) {
        console.error('Error getting user profile:', error);
        return Response.json({
            success: false,
            message: 'Failed to get user profile',
            error: error.message
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectToDatabase();
        
        const body = await request.json();
        const { name, email } = body;
        
        // Get user from token
        const cookieHeader = request.headers.get('cookie');
        const cookies = Object.fromEntries(
            cookieHeader?.split('; ').map(c => c.split('=')) || []
        );
        
        const token = cookies.token || request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return Response.json({ 
                success: false, 
                message: 'No authentication token provided' 
            }, { status: 401 });
        }

        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
        } catch (joseError) {
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }

        let userId = decoded.userId || decoded.id;
        
        // Convert ObjectId to string if it's an ObjectId object
        if (userId && typeof userId === 'object' && userId.buffer) {
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            userId = new mongoose.Types.ObjectId(Buffer.from(bufferData)).toString();
        }
        
        // Validate ObjectId format
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return Response.json({ 
                success: false, 
                message: 'Invalid user ID format' 
            }, { status: 401 });
        }

        // Parse name into firstname and lastname
        const nameParts = name ? name.trim().split(' ') : [];
        const firstname = nameParts[0] || '';
        const lastname = nameParts.slice(1).join(' ') || '';

        // Update user profile
        const updateData = {};
        if (firstname) updateData.firstname = firstname;
        if (lastname) updateData.lastname = lastname;
        if (email) updateData.email = email;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password').lean();

        if (!updatedUser) {
            return Response.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Transform user data to include name field
        const transformedUser = {
            ...updatedUser,
            name: `${updatedUser.firstname || ''} ${updatedUser.lastname || ''}`.trim()
        };

        return Response.json({
            success: true,
            message: 'Profile updated successfully',
            data: transformedUser
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        return Response.json({
            success: false,
            message: 'Failed to update user profile',
            error: error.message
        }, { status: 500 });
    }
}
