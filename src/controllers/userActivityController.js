import UserActivity from '@/models/userActivityModel';
import { connectToDatabase } from '@/lib/db';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';

// Track user activity
export const trackUserActivity = async (req, res) => {
    console.log('=== TRACK USER ACTIVITY DEBUG START ===');
    try {
        console.log('1. Connecting to database...');
        await connectToDatabase();
        console.log('2. Database connected successfully');
        
        console.log('3. Request body:', req.body);
        const { itemType, itemId, itemTitle, itemUrl, action = 'view', sessionDuration = 0 } = req.body;
        console.log('4. Extracted data:', { itemType, itemId, itemTitle, itemUrl, action, sessionDuration });
        
        // Get user from token
        console.log('5. Getting token from request...');
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        console.log('6. Token found:', !!token);
        console.log('7. Token value (first 20 chars):', token?.substring(0, 20));
        
        if (!token) {
            console.log('8. ERROR: No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token provided' 
            });
        }

        console.log('9. Decoding JWT token...');
        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
            console.log('10. JWT decoded with jose successfully');
        } catch (joseError) {
            console.log('11. Jose failed, trying jsonwebtoken:', joseError.message);
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('12. JWT decoded with jsonwebtoken successfully');
        }

        console.log('13. Decoded JWT payload:', decoded);
        const userId = decoded.userId || decoded.id;
        console.log('14. Raw userId from JWT:', userId);
        console.log('15. UserId type:', typeof userId);

        // Convert ObjectId to string if it's an ObjectId object
        let processedUserId = userId;
        if (userId && typeof userId === 'object' && userId.buffer) {
            console.log('16. Converting ObjectId buffer to string...');
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            console.log('17. Buffer data:', bufferData);
            processedUserId = new mongoose.Types.ObjectId(Buffer.from(bufferData)).toString();
            console.log('18. Processed userId:', processedUserId);
        } else {
            console.log('19. UserId is already a string:', processedUserId);
        }

        // Get IP and User Agent
        console.log('20. Getting IP and User Agent...');
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        console.log('21. IP Address:', ipAddress);
        console.log('22. User Agent:', userAgent);

        // Create activity record
        console.log('23. Creating activity record...');
        const activityData = {
            userId: processedUserId,
            itemType,
            itemId,
            itemTitle,
            itemUrl,
            action,
            sessionDuration,
            ipAddress,
            userAgent
        };
        console.log('24. Activity data to save:', activityData);
        
        const activity = new UserActivity(activityData);
        console.log('25. UserActivity instance created:', activity);

        console.log('26. Saving activity to database...');
        const savedActivity = await activity.save();
        console.log('27. Activity saved successfully:', savedActivity);

        console.log('28. Sending success response...');
        res.status(201).json({
            success: true,
            message: 'Activity tracked successfully',
            data: savedActivity
        });
        console.log('29. Response sent successfully');

    } catch (error) {
        console.error('=== ERROR IN TRACK USER ACTIVITY ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to track activity',
            error: error.message
        });
    }
    console.log('=== TRACK USER ACTIVITY DEBUG END ===');
};

// Get user's recent activity
export const getUserActivity = async (req, res) => {
    console.log('=== GET USER ACTIVITY DEBUG START ===');
    try {
        console.log('1. Connecting to database...');
        await connectToDatabase();
        console.log('2. Database connected successfully');
        
        console.log('3. Request query:', req.query);
        const { page = 1, limit = 10 } = req.query;
        console.log('4. Pagination params:', { page, limit });
        
        // Get user from token
        console.log('5. Getting token from request...');
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        console.log('6. Token found:', !!token);
        
        if (!token) {
            console.log('7. ERROR: No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token provided' 
            });
        }

        console.log('8. Decoding JWT token...');
        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
            console.log('9. JWT decoded with jose successfully');
        } catch (joseError) {
            console.log('10. Jose failed, trying jsonwebtoken:', joseError.message);
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('11. JWT decoded with jsonwebtoken successfully');
        }

        console.log('12. Decoded JWT payload:', decoded);
        const userId = decoded.userId || decoded.id;
        console.log('13. Raw userId from JWT:', userId);

        // Convert ObjectId to string if it's an ObjectId object
        let processedUserId = userId;
        if (userId && typeof userId === 'object' && userId.buffer) {
            console.log('14. Converting ObjectId buffer to string...');
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            processedUserId = new mongoose.Types.ObjectId(Buffer.from(bufferData)).toString();
            console.log('15. Processed userId:', processedUserId);
        } else {
            console.log('16. UserId is already a string:', processedUserId);
        }

        const skip = (page - 1) * limit;
        console.log('17. Skip value:', skip);

        // Get user activities with pagination
        console.log('18. Querying activities for userId:', processedUserId);
        console.log(processedUserId)
        const activities = await UserActivity.find({ userId: processedUserId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        console.log('19. Activities found:', activities.length);
        console.log('20. Activities data:', activities);

        // Get total count
        console.log('21. Getting total count...');
        const totalActivities = await UserActivity.countDocuments({ userId: processedUserId });
        console.log('22. Total activities count:', totalActivities);

        // Get activity statistics
        console.log('23. Getting activity statistics...');
        const stats = await UserActivity.aggregate([
            { $match: { userId: processedUserId } },
            {
                $group: {
                    _id: '$itemType',
                    count: { $sum: 1 },
                    lastAccessed: { $max: '$timestamp' }
                }
            }
        ]);
        console.log('24. Activity stats:', stats);

        const responseData = {
            success: true,
            data: {
                activities,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalActivities / limit),
                    totalActivities,
                    hasNextPage: skip + activities.length < totalActivities,
                    hasPrevPage: page > 1
                },
                stats
            }
        };
        console.log('25. Sending response data:', responseData);

        res.status(200).json(responseData);
        console.log('26. Response sent successfully');

    } catch (error) {
        console.error('=== ERROR IN GET USER ACTIVITY ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to get user activity',
            error: error.message
        });
    }
    console.log('=== GET USER ACTIVITY DEBUG END ===');
};

// Get activity analytics for dashboard
export const getActivityAnalytics = async (req, res) => {
    console.log('=== GET ACTIVITY ANALYTICS DEBUG START ===');
    try {
        console.log('1. Connecting to database...');
        await connectToDatabase();
        console.log('2. Database connected successfully');
        
        // Get user from token
        console.log('3. Getting token from request...');
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        console.log('4. Token found:', !!token);
        
        if (!token) {
            console.log('5. ERROR: No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'No authentication token provided' 
            });
        }

        console.log('6. Decoding JWT token...');
        let decoded;
        try {
            // Try with jose (newer method)
            const { payload } = await jwtVerify(
                token,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            decoded = payload;
            console.log('7. JWT decoded with jose successfully');
        } catch (joseError) {
            console.log('8. Jose failed, trying jsonwebtoken:', joseError.message);
            // Fallback to jsonwebtoken
            const jwt = require('jsonwebtoken');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('9. JWT decoded with jsonwebtoken successfully');
        }

        console.log('10. Decoded JWT payload:', decoded);
        const userId = decoded.userId || decoded.id;
        console.log('11. Raw userId from JWT:', userId);

        // Convert ObjectId to string if it's an ObjectId object
        let processedUserId = userId;
        if (userId && typeof userId === 'object' && userId.buffer) {
            console.log('12. Converting ObjectId buffer to string...');
            // Extract the buffer data and create ObjectId from it
            const bufferData = Object.values(userId.buffer);
            processedUserId = new mongoose.Types.ObjectId(Buffer.from(bufferData)).toString();
            console.log('13. Processed userId:', processedUserId);
        } else {
            console.log('14. UserId is already a string:', processedUserId);
        }

        // Get activity analytics for the last 30 days
        console.log('15. Setting up date range...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        console.log('16. Date range: from', thirtyDaysAgo, 'to now');

        console.log('17. Running analytics aggregation...');
        const analytics = await UserActivity.aggregate([
            { 
                $match: { 
                    userId: processedUserId,
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
        console.log('18. Analytics results:', analytics);

        // Get most viewed items
        console.log('19. Getting most viewed items...');
        const mostViewed = await UserActivity.aggregate([
            { 
                $match: { 
                    userId: processedUserId,
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
        console.log('20. Most viewed items:', mostViewed);

        const responseData = {
            success: true,
            data: {
                analytics,
                mostViewed
            }
        };
        console.log('21. Sending response data:', responseData);

        res.status(200).json(responseData);
        console.log('22. Response sent successfully');

    } catch (error) {
        console.error('=== ERROR IN GET ACTIVITY ANALYTICS ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to get activity analytics',
            error: error.message
        });
    }
    console.log('=== GET ACTIVITY ANALYTICS DEBUG END ===');
};
