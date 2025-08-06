import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface CallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export class FirestoreCallNotificationManager {
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
      const requestId = `${studentId}_${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 2); // ينتهي بعد دقيقتين

      const callRequest: Omit<CallRequest, 'id'> = {
        studentId,
        studentName,
        teacherId: this.teacherId,
        teacherName,
        roomId,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      const docRef = doc(db, 'call_requests', requestId);
      await setDoc(docRef, {
        ...callRequest,
        id: requestId
      });

      // حذف الطلب تلقائياً بعد دقيقتين
      setTimeout(async () => {
        try {
          await updateDoc(docRef, {
            status: 'cancelled'
          });
          // حذف الطلب بعد 5 ثوان من الإلغاء
          setTimeout(async () => {
            try {
              await deleteDoc(docRef);
            } catch (error) {
              console.error('Error deleting expired request:', error);
            }
          }, 5000);
        } catch (error) {
          console.error('Error in timeout cleanup:', error);
        }
      }, 120000); // 2 دقيقة

      return requestId;
    } catch (error) {
      console.error('Error sending call request:', error);
      throw error;
    }
  }

  // الاستماع لطلبات المكالمات (للمعلم)
  listenForCallRequests(callback: (requests: CallRequest[]) => void): () => void {
    const q = query(
      collection(db, 'call_requests'),
      where('teacherId', '==', this.teacherId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: CallRequest[] = [];
      const now = new Date();
      
      snapshot.forEach((doc) => {
        const data = doc.data() as CallRequest;
        // تجاهل الطلبات المنتهية الصلاحية
        if (data.expiresAt.toDate() > now) {
          requests.push(data);
        }
      });
      
      callback(requests);
    }, (error) => {
      console.error('Error listening for call requests:', error);
      callback([]);
    });

    return unsubscribe;
  }

  // قبول طلب المكالمة (المعلم)
  async acceptCallRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'call_requests', requestId);
      await updateDoc(docRef, {
        status: 'accepted'
      });
    } catch (error) {
      console.error('Error accepting call request:', error);
      throw error;
    }
  }

  // رفض طلب المكالمة (المعلم)
  async rejectCallRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'call_requests', requestId);
      await updateDoc(docRef, {
        status: 'rejected'
      });
      // حذف الطلب بعد 3 ثوان
      setTimeout(async () => {
        try {
          await deleteDoc(docRef);
        } catch (error) {
          console.error('Error deleting rejected request:', error);
        }
      }, 3000);
    } catch (error) {
      console.error('Error rejecting call request:', error);
      throw error;
    }
  }

  // إلغاء طلب المكالمة (الطالب)
  async cancelCallRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, 'call_requests', requestId);
      await updateDoc(docRef, {
        status: 'cancelled'
      });
      // حذف الطلب بعد ثانية واحدة
      setTimeout(async () => {
        try {
          await deleteDoc(docRef);
        } catch (error) {
          console.error('Error deleting cancelled request:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error cancelling call request:', error);
      throw error;
    }
  }

  // مراقبة حالة طلب المكالمة (للطالب)
  listenForCallRequestStatus(
    requestId: string, 
    callback: (status: 'pending' | 'accepted' | 'rejected' | 'cancelled') => void
  ): () => void {
    const docRef = doc(db, 'call_requests', requestId);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as CallRequest;
        callback(data.status);
      } else {
        callback('cancelled');
      }
    }, (error) => {
      console.error('Error listening for call request status:', error);
      callback('cancelled');
    });

    return unsubscribe;
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
export function createFirestoreCallNotificationManager(teacherId: string): FirestoreCallNotificationManager {
  return new FirestoreCallNotificationManager(teacherId);
}

export function playCallSound(): void {
  // تشغيل صوت المكالمة
  try {
    const audio = new Audio('/sounds/incoming-call.mp3');
    audio.loop = true;
    audio.play().catch(console.error);
    
    // إيقاف الصوت بعد 30 ثانية
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 30000);
  } catch (error) {
    console.error('Error playing call sound:', error);
  }
}
