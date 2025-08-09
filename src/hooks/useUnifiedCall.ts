// 🚀 Hook موحد لجميع أنواع المكالمات باستخدام Agora
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createUnifiedAgoraCallSystem, UnifiedCallRequest } from '@/lib/agoraCallSystem';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export type CallStyle = 'whatsapp' | 'simple' | 'professional';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface UseUnifiedCallReturn {
  // حالة المكالمة
  callStatus: CallStatus;
  isInCall: boolean;
  isLoading: boolean;
  currentCall: UnifiedCallRequest | null;
  incomingCalls: UnifiedCallRequest[];
  
  // دوال المكالمات
  startWhatsAppCall: (receiverId: string, receiverName: string, type?: 'video' | 'audio', receiverAvatar?: string | null) => Promise<void>;
  startSimpleCall: (receiverId: string, receiverName: string, type?: 'video' | 'audio') => Promise<void>;
  startProfessionalCall: (receiverId: string, receiverName: string, type?: 'video' | 'audio') => Promise<void>;
  
  // إدارة المكالمات
  acceptCall: (call: UnifiedCallRequest) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  
  // نظام المكالمات
  callSystem: any;
}

export function useUnifiedCall(): UseUnifiedCallReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCall, setCurrentCall] = useState<UnifiedCallRequest | null>(null);
  const [incomingCalls, setIncomingCalls] = useState<UnifiedCallRequest[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  
  const callSystemRef = useRef<any>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // تهيئة نظام المكالمات
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // تحديد نوع المستخدم من URL أو context
    const userType = window.location.pathname.includes('/teacher') ? 'teacher' : 'student';
    
    console.log('🚀 Initializing Unified Call System:', {
      userId: user.uid,
      userType,
      displayName: user.displayName
    });

    callSystemRef.current = createUnifiedAgoraCallSystem(user.uid, userType);
  }, []);

  // الاستماع للمكالمات الواردة
  useEffect(() => {
    if (!callSystemRef.current) return;

    console.log('🎧 Setting up unified call listener...');
    
    const unsubscribe = callSystemRef.current.listenForIncomingCalls((calls: UnifiedCallRequest[]) => {
      console.log('📞 Received calls update:', calls);
      setIncomingCalls(calls);
      
      // إشعار بالمكالمات الجديدة
      if (calls.length > 0) {
        const latestCall = calls[0];
        
        // تشغيل صوت الرنين
        playRingtone();
        
        // إشعار مخصص حسب نوع المكالمة
        const callTypeText = latestCall.callType === 'video' ? 'فيديو' : 'صوتية';
        const callStyleText = latestCall.callStyle === 'whatsapp' ? 'مكالمة سريعة' : 
                             latestCall.callStyle === 'professional' ? 'مكالمة احترافية' : 'مكالمة';
        
        toast({
          title: `📞 ${callStyleText} ${callTypeText} واردة`,
          description: `من ${latestCall.senderName}`,
          duration: 15000,
        });
      } else {
        stopRingtone();
      }
    });

    return () => {
      console.log('🔇 Cleaning up unified call listener');
      stopRingtone();
      unsubscribe();
    };
  }, [toast]);

  // تشغيل صوت الرنين
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.5;
      }
      ringtoneRef.current.play().catch(console.error);
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  }, []);

  // إيقاف صوت الرنين
  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  // بدء مكالمة WhatsApp
  const startWhatsAppCall = useCallback(async (
    receiverId: string,
    receiverName: string,
    type: 'video' | 'audio' = 'video',
    receiverAvatar: string | null = null
  ) => {
    if (!callSystemRef.current) {
      throw new Error('نظام المكالمات غير مُهيأ');
    }

    setIsLoading(true);
    setCallStatus('calling');
    
    try {
      console.log('📞 Starting WhatsApp call:', { receiverId, receiverName, type });
      
      const callId = await callSystemRef.current.startWhatsAppCall(
        receiverId,
        receiverName,
        type,
        receiverAvatar
      );

      console.log('✅ WhatsApp call started:', callId);
      setCallStatus('ringing');

      toast({
        title: `📞 جاري الاتصال...`,
        description: `مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'} سريعة مع ${receiverName}`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('❌ Error starting WhatsApp call:', error);
      setCallStatus('idle');
      toast({
        title: '❌ فشل في بدء المكالمة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // بدء مكالمة بسيطة
  const startSimpleCall = useCallback(async (
    receiverId: string,
    receiverName: string,
    type: 'video' | 'audio' = 'video'
  ) => {
    if (!callSystemRef.current) {
      throw new Error('نظام المكالمات غير مُهيأ');
    }

    setIsLoading(true);
    setCallStatus('calling');
    
    try {
      const callId = await callSystemRef.current.startSimpleCall(receiverId, receiverName, type);
      setCallStatus('ringing');

      toast({
        title: `📞 طلب مكالمة مُرسل`,
        description: `مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'} مع ${receiverName}`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('❌ Error starting simple call:', error);
      setCallStatus('idle');
      toast({
        title: '❌ فشل في إرسال طلب المكالمة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // بدء مكالمة احترافية
  const startProfessionalCall = useCallback(async (
    receiverId: string,
    receiverName: string,
    type: 'video' | 'audio' = 'video'
  ) => {
    if (!callSystemRef.current) {
      throw new Error('نظام المكالمات غير مُهيأ');
    }

    setIsLoading(true);
    setCallStatus('calling');
    
    try {
      const callId = await callSystemRef.current.startProfessionalCall(receiverId, receiverName, type);
      setCallStatus('ringing');

      toast({
        title: `📞 طلب مكالمة احترافية مُرسل`,
        description: `مكالمة ${type === 'video' ? 'فيديو' : 'صوتية'} مع ${receiverName}`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('❌ Error starting professional call:', error);
      setCallStatus('idle');
      toast({
        title: '❌ فشل في إرسال طلب المكالمة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // قبول مكالمة
  const acceptCall = useCallback(async (call: UnifiedCallRequest) => {
    if (!callSystemRef.current) return;

    try {
      stopRingtone();
      setCurrentCall(call);
      setIsInCall(true);
      setCallStatus('connected');

      const { channelName, token } = await callSystemRef.current.acceptCallRequest(call.id);
      
      console.log('✅ Call accepted:', { channelName, token });

      toast({
        title: '✅ تم قبول المكالمة',
        description: `مكالمة ${call.callType === 'video' ? 'فيديو' : 'صوتية'} مع ${call.senderName}`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('❌ Error accepting call:', error);
      toast({
        title: '❌ فشل في قبول المكالمة',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // رفض مكالمة
  const rejectCall = useCallback(async (callId: string) => {
    if (!callSystemRef.current) return;

    try {
      stopRingtone();
      await callSystemRef.current.rejectCallRequest(callId);
      
      toast({
        title: '📞 تم رفض المكالمة',
        duration: 2000,
      });

    } catch (error: any) {
      console.error('❌ Error rejecting call:', error);
    }
  }, [toast]);

  // إنهاء مكالمة
  const endCall = useCallback(async () => {
    try {
      stopRingtone();
      setIsInCall(false);
      setCurrentCall(null);
      setCallStatus('idle');

      if (currentCall && callSystemRef.current) {
        await callSystemRef.current.endCall(currentCall.id);
      }

      toast({
        title: '📞 تم إنهاء المكالمة',
        duration: 2000,
      });

    } catch (error: any) {
      console.error('❌ Error ending call:', error);
    }
  }, [currentCall, toast]);

  return {
    callStatus,
    isInCall,
    isLoading,
    currentCall,
    incomingCalls,
    startWhatsAppCall,
    startSimpleCall,
    startProfessionalCall,
    acceptCall,
    rejectCall,
    endCall,
    callSystem: callSystemRef.current
  };
}
