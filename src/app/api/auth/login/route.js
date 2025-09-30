import { loginUser } from '@/controllers/authController'

export async function POST(req) {
  const body = await req.json()
  return loginUser(body)
}
