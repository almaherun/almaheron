import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// المسارات المحمية
const protectedPaths = {
  admin: ['/admin'],
  teacher: ['/teacher'],
  student: ['/student'],
  api: ['/api/admin', '/api/teacher', '/api/student']
};

// المسارات العامة التي لا تحتاج حماية
const publicPaths = [
  '/',
  '/auth',
  '/api/auth',
  '/api/upload',
  '/_next',
  '/favicon.ico',
  '/image'
];

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

function getRoleFromPath(pathname: string): string | null {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) return 'admin';
  if (pathname.startsWith('/teacher') || pathname.startsWith('/api/teacher')) return 'teacher';
  if (pathname.startsWith('/student') || pathname.startsWith('/api/student')) return 'student';
  return null;
}

function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = ip;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // تطبيق Rate Limiting على جميع الطلبات
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || 
             'anonymous';
  
  // Rate limiting أكثر صرامة للـ API
  const isApiRoute = pathname.startsWith('/api');
  const limit = isApiRoute ? 50 : 200; // 50 طلب/دقيقة للـ API، 200 للصفحات
  
  if (!rateLimit(ip, limit)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }

  // السماح بالمسارات العامة
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // التحقق من وجود session token
  const sessionToken = request.cookies.get('session-token')?.value;
  
  if (!sessionToken) {
    return redirectToAuth(request);
  }

  try {
    // التحقق من صحة الـ JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(sessionToken, secret);
    
    const userRole = payload.role as string;
    const requiredRole = getRoleFromPath(pathname);
    
    // التحقق من الصلاحيات
    if (requiredRole && userRole !== requiredRole) {
      // إعادة توجيه للصفحة المناسبة حسب الدور
      const redirectUrl = new URL(`/${userRole}/dashboard`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // إضافة معلومات المستخدم للـ headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.uid as string);
    response.headers.set('x-user-role', userRole);
    
    return addSecurityHeaders(response);
    
  } catch (error) {
    // Token غير صالح
    console.error('Invalid token:', error);
    return redirectToAuth(request);
  }
}

function redirectToAuth(request: NextRequest) {
  const authUrl = new URL('/auth', request.url);
  const response = NextResponse.redirect(authUrl);
  
  // حذف الـ token غير الصالح
  response.cookies.delete('session-token');
  
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse) {
  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSP Header محسن
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://api.brevo.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
