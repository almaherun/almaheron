'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, PhoneOff, Video, VideoOff, 
  Mic, MicOff, Settings, MessageCircle,
  Volume2, VolumeX, MoreVertical, X
} from 'lucide-react';

interface WhatsAppCallInterfaceProps {
  teacherName: string;
  teacherImage?: string;
  callType: 'audio' | 'video';
  status: 'calling' | 'connecting' | 'connected';
  onEndCall: () => void;
  onToggleMic?: () => void;
  onToggleVideo?: () => void;
  onToggleSpeaker?: () => void;
  isMicOn?: boolean;
  isVideoOn?: boolean;
  isSpeakerOn?: boolean;
}

export default function WhatsAppCallInterface({
  teacherName,
  teacherImage,
  callType,
  status,
  onEndCall,
  onToggleMic,
  onToggleVideo,
  onToggleSpeaker,
  isMicOn = true,
  isVideoOn = true,
  isSpeakerOn = false
}: WhatsAppCallInterfaceProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // عداد مدة المكالمة
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // تأثير النبضة للحالة calling
  useEffect(() => {
    if (status === 'calling') {
      const interval = setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'calling':
        return 'جاري الاتصال...';
      case 'connecting':
        return 'جاري الاتصال...';
      case 'connected':
        return formatDuration(callDuration);
      default:
        return 'جاري الاتصال...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'calling':
        return 'text-blue-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'connected':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEndCall}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-white">
            <h3 className="font-medium">{teacherName}</h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Avatar */}
        <div className={`relative mb-8 transition-all duration-1000 ${
          isAnimating && status === 'calling' ? 'scale-110' : 'scale-100'
        }`}>
          <div className={`absolute inset-0 rounded-full ${
            status === 'calling' ? 'animate-ping bg-blue-400/30' : ''
          }`} />
          <Avatar className="h-40 w-40 border-4 border-white/20 shadow-2xl">
            <AvatarImage
              src={teacherImage || '/default-teacher.png'}
              alt={teacherName}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-green-500 to-blue-600 text-white">
              {teacherName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Call Type Badge */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              {callType === 'video' ? (
                <>
                  <Video className="h-3 w-3 mr-1" />
                  مكالمة فيديو
                </>
              ) : (
                <>
                  <Phone className="h-3 w-3 mr-1" />
                  مكالمة صوتية
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{teacherName}</h2>
          <Badge variant="secondary" className="bg-white/10 text-white/80 mb-4">
            معلم تحفيظ القرآن الكريم
          </Badge>
          
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          
          {status === 'calling' && (
            <div className="mt-4 text-white/60 text-sm">
              انتظر حتى يرد المعلم على المكالمة
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {status === 'calling' && (
          <div className="flex items-center gap-2 mb-8">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 bg-blue-400 rounded-full animate-pulse`}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            <span className="text-white/60 text-sm">جاري الاتصال</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-6">
          {/* Microphone */}
          {onToggleMic && (
            <Button
              size="lg"
              variant={isMicOn ? "secondary" : "destructive"}
              className={`h-14 w-14 rounded-full ${
                isMicOn 
                  ? 'bg-white/20 hover:bg-white/30 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              onClick={onToggleMic}
            >
              {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
          )}

          {/* End Call */}
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg"
            onClick={onEndCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>

          {/* Video Toggle */}
          {callType === 'video' && onToggleVideo && (
            <Button
              size="lg"
              variant={isVideoOn ? "secondary" : "destructive"}
              className={`h-14 w-14 rounded-full ${
                isVideoOn 
                  ? 'bg-white/20 hover:bg-white/30 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              onClick={onToggleVideo}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
          )}

          {/* Speaker */}
          {onToggleSpeaker && (
            <Button
              size="lg"
              variant={isSpeakerOn ? "secondary" : "ghost"}
              className={`h-14 w-14 rounded-full ${
                isSpeakerOn 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              onClick={onToggleSpeaker}
            >
              {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          )}
        </div>

        {/* Additional Call Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:bg-white/10"
          >
            <Phone className="h-4 w-4 mr-2" />
            إضافة مكالمة
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:bg-white/10"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            إنهاء وحفظ
          </Button>
        </div>

        {/* Islamic Text */}
        <div className="text-center mt-4">
          <p className="text-white/40 text-xs">
            "وَقُل رَّبِّ زِدْنِي عِلْمًا" - سورة طه
          </p>
        </div>
      </div>
    </div>
  );
}
