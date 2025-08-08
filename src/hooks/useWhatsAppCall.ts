// Hook لإدارة مكالمات WhatsApp Style
import { useState, useEffect, useRef, useCallback } from 'react';
import { WhatsAppCallSystem, WhatsAppCall } from '@/lib/whatsappCallSystem';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export function useWhatsAppCall() {
  // حالات المكالمة
  const [currentCall, setCurrentCall] = useState<WhatsAppCall | null>(null);
  const [incomingCalls, setIncomingCalls] = useState<WhatsAppCall[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');

  // مراجع
  const callSystemRef = useRef<WhatsAppCallSystem>(new WhatsAppCallSystem());
  const { toast } = useToast();

  // الاستماع للمكالمات الواردة
  useEffect(() => {
    console.log('🎧 Setting up WhatsApp call listener...');
    
    const unsubscribe = callSystemRef.current.listenForIncomingCalls((calls) => {
      console.log('📞 Received calls update:', calls);
      setIncomingCalls(calls);
      
      // إشعار بالمكالمات الجديدة
      if (calls.length > 0) {
        const latestCall = calls[0];
        
        // تشغيل صوت الرنين
        playRingtone();
        
        toast({
          title: `📞 مكالمة ${latestCall.type === 'video' ? 'فيديو' : 'صوتية'} واردة`,
          description: `من ${latestCall.callerName}`,
          duration: 15000,
        });
      } else {
        // إيقاف صوت الرنين
        stopRingtone();
      }
    });

    return () => {
      console.log('🔇 Cleaning up WhatsApp call listener');
      stopRingtone();
      unsubscribe();
    };
  }, [toast]);

  // تشغيل صوت الرنين
  const playRingtone = useCallback(() => {
    try {
      // يمكن إضافة ملف صوتي للرنين هنا
      console.log('🔔 Playing ringtone...');
    } catch (error) {
      console.error('❌ Error playing ringtone:', error);
    }
  }, []);

  // إيقاف صوت الرنين
  const stopRingtone = useCallback(() => {
    try {
      console.log('🔇 Stopping ringtone...');
    } catch (error) {
      console.error('❌ Error stopping ringtone:', error);
    }
  }, []);

  // بدء مكالمة جديدة
  const startCall = useCallback(async (
    receiverId: string,
    receiverName: string,
    type: 'video' | 'audio' = 'video',
    receiverAvatar?: string
  ): Promise<void> => {
    setIsLoading(true);
    setCallStatus('calling');
    
    try {
      console.log('📞 Starting WhatsApp call:', { receiverId, receiverName, type });
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const callId = await callSystemRef.current.startCall(
        receiverId,
        receiverName,
        type,
        receiverAvatar
      );

      console.log('✅ Call started:', callId);
      setCallStatus('ringing');

      toast({
        title: `📞 جاري الاتصال...`,
        description: `مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'} مع ${receiverName}`,
        duration: 3000,
      });

      // مراقبة حالة المكالمة
      monitorCallStatus(callId);

    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      setCallStatus('idle');
      
      toast({
        title: "❌ فشل بدء المكالمة",
        description: error?.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // مراقبة حالة المكالمة
  const monitorCallStatus = useCallback((callId: string) => {
    // يمكن إضافة مراقبة حالة المكالمة في الوقت الفعلي هنا
    console.log('👀 Monitoring call status for:', callId);
  }, []);

  // قبول المكالمة
  const acceptCall = useCallback(async (call: WhatsAppCall): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('✅ Accepting WhatsApp call:', call.id);

      // إيقاف الرنين
      stopRingtone();

      // قبول المكالمة في Firebase
      await callSystemRef.current.acceptCall(call.id);

      // تعيين المكالمة الحالية
      setCurrentCall(call);
      setCallStatus('connected');

      // بدء مكالمة Jitsi
      await callSystemRef.current.startJitsiCall(call);
      setIsInCall(true);

      // إزالة من قائمة المكالمات الواردة
      setIncomingCalls(prev => prev.filter(c => c.id !== call.id));

      toast({
        title: "✅ تم قبول المكالمة",
        description: "جاري الاتصال...",
        duration: 3000,
      });

      // إعداد مستمعات الأحداث
      setupCallEventListeners();

    } catch (error: any) {
      console.error('❌ Error accepting call:', error);
      setCallStatus('idle');
      
      toast({
        title: "❌ فشل قبول المكالمة",
        description: error?.message || 'تعذر قبول المكالمة',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [stopRingtone, toast]);

  // رفض المكالمة
  const rejectCall = useCallback(async (callId: string): Promise<void> => {
    try {
      console.log('❌ Rejecting WhatsApp call:', callId);

      // إيقاف الرنين
      stopRingtone();

      // رفض المكالمة في Firebase
      await callSystemRef.current.rejectCall(callId);

      // إزالة من قائمة المكالمات الواردة
      setIncomingCalls(prev => prev.filter(c => c.id !== callId));

      toast({
        title: "❌ تم رفض المكالمة",
        description: "تم رفض المكالمة",
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
    }
  }, [stopRingtone, toast]);

  // إنهاء المكالمة
  const endCall = useCallback(async (): Promise<void> => {
    try {
      console.log('📞 Ending WhatsApp call');

      if (currentCall) {
        await callSystemRef.current.endCall(currentCall.id);
      }

      // إيقاف الرنين
      stopRingtone();
      
      // تنظيف الحالات
      setIsInCall(false);
      setCurrentCall(null);
      setCallStatus('idle');

      toast({
        title: "📞 انتهت المكالمة",
        description: "شكراً لاستخدام نظام المكالمات",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }, [currentCall, stopRingtone, toast]);

  // إعداد مستمعات أحداث المكالمة
  const setupCallEventListeners = useCallback(() => {
    callSystemRef.current.on('callJoined', () => {
      console.log('✅ Successfully joined call');
      setIsInCall(true);
      setCallStatus('connected');
    });

    callSystemRef.current.on('callLeft', () => {
      console.log('📞 Left call');
      setIsInCall(false);
      setCurrentCall(null);
      setCallStatus('idle');
    });

    callSystemRef.current.on('participantJoined', (event: any) => {
      console.log('👤 Participant joined:', event);
      toast({
        title: "👤 انضم للمكالمة",
        description: "بدأت المكالمة",
        duration: 2000,
      });
    });

    callSystemRef.current.on('participantLeft', (event: any) => {
      console.log('👋 Participant left:', event);
      toast({
        title: "👋 غادر المكالمة",
        description: "انتهت المكالمة",
        duration: 2000,
      });
    });
  }, [toast]);

  // تنظيف الموارد
  useEffect(() => {
    return () => {
      callSystemRef.current.cleanup();
      stopRingtone();
    };
  }, [stopRingtone]);

  return {
    // حالات المكالمة
    currentCall,
    incomingCalls,
    isInCall,
    isLoading,
    callStatus,
    
    // وظائف المكالمة
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    
    // النظام
    callSystem: callSystemRef.current
  };
}
