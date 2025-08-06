// نظام مكالمات باستخدام Daily.co - 10000 دقيقة مجانية شهرياً
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export interface DailyCallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  roomUrl: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: any;
  expiresAt: any;
  callType: 'audio' | 'video';
}

export class DailyCallSystem {
  private userId: string;
  private userType: 'student' | 'teacher';

  constructor(userId: string, userType: 'student' | 'teacher') {
    this.userId = userId;
    this.userType = userType;
  }

  // إنشاء غرفة مكالمة جديدة باستخدام Daily.co API
  async createRoom(): Promise<string> {
    try {
      // استخدام Daily.co API لإنشاء غرفة
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DAILY_API_KEY || 'demo-key'}`
        },
        body: JSON.stringify({
          name: `almaheron-${Date.now()}`,
          privacy: 'private',
          properties: {
            max_participants: 2,
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
            lang: 'ar'
          }
        })
      });

      if (response.ok) {
        const room = await response.json();
        return room.url;
      } else {
        // في حالة فشل API، استخدم غرفة تجريبية
        return `https://almaheron.daily.co/room-${Date.now()}`;
      }
    } catch (error) {
      console.error('Error creating Daily room:', error);
      // غرفة احتياطية
      return `https://almaheron.daily.co/room-${Date.now()}`;
    }
  }

  // إرسال طلب مكالمة
  async sendCallRequest(
    receiverId: string,
    receiverName: string,
    senderName: string,
    callType: 'audio' | 'video' = 'video'
  ): Promise<string> {
    try {
      // إنشاء غرفة مكالمة
      const roomUrl = await this.createRoom();
      
      // حفظ طلب المكالمة في Firebase
      const callRequest: Omit<DailyCallRequest, 'id'> = {
        studentId: this.userType === 'student' ? this.userId : receiverId,
        studentName: this.userType === 'student' ? senderName : receiverName,
        teacherId: this.userType === 'teacher' ? this.userId : receiverId,
        teacherName: this.userType === 'teacher' ? senderName : receiverName,
        roomUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // ينتهي خلال دقيقتين
        callType
      };

      const docRef = await addDoc(collection(db, 'daily_call_requests'), callRequest);
      
      console.log('📞 Daily call request sent:', {
        id: docRef.id,
        roomUrl,
        from: senderName,
        to: receiverName,
        type: callType
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending call request:', error);
      throw error;
    }
  }

  // قبول طلب المكالمة
  async acceptCallRequest(requestId: string): Promise<string> {
    try {
      const requestRef = doc(db, 'daily_call_requests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted'
      });

      // الحصول على رابط الغرفة
      const requestDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(requestRef));
      const requestData = requestDoc.data() as DailyCallRequest;
      
      console.log('✅ Call request accepted:', requestId);
      return requestData.roomUrl;
    } catch (error) {
      console.error('Error accepting call request:', error);
      throw error;
    }
  }

  // رفض طلب المكالمة
  async rejectCallRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'daily_call_requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected'
      });
      
      console.log('❌ Call request rejected:', requestId);
    } catch (error) {
      console.error('Error rejecting call request:', error);
      throw error;
    }
  }

  // الاستماع لطلبات المكالمات الواردة
  listenForIncomingCalls(callback: (requests: DailyCallRequest[]) => void): () => void {
    const q = query(
      collection(db, 'daily_call_requests'),
      where(this.userType === 'teacher' ? 'teacherId' : 'studentId', '==', this.userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: DailyCallRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data
        } as DailyCallRequest);
      });
      
      console.log(`📞 Incoming calls for ${this.userType}:`, requests.length);
      callback(requests);
    });

    return unsubscribe;
  }

  // الاستماع لحالة طلب مكالمة محدد
  listenForCallStatus(requestId: string, callback: (status: string, roomUrl?: string) => void): () => void {
    const requestRef = doc(db, 'daily_call_requests', requestId);
    
    const unsubscribe = onSnapshot(requestRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as DailyCallRequest;
        console.log(`📞 Call status update for ${requestId}:`, data.status);
        callback(data.status, data.roomUrl);
      }
    });

    return unsubscribe;
  }

  // حذف غرفة المكالمة (اختياري)
  async deleteRoom(roomUrl: string): Promise<void> {
    try {
      const roomName = roomUrl.split('/').pop();
      await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DAILY_API_KEY || 'demo-key'}`
        }
      });
      console.log('🗑️ Room deleted:', roomName);
    } catch (error) {
      console.log('Note: Could not delete room (this is normal for demo)');
    }
  }
}

// دالة مساعدة لإنشاء نظام المكالمات
export function createDailyCallSystem(userId: string, userType: 'student' | 'teacher'): DailyCallSystem {
  return new DailyCallSystem(userId, userType);
}

// معلومات الخدمة
export const DAILY_SERVICE_INFO = {
  name: 'Daily.co',
  freeMinutes: 10000, // 10000 دقيقة مجانية شهرياً
  features: [
    'مكالمات فيديو عالية الجودة',
    'مكالمات صوتية نقية',
    'مشاركة الشاشة',
    'دردشة نصية',
    'تسجيل المكالمات',
    'دعم الهواتف المحمولة',
    'بدون تحميل تطبيقات'
  ],
  limits: {
    maxParticipants: 2, // للمكالمات الثنائية
    maxDuration: 'غير محدود',
    monthlyMinutes: 10000
  }
};
