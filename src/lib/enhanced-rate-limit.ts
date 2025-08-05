import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
  skipSuccessfulRequests?: boolean;
}

// Memory store محسن مع cleanup تلقائي
class EnhancedRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // تنظيف البيانات القديمة كل 5 دقائق
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && (!entry.blockUntil || entry.blockUntil < now)) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const store = new EnhancedRateLimitStore();

// تكوينات مختلفة لـ endpoints مختلفة
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth': {
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    maxRequests: 5, // 5 محاولات تسجيل دخول
    blockDurationMs: 30 * 60 * 1000, // حظر لمدة 30 دقيقة
  },
  '/api/upload': {
    windowMs: 60 * 1000, // دقيقة واحدة
    maxRequests: 10, // 10 رفع ملفات
    blockDurationMs: 5 * 60 * 1000, // حظر لمدة 5 دقائق
  },
  '/api/forgot-password': {
    windowMs: 60 * 60 * 1000, // ساعة واحدة
    maxRequests: 3, // 3 طلبات إعادة تعيين كلمة مرور
    blockDurationMs: 60 * 60 * 1000, // حظر لمدة ساعة
  },
  default: {
    windowMs: 60 * 1000, // دقيقة واحدة
    maxRequests: 60, // 60 طلب
    blockDurationMs: 5 * 60 * 1000, // حظر لمدة 5 دقائق
  }
};

// استخراج IP address بشكل آمن
function getClientIP(request: NextRequest): string {
  // فحص headers مختلفة للـ IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) {
    // أخذ أول IP من القائمة
    return forwarded.split(',')[0].trim();
  }
  
  // fallback إلى IP من NextRequest (في Vercel Edge Runtime قد لا يكون متاحاً)
  return 'unknown';
}

// إنشاء مفتاح فريد للـ rate limiting
function createRateLimitKey(request: NextRequest, endpoint: string): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // إضافة hash للـ user agent لتجنب bypass بسهولة
  const uaHash = Buffer.from(userAgent).toString('base64').slice(0, 8);
  
  return `${endpoint}:${ip}:${uaHash}`;
}

// فحص إذا كان الـ IP في whitelist
function isWhitelisted(ip: string): boolean {
  const whitelist = [
    '127.0.0.1',
    '::1',
    'localhost'
  ];
  
  // يمكن إضافة IPs إضافية من environment variables
  const envWhitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
  
  return whitelist.concat(envWhitelist).includes(ip);
}

// الدالة الرئيسية للـ rate limiting
export function enhancedRateLimit(
  request: NextRequest,
  endpoint?: string
): { allowed: boolean; remaining: number; resetTime: number; blocked?: boolean } {
  const pathname = endpoint || new URL(request.url).pathname;
  const config = RATE_LIMIT_CONFIGS[pathname] || RATE_LIMIT_CONFIGS.default;
  
  if (!config) {
    throw new Error('Rate limit configuration not found');
  }
  const key = createRateLimitKey(request, pathname);
  const ip = getClientIP(request);
  const now = Date.now();

  // فحص whitelist
  if (isWhitelisted(ip)) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs
    };
  }

  const entry = store.get(key);

  // إذا لم يكن هناك entry، إنشاء واحد جديد
  if (!entry) {
    store.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // فحص إذا كان محظور
  if (entry.blocked && entry.blockUntil && entry.blockUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockUntil,
      blocked: true
    };
  }

  // إعادة تعيين العداد إذا انتهت النافذة الزمنية
  if (entry.resetTime <= now) {
    store.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // زيادة العداد
  entry.count++;

  // فحص إذا تم تجاوز الحد
  if (entry.count > config.maxRequests) {
    entry.blocked = true;
    entry.blockUntil = now + config.blockDurationMs;
    
    store.set(key, entry);
    
    // تسجيل محاولة الـ rate limit violation
    console.warn(`Rate limit exceeded for ${ip} on ${pathname}`, {
      ip,
      pathname,
      count: entry.count,
      timestamp: new Date().toISOString()
    });
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockUntil,
      blocked: true
    };
  }

  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

// دالة للحصول على إحصائيات الـ rate limiting (للـ admin)
export function getRateLimitStats(): {
  totalEntries: number;
  blockedIPs: number;
  topEndpoints: Array<{ endpoint: string; requests: number }>;
} {
  const stats = {
    totalEntries: store.size(),
    blockedIPs: 0,
    topEndpoints: new Map<string, number>()
  };

  // تحليل البيانات (يمكن تحسينه للأداء)
  for (const [key, entry] of (store as any).store.entries()) {
    if (entry.blocked) {
      stats.blockedIPs++;
    }
    
    const endpoint = key.split(':')[0];
    stats.topEndpoints.set(endpoint, (stats.topEndpoints.get(endpoint) || 0) + entry.count);
  }

  return {
    ...stats,
    topEndpoints: Array.from(stats.topEndpoints.entries())
      .map(([endpoint, requests]) => ({ endpoint, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)
  };
}

// دالة لإزالة IP من الحظر (للـ admin)
export function unblockIP(ip: string): boolean {
  let found = false;
  
  for (const [key, entry] of (store as any).store.entries()) {
    if (key.includes(ip) && entry.blocked) {
      entry.blocked = false;
      entry.blockUntil = undefined;
      store.set(key, entry);
      found = true;
    }
  }
  
  return found;
}
