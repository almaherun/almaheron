// 📞 Hook بسيط للمكالمات - نسخة مصلحة
'use client';

import { useState, useEffect, useRef } from 'react';
import { createSimpleCallSystem, SimpleCallRequest } from '@/lib/simpleCallSystem';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function useSimpleCall() {
  const [incomingCalls, setIncomingCalls] = useState<SimpleCallRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCall, setCurrentCall] = useState<SimpleCallRequest | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  
  const callSystemRef = useRef<any>(null);
  const { toast } = useToast();

  // تهيئة النظام
  useEffect(() => {
    const initializeSystem = () => {
      const user = auth.currentUser;
      if (!user) {
        console.log('⚠️ No authenticated user, waiting...');
        return;
      }

      const userType = window.location.pathname.includes('/teacher') ? 'teacher' : 'student';
      callSystemRef.current = createSimpleCallSystem(user.uid, userType);

      console.log('📞 Simple call system initialized:', {
        userId: user.uid,
        userType,
        email: user.email,
        displayName: user.displayName
      });
    };

    // جرب التهيئة فوراً
    initializeSystem();

    // إذا لم يكن المستخدم مسجل دخول، انتظر
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user && !callSystemRef.current) {
        console.log('🔄 Auth state changed, initializing...');
        initializeSystem();
      }
    });

    return () => unsubscribe();
  }, []);

  // الاستماع للمكالمات - بسيط ومباشر
  useEffect(() => {
    if (!callSystemRef.current) {
      console.log('⚠️ Call system not ready, skipping listener setup');
      return;
    }

    console.log('🎧 Setting up call listener...');

    try {
      const unsubscribe = callSystemRef.current.listenForIncomingCalls((calls: SimpleCallRequest[]) => {
        console.log('📞 Received calls update:', {
          count: calls.length,
          calls: calls.map(c => ({
            id: c.id,
            from: c.studentName,
            to: c.teacherName
          }))
        });

        setIncomingCalls(calls);
        
        if (calls.length > 0) {
          const latestCall = calls[0];
          toast({
            title: "📞 مكالمة واردة",
            description: `مكالمة من ${latestCall.studentName}`,
            duration: 10000,
          });
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Listener error:', error);
      return () => {};
    }
  }, [callSystemRef.current, toast]);

  // إرسال مكالمة
  const sendCall = async (teacherId: string, teacherName: string) => {
    if (!callSystemRef.current) return;

    setIsLoading(true);
    try {
      console.log('📞 Sending call:', { teacherId, teacherName });
      
      const callId = await callSystemRef.current.sendCallRequest(teacherId, teacherName);
      
      toast({
        title: "📞 تم إرسال طلب المكالمة",
        description: `جاري انتظار رد ${teacherName}...`,
        className: "bg-blue-600 text-white"
      });

      return callId;
    } catch (error: any) {
      console.error('❌ Send call error:', error);
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إرسال طلب المكالمة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // قبول مكالمة
  const acceptCall = async (call: SimpleCallRequest) => {
    if (!callSystemRef.current) return;

    try {
      const { channelName } = await callSystemRef.current.acceptCall(call.id);
      
      setCurrentCall({ ...call, channelName });
      setIsInCall(true);
      setIncomingCalls([]);

      toast({
        title: "✅ تم قبول المكالمة",
        description: `مكالمة مع ${call.studentName}`,
        className: "bg-green-600 text-white"
      });

    } catch (error: any) {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في قبول المكالمة",
        variant: "destructive"
      });
    }
  };

  // رفض مكالمة
  const rejectCall = async (callId: string) => {
    if (!callSystemRef.current) return;

    try {
      await callSystemRef.current.rejectCall(callId);
      
      toast({
        title: "❌ تم رفض المكالمة",
        duration: 2000,
      });

    } catch (error: any) {
      console.error('Error rejecting call:', error);
    }
  };

  // إنهاء مكالمة
  const endCall = async () => {
    if (!callSystemRef.current || !currentCall) return;

    try {
      await callSystemRef.current.endCall(currentCall.id);
      
      setCurrentCall(null);
      setIsInCall(false);

      toast({
        title: "📞 تم إنهاء المكالمة",
        duration: 2000,
      });

    } catch (error: any) {
      console.error('Error ending call:', error);
    }
  };

  return {
    incomingCalls,
    isLoading,
    currentCall,
    isInCall,
    sendCall,
    acceptCall,
    rejectCall,
    endCall,
    callSystem: callSystemRef.current
  };
}
