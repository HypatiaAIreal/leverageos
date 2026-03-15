import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieName } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authEmail = process.env.AUTH_EMAIL;
  const authPassword = process.env.AUTH_PASSWORD;

  if (!authEmail || !authPassword) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  const { email, password } = await req.json();

  if (email !== authEmail || password !== authPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createSessionToken(email);
  const response = NextResponse.json({ success: true });

  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
