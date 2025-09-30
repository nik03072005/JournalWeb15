import { addFavourite, getFavourites, removeFavourite } from "@/controllers/favouriteController";
import { connectToDatabase } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/authUtils";
import { NextResponse } from "next/server";


export async function POST(request){
    try {
        await connectToDatabase();
        
        // Get user ID from token
        const { userId, error } = await getUserIdFromRequest(request);
        if (error) return error;

        const body = await request.json();
        const requestData = { ...body, userId };
        
        return await addFavourite(requestData);
                
    } catch (error) {
        console.error('Error adding favourite:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
            status: 500
        });
    }
}

export async function GET(request) {
  try {
    await connectToDatabase();

    // Get user ID from token
    const { userId, error } = await getUserIdFromRequest(request);
    if (error) return error;

    // You can safely use userId directly
    return await getFavourites({ query: { userId } });

  } catch (error) {
    console.error('Error fetching favourites:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request){
    try {
        await connectToDatabase();
        
        // Get user ID from token
        const { userId, error } = await getUserIdFromRequest(request);
        if (error) return error;

        const body = await request.json();
        const { itemId } = body;

        return await removeFavourite({ userId, itemId });
    } catch (error) {
        console.error('Error removing favourite:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
            status: 500
        });
    }
}