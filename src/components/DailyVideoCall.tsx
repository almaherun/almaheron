'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings,
  Users, MessageCircle, Monitor, Volume2, VolumeX,
  Clock, BookOpen, Star, Heart
} from 'lucide-react';

interface DailyVideoCallProps {
  roomUrl: string;
  userName: string;
  userType: 'student' | 'teacher';
  onCallEnd: () => void;
  remoteUserName?: string;
}

declare global {
  interface Window {
    DailyIframe: any;
  }
}

export default function DailyVideoCall({
  roomUrl,
  userName,
  userType,
  onCallEnd,
  remoteUserName
}: DailyVideoCallProps) {
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');

  useEffect(() => {
    // تحميل Daily.co SDK
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.onload = initializeCall;
    document.head.appendChild(script);

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // عداد مدة المكالمة
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const initializeCall = async () => {
    try {
      if (!window.DailyIframe) {
        console.error('Daily SDK not loaded');
        return;
      }

      // إنشاء إطار المكالمة
      const callFrame = window.DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px'
        },
        showLeaveButton: false,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true
      });

      callFrameRef.current = callFrame;

      // إعداد مستمعي الأحداث
      callFrame
        .on('loaded', () => {
          console.log('📞 Daily call frame loaded');
          setIsLoading(false);
        })
        .on('joined-meeting', (event: any) => {
          console.log('✅ Joined meeting:', event);
          setIsLoading(false);
        })
        .on('participant-joined', (event: any) => {
          console.log('👤 Participant joined:', event.participant);
          updateParticipants();
        })
        .on('participant-left', (event: any) => {
          console.log('👋 Participant left:', event.participant);
          updateParticipants();
        })
        .on('left-meeting', () => {
          console.log('📞 Left meeting');
          onCallEnd();
        })
        .on('error', (error: any) => {
          console.error('❌ Daily call error:', error);
          setIsLoading(false);
        })
        .on('network-quality-change', (event: any) => {
          const quality = event.quality;
          if (quality > 3) setConnectionQuality('good');
          else if (quality > 1) setConnectionQuality('fair');
          else setConnectionQuality('poor');
        });

      // الانضمام للمكالمة
      await callFrame.join({
        url: roomUrl,
        userName: userName,
        startVideoOff: false,
        startAudioOff: false
      });

    } catch (error) {
      console.error('Error initializing call:', error);
      setIsLoading(false);
    }
  };

  const updateParticipants = () => {
    if (callFrameRef.current) {
      const participants = callFrameRef.current.participants();
      setParticipants(Object.values(participants));
    }
  };

  const toggleAudio = () => {
    if (callFrameRef.current) {
      const newMutedState = !isAudioMuted;
      callFrameRef.current.setLocalAudio(!newMutedState);
      setIsAudioMuted(newMutedState);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      const newMutedState = !isVideoMuted;
      callFrameRef.current.setLocalVideo(!newMutedState);
      setIsVideoMuted(newMutedState);
    }
  };

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
    onCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <Card className="w-96 text-center">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">جاري الاتصال...</h3>
            <p className="text-gray-600">يتم تحضير المكالمة مع {remoteUserName}</p>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Daily.co - جودة عالية
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* شريط المعلومات العلوي */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-lg">
              مكالمة مع {remoteUserName || 'مستخدم'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(callDuration)}</span>
              <span className="mx-2">•</span>
              <div className={`flex items-center gap-1 ${getQualityColor()}`}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                <span className="capitalize">{connectionQuality}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Users className="h-3 w-3 mr-1" />
            {participants.length} مشارك
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Daily.co
          </Badge>
        </div>
      </div>

      {/* منطقة الفيديو */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* أدوات القرآن العائمة */}
        {userType === 'teacher' && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="font-semibold text-sm mb-2 text-center">أدوات التحفيظ</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                المصحف
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                تقييم
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* أزرار التحكم السفلية */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-center items-center gap-4">
          {/* كتم الصوت */}
          <Button
            size="lg"
            variant={isAudioMuted ? "destructive" : "outline"}
            className="rounded-full w-14 h-14"
            onClick={toggleAudio}
          >
            {isAudioMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* كتم الفيديو */}
          <Button
            size="lg"
            variant={isVideoMuted ? "destructive" : "outline"}
            className="rounded-full w-14 h-14"
            onClick={toggleVideo}
          >
            {isVideoMuted ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          {/* إنهاء المكالمة */}
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-14 h-14"
            onClick={leaveCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          {/* مشاركة الشاشة */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14"
            onClick={() => callFrameRef.current?.startScreenShare()}
          >
            <Monitor className="h-6 w-6" />
          </Button>

          {/* الدردشة */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>

        {/* معلومات الخدمة */}
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            مدعوم بـ Daily.co • جودة عالية • 10000 دقيقة مجانية شهرياً
          </p>
        </div>
      </div>
    </div>
  );
}
