'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video, Mic, MessageCircle } from 'lucide-react';
import { WhatsAppCall } from '@/lib/whatsappCallSystem';

interface WhatsAppCallNotificationProps {
  call: WhatsAppCall;
  onAccept: () => void;
  onReject: () => void;
}

export default function WhatsAppCallNotification({ 
  call, 
  onAccept, 
  onReject 
}: WhatsAppCallNotificationProps) {
  
  const [callDuration, setCallDuration] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // حساب مدة الرنين
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - call.createdAt.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [call.createdAt]);

  // تأثير الرنين
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 1000);

    return () => clearInterval(animationInterval);
  }, []);

  // تنسيق مدة الرنين
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // الحصول على أيقونة نوع المكالمة
  const getCallIcon = () => {
    if (call.type === 'video') {
      return <Video className="h-8 w-8 text-white" />;
    } else {
      return <Mic className="h-8 w-8 text-white" />;
    }
  };

  // الحصول على نص نوع المكالمة
  const getCallTypeText = () => {
    return call.type === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة';
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex flex-col items-center justify-center z-50 p-4">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform transition-transform duration-1000 ${isAnimating ? 'translate-x-full' : '-translate-x-full'}`}></div>
      </div>

      {/* محتوى الإشعار */}
      <div className="relative z-10 text-center text-white max-w-sm w-full">
        
        {/* نوع المكالمة */}
        <div className="mb-4">
          <p className="text-lg font-medium opacity-90">
            {getCallTypeText()}
          </p>
        </div>

        {/* صورة المتصل */}
        <div className="mb-6 flex justify-center">
          <div className={`relative transition-transform duration-1000 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            <Avatar className="h-32 w-32 border-4 border-white/30 shadow-2xl">
              <AvatarImage
                src={call.callerAvatar || undefined}
                alt={call.callerName}
                className="object-cover"
              />
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                {call.callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* تأثير النبض */}
            <div className={`absolute inset-0 rounded-full border-4 border-white/50 transition-all duration-1000 ${isAnimating ? 'scale-125 opacity-0' : 'scale-100 opacity-100'}`}></div>
            <div className={`absolute inset-0 rounded-full border-4 border-white/30 transition-all duration-1000 delay-300 ${isAnimating ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}></div>
          </div>
        </div>

        {/* اسم المتصل */}
        <div className="mb-2">
          <h2 className="text-3xl font-bold text-white mb-1">
            {call.callerName}
          </h2>
          <p className="text-lg text-white/80">
            {call.type === 'video' ? '📹 مكالمة فيديو' : '🎙️ مكالمة صوتية'}
          </p>
        </div>

        {/* مدة الرنين */}
        <div className="mb-8">
          <p className="text-white/70 text-sm">
            🕐 {formatDuration(callDuration)}
          </p>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-center items-center gap-16 mb-8">
          
          {/* زر الرفض */}
          <Button
            onClick={onReject}
            size="lg"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white/30 shadow-2xl transition-all duration-200 hover:scale-110"
          >
            <PhoneOff className="h-8 w-8 text-white" />
          </Button>

          {/* زر القبول */}
          <Button
            onClick={onAccept}
            size="lg"
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 border-4 border-white/30 shadow-2xl transition-all duration-200 hover:scale-110"
          >
            <Phone className="h-8 w-8 text-white" />
          </Button>
        </div>

        {/* خيارات إضافية */}
        <div className="flex justify-center gap-8">
          
          {/* زر الرسالة */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-3"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>

          {/* أيقونة نوع المكالمة */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
            {getCallIcon()}
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-8 pt-4 border-t border-white/20">
          <div className="flex items-center justify-center gap-4 text-xs text-white/60">
            <span>🔒 مكالمة آمنة</span>
            <span>•</span>
            <span>🌐 مجانية</span>
            <span>•</span>
            <span>📱 AlMaheron</span>
          </div>
        </div>
      </div>

      {/* تأثيرات بصرية إضافية */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/5 rounded-full animate-pulse delay-500"></div>
    </div>
  );
}
