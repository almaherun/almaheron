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
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import SettingsIcon from '@mui/icons-material/Settings';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import '../styles/videocall.css';

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
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  const { toast } = useToast();

  // Initialize WebRTC
  useEffect(() => {
    initializeCall();

    // Prevent scrolling and add full screen class
    document.body.classList.add('video-call-active');
    document.documentElement.style.overflow = 'hidden';

    return () => {
      cleanup();
      // Restore scrolling
      document.body.classList.remove('video-call-active');
      document.documentElement.style.overflow = 'auto';
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

      // Initialize Socket.io connection
      socketRef.current = io();

      // Join the room
      socketRef.current.emit('join-room', {
        roomId,
        userName,
        userType
      });

      // Handle socket events
      socketRef.current.on('user-joined', (data) => {
        console.log('User joined:', data);
        setRemoteUserName(data.userName);

        // Create peer connection as initiator
        createPeer(data.userId, stream);
      });

      socketRef.current.on('room-users', (users) => {
        console.log('Room users:', users);
        if (users.length > 0) {
          const remoteUser = users[0];
          setRemoteUserName(remoteUser.userName);
          remoteUserIdRef.current = remoteUser.userId;
        }
      });

      socketRef.current.on('offer', (data) => {
        console.log('Received offer from:', data.sender);
        handleOffer(data.offer, data.sender, stream);
      });

      socketRef.current.on('answer', (data) => {
        console.log('Received answer from:', data.sender);
        if (peerRef.current) {
          peerRef.current.signal(data.answer);
        }
      });

      socketRef.current.on('ice-candidate', (data) => {
        console.log('Received ICE candidate from:', data.sender);
        if (peerRef.current) {
          peerRef.current.signal(data.candidate);
        }
      });

      socketRef.current.on('user-left', (data) => {
        console.log('User left:', data);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setRemoteUserName('');
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
      });

      setConnectionStatus('connected');
      setIsConnected(true);

      toast({
        title: "تم الاتصال بالخادم",
        description: "في انتظار المستخدم الآخر...",
        className: "bg-blue-600 text-white"
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

  const createPeer = (remoteUserId: string, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('offer', {
        target: remoteUserId,
        offer: signal
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      toast({
        title: "تم الاتصال بنجاح!",
        description: "المكالمة نشطة الآن",
        className: "bg-green-600 text-white"
      });
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
    });

    peerRef.current = peer;
    remoteUserIdRef.current = remoteUserId;
  };

  const handleOffer = (offer: any, senderId: string, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('answer', {
        target: senderId,
        answer: signal
      });
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      toast({
        title: "تم الاتصال بنجاح!",
        description: "المكالمة نشطة الآن",
        className: "bg-green-600 text-white"
      });
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
    });

    peer.signal(offer);
    peerRef.current = peer;
    remoteUserIdRef.current = senderId;
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
      socketRef.current = null;
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
    <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
      {/* Header Info */}
      <div className="absolute top-6 left-6 z-20">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>مكالمة نشطة</span>
          </div>
        </div>
      </div>

      {/* Time Display */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-medium shadow-lg">
          {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Video Container */}
      <div className="relative w-full h-full">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gradient-to-br from-gray-800 to-gray-900"
        />

        {/* Remote User Info */}
        {remoteUserName && (
          <div className="absolute bottom-24 left-6 z-20">
            <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {remoteUserName.charAt(0)}
                </div>
                <span className="font-medium">{remoteUserName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Local Video (Picture in Picture) - Responsive */}
        <div className="absolute z-20 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-600 transition-all duration-300 hover:scale-105
                        top-4 right-4 w-24 h-18
                        sm:top-6 sm:right-6 sm:w-32 sm:h-24
                        md:w-40 md:h-30
                        lg:w-48 lg:h-36
                        xl:w-56 xl:h-42">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <VideoOff className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-2 text-xs bg-black bg-opacity-70 px-2 py-1 rounded-md font-medium">
            أنت
          </div>
          {!isAudioEnabled && (
            <div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Connection Status Overlay */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">جاري الاتصال...</h3>
              <p className="text-gray-300 text-lg">يرجى السماح بالوصول للكاميرا والمايكروفون</p>
              <div className="mt-6 flex justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Controls Bar - Google Meet Style */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-4 sm:pt-12 sm:pb-8">
            <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 px-4">

              {/* Microphone Toggle */}
              <button
                onClick={toggleAudio}
                className={`relative group transition-all duration-200 transform hover:scale-110 active:scale-95
                           ${isAudioEnabled
                             ? 'bg-gray-700 hover:bg-gray-600'
                             : 'bg-red-600 hover:bg-red-700'
                           }
                           rounded-full p-3 sm:p-4 shadow-lg`}
                title={isAudioEnabled ? 'كتم الصوت' : 'إلغاء كتم الصوت'}
              >
                {isAudioEnabled ? (
                  <MicIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'white' }} />
                ) : (
                  <MicOffIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'white' }} />
                )}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {isAudioEnabled ? 'كتم الصوت' : 'إلغاء كتم الصوت'}
                </div>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleVideo}
                className={`relative group transition-all duration-200 transform hover:scale-110 active:scale-95
                           ${isVideoEnabled
                             ? 'bg-gray-700 hover:bg-gray-600'
                             : 'bg-red-600 hover:bg-red-700'
                           }
                           rounded-full p-3 sm:p-4 shadow-lg`}
                title={isVideoEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
              >
                {isVideoEnabled ? (
                  <VideocamIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'white' }} />
                ) : (
                  <VideocamOffIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'white' }} />
                )}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {isVideoEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                </div>
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="relative group bg-red-600 hover:bg-red-700 rounded-full p-4 sm:p-5 shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95 mx-1 sm:mx-2"
                title="إنهاء المكالمة"
              >
                <CallEndIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'white' }} />
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  إنهاء المكالمة
                </div>
              </button>

              {/* Settings Button */}
              <button
                className="relative group bg-gray-700 hover:bg-gray-600 rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                title="الإعدادات"
              >
                <SettingsIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'white' }} />
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  الإعدادات
                </div>
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
