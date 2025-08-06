'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, PhoneOff, Video, VideoOff, 
  User, Clock, MessageCircle, X
} from 'lucide-react';
import { DailyCallRequest } from '@/lib/dailyCallSystem';

interface DailyCallNotificationProps {
  callRequest: DailyCallRequest;
  onAccept: (roomUrl: string) => void;
  onReject: () => void;
  onIgnore?: () => void;
}

export default function DailyCallNotification({
  callRequest,
  onAccept,
  onReject,
  onIgnore
}: DailyCallNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(120); // دقيقتان
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // حساب الوقت المتبقي
    const updateTimeLeft = () => {
      const now = Date.now();
      let expiresAtTime: number;
      
      if (callRequest.expiresAt && typeof callRequest.expiresAt === 'object' && 'toDate' in callRequest.expiresAt) {
        expiresAtTime = (callRequest.expiresAt as any).toDate().getTime();
      } else {
        expiresAtTime = callRequest.expiresAt as any;
      }
      
      const remaining = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        onReject(); // انتهت صلاحية المكالمة
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [callRequest.expiresAt, onReject]);

  useEffect(() => {
    // تأثير الرنين
    const ringInterval = setInterval(() => {
      setIsRinging(prev => !prev);
    }, 1000);

    // تشغيل صوت الرنين (اختياري)
    playRingtone();

    return () => clearInterval(ringInterval);
  }, []);

  const playRingtone = () => {
    try {
      // إنشاء نغمة رنين بسيطة
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // نغمة رنين متكررة
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (error) {
      console.log('Could not play ringtone:', error);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallerName = () => {
    return callRequest.studentName || 'طالب';
  };

  const getCallTypeIcon = () => {
    return callRequest.callType === 'video' ? 
      <Video className="h-8 w-8" /> : 
      <Phone className="h-8 w-8" />;
  };

  const getCallTypeText = () => {
    return callRequest.callType === 'video' ? 'مكالمة مرئية' : 'مكالمة صوتية';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-2xl transform transition-all duration-300 ${isRinging ? 'scale-105' : 'scale-100'}`}>
        <CardContent className="p-8 text-center">
          {/* رمز إسلامي */}
          <div className="text-4xl mb-4">📞</div>
          
          {/* معلومات المتصل */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{getCallerName()}</h2>
            <Badge variant="secondary" className="bg-white/20 text-white mb-2">
              طالب تحفيظ القرآن
            </Badge>
            
            <div className="flex items-center justify-center gap-2 text-white/90">
              {getCallTypeIcon()}
              <span className="text-lg">{getCallTypeText()}</span>
            </div>
            
            <p className="text-sm text-white/80 mt-2">
              حصة تحفيظ القرآن الكريم
            </p>
          </div>

          {/* عداد الوقت */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Clock className="h-4 w-4" />
              <span className="text-sm">ينتهي خلال {formatTimeLeft(timeLeft)}</span>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-center gap-6 mb-4">
            {/* رفض المكالمة */}
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 border-4 border-white/20"
              onClick={onReject}
            >
              <PhoneOff className="h-8 w-8" />
            </Button>
            
            {/* قبول المكالمة */}
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 border-4 border-white/20"
              onClick={() => onAccept(callRequest.roomUrl)}
            >
              {callRequest.callType === 'video' ? (
                <Video className="h-8 w-8" />
              ) : (
                <Phone className="h-8 w-8" />
              )}
            </Button>
          </div>

          {/* خيارات إضافية */}
          <div className="flex justify-center gap-4">
            {onIgnore && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white/80 hover:bg-white/10"
                onClick={onIgnore}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                رسالة
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/10"
              onClick={onReject}
            >
              <X className="h-4 w-4 mr-2" />
              تجاهل
            </Button>
          </div>

          {/* معلومات الخدمة */}
          <div className="mt-6">
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              Daily.co • جودة عالية • مجاني
            </Badge>
          </div>

          {/* نص إسلامي */}
          <div className="mt-4 text-xs text-white/60">
            "وَقُل رَّبِّ زِدْنِي عِلْمًا"
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
