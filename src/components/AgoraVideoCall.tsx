'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings,
  Users, MessageCircle, Monitor, Volume2, VolumeX,
  Clock, BookOpen, Star, Heart, Wifi, WifiOff
} from 'lucide-react';

interface AgoraVideoCallProps {
  channelName: string;
  token?: string;
  userName: string;
  userType: 'student' | 'teacher';
  onCallEnd: () => void;
  remoteUserName?: string;
}

declare global {
  interface Window {
    AgoraRTC: any;
  }
}

export default function AgoraVideoCall({
  channelName,
  token,
  userName,
  userType,
  onCallEnd,
  remoteUserName
}: AgoraVideoCallProps) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const localTracksRef = useRef<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [networkStats, setNetworkStats] = useState<any>({});

  useEffect(() => {
    // تحميل Agora SDK
    const script = document.createElement('script');
    script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.0.js';
    script.onload = initializeAgora;
    script.onerror = () => {
      console.error('Failed to load Agora SDK');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      cleanup();
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

  const initializeAgora = async () => {
    try {
      if (!window.AgoraRTC) {
        console.error('Agora SDK not loaded');
        return;
      }

      // إنشاء عميل Agora
      const client = window.AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });
      clientRef.current = client;

      // إعداد مستمعي الأحداث
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
      client.on('user-left', handleUserLeft);
      client.on('connection-state-change', handleConnectionStateChange);
      client.on('network-quality', handleNetworkQuality);

      // الانضمام للقناة
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        throw new Error('Agora App ID not configured');
      }

      const uid = await client.join(appId, channelName, token || null, null);
      console.log('✅ Joined Agora channel:', channelName, 'with UID:', uid);

      // إنشاء وتشغيل المسارات المحلية
      const [audioTrack, videoTrack] = await window.AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];

      // تشغيل الفيديو المحلي
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // نشر المسارات
      await client.publish([audioTrack, videoTrack]);
      
      setIsLoading(false);
      console.log('📞 Agora call started successfully');

    } catch (error) {
      console.error('Error initializing Agora:', error);
      setIsLoading(false);
    }
  };

  const handleUserPublished = async (user: any, mediaType: string) => {
    console.log('👤 User published:', user.uid, mediaType);
    
    // الاشتراك في المستخدم البعيد
    await clientRef.current.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      // تشغيل الفيديو البعيد
      if (remoteVideoRef.current) {
        user.videoTrack.play(remoteVideoRef.current);
      }
    }
    
    if (mediaType === 'audio') {
      // تشغيل الصوت البعيد
      user.audioTrack.play();
    }

    // تحديث قائمة المستخدمين البعيدين
    setRemoteUsers(prev => {
      const existing = prev.find(u => u.uid === user.uid);
      if (existing) {
        return prev.map(u => u.uid === user.uid ? user : u);
      }
      return [...prev, user];
    });
  };

  const handleUserUnpublished = (user: any, mediaType: string) => {
    console.log('👤 User unpublished:', user.uid, mediaType);
  };

  const handleUserLeft = (user: any) => {
    console.log('👋 User left:', user.uid);
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const handleConnectionStateChange = (curState: string, revState: string) => {
    console.log('🔗 Connection state changed:', curState);
    if (curState === 'DISCONNECTED') {
      setConnectionQuality('poor');
    }
  };

  const handleNetworkQuality = (stats: any) => {
    setNetworkStats(stats);
    
    // تحديد جودة الاتصال
    const uplinkQuality = stats.uplinkNetworkQuality;
    const downlinkQuality = stats.downlinkNetworkQuality;
    const avgQuality = (uplinkQuality + downlinkQuality) / 2;
    
    if (avgQuality <= 2) {
      setConnectionQuality('excellent');
    } else if (avgQuality <= 4) {
      setConnectionQuality('good');
    } else {
      setConnectionQuality('poor');
    }
  };

  const toggleAudio = async () => {
    const audioTrack = localTracksRef.current[0];
    if (audioTrack) {
      await audioTrack.setMuted(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = async () => {
    const videoTrack = localTracksRef.current[1];
    if (videoTrack) {
      await videoTrack.setMuted(!isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const cleanup = async () => {
    // إيقاف المسارات المحلية
    localTracksRef.current.forEach(track => {
      track.stop();
      track.close();
    });
    
    // مغادرة القناة
    if (clientRef.current) {
      await clientRef.current.leave();
    }
  };

  const leaveCall = async () => {
    await cleanup();
    onCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityIcon = () => {
    return connectionQuality === 'poor' ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />;
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
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Agora.io - جودة عالمية
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
                {getQualityIcon()}
                <span className="capitalize">{connectionQuality}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Users className="h-3 w-3 mr-1" />
            {remoteUsers.length + 1} مشارك
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Agora.io
          </Badge>
        </div>
      </div>

      {/* منطقة الفيديو */}
      <div className="flex-1 relative bg-black">
        {/* الفيديو البعيد (ملء الشاشة) */}
        <div 
          ref={remoteVideoRef} 
          className="w-full h-full"
          style={{ background: remoteUsers.length === 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent' }}
        >
          {remoteUsers.length === 0 && (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">في انتظار {remoteUserName}...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* الفيديو المحلي (صغير في الزاوية) */}
        <div className="absolute top-4 left-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <div ref={localVideoRef} className="w-full h-full" />
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
            أنت
          </div>
        </div>
        
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
            مدعوم بـ Agora.io • جودة عالمية • 10000 دقيقة مجانية شهرياً • زمن استجابة منخفض
          </p>
        </div>
      </div>
    </div>
  );
}
