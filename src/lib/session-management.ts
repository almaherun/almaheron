import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

interface SessionData {
  uid: string;
  role: string;
  email: string;
  sessionId: string;
  deviceInfo: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  [key: string]: any; // للتوافق مع JWTPayload
}

interface ActiveSession {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
}

// Store للـ active sessions (في production يفضل استخدام Redis)
const activeSessionsStore = new Map<string, Map<string, ActiveSession>>();

// تنظيف الجلسات المنتهية الصلاحية كل 30 دقيقة
setInterval(() => {
  cleanupExpiredSessions();
}, 30 * 60 * 1000);

/**
 * إنشاء session token محسن
 */
export async function createEnhancedSessionToken(
  userId: string, 
  role: string, 
  email: string,
  deviceInfo: string,
  ipAddress: string
): Promise<{ token: string; sessionId: string }> {
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const sessionId = crypto.randomUUID();
  const now = Date.now();
  
  const sessionData: SessionData = {
    uid: userId,
    role,
    email,
    sessionId,
    deviceInfo,
    createdAt: now,
    lastActivity: now,
    ipAddress
  };

  // إنشاء JWT token
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .setJti(sessionId) // JWT ID
    .sign(secret);

  // حفظ الجلسة في الـ store
  if (!activeSessionsStore.has(userId)) {
    activeSessionsStore.set(userId, new Map());
  }
  
  const userSessions = activeSessionsStore.get(userId)!;
  userSessions.set(sessionId, {
    sessionId,
    deviceInfo,
    ipAddress,
    createdAt: now,
    lastActivity: now,
    isActive: true
  });

  // تحديد عدد الجلسات النشطة (مثلاً 5 جلسات كحد أقصى)
  const maxSessions = 5;
  if (userSessions.size > maxSessions) {
    // حذف أقدم جلسة
    const oldestSession = Array.from(userSessions.entries())
      .sort(([,a], [,b]) => a.lastActivity - b.lastActivity)[0];
    
    if (oldestSession) {
      userSessions.delete(oldestSession[0]);
    }
  }

  return { token, sessionId };
}

/**
 * التحقق من session token محسن
 */
export async function verifyEnhancedSessionToken(
  token: string,
  ipAddress?: string
): Promise<SessionData | null> {
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const sessionData = payload as unknown as SessionData;
    
    // التحقق من وجود الجلسة في الـ store
    const userSessions = activeSessionsStore.get(sessionData.uid);
    if (!userSessions) {
      return null;
    }
    
    const session = userSessions.get(sessionData.sessionId);
    if (!session || !session.isActive) {
      return null;
    }
    
    // فحص IP address إذا تم توفيره (اختياري للأمان الإضافي)
    if (ipAddress && session.ipAddress !== ipAddress) {
      // يمكن إما رفض الطلب أو تسجيل تحذير
      console.warn(`IP address mismatch for session ${sessionData.sessionId}: expected ${session.ipAddress}, got ${ipAddress}`);
    }
    
    // تحديث آخر نشاط
    session.lastActivity = Date.now();
    
    return sessionData;
    
  } catch (error) {
    return null;
  }
}

/**
 * إلغاء جلسة محددة
 */
export function invalidateSession(userId: string, sessionId: string): boolean {
  const userSessions = activeSessionsStore.get(userId);
  if (!userSessions) {
    return false;
  }
  
  const session = userSessions.get(sessionId);
  if (!session) {
    return false;
  }
  
  session.isActive = false;
  userSessions.delete(sessionId);
  
  return true;
}

/**
 * إلغاء جميع جلسات المستخدم
 */
export function invalidateAllUserSessions(userId: string): number {
  const userSessions = activeSessionsStore.get(userId);
  if (!userSessions) {
    return 0;
  }
  
  const count = userSessions.size;
  
  // تعطيل جميع الجلسات
  for (const session of userSessions.values()) {
    session.isActive = false;
  }
  
  userSessions.clear();
  activeSessionsStore.delete(userId);
  
  return count;
}

/**
 * إلغاء جلسات أخرى (الاحتفاظ بالجلسة الحالية فقط)
 */
export function invalidateOtherSessions(userId: string, currentSessionId: string): number {
  const userSessions = activeSessionsStore.get(userId);
  if (!userSessions) {
    return 0;
  }
  
  let count = 0;
  
  for (const [sessionId, session] of userSessions.entries()) {
    if (sessionId !== currentSessionId) {
      session.isActive = false;
      userSessions.delete(sessionId);
      count++;
    }
  }
  
  return count;
}

/**
 * الحصول على جلسات المستخدم النشطة
 */
export function getUserActiveSessions(userId: string): ActiveSession[] {
  const userSessions = activeSessionsStore.get(userId);
  if (!userSessions) {
    return [];
  }
  
  return Array.from(userSessions.values())
    .filter(session => session.isActive)
    .sort((a, b) => b.lastActivity - a.lastActivity);
}

/**
 * فحص إذا كانت الجلسة نشطة
 */
export function isSessionActive(userId: string, sessionId: string): boolean {
  const userSessions = activeSessionsStore.get(userId);
  if (!userSessions) {
    return false;
  }
  
  const session = userSessions.get(sessionId);
  return session ? session.isActive : false;
}

/**
 * تنظيف الجلسات المنتهية الصلاحية
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const maxInactiveTime = 7 * 24 * 60 * 60 * 1000; // 7 أيام
  
  for (const [userId, userSessions] of activeSessionsStore.entries()) {
    for (const [sessionId, session] of userSessions.entries()) {
      if (now - session.lastActivity > maxInactiveTime) {
        session.isActive = false;
        userSessions.delete(sessionId);
      }
    }
    
    // حذف المستخدم إذا لم تعد له جلسات نشطة
    if (userSessions.size === 0) {
      activeSessionsStore.delete(userId);
    }
  }
}

/**
 * الحصول على إحصائيات الجلسات
 */
export function getSessionStats(): {
  totalUsers: number;
  totalActiveSessions: number;
  averageSessionsPerUser: number;
} {
  let totalActiveSessions = 0;
  
  for (const userSessions of activeSessionsStore.values()) {
    totalActiveSessions += Array.from(userSessions.values())
      .filter(session => session.isActive).length;
  }
  
  const totalUsers = activeSessionsStore.size;
  const averageSessionsPerUser = totalUsers > 0 ? totalActiveSessions / totalUsers : 0;
  
  return {
    totalUsers,
    totalActiveSessions,
    averageSessionsPerUser: Math.round(averageSessionsPerUser * 100) / 100
  };
}

/**
 * إنشاء device fingerprint
 */
export function createDeviceFingerprint(userAgent: string, acceptLanguage?: string): string {
  const data = `${userAgent}:${acceptLanguage || 'unknown'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * فحص الجلسات المشبوهة
 */
export function detectSuspiciousSessions(userId: string): {
  suspiciousCount: number;
  reasons: string[];
} {
  const userSessions = activeSessionsStore.get(userId);
  if (!userSessions) {
    return { suspiciousCount: 0, reasons: [] };
  }
  
  const sessions = Array.from(userSessions.values()).filter(s => s.isActive);
  const reasons: string[] = [];
  let suspiciousCount = 0;
  
  // فحص عدد الجلسات
  if (sessions.length > 3) {
    reasons.push(`Too many active sessions: ${sessions.length}`);
    suspiciousCount++;
  }
  
  // فحص IPs مختلفة
  const uniqueIPs = new Set(sessions.map(s => s.ipAddress));
  if (uniqueIPs.size > 2) {
    reasons.push(`Multiple IP addresses: ${uniqueIPs.size}`);
    suspiciousCount++;
  }
  
  // فحص أجهزة مختلفة
  const uniqueDevices = new Set(sessions.map(s => s.deviceInfo));
  if (uniqueDevices.size > 3) {
    reasons.push(`Multiple devices: ${uniqueDevices.size}`);
    suspiciousCount++;
  }
  
  return { suspiciousCount, reasons };
}

// تنظيف الـ store عند إغلاق التطبيق (فقط في Node.js environment)
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', () => {
    activeSessionsStore.clear();
  });

  process.on('SIGINT', () => {
    activeSessionsStore.clear();
  });
}