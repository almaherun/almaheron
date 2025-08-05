import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { enhancedRateLimit } from './lib/enhanced-rate-limit';

// المسارات المحمية (محفوظة للاستخدام المستقبلي)
// const protectedPaths = {
//   admin: ['/admin'],
//   teacher: ['/teacher'],
//   student: ['/student'],
//   api: ['/api/admin', '/api/teacher', '/api/student']
// };

// المسارات العامة التي لا تحتاج حماية
const publicPaths = [
  '/',
  '/auth',
  '/api/auth',
  '/api/upload',
  '/_next',
  '/favicon.ico',
  '/images',
  '/subscription',
  '/test',
  '/debug',
  '/diagnose',
  '/static',
  '/landing'
];

// تم استبدال Rate limiting store بنظام محسن في enhanced-rate-limit.ts

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

function getRoleFromPath(pathname: string): string | null {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) return 'admin';
  if (pathname.startsWith('/teacher') || pathname.startsWith('/api/teacher')) return 'teacher';
  if (pathname.startsWith('/student') || pathname.startsWith('/api/student')) return 'student';
  return null;
}

// تم نقل Rate limiting إلى enhanced-rate-limit.ts

function addSecurityHeaders(response: NextResponse): NextResponse {
  // إضافة headers أمنية
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CSP محسن للحماية من XSS
  const nonce = crypto.randomUUID();
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'nonce-" + nonce + "' https://apis.google.com https://www.google.com https://www.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com; " +
    "connect-src 'self' https://api.brevo.com https://res.cloudinary.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com; " +
    "frame-src 'self' https://www.google.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // التحقق من وجود JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return new NextResponse('Server configuration error', { status: 500 });
  }
  
  // تطبيق Enhanced Rate Limiting
  const rateLimitResult = enhancedRateLimit(request, pathname);
  
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    
    return new NextResponse(
      JSON.stringify({ 
        error: rateLimitResult.blocked ? 'IP temporarily blocked due to excessive requests' : 'Too many requests',
        retryAfter: retryAfter,
        resetTime: rateLimitResult.resetTime
      }), 
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    );
  }

  // السماح بالمسارات العامة
  if (isPublicPath(pathname)) {
    const response = addSecurityHeaders(NextResponse.next());
    // إضافة rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    return response;
  }

  // التحقق من وجود session token
  const sessionToken = request.cookies.get('session-token')?.value;
  
  if (!sessionToken) {
    // إعادة توجيه للصفحة الرئيسية مع رسالة
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('message', 'login_required');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // التحقق من صحة الـ JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);
    
    const userRole = payload.role as string;
    const requiredRole = getRoleFromPath(pathname);
    
    // التحقق من الصلاحيات
    if (requiredRole && userRole !== requiredRole) {
      // إعادة توجيه للصفحة المناسبة حسب الدور
      const redirectUrl = new URL(`/${userRole}/dashboard`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // إضافة معلومات المستخدم والـ rate limit للـ headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.uid as string);
    response.headers.set('x-user-role', userRole);
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return addSecurityHeaders(response);
    
  } catch (error) {
    // تسجيل آمن للأخطاء
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // حذف الـ token المعطوب وإعادة توجيه
    const response = NextResponse.redirect(new URL('/auth', request.url));
    response.cookies.delete('session-token');
    
    return addSecurityHeaders(response);
  }
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


