import { connectToDatabase } from '@/lib/db';
import UserActivity from '@/models/userActivityModel';
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

        // Get activity analytics for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const analytics = await UserActivity.aggregate([
            { 
                $match: { 
                    userId: userId,
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        itemType: "$itemType"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        // Get most viewed items
        const mostViewed = await UserActivity.aggregate([
            { 
                $match: { 
                    userId: userId,
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        itemId: "$itemId",
                        itemTitle: "$itemTitle",
                        itemType: "$itemType",
                        itemUrl: "$itemUrl"
                    },
                    viewCount: { $sum: 1 },
                    lastViewed: { $max: "$timestamp" }
                }
            },
            {
                $sort: { viewCount: -1 }
            },
            {
                $limit: 10
            }
        ]);

        return Response.json({
            success: true,
            data: {
                analytics,
                mostViewed
            }
        });

    } catch (error) {
        console.error('Error getting activity analytics:', error);
        return Response.json({
            success: false,
            message: 'Failed to get activity analytics',
            error: error.message
        }, { status: 500 });
    }
}
