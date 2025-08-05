import helmet from 'helmet';
import { NextResponse } from 'next/server';

/**
 * إعداد Helmet.js للأمان المحسن
 */
export function getSecurityHeaders() {
  return helmet({
    // Content Security Policy محسن
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // مطلوب لـ Next.js
          "https://apis.google.com",
          "https://www.google.com",
          "https://www.gstatic.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // مطلوب لـ Tailwind CSS
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://lh3.googleusercontent.com"
        ],
        connectSrc: [
          "'self'",
          "https://api.brevo.com",
          "https://res.cloudinary.com",
          "https://*.firebaseio.com",
          "https://*.googleapis.com",
          "wss://*.firebaseio.com"
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com"
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // تعطيل لتجنب مشاكل مع Firebase
    
    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    
    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: "cross-origin" },
    
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    
    // Frame Options
    frameguard: { action: 'deny' },
    
    // Hide Powered By
    hidePoweredBy: true,
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // سنة واحدة
      includeSubDomains: true,
      preload: true
    },
    
    // IE No Open
    ieNoOpen: true,
    
    // No Sniff
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross Domain Policies
    permittedCrossDomainPolicies: false,
    
    // Referrer Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    
    // X-XSS-Protection
    xssFilter: true
  });
}

/**
 * إضافة security headers مخصصة إضافية
 */
export function addCustomSecurityHeaders(response: NextResponse): NextResponse {
  // إضافة headers إضافية للأمان
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // إضافة headers للحماية من clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // إضافة headers للحماية من MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // إضافة Permissions Policy
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // إضافة Feature Policy (deprecated لكن لا يزال مفيد للمتصفحات القديمة)
  response.headers.set('Feature-Policy', 
    "camera 'none'; microphone 'none'; geolocation 'none'"
  );
  
  return response;
}

/**
 * CSP Nonce generator
 */
export function generateCSPNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}

/**
 * إعداد CSP مع nonce
 */
export function getCSPWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://apis.google.com https://www.google.com https://www.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com",
    "connect-src 'self' https://api.brevo.com https://res.cloudinary.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
}

/**
 * فحص إذا كان الطلب آمن
 */
export function isSecureRequest(request: Request): boolean {
  const url = new URL(request.url);
  
  // فحص HTTPS في production
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    return false;
  }
  
  // فحص headers أمنية مطلوبة
  const requiredHeaders = ['user-agent'];
  for (const header of requiredHeaders) {
    if (!request.headers.get(header)) {
      return false;
    }
  }
  
  return true;
}

/**
 * إضافة CORS headers آمنة
 */
export function addSecureCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  // قائمة المصادر المسموحة
  const allowedOrigins = [
    'http://localhost:3000',
    'https://yourdomain.com', // استبدل بالدومين الحقيقي
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 ساعة
  
  return response;
}

/**
 * إعداد security headers شامل
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // إضافة جميع security headers
  response = addCustomSecurityHeaders(response);
  
  // إضافة CSP مع nonce
  const nonce = generateCSPNonce();
  response.headers.set('Content-Security-Policy', getCSPWithNonce(nonce));
  
  return response;
}