'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { SimpleCallRequest } from '@/lib/simpleCallSystem';

interface SimpleVideoCallProps {
  call: SimpleCallRequest;
  onEndCall: () => void;
}

// تحميل Agora SDK
declare global {
  interface Window {
    AgoraRTC: any;
  }
}

export default function SimpleVideoCall({ call, onEndCall }: SimpleVideoCallProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const localTracksRef = useRef<any[]>([]);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log('🎥 Starting call initialization...');

      // طلب إذن الكاميرا والميكروفون أولاً
      try {
        console.log('🎤 Requesting camera and microphone permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('✅ Permissions granted');
        // إغلاق الـ stream المؤقت
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error('❌ Permission denied:', permissionError);
        alert('يرجى السماح للكاميرا والميكروفون للمتابعة');
        return;
      }

      // تحميل Agora SDK
      if (!window.AgoraRTC) {
        console.log('📦 Loading Agora SDK...');
        await loadAgoraSDK();
      }

      const AgoraRTC = window.AgoraRTC;

      // إنشاء العميل
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // الاستماع للأحداث
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);

      // الانضمام للقناة
      const appId = 'cb27c3ffa8e9410db064c2006c934df1';
      console.log('🔗 Joining channel:', call.channelName);
      await client.join(appId, call.channelName, null, null);

      // إنشاء المسارات المحلية
      console.log('🎥 Creating camera and microphone tracks...');
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];

      // عرض الفيديو المحلي
      if (localVideoRef.current) {
        console.log('📺 Playing local video...');
        videoTrack.play(localVideoRef.current);
      }

      // نشر المسارات
      console.log('📡 Publishing tracks...');
      await client.publish([audioTrack, videoTrack]);

      setIsLoading(false);
      setIsConnected(true);

      console.log('✅ Call connected successfully:', call.channelName);

    } catch (error: any) {
      console.error('❌ Error initializing call:', error);
      alert('حدث خطأ في بدء المكالمة: ' + (error?.message || 'خطأ غير معروف'));
      setIsLoading(false);
    }
  };

  const loadAgoraSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.19.1.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleUserPublished = async (user: any, mediaType: string) => {
    try {
      await clientRef.current.subscribe(user, mediaType);

      if (mediaType === 'video' && remoteVideoRef.current) {
        user.videoTrack.play(remoteVideoRef.current);
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }

      console.log('👥 Remote user joined:', user.uid);
    } catch (error) {
      console.error('❌ Error handling user published:', error);
    }
  };

  const handleUserUnpublished = (user: any) => {
    console.log('👋 Remote user left:', user.uid);
  };

  const toggleMute = async () => {
    if (localTracksRef.current[0]) {
      await localTracksRef.current[0].setEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current[1]) {
      await localTracksRef.current[1].setEnabled(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const cleanup = async () => {
    try {
      // إيقاف المسارات المحلية
      localTracksRef.current.forEach(track => {
        track.stop();
        track.close();
      });

      // مغادرة القناة
      if (clientRef.current) {
        await clientRef.current.leave();
      }

      console.log('🧹 Call cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  };

  const handleEndCall = async () => {
    await cleanup();
    onEndCall();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <Card className="w-96 text-center">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">جاري الاتصال...</h3>
            <p className="text-gray-600">يتم تحضير المكالمة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* شريط المعلومات العلوي */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            مكالمة مع {call.studentName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
        </div>
      </div>

      {/* منطقة الفيديو */}
      <div className="flex-1 relative bg-black">
        {/* الفيديو البعيد (ملء الشاشة) */}
        <div 
          ref={remoteVideoRef} 
          className="w-full h-full"
          style={{ background: '#1a1a1a' }}
        />
        
        {/* الفيديو المحلي (صغير في الزاوية) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <div 
            ref={localVideoRef} 
            className="w-full h-full"
          />
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="bg-white p-6">
        <div className="flex justify-center gap-4">
          {/* زر كتم الصوت */}
          <Button
            onClick={toggleMute}
            size="lg"
            className={`rounded-full w-14 h-14 p-0 ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* زر إيقاف الفيديو */}
          <Button
            onClick={toggleVideo}
            size="lg"
            className={`rounded-full w-14 h-14 p-0 ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          {/* زر إنهاء المكالمة */}
          <Button
            onClick={handleEndCall}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 p-0"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
