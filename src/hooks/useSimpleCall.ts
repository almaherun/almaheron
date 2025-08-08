// Hook بسيط للمكالمات - بدون تعقيدات
import { useState, useEffect } from 'react';
import { createSimpleCallSystem, SimpleCallRequest } from '@/lib/simpleCallSystem';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export function useSimpleCall() {
  const [incomingCalls, setIncomingCalls] = useState<SimpleCallRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [callSystem] = useState(() => createSimpleCallSystem());
  const { toast } = useToast();

  // الاستماع للمكالمات الواردة
  useEffect(() => {
    console.log('🎧 Setting up call listener...');

    // انتظار Firebase Auth
    const waitForAuth = () => {
      if (auth.currentUser) {
        console.log('✅ Auth ready, setting up listener');
        return callSystem.listenForIncomingCalls((calls) => {
          console.log('📞 Received calls update:', calls);
          setIncomingCalls(calls);

          // إشعار بالمكالمات الجديدة
          if (calls.length > 0) {
            const latestCall = calls[0];
            toast({
              title: "📞 مكالمة واردة",
              description: `مكالمة من ${latestCall.fromName}`,
              duration: 10000,
            });
          }
        });
      } else {
        console.log('⏳ Waiting for Firebase Auth...');
        return () => {}; // عودة دالة فارغة
      }
    };

    const unsubscribe = waitForAuth();

    return () => {
      console.log('🔇 Cleaning up call listener');
      if (unsubscribe) unsubscribe();
    };
  }, [toast, callSystem]);

  // إجراء مكالمة
  const makeCall = async (toUserId: string, toUserName: string, callType: 'video' | 'audio' = 'video') => {
    setIsLoading(true);
    try {
      console.log('📞 Starting call to:', { toUserId, toUserName, callType });
      const callId = await callSystem.makeCall(toUserId, toUserName, callType);
      
      toast({
        title: "📞 جاري الاتصال",
        description: `جاري الاتصال بـ ${toUserName}...`,
        duration: 5000,
      });
      
      return callId;
    } catch (error) {
      console.error('❌ Call failed:', error);
      toast({
        title: "❌ فشل الاتصال",
        description: "حدث خطأ أثناء إجراء المكالمة",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // قبول مكالمة
  const acceptCall = async (callId: string) => {
    try {
      await callSystem.acceptCall(callId);
      toast({
        title: "✅ تم قبول المكالمة",
        description: "جاري بدء المكالمة...",
      });
    } catch (error) {
      console.error('❌ Accept call failed:', error);
      toast({
        title: "❌ فشل قبول المكالمة",
        description: "حدث خطأ أثناء قبول المكالمة",
        variant: "destructive",
      });
    }
  };

  // رفض مكالمة
  const rejectCall = async (callId: string) => {
    try {
      await callSystem.rejectCall(callId);
      toast({
        title: "❌ تم رفض المكالمة",
        description: "تم رفض المكالمة",
      });
    } catch (error) {
      console.error('❌ Reject call failed:', error);
    }
  };

  // إنهاء مكالمة
  const endCall = async (callId: string) => {
    try {
      await callSystem.endCall(callId);
      toast({
        title: "📞 انتهت المكالمة",
        description: "تم إنهاء المكالمة",
      });
    } catch (error) {
      console.error('❌ End call failed:', error);
    }
  };

  return {
    incomingCalls,
    isLoading,
    makeCall,
    acceptCall,
    rejectCall,
    endCall
  };
}
