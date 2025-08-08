// Hook لإدارة مكالمات Jitsi Meet
import { useState, useEffect, useRef, useCallback } from 'react';
import { JitsiSystem, JitsiSession } from '@/lib/jitsiSystem';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export function useJitsiCall() {
  // حالات المكالمة
  const [currentSession, setCurrentSession] = useState<JitsiSession | null>(null);
  const [incomingSessions, setIncomingSessions] = useState<JitsiSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // مراجع
  const jitsiSystemRef = useRef<JitsiSystem>(new JitsiSystem());
  const { toast } = useToast();

  // الاستماع للجلسات الواردة
  useEffect(() => {
    console.log('🎧 Setting up Jitsi session listener...');
    
    const unsubscribe = jitsiSystemRef.current.listenForIncomingSessions((sessions) => {
      console.log('📞 Received sessions update:', sessions);
      setIncomingSessions(sessions);
      
      // إشعار بالجلسات الجديدة
      if (sessions.length > 0) {
        const latestSession = sessions[0];
        toast({
          title: "📞 مكالمة واردة",
          description: `مكالمة من ${latestSession.hostName}`,
          duration: 10000,
        });
      }
    });

    return () => {
      console.log('🔇 Cleaning up Jitsi session listener');
      unsubscribe();
    };
  }, [toast]);

  // إنشاء جلسة جديدة
  const createSession = useCallback(async (
    title: string,
    type: 'video' | 'audio' | 'quran' = 'video',
    targetUserId?: string,
    targetUserName?: string,
    settings?: Partial<JitsiSession['settings']>
  ): Promise<string> => {
    setIsLoading(true);
    try {
      console.log('🎯 Creating Jitsi session:', { title, type, targetUserId });
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const sessionId = await jitsiSystemRef.current.createSession(
        title,
        type,
        targetUserId,
        targetUserName,
        settings
      );

      console.log('✅ Jitsi session created:', sessionId);
      setIsHost(true);

      toast({
        title: "✅ تم إنشاء الجلسة",
        description: `جلسة "${title}" جاهزة`,
        duration: 3000,
      });

      return sessionId;
    } catch (error: any) {
      console.error('❌ Error creating Jitsi session:', error);
      
      toast({
        title: "❌ فشل إنشاء الجلسة",
        description: error?.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // بدء المكالمة
  const startCall = useCallback(async (sessionId?: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting Jitsi call:', sessionId);

      await jitsiSystemRef.current.startCall(sessionId);
      setIsConnected(true);

      toast({
        title: "✅ بدأت المكالمة",
        description: "مرحباً بك في المكالمة",
        duration: 3000,
      });

      // إعداد مستمعات الأحداث
      jitsiSystemRef.current.on('joined', () => {
        console.log('✅ Successfully joined Jitsi meeting');
        setIsConnected(true);
      });

      jitsiSystemRef.current.on('left', () => {
        console.log('📞 Left Jitsi meeting');
        setIsConnected(false);
        setCurrentSession(null);
      });

    } catch (error: any) {
      console.error('❌ Error starting Jitsi call:', error);
      
      toast({
        title: "❌ فشل بدء المكالمة",
        description: error?.message || 'تعذر بدء المكالمة',
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // إنشاء وبدء مكالمة في خطوة واحدة
  const createAndStartCall = useCallback(async (
    title: string,
    type: 'video' | 'audio' | 'quran' = 'video',
    targetUserId?: string,
    targetUserName?: string
  ): Promise<void> => {
    try {
      console.log('🎯 Creating and starting call:', { title, type, targetUserId });

      const sessionId = await createSession(title, type, targetUserId, targetUserName);
      await startCall(sessionId);

      console.log('✅ Call created and started successfully');
    } catch (error) {
      console.error('❌ Error in createAndStartCall:', error);
      throw error;
    }
  }, [createSession, startCall]);

  // قبول جلسة واردة
  const acceptSession = useCallback(async (session: JitsiSession): Promise<void> => {
    try {
      console.log('✅ Accepting session:', session.id);

      // تعيين الجلسة الحالية
      setCurrentSession(session);
      
      // بدء المكالمة مباشرة بالغرفة
      jitsiSystemRef.current['currentSession'] = session;
      await startCall(session.id);

      toast({
        title: "✅ تم قبول المكالمة",
        description: "جاري الانضمام للمكالمة...",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('❌ Error accepting session:', error);
      
      toast({
        title: "❌ فشل قبول المكالمة",
        description: error?.message || 'تعذر قبول المكالمة',
        variant: "destructive",
      });
    }
  }, [startCall, toast]);

  // رفض جلسة واردة
  const rejectSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      console.log('❌ Rejecting session:', sessionId);

      // إزالة الجلسة من القائمة
      setIncomingSessions(prev => prev.filter(s => s.id !== sessionId));

      toast({
        title: "❌ تم رفض المكالمة",
        description: "تم رفض المكالمة",
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Error rejecting session:', error);
    }
  }, [toast]);

  // إنهاء المكالمة
  const endCall = useCallback(async (): Promise<void> => {
    try {
      console.log('📞 Ending Jitsi call');

      await jitsiSystemRef.current.endCall();
      
      // تنظيف الحالات
      setIsConnected(false);
      setCurrentSession(null);
      setIsHost(false);

      toast({
        title: "📞 انتهت المكالمة",
        description: "شكراً لاستخدام نظام المكالمات",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }, [toast]);

  // تنظيف الموارد
  useEffect(() => {
    return () => {
      jitsiSystemRef.current.cleanup();
    };
  }, []);

  return {
    // حالات المكالمة
    currentSession,
    incomingSessions,
    isConnected,
    isHost,
    isLoading,
    
    // وظائف المكالمة
    createSession,
    startCall,
    createAndStartCall,
    acceptSession,
    rejectSession,
    endCall,
    
    // النظام
    jitsiSystem: jitsiSystemRef.current
  };
}
