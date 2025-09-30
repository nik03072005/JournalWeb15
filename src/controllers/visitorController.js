import Visitor from '../models/visitorModel.js';
import { connectToDatabase } from '../lib/db.js';

// Get visitor count for a paper
export const getVisitorCount = async (paperId, paperType = 'local') => {
    try {
        await connectToDatabase();
        const visitor = await Visitor.findOne({ paperId, paperType });
        return visitor ? visitor.visitCount : 0;
    } catch (error) {
        console.error('Error getting visitor count:', error.message);
        return 0;
    }
};

// Record a visit
export const recordVisit = async (paperId, paperType = 'local', visitorIdentifier = null) => {
    try {
        await connectToDatabase();
        console.log('Recording visit for paperId:', paperId, 'paperType:', paperType, 'identifier:', visitorIdentifier);
        
        // Use IP address or generate a session-based identifier
        const identifier = visitorIdentifier || 'anonymous';
        
        let visitor = await Visitor.findOne({ paperId, paperType });
        console.log('Found existing visitor:', visitor ? 'Yes' : 'No');
        
        if (!visitor) {
            // Create new visitor record
            visitor = new Visitor({
                paperId,
                paperType,
                visitCount: 1,
                uniqueVisitors: [{
                    identifier,
                    firstVisit: new Date(),
                    lastVisit: new Date(),
                    visitCount: 1
                }]
            });
            console.log('Creating new visitor record');
        } else {
            // Update existing visitor record
            visitor.visitCount += 1;
            visitor.lastVisited = new Date();
            
            // Check if this is a unique visitor
            const existingVisitor = visitor.uniqueVisitors.find(v => v.identifier === identifier);
            
            if (existingVisitor) {
                // Update existing unique visitor
                existingVisitor.lastVisit = new Date();
                existingVisitor.visitCount += 1;
                console.log('Updating existing unique visitor');
            } else {
                // Add new unique visitor
                visitor.uniqueVisitors.push({
                    identifier,
                    firstVisit: new Date(),
                    lastVisit: new Date(),
                    visitCount: 1
                });
                console.log('Adding new unique visitor');
            }
        }
        
        const savedVisitor = await visitor.save();
        console.log('Visitor saved successfully:', savedVisitor._id);
        return savedVisitor;
    } catch (error) {
        console.error('Detailed error recording visit:', error.message);
        console.error('Error stack:', error.stack);
        throw new Error(`Failed to record visit: ${error.message}`);
    }
};

// Get detailed visitor stats
export const getVisitorStats = async (paperId, paperType = 'local') => {
    try {
        await connectToDatabase();
        const visitor = await Visitor.findOne({ paperId, paperType });
        
        if (!visitor) {
            return {
                totalVisits: 0,
                uniqueVisitors: 0,
                lastVisited: null,
                createdAt: null
            };
        }
        
        return {
            totalVisits: visitor.visitCount,
            uniqueVisitors: visitor.uniqueVisitors.length,
            lastVisited: visitor.lastVisited,
            createdAt: visitor.createdAt
        };
    } catch (error) {
        console.error('Error getting visitor stats:', error.message);
        return {
            totalVisits: 0,
            uniqueVisitors: 0,
            lastVisited: null,
            createdAt: null
        };
    }
};

// Get most visited papers
export const getMostVisited = async (limit = 10, paperType = null) => {
    try {
        await connectToDatabase();
        const query = paperType ? { paperType } : {};
        const visitors = await Visitor.find(query)
            .sort({ visitCount: -1 })
            .limit(limit)
            .select('paperId paperType visitCount uniqueVisitors lastVisited');
        
        return visitors.map(v => ({
            paperId: v.paperId,
            paperType: v.paperType,
            totalVisits: v.visitCount,
            uniqueVisitors: v.uniqueVisitors.length,
            lastVisited: v.lastVisited
        }));
    } catch (error) {
        console.error('Error getting most visited papers:', error.message);
        return [];
    }
};

// Reset visitor count (admin function)
export const resetVisitorCount = async (paperId, paperType = 'local') => {
    try {
        await connectToDatabase();
        await Visitor.findOneAndDelete({ paperId, paperType });
        return true;
    } catch (error) {
        console.error('Error resetting visitor count:', error.message);
        return false;
    }
};
