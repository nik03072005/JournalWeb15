import { connectToDatabase } from "@/lib/db";
import userModel from "@/models/userModel";
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose';

export async function registerUser({firstName, lastName, email, mobileNumber, password,role}) {
    console.log('Received role:', role, 'Type:', typeof role, 'Length:', role?.length);
    const db = await connectToDatabase();
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        throw new Error('User already exists');
    }
    const newUser = {
        firstname: firstName,
        lastname: lastName,
        email,
        mobileNumber,
        password,
        role: role?.trim() // Trim any whitespace
    };
    console.log('Creating user with role:', newUser.role);
    try {
        const user = new userModel(newUser);
        await user.save();
        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Validation error:', error);
        console.error('Error details:', error.errors);
        throw error;
    }
}

export async function loginUser({ email, password }) {
    try {
    await connectToDatabase();
    
    const user = await userModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  // Token TTL in seconds (defaults to 1 day); keep JWT exp aligned with cookie Max-Age
  const ttlSeconds = Number(process.env.JWT_TTL_SECONDS || 86400);
    const token = await new SignJWT({ userId: user._id.toString(), role: user.role})
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(secret);
    const res = NextResponse.json(
      { user: { id: user._id.toString(), email: user.email, role: user.role,firstName:user.firstname,lastName:user.lastname }, token },
      { status: 200 }
    );
    const isProd = process.env.NODE_ENV === 'production';
    const cookie = [
      `token=${token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Lax', // send on normal navigations (e.g., clicking Dashboard)
      `Max-Age=${ttlSeconds}`,
      isProd ? 'Secure' : null,
    ]
      .filter(Boolean)
      .join('; ');
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
