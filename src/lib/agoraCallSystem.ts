// نظام مكالمات باستخدام Agora.io - 10000 دقيقة مجانية شهرياً
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export interface AgoraCallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  channelName: string;
  token?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: any;
  expiresAt: any;
  callType: 'audio' | 'video';

  // حقول إضافية للتتبع المحسن
  senderId?: string;
  senderName?: string;
  senderType?: 'student' | 'teacher';
}

export class AgoraCallSystem {
  private userId: string;
  private userType: 'student' | 'teacher';
  private appId: string;

  constructor(userId: string, userType: 'student' | 'teacher') {
    this.userId = userId;
    this.userType = userType;
    this.appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  }

  // إنشاء اسم قناة فريد
  private generateChannelName(): string {
    return `almaheron_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // إنشاء Token للمصادقة (مبسط للتطوير)
  private async generateToken(channelName: string, uid: number): Promise<string> {
    try {
      // في الإنتاج، يجب إنشاء Token من الخادم
      // هنا نستخدم null للتطوير (يعمل في Test Mode)
      return '';
    } catch (error) {
      console.error('Error generating token:', error);
      return '';
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
      const channelName = this.generateChannelName();
      
      // حفظ طلب المكالمة في Firebase مع تحديد صحيح للمعلم والطالب
      let studentId, studentName, teacherId, teacherName;

      if (this.userType === 'student') {
        // الطالب يتصل بالمعلم
        studentId = this.userId;
        studentName = senderName;
        teacherId = receiverId;
        teacherName = receiverName;
      } else {
        // المعلم يتصل بالطالب
        studentId = receiverId;
        studentName = receiverName;
        teacherId = this.userId;
        teacherName = senderName;
      }

      const callRequest: Omit<AgoraCallRequest, 'id'> = {
        studentId,
        studentName,
        teacherId,
        teacherName,
        channelName,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // ينتهي خلال 5 دقائق (زيادة الوقت)
        callType,
        // إضافة معلومات إضافية للتتبع
        senderId: this.userId,
        senderName: senderName,
        senderType: this.userType
      };

      const docRef = await addDoc(collection(db, 'agora_call_requests'), callRequest);

      console.log('📞 Agora call request sent:', {
        id: docRef.id,
        channelName,
        from: senderName,
        to: receiverName,
        type: callType,
        senderType: this.userType,
        callRequest: {
          studentId: callRequest.studentId,
          studentName: callRequest.studentName,
          teacherId: callRequest.teacherId,
          teacherName: callRequest.teacherName,
          senderId: callRequest.senderId,
          senderType: callRequest.senderType
        }
      });

      console.log('🎯 Call routing details:', {
        senderUserId: this.userId,
        senderType: this.userType,
        receiverId: receiverId,
        expectedTeacherId: this.userType === 'student' ? receiverId : this.userId,
        expectedStudentId: this.userType === 'student' ? this.userId : receiverId
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending call request:', error);
      throw error;
    }
  }

  // قبول طلب المكالمة
  async acceptCallRequest(requestId: string): Promise<{ channelName: string; token?: string }> {
    try {
      const requestRef = doc(db, 'agora_call_requests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted'
      });

      // الحصول على معلومات القناة
      const requestDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(requestRef));
      const requestData = requestDoc.data() as AgoraCallRequest;
      
      // إنشاء Token إذا لزم الأمر
      const token = await this.generateToken(requestData.channelName, parseInt(this.userId) || 0);
      
      console.log('✅ Call request accepted:', requestId);
      return {
        channelName: requestData.channelName,
        token
      };
    } catch (error) {
      console.error('Error accepting call request:', error);
      throw error;
    }
  }

  // رفض طلب المكالمة
  async rejectCallRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'agora_call_requests', requestId);
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
  listenForIncomingCalls(callback: (requests: AgoraCallRequest[]) => void): () => void {
    try {
      const fieldToQuery = this.userType === 'teacher' ? 'teacherId' : 'studentId';

      console.log(`🔍 Setting up call listener for ${this.userType}:`, {
        userId: this.userId,
        fieldToQuery: fieldToQuery,
        userType: this.userType
      });

      const q = query(
        collection(db, 'agora_call_requests'),
        where(fieldToQuery, '==', this.userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const requests: AgoraCallRequest[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
              id: doc.id,
              ...data
            } as AgoraCallRequest);
          });

          console.log(`📞 Incoming calls for ${this.userType} (${this.userId}):`, {
            count: requests.length,
            requests: requests.map(r => ({
              id: r.id,
              from: r.senderName || (this.userType === 'teacher' ? r.studentName : r.teacherName),
              type: r.callType,
              status: r.status
            }))
          });

          callback(requests);
        } catch (error) {
          console.error('Error processing incoming calls:', error);
          callback([]);
        }
      }, (error) => {
        console.error('Error listening for incoming calls:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up incoming calls listener:', error);
      return () => {}; // إرجاع دالة فارغة في حالة الخطأ
    }
  }

  // الاستماع لحالة طلب مكالمة محدد
  listenForCallStatus(requestId: string, callback: (status: string, data?: any) => void): () => void {
    const requestRef = doc(db, 'agora_call_requests', requestId);
    
    const unsubscribe = onSnapshot(requestRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as AgoraCallRequest;
        console.log(`📞 Call status update for ${requestId}:`, data.status);
        callback(data.status, {
          channelName: data.channelName,
          token: data.token
        });
      }
    });

    return unsubscribe;
  }

  // الحصول على إعدادات Agora
  getAgoraConfig() {
    return {
      appId: this.appId,
      // إعدادات الجودة
      videoProfile: '720p_1', // HD 720p
      audioProfile: 'high_quality_stereo',
      // إعدادات الشبكة
      mode: 'rtc', // Real-time communication
      codec: 'vp8', // VP8 codec for better compatibility
    };
  }
}

// دالة مساعدة لإنشاء نظام المكالمات
export function createAgoraCallSystem(userId: string, userType: 'student' | 'teacher'): AgoraCallSystem {
  return new AgoraCallSystem(userId, userType);
}

// معلومات الخدمة
export const AGORA_SERVICE_INFO = {
  name: 'Agora.io',
  freeMinutes: 10000, // 10000 دقيقة مجانية شهرياً
  features: [
    'مكالمات فيديو عالية الجودة HD/4K',
    'مكالمات صوتية نقية',
    'زمن استجابة منخفض جداً (<300ms)',
    'دعم عالمي في 200+ دولة',
    'مقاومة فقدان الشبكة',
    'تشفير end-to-end',
    'مشاركة الشاشة',
    'تسجيل المكالمات',
    'بث مباشر',
    'دعم الهواتف المحمولة'
  ],
  limits: {
    maxParticipants: 'غير محدود',
    maxDuration: 'غير محدود',
    monthlyMinutes: 10000,
    videoQuality: 'حتى 4K',
    audioQuality: '48kHz Stereo'
  },
  regions: [
    'الشرق الأوسط',
    'أوروبا',
    'آسيا',
    'أمريكا الشمالية',
    'أمريكا الجنوبية',
    'أفريقيا',
    'أوقيانوسيا'
  ]
};
