'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  Maximize,
  Minimize,
  User,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseSignaling, createSignaling } from '@/lib/firebaseSignaling';
import SimplePeer from 'simple-peer';

interface ModernVideoCallProps {
  roomId: string;
  userName: string;
  userType: 'student' | 'teacher';
  onCallEnd: () => void;
  remoteUserName?: string;
  remoteUserAvatar?: string;
}

export default function ModernVideoCall({
  roomId,
  userName,
  userType,
  onCallEnd,
  remoteUserName = 'المستخدم الآخر',
  remoteUserAvatar
}: ModernVideoCallProps) {
  // States
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'requesting-permission' | 'connecting' | 'connected' | 'disconnected'>('requesting-permission');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const signalingRef = useRef<FirebaseSignaling | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  // Initialize call
  useEffect(() => {
    // Hide mobile navigation and set fullscreen
    document.body.classList.add('video-call-active');
    document.documentElement.style.overflow = 'hidden';

    // إخفاء جميع أشرطة التنقل المحتملة
    const hideNavigationBars = () => {
      // البحث عن جميع أشرطة التنقل المحتملة
      const selectors = [
        '.md\\:hidden.fixed.bottom-0',
        '[class*="bottom-0"]',
        '[class*="fixed"][class*="bottom"]',
        'nav[class*="bottom"]',
        '.bottom-navigation',
        '.mobile-nav',
        '.tab-bar'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.display = 'none';
          htmlElement.style.visibility = 'hidden';
          htmlElement.style.opacity = '0';
          htmlElement.style.transform = 'translateY(100%)';
        });
      });
    };

    hideNavigationBars();

    // إخفاء شريط العنوان في المتصفحات المحمولة
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
    }

    // Auto-hide controls after 3 seconds
    const hideControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    hideControlsTimer();

    return () => {
      cleanup();
      // Restore UI
      document.body.classList.remove('video-call-active');
      document.documentElement.style.overflow = 'auto';

      // إظهار أشرطة التنقل مرة أخرى
      const selectors = [
        '.md\\:hidden.fixed.bottom-0',
        '[class*="bottom-0"]',
        '[class*="fixed"][class*="bottom"]',
        'nav[class*="bottom"]',
        '.bottom-navigation',
        '.mobile-nav',
        '.tab-bar'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.display = '';
          htmlElement.style.visibility = '';
          htmlElement.style.opacity = '';
          htmlElement.style.transform = '';
        });
      });

      // استعادة viewport
      const metaViewport = document.querySelector('meta[name=viewport]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');
      }

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && callStartTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTimeRef.current!.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const requestPermission = async () => {
    try {
      setConnectionStatus('connecting');
      await initializeCall();
    } catch (error) {
      console.error('Permission denied:', error);
      setConnectionStatus('disconnected');
      toast({
        title: "تم رفض الإذن",
        description: "يرجى السماح بالوصول للكاميرا والمايكروفون",
        variant: "destructive"
      });
    }
  };

  const initializeCall = async () => {
    try {
      console.log('🎥 Initializing call for', userType, 'in room:', roomId);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('📹 Got media stream:', stream);

      setPermissionGranted(true);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📺 Set local video stream');
      }

      // Initialize Firebase signaling
      const userId = `${userType}_${Date.now()}`;
      signalingRef.current = createSignaling(roomId, userId, userName, userType);

      console.log('🔗 Created signaling for user:', userId);

      // Set up event listeners
      signalingRef.current.on('user-joined', (user) => {
        console.log('👤 User joined:', user);
        // المعلم يبدأ الاتصال دائماً
        if (userType === 'teacher') {
          console.log('👨‍🏫 Teacher initiating call to student');
          createPeer(user.id, stream);
        }
      });

      signalingRef.current.on('offer', (data) => {
        console.log('📞 Received offer from:', data.sender);
        handleOffer(data.offer, data.sender, stream);
      });

      signalingRef.current.on('answer', (data) => {
        console.log('✅ Received answer from:', data.sender);
        if (peerRef.current) {
          peerRef.current.signal(data.answer);
        }
      });

      signalingRef.current.on('ice-candidate', (data) => {
        console.log('🧊 Received ICE candidate from:', data.sender);
        if (peerRef.current) {
          peerRef.current.signal(data.candidate);
        }
      });

      // Join the room
      await signalingRef.current.joinRoom();
      console.log('🏠 Joined room:', roomId);

      // Check for existing users
      const existingUsers = await signalingRef.current.getRoomUsers();
      console.log('👥 Existing users in room:', existingUsers);

      if (existingUsers.length > 0) {
        const remoteUser = existingUsers[0];
        remoteUserIdRef.current = remoteUser.id;

        // الطالب ينتظر المعلم ليبدأ الاتصال
        if (userType === 'student') {
          console.log('👨‍🎓 Student waiting for teacher to initiate');
        }
      }

      setConnectionStatus('connected');
      setIsConnected(true);
      callStartTimeRef.current = new Date();

      console.log('✅ Call initialization complete');

    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      toast({
        title: "خطأ في الوصول للكاميرا",
        description: "تأكد من السماح بالوصول للكاميرا والمايكروفون",
        variant: "destructive"
      });
      setConnectionStatus('disconnected');
    }
  };

  const createPeer = (remoteUserId: string, stream: MediaStream) => {
    console.log('🔗 Creating peer connection to:', remoteUserId);

    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      console.log('📡 Sending offer to:', remoteUserId);
      signalingRef.current?.sendOffer(signal, remoteUserId);
    });

    peer.on('stream', (remoteStream) => {
      console.log('🎥 Received remote stream from:', remoteUserId);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log('📺 Set remote video stream');
      }
      toast({
        title: "تم الاتصال بنجاح!",
        description: "المكالمة نشطة الآن",
        className: "bg-green-600 text-white"
      });
    });

    peer.on('connect', () => {
      console.log('🔗 Peer connected successfully');
    });

    peer.on('error', (error) => {
      console.error('❌ Peer error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ في الاتصال مع المستخدم الآخر",
        variant: "destructive"
      });
    });

    peerRef.current = peer;
    remoteUserIdRef.current = remoteUserId;
  };

  const handleOffer = (offer: any, senderId: string, stream: MediaStream) => {
    console.log('📞 Handling offer from:', senderId);

    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      console.log('📡 Sending answer to:', senderId);
      signalingRef.current?.sendAnswer(signal, senderId);
    });

    peer.on('stream', (remoteStream) => {
      console.log('🎥 Received remote stream from:', senderId);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log('📺 Set remote video stream');
      }
      toast({
        title: "تم الاتصال بنجاح!",
        description: "المكالمة نشطة الآن",
        className: "bg-green-600 text-white"
      });
    });

    peer.on('connect', () => {
      console.log('🔗 Peer connected successfully');
    });

    peer.on('error', (error) => {
      console.error('❌ Peer error:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ في الاتصال مع المستخدم الآخر",
        variant: "destructive"
      });
    });

    console.log('📡 Signaling offer to peer');
    peer.signal(offer);
    peerRef.current = peer;
    remoteUserIdRef.current = senderId;
  };

  const cleanup = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (signalingRef.current) {
      await signalingRef.current.leaveRoom();
      signalingRef.current = null;
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

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    // Note: Speaker control is limited in web browsers
  };

  const endCall = () => {
    cleanup();
    onCallEnd();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScreenClick = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={handleScreenClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        height: '100vh',
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      {/* Permission Request Overlay */}
      {connectionStatus === 'requesting-permission' && (
        <div className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                <Video className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">بدء المكالمة</h3>
            <p className="text-gray-300 text-lg mb-8">نحتاج إذن للوصول للكاميرا والمايكروفون لبدء المكالمة</p>
            <button
              onClick={requestPermission}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Video className="h-6 w-6" />
              السماح وبدء المكالمة
            </button>
          </div>
        </div>
      )}

      {/* Connecting Overlay */}
      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-30">
          <div className="text-center max-w-md mx-auto px-6">
            {/* Profile Image */}
            <div className="relative mb-8">
              <Avatar className="h-32 w-32 mx-auto border-4 border-white/30 shadow-2xl">
                <AvatarImage src={remoteUserAvatar} alt={remoteUserName} />
                <AvatarFallback className="text-4xl bg-white/20 text-white">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              {/* Multiple pulsing rings */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-25" style={{animationDelay: '1s'}}></div>
            </div>

            <h3 className="text-3xl font-bold mb-2 text-white">{remoteUserName}</h3>
            <p className="text-blue-200 text-xl mb-4">جاري الاتصال...</p>
            <p className="text-gray-300 text-lg">في انتظار الاتصال...</p>

            {/* Loading dots */}
            <div className="flex items-center justify-center mt-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Interface */}
      {connectionStatus === 'connected' && (
        <>
          {/* Remote Video (Full Screen) */}
          <div className="flex-1 relative bg-gray-900">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
            />

            {/* Placeholder when no remote video */}
            {!remoteVideoRef.current?.srcObject && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-white/20">
                    <AvatarImage src={remoteUserAvatar} alt={remoteUserName} />
                    <AvatarFallback className="text-4xl bg-gray-700 text-white">
                      <User className="h-16 w-16" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold text-white mb-2">{remoteUserName}</h3>
                  <p className="text-gray-400">في انتظار الاتصال...</p>
                </div>
              </div>
            )}
            
            {/* Local Video (Picture in Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 md:w-40 md:h-32 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* Call Info */}
            <div className={`absolute top-4 left-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={remoteUserAvatar} alt={remoteUserName} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{remoteUserName}</p>
                    <p className="text-xs text-gray-300">{formatDuration(callDuration)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <div className="flex items-center justify-center gap-4 md:gap-6">
              {/* Audio Toggle */}
              <Button
                onClick={toggleAudio}
                size="lg"
                className={`w-14 h-14 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>

              {/* End Call */}
              <Button
                onClick={endCall}
                size="lg"
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="h-8 w-8" />
              </Button>

              {/* Video Toggle */}
              <Button
                onClick={toggleVideo}
                size="lg"
                className={`w-14 h-14 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
