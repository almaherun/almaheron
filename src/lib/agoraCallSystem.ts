// 🚀 نظام مكالمات Agora.io الموحد - يحل محل جميع الأنظمة الأخرى
import { db, auth } from './firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';

// واجهة موحدة لجميع أنواع المكالمات
export interface UnifiedCallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  channelName: string;
  token?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'ended';
  createdAt: any;
  expiresAt: any;
  callType: 'audio' | 'video';

  // معلومات المرسل والمستقبل
  senderId: string;
  senderName: string;
  senderType: 'student' | 'teacher';
  receiverId: string;
  receiverName: string;

  // أنماط المكالمات المختلفة
  callStyle: 'whatsapp' | 'simple' | 'professional'; // نمط المكالمة
  isDirectCall: boolean; // مكالمة مباشرة أم طلب مكالمة

  // معلومات إضافية
  callerAvatar?: string | null;
  receiverAvatar?: string | null;
  priority: 'normal' | 'high' | 'urgent';

  // إعدادات المكالمة
  settings: {
    enableChat: boolean;
    enableScreenShare: boolean;
    enableRecording: boolean;
    maxParticipants: number;
    autoAccept: boolean;
  };

  // معلومات المكالمة
  startedAt?: any;
  endedAt?: any;
  duration?: number;
  endReason?: 'completed' | 'cancelled' | 'rejected' | 'timeout' | 'error';
}

// للتوافق مع الكود الحالي
export interface AgoraCallRequest extends UnifiedCallRequest {}

export class UnifiedAgoraCallSystem {
  private userId: string;
  private userType: 'student' | 'teacher';
  private appId: string;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(userId: string, userType: 'student' | 'teacher') {
    console.log('🚀 Unified Agora System constructor called with:', { userId, userType });

    // التحقق من userId وإصلاحه إذا كان فارغاً
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ Unified Agora: userId is empty, trying Firebase Auth fallback');
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('✅ Using Firebase Auth UID as fallback:', currentUser.uid);
        this.userId = currentUser.uid;
      } else {
        console.error('❌ No Firebase Auth user available');
        throw new Error(`Unified Agora: userId cannot be empty and no Firebase Auth user available. Received: "${userId}"`);
      }
    } else {
      this.userId = userId;
    }

    this.userType = userType;
    this.appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

    console.log('🚀 Unified Agora System initialized:', {
      userId: this.userId,
      userType: this.userType,
      appId: this.appId ? 'configured' : 'missing'
    });
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

  // 📞 إرسال مكالمة بنمط WhatsApp (مباشرة)
  async startWhatsAppCall(
    receiverId: string,
    receiverName: string,
    callType: 'audio' | 'video' = 'video',
    receiverAvatar: string | null = null
  ): Promise<string> {
    return this.sendUnifiedCallRequest(receiverId, receiverName, callType, {
      callStyle: 'whatsapp',
      isDirectCall: true,
      priority: 'high',
      callerAvatar: auth.currentUser?.photoURL || null,
      receiverAvatar,
      settings: {
        enableChat: false,
        enableScreenShare: false,
        enableRecording: false,
        maxParticipants: 2,
        autoAccept: false
      }
    });
  }

  // 📞 إرسال مكالمة بسيطة
  async startSimpleCall(
    receiverId: string,
    receiverName: string,
    callType: 'audio' | 'video' = 'video'
  ): Promise<string> {
    return this.sendUnifiedCallRequest(receiverId, receiverName, callType, {
      callStyle: 'simple',
      isDirectCall: false,
      priority: 'normal',
      settings: {
        enableChat: true,
        enableScreenShare: true,
        enableRecording: false,
        maxParticipants: 2,
        autoAccept: false
      }
    });
  }

  // 📞 إرسال مكالمة احترافية
  async startProfessionalCall(
    receiverId: string,
    receiverName: string,
    callType: 'audio' | 'video' = 'video'
  ): Promise<string> {
    return this.sendUnifiedCallRequest(receiverId, receiverName, callType, {
      callStyle: 'professional',
      isDirectCall: false,
      priority: 'normal',
      settings: {
        enableChat: true,
        enableScreenShare: true,
        enableRecording: true,
        maxParticipants: 10,
        autoAccept: false
      }
    });
  }

  // 🔧 دالة موحدة لإرسال طلبات المكالمات
  private async sendUnifiedCallRequest(
    receiverId: string,
    receiverName: string,
    callType: 'audio' | 'video',
    options: {
      callStyle: 'whatsapp' | 'simple' | 'professional';
      isDirectCall: boolean;
      priority: 'normal' | 'high' | 'urgent';
      callerAvatar?: string | null;
      receiverAvatar?: string | null;
      settings: UnifiedCallRequest['settings'];
    }
  ): Promise<string> {
    try {
      const channelName = this.generateChannelName();
      const user = auth.currentUser;
      const senderName = user?.displayName || user?.email || 'مستخدم';

      // تحديد معلومات المكالمة
      let studentId, studentName, teacherId, teacherName;

      console.log('🔍 Unified call details:', {
        userType: this.userType,
        userId: this.userId,
        receiverId,
        senderName,
        receiverName,
        callStyle: options.callStyle
      });

      if (this.userType === 'student') {
        studentId = this.userId;
        studentName = senderName;
        teacherId = receiverId;
        teacherName = receiverName;
      } else {
        studentId = receiverId;
        studentName = receiverName;
        teacherId = this.userId;
        teacherName = senderName;
      }

      // التحقق من أن جميع القيم المطلوبة موجودة
      if (!studentId || !teacherId) {
        throw new Error(`Missing required IDs: studentId=${studentId}, teacherId=${teacherId}`);
      }

      // إنشاء طلب مكالمة موحد
      const callRequest: Omit<UnifiedCallRequest, 'id'> = {
        studentId,
        studentName,
        teacherId,
        teacherName,
        channelName,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        callType,

        // معلومات المرسل والمستقبل
        senderId: this.userId,
        senderName,
        senderType: this.userType,
        receiverId,
        receiverName,

        // إعدادات المكالمة الموحدة
        callStyle: options.callStyle,
        isDirectCall: options.isDirectCall,
        priority: options.priority,
        callerAvatar: options.callerAvatar,
        receiverAvatar: options.receiverAvatar,
        settings: options.settings
      };

      const docRef = await addDoc(collection(db, 'agora_call_requests'), callRequest);

      console.log(`🚀 ${options.callStyle.toUpperCase()} call request sent:`, {
        id: docRef.id,
        channelName,
        from: senderName,
        to: receiverName,
        type: callType,
        style: options.callStyle,
        isDirect: options.isDirectCall,
        priority: options.priority,

        // تفاصيل التوجيه
        routing: {
          senderId: callRequest.senderId,
          senderName: callRequest.senderName,
          senderType: callRequest.senderType,
          receiverId: callRequest.receiverId,
          receiverName: callRequest.receiverName,
          studentId: callRequest.studentId,
          teacherId: callRequest.teacherId
        },

        // تفاصيل قاعدة البيانات
        database: {
          collection: 'agora_call_requests',
          documentId: docRef.id,
          teacherShouldQuery: `teacherId == ${callRequest.teacherId}`,
          studentShouldQuery: `studentId == ${callRequest.studentId}`
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

  // 🔄 دالة للتوافق مع الكود الحالي - إرسال طلب مكالمة عادي
  async sendCallRequest(
    receiverId: string,
    receiverName: string,
    senderName: string,
    callType: 'audio' | 'video' = 'video'
  ): Promise<string> {
    return this.startSimpleCall(receiverId, receiverName, callType);
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

  // 🔧 دالة بديلة مبسطة للاستماع للمكالمات
  listenForIncomingCallsSimple(callback: (requests: AgoraCallRequest[]) => void): () => void {
    try {
      console.log('🔧 Using simplified call listener...');

      // استعلام بسيط جداً - فقط حسب المستخدم
      const fieldToQuery = this.userType === 'teacher' ? 'teacherId' : 'studentId';
      const simpleQuery = query(
        collection(db, 'agora_call_requests'),
        where(fieldToQuery, '==', this.userId)
      );

      const unsubscribe = onSnapshot(simpleQuery, (snapshot) => {
        const allRequests: AgoraCallRequest[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          allRequests.push({
            id: doc.id,
            ...data
          } as AgoraCallRequest);
        });

        // فلترة المكالمات المعلقة يدوياً
        const pendingRequests = allRequests.filter(req => req.status === 'pending');

        console.log('🔧 Simplified query results:', {
          total: allRequests.length,
          pending: pendingRequests.length,
          userType: this.userType,
          userId: this.userId
        });

        callback(pendingRequests);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error in simplified listener:', error);
      return () => {};
    }
  }

  // الاستماع لطلبات المكالمات الواردة
  listenForIncomingCalls(callback: (requests: AgoraCallRequest[]) => void): () => void {
    // جرب الطريقة المبسطة أولاً
    try {
      return this.listenForIncomingCallsSimple(callback);
    } catch (error) {
      console.error('❌ Simplified method failed, trying original:', error);
    }

    // الطريقة الأصلية كاحتياط
    try {
      const fieldToQuery = this.userType === 'teacher' ? 'teacherId' : 'studentId';

      console.log(`🔍 Setting up call listener for ${this.userType}:`, {
        userId: this.userId,
        fieldToQuery: fieldToQuery,
        userType: this.userType,
        queryDetails: {
          collection: 'agora_call_requests',
          where1: `${fieldToQuery} == ${this.userId}`,
          where2: 'status == pending'
        }
      });

      // تجربة استعلام بسيط أولاً للتأكد من وجود البيانات
      console.log('🧪 Testing simple query first...');
      const testQuery = query(
        collection(db, 'agora_call_requests'),
        where('status', '==', 'pending')
      );

      // استعلام تجريبي لمرة واحدة
      onSnapshot(testQuery, (testSnapshot) => {
        console.log('🧪 Test query results:', {
          totalPendingCalls: testSnapshot.size,
          docs: testSnapshot.docs.map(doc => ({
            id: doc.id,
            studentId: doc.data().studentId,
            teacherId: doc.data().teacherId,
            status: doc.data().status,
            senderName: doc.data().senderName
          }))
        });
      }, { includeMetadataChanges: false });

      // استعلام مبسط بدون orderBy لتجنب مشكلة الفهارس
      const q = query(
        collection(db, 'agora_call_requests'),
        where(fieldToQuery, '==', this.userId),
        where('status', '==', 'pending')
      );

      console.log('🎯 Final query setup:', {
        collection: 'agora_call_requests',
        field: fieldToQuery,
        value: this.userId,
        status: 'pending'
      });

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const requests: AgoraCallRequest[] = [];

          console.log(`🔍 Raw snapshot data for ${this.userType} (${this.userId}):`, {
            snapshotSize: snapshot.size,
            snapshotEmpty: snapshot.empty
          });

          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`📄 Document ${doc.id}:`, {
              studentId: data.studentId,
              teacherId: data.teacherId,
              senderId: data.senderId,
              senderName: data.senderName,
              receiverId: data.receiverId,
              receiverName: data.receiverName,
              status: data.status,
              callStyle: data.callStyle
            });

            requests.push({
              id: doc.id,
              ...data
            } as AgoraCallRequest);
          });

          console.log(`📞 Processed calls for ${this.userType} (${this.userId}):`, {
            count: requests.length,
            searchField: fieldToQuery,
            searchValue: this.userId,
            requests: requests.map(r => ({
              id: r.id,
              studentId: r.studentId,
              teacherId: r.teacherId,
              senderId: r.senderId,
              senderName: r.senderName,
              receiverId: r.receiverId,
              receiverName: r.receiverName,
              from: r.senderName || (this.userType === 'teacher' ? r.studentName : r.teacherName),
              type: r.callType,
              style: r.callStyle,
              status: r.status,
              createdAt: r.createdAt
            }))
          });

          // ترتيب المكالمات يدوياً حسب وقت الإنشاء (الأحدث أولاً)
          const sortedRequests = requests.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
            const timeB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
            return timeB.getTime() - timeA.getTime();
          });

          // تسجيل إضافي للمقارنة
          console.log('🔍 Query details:', {
            userType: this.userType,
            userId: this.userId,
            fieldQueried: this.userType === 'teacher' ? 'teacherId' : 'studentId',
            totalFound: sortedRequests.length
          });

          callback(sortedRequests);
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

// 🚀 دوال إنشاء النظام الموحد
export function createUnifiedAgoraCallSystem(userId: string, userType: 'student' | 'teacher'): UnifiedAgoraCallSystem {
  return new UnifiedAgoraCallSystem(userId, userType);
}

// للتوافق مع الكود الحالي
export function createAgoraCallSystem(userId: string, userType: 'student' | 'teacher'): UnifiedAgoraCallSystem {
  return new UnifiedAgoraCallSystem(userId, userType);
}

// تصدير الكلاس القديم للتوافق
export class AgoraCallSystem extends UnifiedAgoraCallSystem {
  constructor(userId: string, userType: 'student' | 'teacher') {
    super(userId, userType);
    console.log('⚠️ Using legacy AgoraCallSystem - consider upgrading to UnifiedAgoraCallSystem');
  }
}
