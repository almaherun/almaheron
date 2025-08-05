'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoCallProps {
  roomId: string;
  userName: string;
  userType: 'teacher' | 'student';
  onCallEnd: () => void;
}

export default function VideoCall({ roomId, userName, userType, onCallEnd }: VideoCallProps) {
  // Video/Audio States
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [remoteUserName, setRemoteUserName] = useState<string>('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);

  const { toast } = useToast();

  // Initialize WebRTC
  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus('connected');
      setIsConnected(true);
      setRemoteUserName(userType === 'student' ? 'المعلم' : 'الطالب');

      // Simulate remote connection after 2 seconds
      setTimeout(() => {
        if (remoteVideoRef.current && localStreamRef.current) {
          // For demo purposes, show local stream in remote video too
          remoteVideoRef.current.srcObject = localStreamRef.current;
        }
      }, 2000);

      toast({
        title: "تم الاتصال بنجاح",
        description: "يمكنك الآن بدء المكالمة",
        className: "bg-green-600 text-white"
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "خطأ في الوصول للكاميرا",
        description: "تأكد من السماح بالوصول للكاميرا والمايكروفون",
        variant: "destructive"
      });
      setConnectionStatus('disconnected');
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };



  const endCall = () => {
    cleanup();
    onCallEnd();
    toast({
      title: "انتهت المكالمة",
      description: "تم إنهاء المكالمة بنجاح",
      className: "bg-blue-600 text-white"
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2 text-sm">
          الغرفة: {roomId.substring(0, 8)}...
        </div>
      </div>

      {/* Main Video Container */}
      <div className="relative w-full h-screen">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />

        {/* Remote User Name */}
        <div className="absolute bottom-20 left-4 bg-black bg-opacity-50 rounded-lg px-3 py-2 text-sm">
          {remoteUserName}
        </div>

        {/* Local Video (Picture in Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            أنت ({userType === 'teacher' ? 'معلم' : 'طالب'})
          </div>
        </div>

        {/* Connection Status Overlay */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-xl">جاري الاتصال...</p>
              <p className="text-sm text-gray-300 mt-2">يرجى السماح بالوصول للكاميرا والمايكروفون</p>
            </div>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
          <div className="flex justify-center items-center gap-4">
            {/* Audio Toggle */}
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full w-14 h-14 hover:scale-110 transition-transform"
            >
              {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            {/* Video Toggle */}
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-14 h-14 hover:scale-110 transition-transform"
            >
              {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>

            {/* End Call */}
            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 hover:scale-110 transition-transform"
            >
              <PhoneOff className="h-7 w-7" />
            </Button>

            {/* Settings */}
            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14 hover:scale-110 transition-transform"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
