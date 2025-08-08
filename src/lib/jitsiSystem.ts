// 🚀 نظام مكالمات Jitsi Meet - مجاني 100% بدون API keys
import { db, auth } from './firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export interface JitsiSession {
  id: string;
  roomName: string;
  roomUrl: string;
  hostId: string;
  hostName: string;
  studentId?: string;
  studentName?: string;
  title: string;
  type: 'video' | 'audio' | 'quran';
  status: 'waiting' | 'active' | 'ended';
  participants: string[];
  createdAt: Date;
  endedAt?: Date;
  duration?: number;
  settings: {
    enableChat: boolean;
    enableScreenShare: boolean;
    enableRecording: boolean;
    isPrivate: boolean;
  };
}

export class JitsiSystem {
  private jitsiAPI: any = null;
  private currentSession: JitsiSession | null = null;
  private isHost: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    console.log('🚀 Jitsi Meet System initialized');
    this.loadJitsiSDK();
  }

  // تحميل Jitsi Meet SDK
  private async loadJitsiSDK(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && !(window as any).JitsiMeetExternalAPI) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Jitsi Meet SDK loaded successfully');
        };
        script.onerror = () => {
          console.error('❌ Failed to load Jitsi Meet SDK');
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('❌ Error loading Jitsi SDK:', error);
    }
  }

  // إنشاء جلسة مكالمة جديدة
  async createSession(
    title: string,
    type: 'video' | 'audio' | 'quran' = 'video',
    targetUserId?: string,
    targetUserName?: string,
    settings: Partial<JitsiSession['settings']> = {}
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      console.log('🏠 Creating Jitsi session:', { title, type, targetUserId });

      // إنشاء اسم غرفة فريد ومناسب
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 6);
      const roomName = `AlMaheron-${type}-${timestamp}-${randomId}`;
      const roomUrl = `https://meet.jit.si/${roomName}`;

      const defaultSettings = {
        enableChat: true,
        enableScreenShare: true,
        enableRecording: type === 'quran',
        isPrivate: true,
        ...settings
      };

      const sessionData: Omit<JitsiSession, 'id'> = {
        roomName,
        roomUrl,
        hostId: user.uid,
        hostName: user.displayName || user.email || 'المضيف',
        studentId: targetUserId,
        studentName: targetUserName,
        title,
        type,
        status: 'waiting',
        participants: [user.uid],
        createdAt: new Date(),
        settings: defaultSettings
      };

      console.log('📝 Session data:', sessionData);

      const docRef = await addDoc(collection(db, 'jitsi_sessions'), sessionData);
      console.log('✅ Jitsi session created:', docRef.id);

      this.isHost = true;
      this.currentSession = { ...sessionData, id: docRef.id };
      
      return docRef.id;
    } catch (error: any) {
      console.error('❌ Error creating Jitsi session:', error);
      throw new Error(`فشل إنشاء الجلسة: ${error?.message || 'خطأ غير معروف'}`);
    }
  }

  // بدء المكالمة
  async startCall(sessionId?: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Jitsi Meet يعمل فقط في المتصفح');
      }

      console.log('🚀 Starting Jitsi call for session:', sessionId);

      // انتظار تحميل Jitsi SDK
      await this.waitForJitsi();

      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI) {
        throw new Error('Jitsi Meet SDK غير متوفر');
      }

      if (!this.currentSession) {
        throw new Error('لا توجد جلسة نشطة');
      }

      const user = auth.currentUser;
      const displayName = user?.displayName || user?.email || 'مشارك';

      // إعدادات المكالمة المخصصة
      const options = {
        roomName: this.currentSession.roomName,
        width: '100%',
        height: '100%',
        parentNode: this.createJitsiContainer(),
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: this.currentSession.type === 'audio',
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: this.getToolbarButtons(),
          defaultLanguage: 'ar',
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: this.getToolbarButtons(),
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: '#16a34a',
          DISABLE_VIDEO_BACKGROUND: false,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          TOOLBAR_TIMEOUT: 4000,
        },
        userInfo: {
          displayName: displayName,
          email: user?.email || ''
        }
      };

      console.log('🎛️ Jitsi options:', options);

      // إنشاء مثيل Jitsi
      this.jitsiAPI = new JitsiMeetExternalAPI('meet.jit.si', options);

      console.log('✅ Jitsi call started successfully');

      // إعداد مستمعات الأحداث
      this.setupEventListeners();

      // تحديث حالة الجلسة
      if (sessionId) {
        await updateDoc(doc(db, 'jitsi_sessions', sessionId), {
          status: 'active',
          participants: [...this.currentSession.participants, user?.uid].filter(Boolean)
        });
      }

    } catch (error: any) {
      console.error('❌ Error starting Jitsi call:', error);
      throw new Error(`فشل بدء المكالمة: ${error?.message || 'خطأ غير معروف'}`);
    }
  }

  // الحصول على أزرار شريط الأدوات حسب نوع المكالمة
  private getToolbarButtons(): string[] {
    const baseButtons = [
      'microphone', 'camera', 'hangup', 'chat', 'raisehand'
    ];

    if (this.currentSession?.settings.enableScreenShare) {
      baseButtons.push('desktop');
    }

    if (this.currentSession?.settings.enableRecording && this.isHost) {
      baseButtons.push('recording');
    }

    if (this.currentSession?.type === 'quran') {
      baseButtons.push('whiteboard', 'etherpad');
    }

    baseButtons.push('fullscreen', 'settings');

    return baseButtons;
  }

  // إنشاء حاوي Jitsi
  private createJitsiContainer(): HTMLElement {
    // إزالة الحاوي السابق إن وجد
    const existingContainer = document.getElementById('jitsi-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // إنشاء حاوي جديد
    const container = document.createElement('div');
    container.id = 'jitsi-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: #000;
    `;

    document.body.appendChild(container);
    return container;
  }

  // انتظار تحميل Jitsi SDK
  private async waitForJitsi(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 ثوان

      const checkJitsi = () => {
        if ((window as any).JitsiMeetExternalAPI) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkJitsi, 100);
        } else {
          reject(new Error('Jitsi Meet SDK لم يتم تحميله في الوقت المحدد'));
        }
      };

      checkJitsi();
    });
  }

  // إعداد مستمعات الأحداث
  private setupEventListeners(): void {
    if (!this.jitsiAPI) return;

    this.jitsiAPI.addEventListener('videoConferenceJoined', (event: any) => {
      console.log('✅ Joined Jitsi meeting:', event);
      this.emit('joined', event);
    });

    this.jitsiAPI.addEventListener('participantJoined', (event: any) => {
      console.log('👤 Participant joined:', event);
      this.emit('participantJoined', event);
    });

    this.jitsiAPI.addEventListener('participantLeft', (event: any) => {
      console.log('👋 Participant left:', event);
      this.emit('participantLeft', event);
    });

    this.jitsiAPI.addEventListener('videoConferenceLeft', (event: any) => {
      console.log('📞 Left Jitsi meeting:', event);
      this.emit('left', event);
      this.cleanup();
    });

    this.jitsiAPI.addEventListener('readyToClose', () => {
      console.log('🚪 Ready to close Jitsi');
      this.cleanup();
    });
  }

  // نظام الأحداث
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // إنهاء المكالمة
  async endCall(): Promise<void> {
    try {
      if (this.jitsiAPI) {
        this.jitsiAPI.executeCommand('hangup');
        this.jitsiAPI.dispose();
        this.jitsiAPI = null;
      }

      // تحديث حالة الجلسة
      if (this.currentSession) {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - this.currentSession.createdAt.getTime()) / 1000);

        await updateDoc(doc(db, 'jitsi_sessions', this.currentSession.id), {
          status: 'ended',
          endedAt: endTime,
          duration: duration
        });
      }

      console.log('📞 Jitsi call ended');
    } catch (error) {
      console.error('❌ Error ending Jitsi call:', error);
    }
  }

  // تنظيف الموارد
  cleanup(): void {
    if (this.jitsiAPI) {
      this.jitsiAPI.dispose();
      this.jitsiAPI = null;
    }

    // إزالة حاوي Jitsi
    const container = document.getElementById('jitsi-container');
    if (container) {
      container.remove();
    }

    this.currentSession = null;
    this.isHost = false;
    this.eventListeners.clear();
    console.log('🧹 Jitsi cleanup complete');
  }

  // الاستماع للجلسات الواردة
  listenForIncomingSessions(callback: (sessions: JitsiSession[]) => void): () => void {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No user authenticated for listening');
      return () => {};
    }

    console.log('👂 Listening for incoming Jitsi sessions for user:', user.uid);

    const q = query(
      collection(db, 'jitsi_sessions'),
      where('studentId', '==', user.uid),
      where('status', '==', 'waiting')
    );

    return onSnapshot(q, (snapshot) => {
      const sessions: JitsiSession[] = [];
      snapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          endedAt: doc.data().endedAt?.toDate()
        } as JitsiSession);
      });

      console.log('📞 Incoming sessions found:', sessions.length);
      callback(sessions);
    }, (error) => {
      console.error('❌ Error listening for sessions:', error);
      callback([]);
    });
  }
}
