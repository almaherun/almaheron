'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Settings,
  MessageCircle,
  Users
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string, sender: string, message: string, timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState('');
  
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

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          // Return to camera
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
        
      } else {
        // Stop screen sharing and return to camera
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast({
        title: "خطأ في مشاركة الشاشة",
        description: "لم نتمكن من مشاركة الشاشة",
        variant: "destructive"
      });
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: userName,
        message: newMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
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
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">جلسة تعليمية</h1>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus === 'connected' ? 'متصل' : 'غير متصل'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>الغرفة: {roomId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {/* Remote Video (Main) */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Local Video (Picture in Picture) */}
                  <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg">جاري الاتصال...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="p-4 bg-gray-800">
                  <div className="flex justify-center items-center gap-4">
                    {/* Video Toggle */}
                    <Button
                      variant={isVideoEnabled ? "default" : "destructive"}
                      size="lg"
                      onClick={toggleVideo}
                      className="rounded-full w-12 h-12"
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>

                    {/* Audio Toggle */}
                    <Button
                      variant={isAudioEnabled ? "default" : "destructive"}
                      size="lg"
                      onClick={toggleAudio}
                      className="rounded-full w-12 h-12"
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>

                    {/* Screen Share */}
                    <Button
                      variant={isScreenSharing ? "secondary" : "outline"}
                      size="lg"
                      onClick={toggleScreenShare}
                      className="rounded-full w-12 h-12"
                    >
                      {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                    </Button>

                    {/* Settings */}
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full w-12 h-12"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>

                    {/* End Call */}
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={endCall}
                      className="rounded-full w-12 h-12"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  الدردشة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">{msg.sender}</span>
                        <span className="text-xs text-gray-400">
                          {msg.timestamp.toLocaleTimeString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      لا توجد رسائل بعد
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب رسالة..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={sendMessage} size="sm">
                      إرسال
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
