'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, User, Clock } from 'lucide-react';
import { FirestoreCallNotificationManager } from '@/lib/callNotificationsFirestore';

interface WaitingForApprovalProps {
  teacherName: string;
  teacherAvatar?: string;
  requestId: string;
  callManager: FirestoreCallNotificationManager;
  onCancel: () => void;
  onAccepted: () => void;
  onRejected: () => void;
  onTimeout: () => void;
}

export default function WaitingForApproval({
  teacherName,
  teacherAvatar,
  requestId,
  callManager,
  onCancel,
  onAccepted,
  onRejected,
  onTimeout
}: WaitingForApprovalProps) {
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 دقيقة
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // مراقبة حالة الطلب
    const unsubscribe = callManager.listenForCallRequestStatus(requestId, (status) => {
      switch (status) {
        case 'accepted':
          onAccepted();
          break;
        case 'rejected':
          onRejected();
          break;
        case 'cancelled':
          onTimeout();
          break;
      }
    });

    // العد التنازلي
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleCancel(); // إلغاء تلقائي عند انتهاء الوقت
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [requestId]);

  const handleCancel = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await callManager.cancelCallRequest(requestId);
      onCancel();
    } catch (error) {
      console.error('Error cancelling call:', error);
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            في انتظار الموافقة
          </h2>
          <div className="flex items-center justify-center gap-2 text-blue-500 font-medium">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Teacher Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-blue-500">
              <AvatarImage src={teacherAvatar} alt={teacherName} />
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-pulse opacity-75"></div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {teacherName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            تم إرسال طلب المكالمة
            <br />
            في انتظار الموافقة...
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleCancel}
            disabled={isProcessing}
            variant="destructive"
            size="lg"
            className="h-14 px-8 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg"
          >
            <PhoneOff className="h-6 w-6 mr-2" />
            إلغاء المكالمة
          </Button>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              جاري الإلغاء...
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          💡 سيتم إلغاء المكالمة تلقائياً بعد دقيقتين
        </div>
      </div>
    </div>
  );
}
