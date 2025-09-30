import Favourite from "@/models/Favourite";
import { NextResponse } from "next/server";



export const addFavourite = async (req, res) => {
    try {
        const { userId, itemType, itemId, itemTitle, itemUrl, action } = req.body || req;

        // Add debugging
        console.log('=== FAVOURITE CONTROLLER DEBUG ===');
        console.log('Received data:', { userId, itemType, itemId, itemTitle, itemUrl, action });
        console.log('itemType value:', itemType);
        console.log('itemType type:', typeof itemType);

        const newFavourite = new Favourite({
            userId,
            itemType,
            itemId,
            itemTitle,
            itemUrl,
            action
        });

        console.log('Created favourite object:', newFavourite);
        
        await newFavourite.save();
        console.log('Favourite saved successfully');
        
         return NextResponse.json({
            success: true,
            message: 'Favourite added successfully',
            favourite: newFavourite
        }, { status: 201 });
        
    } catch (error) {
        console.error('Error adding favourite:', error);
        console.error('Error details:', error.message);
        console.error('Validation errors:', error.errors);
        return NextResponse.json({ 
            success: false,
            message: 'Internal server error',
            error: error.message,
            details: error.errors 
        }, { status: 500 });
    }
};
export const getFavourites = async (req, res) => {
    try {
        const { userId } = req.query;
        console.log("Fetching favourites for user:", userId);

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const favourites = await Favourite.find({ userId }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: favourites
        });
    }
     catch (error) {
        console.error('Error fetching favourites:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};

export const removeFavourite = async (req, res) => {
    try {
        const { userId, itemId } = req;

        if (!userId || !itemId) {
            return NextResponse.json({ message: 'User ID and Item ID are required' }, { status: 400 });
        }

        const result = await Favourite.deleteOne({ userId, itemId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: 'Favourite not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            message: 'Favourite removed successfully' 
        });
    } catch (error) {
        console.error('Error removing favourite:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};
