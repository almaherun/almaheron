'use client';

import React, { useEffect, useState } from 'react';
import { createDailyCallSystem, DailyCallRequest } from '@/lib/dailyCallSystem';
import DailyCallNotification from './DailyCallNotification';
import DailyVideoCall from './DailyVideoCall';
import { useToast } from '@/hooks/use-toast';

interface DailyCallManagerProps {
  userId: string;
  userName: string;
  userType: 'student' | 'teacher';
}

export default function DailyCallManager({
  userId,
  userName,
  userType
}: DailyCallManagerProps) {
  const [callSystem] = useState(() => createDailyCallSystem(userId, userType));
  const [incomingCall, setIncomingCall] = useState<DailyCallRequest | null>(null);
  const [activeCall, setActiveCall] = useState<{
    roomUrl: string;
    remoteUserName: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // الاستماع للمكالمات الواردة
    const unsubscribe = callSystem.listenForIncomingCalls((requests) => {
      console.log(`📞 Incoming calls for ${userType}:`, requests);
      
      if (requests.length > 0) {
        const latestCall = requests[0];
        
        // التحقق من أن المكالمة لم تنته صلاحيتها
        const now = Date.now();
        let expiresAtTime: number;
        
        if (latestCall.expiresAt && typeof latestCall.expiresAt === 'object' && 'toDate' in latestCall.expiresAt) {
          expiresAtTime = (latestCall.expiresAt as any).toDate().getTime();
        } else {
          expiresAtTime = latestCall.expiresAt as any;
        }
        
        if (expiresAtTime > now) {
          setIncomingCall(latestCall);
          
          // إظهار toast للإشعار
          const callerName = userType === 'teacher' ? latestCall.studentName : latestCall.teacherName;
          toast({
            title: "مكالمة واردة",
            description: `${callerName} يريد بدء ${latestCall.callType === 'video' ? 'مكالمة مرئية' : 'مكالمة صوتية'}`,
            className: "bg-green-600 text-white"
          });
        }
      } else {
        setIncomingCall(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [callSystem, userType, toast]);

  const handleAcceptCall = async (roomUrl: string) => {
    if (!incomingCall) return;

    try {
      // قبول المكالمة
      await callSystem.acceptCallRequest(incomingCall.id);
      
      // بدء المكالمة
      const remoteUserName = userType === 'teacher' ? incomingCall.studentName : incomingCall.teacherName;
      setActiveCall({
        roomUrl,
        remoteUserName
      });
      
      setIncomingCall(null);
      
      toast({
        title: "تم قبول المكالمة",
        description: "جاري الاتصال...",
        className: "bg-green-600 text-white"
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء قبول المكالمة",
        variant: "destructive"
      });
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;

    try {
      await callSystem.rejectCallRequest(incomingCall.id);
      setIncomingCall(null);
      
      toast({
        title: "تم رفض المكالمة",
        description: "تم رفض طلب المكالمة",
        className: "bg-red-600 text-white"
      });
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  const handleEndCall = () => {
    setActiveCall(null);
    
    toast({
      title: "انتهت المكالمة",
      description: "تم إنهاء المكالمة بنجاح",
      className: "bg-blue-600 text-white"
    });
  };

  // عرض المكالمة النشطة
  if (activeCall) {
    return (
      <DailyVideoCall
        roomUrl={activeCall.roomUrl}
        userName={userName}
        userType={userType}
        onCallEnd={handleEndCall}
        remoteUserName={activeCall.remoteUserName}
      />
    );
  }

  // عرض إشعار المكالمة الواردة
  if (incomingCall) {
    return (
      <DailyCallNotification
        callRequest={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onIgnore={handleRejectCall}
      />
    );
  }

  // لا توجد مكالمات
  return null;
}

// Hook لاستخدام نظام المكالمات
export function useDailyCallSystem(userId: string, userName: string, userType: 'student' | 'teacher') {
  const [callSystem] = useState(() => createDailyCallSystem(userId, userType));
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [waitingCallId, setWaitingCallId] = useState<string | null>(null);
  const { toast } = useToast();

  const startCall = async (
    receiverId: string, 
    receiverName: string, 
    callType: 'audio' | 'video' = 'video'
  ) => {
    try {
      setIsWaitingForResponse(true);
      
      const requestId = await callSystem.sendCallRequest(
        receiverId,
        receiverName,
        userName,
        callType
      );
      
      setWaitingCallId(requestId);
      
      toast({
        title: "تم إرسال طلب المكالمة",
        description: `جاري انتظار رد ${receiverName}...`,
        className: "bg-blue-600 text-white"
      });

      // الاستماع لحالة المكالمة
      const unsubscribe = callSystem.listenForCallStatus(requestId, (status, roomUrl) => {
        if (status === 'accepted' && roomUrl) {
          setIsWaitingForResponse(false);
          setWaitingCallId(null);
          unsubscribe();
          
          // بدء المكالمة
          window.open(roomUrl, '_blank');
          
          toast({
            title: "تم قبول المكالمة",
            description: "تم فتح المكالمة في نافذة جديدة",
            className: "bg-green-600 text-white"
          });
        } else if (status === 'rejected') {
          setIsWaitingForResponse(false);
          setWaitingCallId(null);
          unsubscribe();
          
          toast({
            title: "تم رفض المكالمة",
            description: `${receiverName} رفض المكالمة`,
            variant: "destructive"
          });
        } else if (status === 'expired') {
          setIsWaitingForResponse(false);
          setWaitingCallId(null);
          unsubscribe();
          
          toast({
            title: "انتهت صلاحية المكالمة",
            description: "لم يتم الرد على المكالمة في الوقت المحدد",
            variant: "destructive"
          });
        }
      });

      // إلغاء الانتظار بعد دقيقتين
      setTimeout(() => {
        if (isWaitingForResponse) {
          setIsWaitingForResponse(false);
          setWaitingCallId(null);
          unsubscribe();
        }
      }, 120000);

    } catch (error) {
      console.error('Error starting call:', error);
      setIsWaitingForResponse(false);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال طلب المكالمة",
        variant: "destructive"
      });
    }
  };

  const cancelCall = async () => {
    if (waitingCallId) {
      try {
        await callSystem.rejectCallRequest(waitingCallId);
        setIsWaitingForResponse(false);
        setWaitingCallId(null);
        
        toast({
          title: "تم إلغاء المكالمة",
          description: "تم إلغاء طلب المكالمة",
          className: "bg-gray-600 text-white"
        });
      } catch (error) {
        console.error('Error canceling call:', error);
      }
    }
  };

  return {
    startCall,
    cancelCall,
    isWaitingForResponse,
    callSystem
  };
}
