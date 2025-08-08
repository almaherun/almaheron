'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  Monitor, Users, MessageCircle, Hand, Settings,
  Camera, Volume2, VolumeX, Maximize, Minimize,
  Circle, Square, Download, Share, PenTool,
  BookOpen, Star, Clock, Wifi, Battery
} from 'lucide-react';
import { AdvancedCallSystem, CallSession, CallParticipant } from '@/lib/advancedCallSystem';

interface AdvancedCallInterfaceProps {
  session: CallSession;
  onEndCall: () => void;
  isHost?: boolean;
}

export default function AdvancedCallInterface({ 
  session, 
  onEndCall, 
  isHost = false 
}: AdvancedCallInterfaceProps) {
  // حالات المكالمة
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [chatMessage, setChatMessage] = useState('');

  // مراجع العناصر
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callSystemRef = useRef<AdvancedCallSystem>(new AdvancedCallSystem());

  // تأثيرات
  useEffect(() => {
    // بدء عداد المدة
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تنسيق وقت المكالمة
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // وظائف التحكم
  const handleToggleMute = () => {
    const muted = callSystemRef.current.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = callSystemRef.current.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        await callSystemRef.current.startScreenShare();
        setIsScreenSharing(true);
      } else {
        // إيقاف مشاركة الشاشة
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error with screen sharing:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (!isRecording) {
        await callSystemRef.current.startRecording();
        setIsRecording(true);
      } else {
        const recordingBlob = await callSystemRef.current.stopRecording();
        setIsRecording(false);
        
        // تحميل التسجيل
        const url = URL.createObjectURL(recordingBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        a.click();
      }
    } catch (error) {
      console.error('Error with recording:', error);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      callSystemRef.current.sendChatMessage(chatMessage, session.id);
      setChatMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* شريط الحالة العلوي */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionQuality === 'excellent' ? 'bg-green-500' :
              connectionQuality === 'good' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">{connectionQuality === 'excellent' ? 'ممتاز' : connectionQuality === 'good' ? 'جيد' : 'ضعيف'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">{session.participants.length} مشارك</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{session.title}</h1>
          {session.type === 'quran' && <BookOpen className="w-5 h-5 text-green-400" />}
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="w-3 h-3 mr-1 fill-current" />
              تسجيل
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Battery className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* منطقة الفيديو الرئيسية */}
      <div className="flex-1 relative">
        {/* الفيديو الرئيسي */}
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />

        {/* الفيديو المحلي (صورة في صورة) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* عرض المشاركين */}
        {session.participants.length > 2 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 max-h-96 overflow-y-auto">
            {session.participants.slice(0, 6).map((participant) => (
              <div key={participant.id} className="w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border border-white/20 relative">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {participant.name.charAt(0)}
                  </span>
                </div>
                {participant.isMuted && (
                  <MicOff className="absolute bottom-1 left-1 w-3 h-3 text-red-500" />
                )}
                {participant.isHandRaised && (
                  <Hand className="absolute bottom-1 right-1 w-3 h-3 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* رسائل الدردشة العائمة */}
        {showChat && (
          <div className="absolute bottom-20 right-4 w-80 h-96 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col">
            <div className="p-3 border-b border-white/20">
              <h3 className="text-white font-semibold">الدردشة</h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              {/* رسائل الدردشة */}
            </div>
            <div className="p-3 border-t border-white/20 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-white/10 text-white placeholder-white/50 rounded px-3 py-2 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button size="sm" onClick={handleSendMessage}>
                إرسال
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* شريط التحكم السفلي */}
      <div className="bg-gray-900/95 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-4">
          {/* مجموعة التحكم الأساسي */}
          <div className="flex items-center gap-3">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={handleToggleVideo}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={onEndCall}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={handleScreenShare}
            >
              <Monitor className="w-6 h-6" />
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => callSystemRef.current.switchCamera()}
            >
              <Camera className="w-6 h-6" />
            </Button>
          </div>

          {/* مجموعة التحكم المتقدم */}
          <div className="flex items-center gap-3 ml-8">
            {isHost && (
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={handleStartRecording}
              >
                {isRecording ? <Square className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </Button>
            )}

            <Button
              variant={isHandRaised ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => {
                callSystemRef.current.raiseHand();
                setIsHandRaised(!isHandRaised);
              }}
            >
              <Hand className="w-6 h-6" />
            </Button>

            <Button
              variant={showChat ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>

            <Button
              variant={showParticipants ? "default" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="w-6 h-6" />
            </Button>

            {session.type === 'quran' && (
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-14 h-14"
              >
                <PenTool className="w-6 h-6" />
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>

          {/* تحكم الصوت */}
          <div className="flex items-center gap-2 ml-8">
            <Volume2 className="w-5 h-5 text-white" />
            <div className="w-24">
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
