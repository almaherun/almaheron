// Hook متقدم لإدارة المكالمات - ينافس العمالقة
import { useState, useEffect, useRef, useCallback } from 'react';
import { AdvancedCallSystem, CallSession, CallParticipant } from '@/lib/advancedCallSystem';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export interface CallStats {
  duration: number;
  participants: number;
  quality: 'excellent' | 'good' | 'poor';
  bandwidth: string;
  latency: number;
  packetsLost: number;
}

export interface CallSettings {
  videoQuality: 'low' | 'medium' | 'high' | 'hd';
  audioQuality: 'low' | 'medium' | 'high';
  enableNoiseCancellation: boolean;
  enableEchoCancellation: boolean;
  enableAutoGainControl: boolean;
  maxParticipants: number;
  requireApproval: boolean;
  allowRecording: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
}

export function useAdvancedCall() {
  // حالات المكالمة
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [callStats, setCallStats] = useState<CallStats>({
    duration: 0,
    participants: 0,
    quality: 'excellent',
    bandwidth: '0 Mbps',
    latency: 0,
    packetsLost: 0
  });

  // حالات الوسائط
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // حالات التحكم
  const [callSettings, setCallSettings] = useState<CallSettings>({
    videoQuality: 'hd',
    audioQuality: 'high',
    enableNoiseCancellation: true,
    enableEchoCancellation: true,
    enableAutoGainControl: true,
    maxParticipants: 50,
    requireApproval: false,
    allowRecording: true,
    allowScreenShare: true,
    allowChat: true
  });

  // مراجع
  const callSystemRef = useRef<AdvancedCallSystem>(new AdvancedCallSystem());
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // تأثيرات
  useEffect(() => {
    // بدء مراقبة الإحصائيات
    if (isConnected) {
      statsIntervalRef.current = setInterval(updateCallStats, 1000);
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [isConnected]);

  // تحديث إحصائيات المكالمة
  const updateCallStats = useCallback(() => {
    if (!callSystemRef.current) return;

    const stats = callSystemRef.current.getCallStats();
    setCallStats(prevStats => ({
      ...prevStats,
      duration: prevStats.duration + 1,
      participants: participants.length,
      ...stats
    }));
  }, [participants.length]);

  // إنشاء جلسة مكالمة جديدة
  const createSession = useCallback(async (
    title: string,
    type: CallSession['type'] = 'video',
    customSettings?: Partial<CallSettings>
  ): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const sessionSettings = { ...callSettings, ...customSettings };
      const sessionId = await callSystemRef.current.createSession(title, type, {
        allowScreenShare: sessionSettings.allowScreenShare,
        allowRecording: sessionSettings.allowRecording,
        allowChat: sessionSettings.allowChat,
        allowWhiteboard: type === 'quran',
        requireApproval: sessionSettings.requireApproval,
        muteOnJoin: false
      });

      setIsHost(true);
      setIsConnected(true);

      toast({
        title: "✅ تم إنشاء الجلسة",
        description: `جلسة "${title}" جاهزة للمشاركين`,
        duration: 3000,
      });

      return sessionId;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      toast({
        title: "❌ فشل إنشاء الجلسة",
        description: "حدث خطأ أثناء إنشاء الجلسة",
        variant: "destructive",
      });
      throw error;
    }
  }, [callSettings, toast]);

  // الانضمام لجلسة
  const joinSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await callSystemRef.current.joinSession(sessionId);
      setIsConnected(true);
      setIsHost(false);

      toast({
        title: "✅ تم الانضمام للجلسة",
        description: "مرحباً بك في المكالمة",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error joining session:', error);
      toast({
        title: "❌ فشل الانضمام",
        description: "تعذر الانضمام للجلسة",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // إعداد الوسائط المحلية
  const setupMedia = useCallback(async (
    videoEnabled: boolean = true,
    audioEnabled: boolean = true
  ): Promise<MediaStream> => {
    try {
      const stream = await callSystemRef.current.setupLocalMedia(videoEnabled, audioEnabled);
      setLocalStream(stream);
      setIsVideoOff(!videoEnabled);
      setIsMuted(!audioEnabled);
      return stream;
    } catch (error) {
      console.error('❌ Error setting up media:', error);
      toast({
        title: "❌ خطأ في الوسائط",
        description: "تعذر الوصول للكاميرا أو الميكروفون",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // تبديل كتم الصوت
  const toggleMute = useCallback((): boolean => {
    const muted = callSystemRef.current.toggleMute();
    setIsMuted(muted);
    
    toast({
      title: muted ? "🔇 تم كتم الصوت" : "🔊 تم إلغاء كتم الصوت",
      duration: 1000,
    });
    
    return muted;
  }, [toast]);

  // تبديل الفيديو
  const toggleVideo = useCallback((): boolean => {
    const videoOff = callSystemRef.current.toggleVideo();
    setIsVideoOff(videoOff);
    
    toast({
      title: videoOff ? "📹 تم إيقاف الفيديو" : "📹 تم تشغيل الفيديو",
      duration: 1000,
    });
    
    return videoOff;
  }, [toast]);

  // بدء مشاركة الشاشة
  const startScreenShare = useCallback(async (): Promise<void> => {
    try {
      const screenStream = await callSystemRef.current.startScreenShare();
      setIsScreenSharing(true);
      
      // إضافة مستمع لإنهاء المشاركة
      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        toast({
          title: "📺 انتهت مشاركة الشاشة",
          duration: 2000,
        });
      };

      toast({
        title: "📺 بدأت مشاركة الشاشة",
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      toast({
        title: "❌ فشل مشاركة الشاشة",
        description: "تعذر بدء مشاركة الشاشة",
        variant: "destructive",
      });
    }
  }, [toast]);

  // بدء التسجيل
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      await callSystemRef.current.startRecording();
      setIsRecording(true);
      
      toast({
        title: "🎥 بدأ التسجيل",
        description: "جاري تسجيل المكالمة",
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      toast({
        title: "❌ فشل بدء التسجيل",
        variant: "destructive",
      });
    }
  }, [toast]);

  // إيقاف التسجيل
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      const recordingBlob = await callSystemRef.current.stopRecording();
      setIsRecording(false);
      
      toast({
        title: "✅ تم حفظ التسجيل",
        description: "يمكنك تحميل التسجيل الآن",
        duration: 3000,
      });
      
      return recordingBlob;
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      toast({
        title: "❌ فشل إيقاف التسجيل",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // تبديل الكاميرا
  const switchCamera = useCallback(async (): Promise<void> => {
    try {
      await callSystemRef.current.switchCamera();
      toast({
        title: "📱 تم تبديل الكاميرا",
        duration: 1000,
      });
    } catch (error) {
      console.error('❌ Error switching camera:', error);
    }
  }, [toast]);

  // رفع اليد
  const raiseHand = useCallback((): void => {
    callSystemRef.current.raiseHand();
    toast({
      title: "✋ تم رفع اليد",
      duration: 2000,
    });
  }, [toast]);

  // إرسال رسالة
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!currentSession) return;
    
    try {
      await callSystemRef.current.sendChatMessage(message, currentSession.id);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "❌ فشل إرسال الرسالة",
        variant: "destructive",
      });
    }
  }, [currentSession, toast]);

  // إنهاء المكالمة
  const endCall = useCallback(async (): Promise<void> => {
    try {
      if (currentSession) {
        await callSystemRef.current.endCall(currentSession.id);
      }
      
      // تنظيف الحالات
      setCurrentSession(null);
      setParticipants([]);
      setIsConnected(false);
      setIsHost(false);
      setLocalStream(null);
      setRemoteStreams(new Map());
      setIsMuted(false);
      setIsVideoOff(false);
      setIsScreenSharing(false);
      setIsRecording(false);

      toast({
        title: "📞 انتهت المكالمة",
        description: "شكراً لاستخدام نظام المكالمات",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }, [currentSession, toast]);

  // تحديث إعدادات المكالمة
  const updateSettings = useCallback((newSettings: Partial<CallSettings>): void => {
    setCallSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // تنظيف الموارد
  useEffect(() => {
    return () => {
      callSystemRef.current.cleanup();
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  return {
    // حالات المكالمة
    currentSession,
    participants,
    isConnected,
    isHost,
    callStats,
    
    // حالات الوسائط
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    
    // إعدادات
    callSettings,
    updateSettings,
    
    // وظائف المكالمة
    createSession,
    joinSession,
    setupMedia,
    endCall,
    
    // وظائف التحكم
    toggleMute,
    toggleVideo,
    startScreenShare,
    startRecording,
    stopRecording,
    switchCamera,
    raiseHand,
    sendMessage
  };
}
