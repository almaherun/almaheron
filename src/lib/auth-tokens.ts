import { SignJWT, jwtVerify } from 'jose';

// التحقق من وجود JWT_SECRET وقوته
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createSessionToken(userId: string, role: string, email: string) {
  const token = await new SignJWT({ 
    uid: userId, 
    role, 
    email,
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);

  return token;
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// إزالة functions التي تستخدم cookies من هنا
