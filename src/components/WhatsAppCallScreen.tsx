'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  MoreVertical
} from 'lucide-react';
import { WhatsAppCall } from '@/lib/whatsappCallSystem';

interface WhatsAppCallScreenProps {
  call: WhatsAppCall;
  onEndCall: () => void;
  isConnected: boolean;
}

export default function WhatsAppCallScreen({ 
  call, 
  onEndCall,
  isConnected 
}: WhatsAppCallScreenProps) {
  
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.type === 'audio');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // حساب مدة المكالمة
  useEffect(() => {
    if (!isConnected || !call.answeredAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = call.answeredAt || call.createdAt;
      const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setCallDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, call.answeredAt, call.createdAt]);

  // إخفاء/إظهار أزرار التحكم تلقائياً
  useEffect(() => {
    if (!isConnected) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 5000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleMouseMove);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleMouseMove);
    };
  }, [isConnected]);

  // تنسيق مدة المكالمة
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // الحصول على حالة المكالمة
  const getCallStatus = () => {
    if (!isConnected) {
      return call.status === 'calling' ? 'جاري الاتصال...' : 'جاري الرنين...';
    }
    return formatDuration(callDuration);
  };

  // تبديل كتم الصوت
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // يمكن إضافة تحكم Jitsi هنا
  };

  // تبديل الفيديو
  const toggleVideo = () => {
    if (call.type === 'video') {
      setIsVideoOff(!isVideoOff);
      // يمكن إضافة تحكم Jitsi هنا
    }
  };

  // تبديل السماعة
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // تبديل ملء الشاشة
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      
      {/* منطقة الفيديو الرئيسية */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
        
        {/* فيديو المتصل الآخر (سيتم استبداله بـ Jitsi) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {call.type === 'video' && isConnected ? (
            // منطقة فيديو Jitsi ستظهر هنا
            <div id="whatsapp-call-container" className="w-full h-full"></div>
          ) : (
            // واجهة المكالمة الصوتية
            <div className="text-center text-white">
              <Avatar className="h-40 w-40 mx-auto mb-6 border-4 border-white/20">
                <AvatarImage
                  src={call.callerAvatar || call.receiverAvatar || undefined}
                  alt={call.callerName || call.receiverName}
                />
                <AvatarFallback className="bg-gray-700 text-white text-4xl">
                  {(call.callerName || call.receiverName).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-3xl font-bold mb-2">
                {call.callerName || call.receiverName}
              </h2>
              
              <p className="text-xl text-gray-300 mb-4">
                {call.type === 'video' ? '📹 مكالمة فيديو' : '🎙️ مكالمة صوتية'}
              </p>
              
              <div className="text-lg text-gray-400">
                {getCallStatus()}
              </div>
            </div>
          )}
        </div>

        {/* فيديو المستخدم الحالي (صغير في الزاوية) */}
        {call.type === 'video' && isConnected && !isVideoOff && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-white/20 overflow-hidden">
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">
              أنت
            </div>
          </div>
        )}

        {/* معلومات المكالمة العلوية */}
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={call.callerAvatar || call.receiverAvatar || undefined}
                  alt={call.callerName || call.receiverName}
                />
                <AvatarFallback className="bg-gray-600 text-white text-sm">
                  {(call.callerName || call.receiverName).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <p className="font-semibold">
                  {call.callerName || call.receiverName}
                </p>
                <p className="text-sm text-gray-300">
                  {getCallStatus()}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* أزرار التحكم السفلية */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center gap-6">
          
          {/* زر كتم الصوت */}
          <Button
            onClick={toggleMute}
            size="lg"
            className={`h-14 w-14 rounded-full transition-all duration-200 ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* زر السماعة */}
          <Button
            onClick={toggleSpeaker}
            size="lg"
            className={`h-14 w-14 rounded-full transition-all duration-200 ${
              isSpeakerOn 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>

          {/* زر إنهاء المكالمة */}
          <Button
            onClick={onEndCall}
            size="lg"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-110"
          >
            <PhoneOff className="h-8 w-8" />
          </Button>

          {/* زر الفيديو (للمكالمات المرئية فقط) */}
          {call.type === 'video' && (
            <Button
              onClick={toggleVideo}
              size="lg"
              className={`h-14 w-14 rounded-full transition-all duration-200 ${
                isVideoOff 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          )}

          {/* زر المزيد */}
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-gray-700 hover:bg-gray-600 transition-all duration-200"
          >
            <MoreVertical className="h-6 w-6" />
          </Button>
        </div>

        {/* مؤشرات الحالة */}
        <div className="flex items-center justify-center gap-4 mt-4 text-white/70 text-sm">
          {isMuted && (
            <div className="flex items-center gap-1">
              <MicOff className="h-4 w-4" />
              <span>مكتوم</span>
            </div>
          )}
          
          {call.type === 'video' && isVideoOff && (
            <div className="flex items-center gap-1">
              <VideoOff className="h-4 w-4" />
              <span>الفيديو مغلق</span>
            </div>
          )}
          
          {isSpeakerOn && (
            <div className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              <span>السماعة</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
