import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

/**
 * Extract and validate user ID from JWT token in request
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string, error: null} | {userId: null, error: Response}>}
 */
export async function getUserIdFromRequest(request) {
    try {
        // Get token from cookies or authorization header
        const cookieHeader = request.headers.get('cookie');
        const cookies = Object.fromEntries(
            cookieHeader?.split('; ').map(c => c.split('=')) || []
        );
        
        const token = cookies.token || request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return {
                userId: null,
                error: Response.json({ 
                    success: false, 
                    message: 'No authentication token provided' 
                }, { status: 401 })
            };
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

        if (!userId) {
            return {
                userId: null,
                error: Response.json({ 
                    success: false, 
                    message: 'Invalid token: no user ID found' 
                }, { status: 401 })
            };
        }

        return {
            userId,
            error: null
        };

    } catch (error) {
        console.error('Error extracting user ID from token:', error);
        return {
            userId: null,
            error: Response.json({ 
                success: false, 
                message: 'Invalid or expired token' 
            }, { status: 401 })
        };
    }
}
