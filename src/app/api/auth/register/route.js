import { registerUser } from '@/controllers/authController'

export async function POST(req) {
  try {
    const body = await req.json()
    return await registerUser(body) // pass body to controller
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
