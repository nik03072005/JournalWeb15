import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

let isConnected = false

export async function connectToDatabase() {
  if (isConnected) return

  try {
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log('✅ Connected to MongoDB')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err)
    throw new Error('Failed to connect to MongoDB')
  }
}
