// 🚀 نظام مكالمات WhatsApp Style - مكالمات فردية مع إشعارات حقيقية
import { db, auth } from './firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, deleteDoc } from 'firebase/firestore';

export interface WhatsAppCall {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string | null;
  type: 'video' | 'audio';
  status: 'calling' | 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';
  createdAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
  jitsiRoomName?: string;
  jitsiRoomUrl?: string;
}

export class WhatsAppCallSystem {
  private jitsiAPI: any = null;
  private currentCall: WhatsAppCall | null = null;
  private isInCall: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    console.log('📞 WhatsApp Call System initialized');
    this.loadJitsiSDK();
  }

  // تحميل Jitsi SDK
  private async loadJitsiSDK(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && !(window as any).JitsiMeetExternalAPI) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Jitsi SDK loaded for WhatsApp calls');
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('❌ Error loading Jitsi SDK:', error);
    }
  }

  // بدء مكالمة جديدة (مثل WhatsApp)
  async startCall(
    receiverId: string,
    receiverName: string,
    type: 'video' | 'audio' = 'video',
    receiverAvatar: string | null = null
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      console.log('📞 Starting WhatsApp-style call:', { receiverId, receiverName, type });

      // إنشاء غرفة Jitsi فريدة للمكالمة
      const timestamp = Date.now();
      const roomName = `AlMaheron-Call-${user.uid}-${receiverId}-${timestamp}`;
      const roomUrl = `https://meet.jit.si/${roomName}`;

      const callData: Omit<WhatsAppCall, 'id'> = {
        callerId: user.uid,
        callerName: user.displayName || user.email || 'مستخدم',
        callerAvatar: user.photoURL || null,
        receiverId,
        receiverName,
        receiverAvatar: receiverAvatar || null,
        type,
        status: 'calling',
        createdAt: new Date(),
        jitsiRoomName: roomName,
        jitsiRoomUrl: roomUrl
      };

      console.log('📝 Call data:', callData);

      const docRef = await addDoc(collection(db, 'whatsapp_calls'), callData);
      console.log('✅ Call created:', docRef.id);

      this.currentCall = { ...callData, id: docRef.id };
      
      // تحديث الحالة إلى "رنين"
      setTimeout(async () => {
        await updateDoc(doc(db, 'whatsapp_calls', docRef.id), {
          status: 'ringing'
        });
      }, 1000);

      return docRef.id;
    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      throw new Error(`فشل بدء المكالمة: ${error?.message || 'خطأ غير معروف'}`);
    }
  }

  // قبول المكالمة
  async acceptCall(callId: string): Promise<void> {
    try {
      console.log('✅ Accepting call:', callId);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // تحديث حالة المكالمة
      await updateDoc(doc(db, 'whatsapp_calls', callId), {
        status: 'accepted',
        answeredAt: new Date()
      });

      console.log('✅ Call accepted, starting Jitsi...');
    } catch (error: any) {
      console.error('❌ Error accepting call:', error);
      throw new Error(`فشل قبول المكالمة: ${error?.message || 'خطأ غير معروف'}`);
    }
  }

  // رفض المكالمة
  async rejectCall(callId: string): Promise<void> {
    try {
      console.log('❌ Rejecting call:', callId);

      await updateDoc(doc(db, 'whatsapp_calls', callId), {
        status: 'rejected',
        endedAt: new Date()
      });

      console.log('❌ Call rejected');
    } catch (error: any) {
      console.error('❌ Error rejecting call:', error);
    }
  }

  // إنهاء المكالمة
  async endCall(callId: string): Promise<void> {
    try {
      console.log('📞 Ending call:', callId);

      const endTime = new Date();
      let duration = 0;

      if (this.currentCall?.answeredAt) {
        duration = Math.round((endTime.getTime() - this.currentCall.answeredAt.getTime()) / 1000);
      }

      await updateDoc(doc(db, 'whatsapp_calls', callId), {
        status: 'ended',
        endedAt: endTime,
        duration: duration
      });

      // إنهاء Jitsi
      if (this.jitsiAPI) {
        this.jitsiAPI.executeCommand('hangup');
        this.jitsiAPI.dispose();
        this.jitsiAPI = null;
      }

      this.cleanup();
      console.log('📞 Call ended successfully');
    } catch (error: any) {
      console.error('❌ Error ending call:', error);
    }
  }

  // بدء مكالمة Jitsi (بعد القبول)
  async startJitsiCall(call: WhatsAppCall): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Jitsi يعمل فقط في المتصفح');
      }

      console.log('🚀 Starting Jitsi call:', call.jitsiRoomName);

      await this.waitForJitsi();

      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI) {
        throw new Error('Jitsi SDK غير متوفر');
      }

      const user = auth.currentUser;
      const displayName = user?.displayName || user?.email || 'مشارك';

      // إعدادات مكالمة فردية (مثل WhatsApp)
      const options = {
        roomName: call.jitsiRoomName,
        width: '100%',
        height: '100%',
        parentNode: this.createCallContainer(),
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: call.type === 'audio',
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: this.getWhatsAppToolbarButtons(call.type),
          defaultLanguage: 'ar',
          // إعدادات مكالمة فردية
          maxParticipants: 2,
          enableLobby: false,
          enableNoiseCancellation: true,
          enableTalkWhileMuted: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: this.getWhatsAppToolbarButtons(call.type),
          SETTINGS_SECTIONS: ['devices', 'language'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DEFAULT_BACKGROUND: '#000000',
          DISABLE_VIDEO_BACKGROUND: false,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          TOOLBAR_TIMEOUT: 4000,
          // واجهة مكالمة فردية
          HIDE_INVITE_MORE_HEADER: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_PRESENCE_STATUS: true,
        },
        userInfo: {
          displayName: displayName,
          email: user?.email || ''
        }
      };

      console.log('🎛️ WhatsApp call options:', options);

      // إنشاء مكالمة Jitsi
      this.jitsiAPI = new JitsiMeetExternalAPI('meet.jit.si', options);
      this.currentCall = call;
      this.isInCall = true;

      // إعداد مستمعات الأحداث
      this.setupWhatsAppEventListeners();

      console.log('✅ WhatsApp-style call started');
    } catch (error: any) {
      console.error('❌ Error starting Jitsi call:', error);
      throw new Error(`فشل بدء المكالمة: ${error?.message || 'خطأ غير معروف'}`);
    }
  }

  // أزرار شريط الأدوات (مثل WhatsApp)
  private getWhatsAppToolbarButtons(type: 'video' | 'audio'): string[] {
    const buttons = ['microphone', 'hangup'];
    
    if (type === 'video') {
      buttons.unshift('camera');
    }
    
    // أزرار إضافية للمكالمات
    buttons.push('fullscreen');
    
    return buttons;
  }

  // إنشاء حاوي المكالمة (مثل WhatsApp)
  private createCallContainer(): HTMLElement {
    const existingContainer = document.getElementById('whatsapp-call-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const container = document.createElement('div');
    container.id = 'whatsapp-call-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: #000;
      display: flex;
      flex-direction: column;
    `;

    document.body.appendChild(container);
    return container;
  }

  // انتظار تحميل Jitsi
  private async waitForJitsi(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100;

      const checkJitsi = () => {
        if ((window as any).JitsiMeetExternalAPI) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkJitsi, 100);
        } else {
          reject(new Error('Jitsi SDK لم يتم تحميله'));
        }
      };

      checkJitsi();
    });
  }

  // إعداد مستمعات الأحداث (WhatsApp Style)
  private setupWhatsAppEventListeners(): void {
    if (!this.jitsiAPI) return;

    this.jitsiAPI.addEventListener('videoConferenceJoined', (event: any) => {
      console.log('✅ Joined WhatsApp call:', event);
      this.emit('callJoined', event);
    });

    this.jitsiAPI.addEventListener('participantJoined', (event: any) => {
      console.log('👤 Participant joined call:', event);
      this.emit('participantJoined', event);
    });

    this.jitsiAPI.addEventListener('participantLeft', (event: any) => {
      console.log('👋 Participant left call:', event);
      this.emit('participantLeft', event);
      
      // إذا غادر المشارك الآخر، أنهي المكالمة
      if (this.currentCall) {
        this.endCall(this.currentCall.id);
      }
    });

    this.jitsiAPI.addEventListener('videoConferenceLeft', (event: any) => {
      console.log('📞 Left WhatsApp call:', event);
      this.emit('callLeft', event);
      
      if (this.currentCall) {
        this.endCall(this.currentCall.id);
      }
    });

    this.jitsiAPI.addEventListener('readyToClose', () => {
      console.log('🚪 Ready to close call');
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

  // تنظيف الموارد
  cleanup(): void {
    if (this.jitsiAPI) {
      this.jitsiAPI.dispose();
      this.jitsiAPI = null;
    }

    const container = document.getElementById('whatsapp-call-container');
    if (container) {
      container.remove();
    }

    this.currentCall = null;
    this.isInCall = false;
    this.eventListeners.clear();
    console.log('🧹 WhatsApp call cleanup complete');
  }

  // الاستماع للمكالمات الواردة
  listenForIncomingCalls(callback: (calls: WhatsAppCall[]) => void): () => void {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No user authenticated');
      return () => {};
    }

    console.log('👂 Listening for incoming WhatsApp calls for user:', user.uid);

    const q = query(
      collection(db, 'whatsapp_calls'),
      where('receiverId', '==', user.uid),
      where('status', 'in', ['calling', 'ringing']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const calls: WhatsAppCall[] = [];
      snapshot.forEach((doc) => {
        calls.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          answeredAt: doc.data().answeredAt?.toDate(),
          endedAt: doc.data().endedAt?.toDate()
        } as WhatsAppCall);
      });

      console.log('📞 Incoming WhatsApp calls found:', calls.length);
      callback(calls);
    }, (error) => {
      console.error('❌ Error listening for calls:', error);
      callback([]);
    });
  }

  // الحصول على معلومات المكالمة الحالية
  getCurrentCall(): WhatsAppCall | null {
    return this.currentCall;
  }

  // التحقق من حالة المكالمة
  isCurrentlyInCall(): boolean {
    return this.isInCall;
  }
}
