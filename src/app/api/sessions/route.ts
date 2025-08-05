import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth-tokens';
import { 
  getUserActiveSessions, 
  invalidateSession, 
  invalidateAllUserSessions,
  invalidateOtherSessions,
  detectSuspiciousSessions 
} from '@/lib/session-management';

export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.uid as string;
    
    // الحصول على الجلسات النشطة
    const activeSessions = getUserActiveSessions(userId);
    
    // فحص الجلسات المشبوهة
    const suspiciousActivity = detectSuspiciousSessions(userId);
    
    // إخفاء معلومات حساسة
    const safeSessions = activeSessions.map(session => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress.replace(/\.\d+$/, '.***'), // إخفاء آخر جزء من IP
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      isActive: session.isActive
    }));
    
    return NextResponse.json({
      sessions: safeSessions,
      totalSessions: activeSessions.length,
      suspiciousActivity
    });
    
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.uid as string;
    const currentSessionId = payload.sessionId as string;
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const targetSessionId = searchParams.get('sessionId');
    
    let deletedCount = 0;
    
    switch (action) {
      case 'current':
        // إلغاء الجلسة الحالية (تسجيل خروج)
        if (invalidateSession(userId, currentSessionId)) {
          deletedCount = 1;
        }
        break;
        
      case 'specific':
        // إلغاء جلسة محددة
        if (!targetSessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }
        
        if (invalidateSession(userId, targetSessionId)) {
          deletedCount = 1;
        }
        break;
        
      case 'others':
        // إلغاء جميع الجلسات الأخرى
        deletedCount = invalidateOtherSessions(userId, currentSessionId);
        break;
        
      case 'all':
        // إلغاء جميع الجلسات
        deletedCount = invalidateAllUserSessions(userId);
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({
      message: 'Sessions invalidated successfully',
      deletedCount
    });
    
  } catch (error) {
    console.error('Sessions DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}