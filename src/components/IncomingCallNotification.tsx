'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, User } from 'lucide-react';
import { CallRequest, CallNotificationManager } from '@/lib/callNotifications';

interface IncomingCallNotificationProps {
  callRequest: CallRequest;
  onAccept: (roomId: string) => void;
  onReject: () => void;
  callManager: CallNotificationManager;
}

export default function IncomingCallNotification({
  callRequest,
  onAccept,
  onReject,
  callManager
}: IncomingCallNotificationProps) {
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 دقيقة
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // حساب الوقت المتبقي
    const updateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((callRequest.expiresAt - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        handleReject(); // رفض تلقائي عند انتهاء الوقت
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [callRequest.expiresAt]);

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await callManager.acceptCallRequest(callRequest.id);
      onAccept(callRequest.roomId);
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await callManager.rejectCallRequest(callRequest.id);
      onReject();
    } catch (error) {
      console.error('Error rejecting call:', error);
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
            مكالمة واردة
          </h2>
          <div className="text-red-500 font-medium">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Student Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-blue-500">
              <AvatarImage src="" alt={callRequest.studentName} />
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {callRequest.studentName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            يريد بدء مكالمة فيديو
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <Button
            onClick={handleReject}
            disabled={isProcessing}
            variant="destructive"
            size="lg"
            className="flex-1 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg"
          >
            <PhoneOff className="h-6 w-6 mr-2" />
            رفض
          </Button>

          {/* Accept Button */}
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            size="lg"
            className="flex-1 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
          >
            <Phone className="h-6 w-6 mr-2" />
            قبول
          </Button>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              جاري المعالجة...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
