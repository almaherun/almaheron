'use server';

import { cookies } from 'next/headers';
import { createSessionToken } from './auth-tokens';

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 أيام
    path: '/'
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('session-token');
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('session-token')?.value;
}

export async function createAndSetSessionToken(userId: string, role: string, email: string) {
  const token = await createSessionToken(userId, role, email);
  await setSessionCookie(token);
  return token;
}