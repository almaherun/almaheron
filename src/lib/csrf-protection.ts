import { NextRequest } from 'next/server';
import crypto from 'crypto';

// CSRF Token store (في production يفضل استخدام Redis أو database)
const csrfTokenStore = new Map<string, { token: string; expires: number; used: boolean }>();

// تنظيف الـ tokens المنتهية الصلاحية كل 10 دقائق
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokenStore.entries()) {
    if (value.expires < now) {
      csrfTokenStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * إنشاء CSRF token جديد
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (30 * 60 * 1000); // 30 دقيقة
  
  csrfTokenStore.set(sessionId, {
    token,
    expires,
    used: false
  });
  
  return token;
}

/**
 * التحقق من صحة CSRF token
 */
export function verifyCSRFToken(sessionId: string, providedToken: string, oneTime: boolean = false): boolean {
  const storedData = csrfTokenStore.get(sessionId);
  
  if (!storedData) {
    return false;
  }
  
  // فحص انتهاء الصلاحية
  if (storedData.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  // فحص إذا كان الـ token مستخدم من قبل (للـ one-time tokens)
  if (oneTime && storedData.used) {
    return false;
  }
  
  // فحص صحة الـ token
  const isValid = crypto.timingSafeEqual(
    Buffer.from(storedData.token, 'hex'),
    Buffer.from(providedToken, 'hex')
  );
  
  if (isValid && oneTime) {
    storedData.used = true;
  }
  
  return isValid;
}

/**
 * حذف CSRF token
 */
export function deleteCSRFToken(sessionId: string): void {
  csrfTokenStore.delete(sessionId);
}

/**
 * استخراج CSRF token من الطلب
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // فحص header أولاً
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }
  
  // فحص form data
  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    // سيتم التعامل مع هذا في الـ API route
    return null;
  }
  
  return null;
}

/**
 * إنشاء session ID من الطلب
 */
export function getSessionId(request: NextRequest): string {
  // استخدام JWT token كـ session ID
  const sessionToken = request.cookies.get('session-token')?.value;
  if (sessionToken) {
    // إنشاء hash من الـ token للاستخدام كـ session ID
    return crypto.createHash('sha256').update(sessionToken).digest('hex');
  }
  
  // fallback للـ IP + User Agent
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

/**
 * فحص إذا كان الطلب يحتاج CSRF protection
 */
export function requiresCSRFProtection(request: NextRequest): boolean {
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  
  // فقط الطلبات المعدلة تحتاج CSRF protection
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }
  
  // استثناء بعض المسارات
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout'
  ];
  
  return !exemptPaths.some(path => pathname.startsWith(path));
}

/**
 * إضافة CSRF token للاستجابة
 */
export function addCSRFTokenToResponse(response: Response, sessionId: string): Response {
  const token = generateCSRFToken(sessionId);
  
  // إضافة الـ token كـ header
  response.headers.set('X-CSRF-Token', token);
  
  return response;
}

/**
 * Middleware للـ CSRF protection
 */
export function csrfProtectionMiddleware(request: NextRequest): { valid: boolean; error?: string } {
  if (!requiresCSRFProtection(request)) {
    return { valid: true };
  }
  
  const sessionId = getSessionId(request);
  const providedToken = extractCSRFToken(request);
  
  if (!providedToken) {
    return { 
      valid: false, 
      error: 'CSRF token missing. Include X-CSRF-Token header or _csrf field in form data.' 
    };
  }
  
  const isValid = verifyCSRFToken(sessionId, providedToken);
  
  if (!isValid) {
    return { 
      valid: false, 
      error: 'Invalid or expired CSRF token.' 
    };
  }
  
  return { valid: true };
}

// تنظيف الـ store عند إغلاق التطبيق
process.on('SIGTERM', () => {
  csrfTokenStore.clear();
});

process.on('SIGINT', () => {
  csrfTokenStore.clear();
});