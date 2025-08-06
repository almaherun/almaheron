'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// تعريف نوع Jitsi API
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetCallProps {
  roomId: string;
  userName: string;
  userType: 'student' | 'teacher';
  onCallEnd: () => void;
  remoteUserName?: string;
}

export default function JitsiMeetCall({
  roomId,
  userName,
  userType,
  onCallEnd,
  remoteUserName = 'المستخدم الآخر'
}: JitsiMeetCallProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  const { toast } = useToast();

  // تحميل Jitsi Meet API
  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        setIsJitsiLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Jitsi Meet API loaded successfully');
        setIsJitsiLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Jitsi Meet API');
        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل نظام المكالمات",
          variant: "destructive"
        });
      };
      document.head.appendChild(script);
    };

    loadJitsiScript();
  }, [toast]);

  // إنشاء مكالمة Jitsi
  useEffect(() => {
    if (!isJitsiLoaded || !jitsiContainerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: `almaheron_${roomId}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: userName,
        email: `${userType}@almaheron.app`
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        enableClosePage: false,
        prejoinPageEnabled: false,
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        // إعدادات الأمان
        enableLobbyChat: false,
        enableInsecureRoomNameWarning: false,
        enableAutomaticUrlCopy: false,
        // إعدادات اللغة العربية
        defaultLanguage: 'ar',
        // تحسين الجودة
        resolution: 720,
        constraints: {
          video: {
            aspectRatio: 16 / 9,
            height: {
              ideal: 720,
              max: 720,
              min: 240
            }
          }
        },
        // إخفاء بعض الأزرار غير المرغوب فيها
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'settings',
          'videoquality', 'filmstrip', 'tileview'
        ]
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        // تخصيص الألوان
        DEFAULT_BACKGROUND: '#1a1a2e',
        // إخفاء عناصر غير مرغوب فيها
        TOOLBAR_ALWAYS_VISIBLE: true,
        SETTINGS_SECTIONS: ['devices', 'language'],
        // تخصيص النصوص
        APP_NAME: 'أكاديمية المحيرون',
        NATIVE_APP_NAME: 'أكاديمية المحيرون',
        PROVIDER_NAME: 'أكاديمية المحيرون'
      }
    };

    console.log('🚀 Creating Jitsi Meet instance for room:', options.roomName);
    
    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // إعداد مستمعي الأحداث
      api.addEventListener('ready', () => {
        console.log('✅ Jitsi Meet is ready');
        setIsConnected(true);
        
        toast({
          title: "تم الاتصال بنجاح!",
          description: "المكالمة نشطة الآن",
          className: "bg-green-600 text-white"
        });
      });

      api.addEventListener('participantJoined', (participant: any) => {
        console.log('👤 Participant joined:', participant);
        setParticipantCount(prev => prev + 1);
        
        if (participantCount === 1) {
          toast({
            title: "انضم مستخدم جديد",
            description: `${remoteUserName} انضم للمكالمة`,
            className: "bg-blue-600 text-white"
          });
        }
      });

      api.addEventListener('participantLeft', (participant: any) => {
        console.log('👋 Participant left:', participant);
        setParticipantCount(prev => Math.max(1, prev - 1));
      });

      api.addEventListener('audioMuteStatusChanged', (event: any) => {
        setIsAudioMuted(event.muted);
      });

      api.addEventListener('videoMuteStatusChanged', (event: any) => {
        setIsVideoMuted(event.muted);
      });

      api.addEventListener('readyToClose', () => {
        console.log('📞 Call ended');
        onCallEnd();
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('🚪 Left video conference');
        onCallEnd();
      });

    } catch (error) {
      console.error('❌ Error creating Jitsi Meet instance:', error);
      toast({
        title: "خطأ في بدء المكالمة",
        description: "حدث خطأ في إنشاء المكالمة",
        variant: "destructive"
      });
    }

    // تنظيف عند إلغاء المكون
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [isJitsiLoaded, roomId, userName, userType, onCallEnd, remoteUserName, participantCount, toast]);

  // دوال التحكم
  const toggleAudio = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const endCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
    }
    onCallEnd();
  };

  // إخفاء شريط التنقل السفلي
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const hideNavigationBars = () => {
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
        });
      });
    };

    hideNavigationBars();

    return () => {
      document.body.style.overflow = 'auto';
      
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
        });
      });
    };
  }, []);

  if (!isJitsiLoaded) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-2xl font-bold text-white mb-2">جاري تحميل نظام المكالمات...</h3>
          <p className="text-blue-200">يرجى الانتظار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Jitsi Meet Container */}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '100vh' }}
      />
      
      {/* Custom Controls Overlay (اختياري) */}
      {isConnected && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>متصل - {participantCount} مشارك</span>
          </div>
        </div>
      )}
    </div>
  );
}
