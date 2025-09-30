import { connectToDatabase } from '@/lib/db';
import UserActivity from '@/models/userActivityModel';
import mongoose from 'mongoose';
import { jwtVerify } from 'jose';

export async function POST(request) {
    //console.log('=== ACTIVITY API POST REQUEST DEBUG START ===');
    try {
        //console.log('1. Request received at /api/user/activity');
        await connectToDatabase();
        //console.log('2. Database connected successfully');
        
        const body = await request.json();
        //console.log('3. Request body received:', body);
        const { itemType, itemId, itemTitle, itemUrl, action = 'view', sessionDuration = 0 } = body;
        //console.log('4. Extracted data:', { itemType, itemId, itemTitle, itemUrl, action, sessionDuration });
        
        // Get user from token
        //console.log('5. Getting token from request headers...');
        const cookieHeader = request.headers.get('cookie');
        //console.log('6. Cookie header:', cookieHeader ? 'Present' : 'Missing');
        const cookies = Object.fromEntries(
            cookieHeader?.split('; ').map(c => c.split('=')) || []
        );
        //console.log('7. Parsed cookies:', Object.keys(cookies));
        
        const token = cookies.token || request.headers.get('authorization')?.replace('Bearer ', '');
        //console.log('8. Token found:', !!token);
        //console.log('9. Token value (first 20 chars):', token?.substring(0, 20));
        
        if (!token) {
            //console.log('10. ERROR: No authentication token provided');
            return Response.json({ 
                success: false, 
                message: 'No authentication token provided' 
            }, { status: 401 });
        }

        //console.log('11. Decoding JWT token...');
        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
            //console.log('12. JWT decoded with jose successfully');
        } catch (joseError) {
            //console.log('13. Jose failed, trying jsonwebtoken:', joseError.message);
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            //console.log('14. JWT decoded with jsonwebtoken successfully');
        }

        //console.log('15. Decoded JWT payload:', decoded);
        let userId = decoded.userId || decoded.id;
        //console.log('16. Raw userId from JWT:', userId);
        //console.log('17. UserId type:', typeof userId);

        // Convert ObjectId to proper ObjectId type for database operations
        let userObjectId;
        if (userId && typeof userId === 'object' && userId.buffer) {
            //console.log('18. Converting ObjectId buffer to ObjectId...');
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            //console.log('19. Buffer data:', bufferData);
            userObjectId = new mongoose.Types.ObjectId(Buffer.from(bufferData));
            //console.log('20. Processed userObjectId:', userObjectId);
        } else if (userId && typeof userId === 'string') {
            //console.log('21. Converting string userId to ObjectId...');
            userObjectId = new mongoose.Types.ObjectId(userId);
            //console.log('22. Processed userObjectId from string:', userObjectId);
        } else {
            //console.log('23. Using userId as is:', userId);
            userObjectId = userId;
        }

        // Get IP and User Agent
        //console.log('24. Getting IP and User Agent...');
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        //console.log('25. IP Address:', ipAddress);
        //console.log('26. User Agent:', userAgent);

        // Create activity record
        //console.log('27. Creating activity record...');
        const activityData = {
            userId: userObjectId,
            itemType,
            itemId,
            itemTitle,
            itemUrl,
            action,
            sessionDuration,
            ipAddress,
            userAgent
        };
        //console.log('28. Activity data to save:', activityData);
        
        const activity = new UserActivity(activityData);
        //console.log('29. UserActivity instance created');

        //console.log('30. Saving activity to database...');
        const savedActivity = await activity.save();
        //console.log('31. Activity saved successfully:', savedActivity);

        //console.log('32. Sending success response...');
        return Response.json({
            success: true,
            message: 'Activity tracked successfully',
            data: savedActivity
        }, { status: 201 });

    } catch (error) {
        console.error('=== ERROR IN ACTIVITY API POST ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return Response.json({
            success: false,
            message: 'Failed to track activity',
            error: error.message
        }, { status: 500 });
    } finally {
        //console.log('=== ACTIVITY API POST REQUEST DEBUG END ===');
    }
}

export async function GET(request) {
    //console.log('=== ACTIVITY API GET REQUEST DEBUG START ===');
    try {
        //console.log('1. GET request received at /api/user/activity');
        await connectToDatabase();
        //console.log('2. Database connected successfully');
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        //console.log('3. Pagination params:', { page, limit });
        
        // Get user from token
        //console.log('4. Getting token from request headers...');
        const cookieHeader = request.headers.get('cookie');
        //console.log('5. Cookie header:', cookieHeader ? 'Present' : 'Missing');
        const cookies = Object.fromEntries(
            cookieHeader?.split('; ').map(c => c.split('=')) || []
        );
        //console.log('6. Parsed cookies:', Object.keys(cookies));
        
        const token = cookies.token || request.headers.get('authorization')?.replace('Bearer ', '');
        //console.log('7. Token found:', !!token);
        //console.log('8. Token value (first 20 chars):', token?.substring(0, 20));
        
        if (!token) {
            //console.log('9. ERROR: No authentication token provided');
            return Response.json({ 
                success: false, 
                message: 'No authentication token provided' 
            }, { status: 401 });
        }

        //console.log('10. Decoding JWT token...');
        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
            //console.log('11. JWT decoded with jose successfully');
        } catch (joseError) {
            //console.log('12. Jose failed, trying jsonwebtoken:', joseError.message);
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            //console.log('13. JWT decoded with jsonwebtoken successfully');
        }

        //console.log('14. Decoded JWT payload:', decoded);
        let userId = decoded.userId || decoded.id;
        //console.log('15. Raw userId from JWT:', userId);
        //console.log('16. UserId type:', typeof userId);

        // Convert ObjectId to proper ObjectId type for database operations
        let userObjectId;
        if (userId && typeof userId === 'object' && userId.buffer) {
            //console.log('17. Converting ObjectId buffer to ObjectId...');
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            //console.log('18. Buffer data:', bufferData);
            userObjectId = new mongoose.Types.ObjectId(Buffer.from(bufferData));
            //console.log('19. Processed userObjectId:', userObjectId);
        } else if (userId && typeof userId === 'string') {
            //console.log('20. Converting string userId to ObjectId...');
            userObjectId = new mongoose.Types.ObjectId(userId);
            //console.log('21. Processed userObjectId from string:', userObjectId);
        } else {
            //console.log('22. Using userId as is:', userId);
            userObjectId = userId;
        }

        const skip = (page - 1) * limit;
        //console.log('23. Skip value:', skip);

        // Get user activities with pagination
        //console.log('24. Querying activities for userObjectId:', userObjectId);
        //console.log('25. Query filter:', { userId: userObjectId });
        
        // First, let's see all unique userIds in the database for debugging
        const allUserIds = await UserActivity.distinct('userId');
        //console.log('26. All unique userIds in database:', allUserIds);
        //console.log('27. Current user ObjectId matches any existing?', allUserIds.some(id => id.toString() === userObjectId.toString()));
        
        const activities = await UserActivity.find({ userId: userObjectId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        //console.log('28. Activities found:', activities.length);
        // console.log('29. Sample activity userIds:', activities.slice(0, 3).map(a => ({ 
        //     activityId: a._id, 
        //     userId: a.userId, 
        //     itemTitle: a.itemTitle,
        //     userIdType: typeof a.userId,
        //     userIdEquals: a.userId.toString() === userObjectId.toString()
        // })));

        // Get total count
        //console.log('30. Getting total count for userObjectId:', userObjectId);
        const totalActivities = await UserActivity.countDocuments({ userId: userObjectId });
        //console.log('31. Total activities count:', totalActivities);

        // Get activity statistics
        //console.log('32. Getting activity statistics for userObjectId:', userObjectId);
        const stats = await UserActivity.aggregate([
            { $match: { userId: userObjectId } },
            {
                $group: {
                    _id: '$itemType',
                    count: { $sum: 1 },
                    lastAccessed: { $max: '$timestamp' }
                }
            }
        ]);
        //console.log('33. Activity stats:', stats);

        const responseData = {
            success: true,
            data: {
                activities,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalActivities / limit),
                    totalActivities,
                    hasNextPage: skip + activities.length < totalActivities,
                    hasPrevPage: page > 1
                },
                stats
            }
        };
        // console.log('34. Sending response for userObjectId:', userObjectId);
        // console.log('35. Response data summary:', {
        //     activitiesCount: responseData.data.activities.length,
        //     totalActivities: responseData.data.pagination.totalActivities,
        //     statsCount: responseData.data.stats.length
        // });

        return Response.json(responseData);

    } catch (error) {
        console.error('=== ERROR IN ACTIVITY API GET ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return Response.json({
            success: false,
            message: 'Failed to get user activity',
            error: error.message
        }, { status: 500 });
    } finally {
        console.log('=== ACTIVITY API GET REQUEST DEBUG END ===');
    }
}
