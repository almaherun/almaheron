import { database } from './firebase';
import { ref, push, set, onValue, remove, serverTimestamp, get } from 'firebase/database';

export interface CallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: any;
  expiresAt: any;
}

export class CallNotificationManager {
  private teacherId: string;
  private listeners: Map<string, (data: any) => void> = new Map();

  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  // إرسال طلب مكالمة للمعلم
  async sendCallRequest(
    studentId: string,
    studentName: string,
    teacherName: string,
    roomId: string
  ): Promise<string> {
    try {
      // التحقق من وجود database
      if (!database) {
        throw new Error('Firebase Realtime Database is not initialized');
      }

      const callRequestsRef = ref(database, `call_requests/${this.teacherId}`);
      const newRequestRef = push(callRequestsRef);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 2); // ينتهي بعد دقيقتين

      const callRequest: Omit<CallRequest, 'id'> = {
        studentId,
        studentName,
        teacherId: this.teacherId,
        teacherName,
        roomId,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: expiresAt.getTime()
      };

      await set(newRequestRef, {
        ...callRequest,
        id: newRequestRef.key
      });

      // حذف الطلب تلقائياً بعد دقيقتين
      setTimeout(async () => {
        try {
          const snapshot = await get(newRequestRef);
          if (snapshot.exists() && snapshot.val().status === 'pending') {
            await set(newRequestRef, {
              ...snapshot.val(),
              status: 'cancelled'
            });
          }
        } catch (error) {
          console.error('Error in timeout cleanup:', error);
        }
      }, 120000); // 2 دقيقة

      return newRequestRef.key!;
    } catch (error) {
      console.error('Error sending call request:', error);
      throw error;
    }
  }

  // الاستماع لطلبات المكالمات (للمعلم)
  listenForCallRequests(callback: (requests: CallRequest[]) => void): () => void {
    const callRequestsRef = ref(database, `call_requests/${this.teacherId}`);
    
    const unsubscribe = onValue(callRequestsRef, (snapshot) => {
      const requests: CallRequest[] = [];
      const now = Date.now();
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.values(data).forEach((request: any) => {
          // تجاهل الطلبات المنتهية الصلاحية
          if (request.expiresAt > now) {
            requests.push(request);
          }
        });
      }
      
      // ترتيب حسب الأحدث
      requests.sort((a, b) => b.createdAt - a.createdAt);
      callback(requests);
    });

    return unsubscribe;
  }

  // قبول طلب المكالمة (المعلم)
  async acceptCallRequest(requestId: string): Promise<void> {
    const requestRef = ref(database, `call_requests/${this.teacherId}/${requestId}`);
    const snapshot = await import('firebase/database').then(({ get }) => get(requestRef));
    
    if (snapshot.exists()) {
      await set(requestRef, {
        ...snapshot.val(),
        status: 'accepted'
      });
    }
  }

  // رفض طلب المكالمة (المعلم)
  async rejectCallRequest(requestId: string): Promise<void> {
    const requestRef = ref(database, `call_requests/${this.teacherId}/${requestId}`);
    const snapshot = await import('firebase/database').then(({ get }) => get(requestRef));
    
    if (snapshot.exists()) {
      await set(requestRef, {
        ...snapshot.val(),
        status: 'rejected'
      });
    }
  }

  // إلغاء طلب المكالمة (الطالب)
  async cancelCallRequest(requestId: string): Promise<void> {
    const requestRef = ref(database, `call_requests/${this.teacherId}/${requestId}`);
    const snapshot = await import('firebase/database').then(({ get }) => get(requestRef));
    
    if (snapshot.exists()) {
      await set(requestRef, {
        ...snapshot.val(),
        status: 'cancelled'
      });
    }
  }

  // مراقبة حالة طلب المكالمة (للطالب)
  listenForCallRequestStatus(
    requestId: string, 
    callback: (status: 'pending' | 'accepted' | 'rejected' | 'cancelled') => void
  ): () => void {
    const requestRef = ref(database, `call_requests/${this.teacherId}/${requestId}`);
    
    const unsubscribe = onValue(requestRef, (snapshot) => {
      if (snapshot.exists()) {
        const request = snapshot.val();
        callback(request.status);
      } else {
        callback('cancelled');
      }
    });

    return unsubscribe;
  }

  // تنظيف الطلبات المنتهية الصلاحية
  async cleanupExpiredRequests(): Promise<void> {
    const callRequestsRef = ref(database, `call_requests/${this.teacherId}`);
    const snapshot = await import('firebase/database').then(({ get }) => get(callRequestsRef));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();
      
      for (const [key, request] of Object.entries(data) as [string, any][]) {
        if (request.expiresAt <= now || request.status !== 'pending') {
          await remove(ref(database, `call_requests/${this.teacherId}/${key}`));
        }
      }
    }
  }

  // Event listener system
  on(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  private emit(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }
}

// Helper functions
export function createCallNotificationManager(teacherId: string): CallNotificationManager {
  return new CallNotificationManager(teacherId);
}

export function playCallSound(): void {
  // تشغيل صوت المكالمة
  const audio = new Audio('/sounds/incoming-call.mp3');
  audio.loop = true;
  audio.play().catch(console.error);
  
  // إيقاف الصوت بعد 30 ثانية
  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 30000);
}
