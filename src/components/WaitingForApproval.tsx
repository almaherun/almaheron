'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, User, Clock } from 'lucide-react';
import { SimpleCallSystem } from '@/lib/simpleCallSystem';

interface WaitingForApprovalProps {
  teacherName: string;
  teacherAvatar?: string;
  requestId: string;
  callManager: SimpleCallSystem;
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            جاري الاتصال...
          </h2>
          <div className="flex items-center justify-center gap-2 text-blue-300 font-medium">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Teacher Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <Avatar className="h-32 w-32 border-4 border-white/30 shadow-2xl">
              <AvatarImage src={teacherAvatar} alt={teacherName} />
              <AvatarFallback className="text-3xl bg-white/20 text-white">
                <User className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>
            {/* Multiple pulsing rings */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-25" style={{animationDelay: '1s'}}></div>
          </div>

          <h3 className="text-3xl font-bold text-white mb-2">
            {teacherName}
          </h3>
          <p className="text-blue-200 text-center text-lg">
            في انتظار الرد...
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex gap-3">
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-4 h-4 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleCancel}
            disabled={isProcessing}
            size="lg"
            className="h-16 px-10 rounded-full bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white font-bold text-lg border border-red-400/30 shadow-lg"
          >
            <PhoneOff className="h-7 w-7 mr-3" />
            إنهاء
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
