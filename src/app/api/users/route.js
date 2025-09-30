import { getAllUsers, registerUser, updateUser, deleteUser } from '@/controllers/userController';
import { NextResponse } from 'next/server';
import { withCORS, preflight } from '@/lib/cors';

export function OPTIONS(req) {
    const origin = req.headers.get('origin');
    console.log(origin,"ds")
    return preflight(origin);
}

export async function GET(req) {
    const origin = req.headers.get('origin');
    try {
        const res = await getAllUsers();
        return withCORS(res, origin);
    } catch (err) {
        const res = new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
        return withCORS(res, origin);
    }
}

export async function POST(req) {
    const origin = req.headers.get('origin');
    try {
        const body = await req.json();
        const res = await registerUser(body);
        return withCORS(res, origin);
    } catch (err) {
        const res = new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
        return withCORS(res, origin);
    }
}

export async function PUT(req) {
    const origin = req.headers.get('origin');
    try {
        const { userId, ...updates } = await req.json();
        if (!userId) {
            const res = NextResponse.json({ error: 'User ID is required' }, { status: 400 });
            return withCORS(res, origin);
        }
        const res = await updateUser(userId, updates);
        return withCORS(res, origin);
    } catch (err) {
        const res = new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
        return withCORS(res, origin);
    }
}

export async function DELETE(req) {
    const origin = req.headers.get('origin');
    try {
        const { userId } = await req.json();
        if (!userId) {
            const res = NextResponse.json({ error: 'User ID is required' }, { status: 400 });
            return withCORS(res, origin);
        }
        const res = await deleteUser(userId);
        return withCORS(res, origin);
    } catch (err) {
        const res = new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
        return withCORS(res, origin);
    }
}