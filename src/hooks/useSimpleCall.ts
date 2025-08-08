// Hook بسيط للمكالمات - بدون تعقيدات
import { useState, useEffect } from 'react';
import { simpleCallSystem, SimpleCallRequest } from '@/lib/simpleCallSystem';
import { useToast } from '@/hooks/use-toast';

export function useSimpleCall() {
  const [incomingCalls, setIncomingCalls] = useState<SimpleCallRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // الاستماع للمكالمات الواردة
  useEffect(() => {
    console.log('🎧 Setting up call listener...');
    const unsubscribe = simpleCallSystem.listenForIncomingCalls((calls) => {
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

    return () => {
      console.log('🔇 Cleaning up call listener');
      unsubscribe();
    };
  }, [toast]);

  // إجراء مكالمة
  const makeCall = async (toUserId: string, toUserName: string, callType: 'video' | 'audio' = 'video') => {
    setIsLoading(true);
    try {
      console.log('📞 Starting call to:', { toUserId, toUserName, callType });
      const callId = await simpleCallSystem.makeCall(toUserId, toUserName, callType);
      
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
      await simpleCallSystem.acceptCall(callId);
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
      await simpleCallSystem.rejectCall(callId);
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
      await simpleCallSystem.endCall(callId);
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
