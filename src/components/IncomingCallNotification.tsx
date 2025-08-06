'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, User } from 'lucide-react';
import { CallRequest, FirestoreCallNotificationManager } from '@/lib/callNotificationsFirestore';

interface IncomingCallNotificationProps {
  callRequest: CallRequest;
  onAccept: (roomId: string) => void;
  onReject: () => void;
  callManager: FirestoreCallNotificationManager;
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
      let expiresAtTime: number;

      if (callRequest.expiresAt && typeof callRequest.expiresAt === 'object' && 'toDate' in callRequest.expiresAt) {
        // Firestore Timestamp
        expiresAtTime = (callRequest.expiresAt as any).toDate().getTime();
      } else {
        // Regular number timestamp
        expiresAtTime = callRequest.expiresAt as any;
      }

      const remaining = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
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
    <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            مكالمة واردة
          </h2>
          <div className="text-green-300 font-medium text-lg">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Student Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <Avatar className="h-32 w-32 border-4 border-white/30 shadow-2xl">
              <AvatarImage src="" alt={callRequest.studentName} />
              <AvatarFallback className="text-3xl bg-white/20 text-white">
                <User className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>
            {/* Multiple pulsing rings */}
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute inset-0 rounded-full border-4 border-teal-400 animate-ping opacity-25" style={{animationDelay: '1s'}}></div>
          </div>

          <h3 className="text-3xl font-bold text-white mb-2">
            {callRequest.studentName}
          </h3>
          <p className="text-green-200 text-lg">
            مكالمة فيديو واردة
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 justify-center">
          {/* Reject Button */}
          <Button
            onClick={handleReject}
            disabled={isProcessing}
            size="lg"
            className="w-20 h-20 rounded-full bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white font-bold border border-red-400/30 shadow-lg"
          >
            <PhoneOff className="h-8 w-8" />
          </Button>

          {/* Accept Button */}
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            size="lg"
            className="w-20 h-20 rounded-full bg-green-500/80 hover:bg-green-500 backdrop-blur-sm text-white font-bold border border-green-400/30 shadow-lg"
          >
            <Phone className="h-8 w-8" />
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
