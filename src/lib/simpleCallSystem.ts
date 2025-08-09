// 📞 نظام مكالمات بسيط جداً باستخدام Agora
import { db, auth } from './firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';

export interface SimpleCallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  channelName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  createdAt: any;
  callType: 'video';
}

export class SimpleCallSystem {
  private userId: string;
  private userType: 'student' | 'teacher';
  private appId: string = 'cb27c3ffa8e9410db064c2006c934df1'; // Agora App ID

  constructor(userId: string, userType: 'student' | 'teacher') {
    this.userId = userId;
    this.userType = userType;
    
    console.log('📞 Simple Call System initialized:', {
      userId: this.userId,
      userType: this.userType,
      appId: this.appId
    });
  }

  // إرسال طلب مكالمة بسيط
  async sendCallRequest(teacherId: string, teacherName: string): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('المستخدم غير مسجل دخول');

      const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const callRequest: Omit<SimpleCallRequest, 'id'> = {
        studentId: user.uid,
        studentName: user.displayName || user.email || 'طالب',
        teacherId: teacherId,
        teacherName: teacherName,
        channelName: channelName,
        status: 'pending',
        createdAt: serverTimestamp(),
        callType: 'video'
      };

      console.log('📞 Sending call request:', {
        studentId: callRequest.studentId,
        studentName: callRequest.studentName,
        teacherId: callRequest.teacherId,
        teacherName: callRequest.teacherName,
        channel: channelName,
        collection: 'simple_calls'
      });

      // محاولة حفظ المكالمة مع إعادة المحاولة
      let docRef: any;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          docRef = await addDoc(collection(db, 'simple_calls'), callRequest);
          break;
        } catch (error) {
          attempts++;
          console.error(`❌ Attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
            throw error;
          }
          // انتظار قبل إعادة المحاولة
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      console.log('✅ Call request saved to Firestore:', {
        id: docRef.id,
        from: callRequest.studentName,
        to: callRequest.teacherName,
        channel: channelName,
        attempts: attempts
      });

      // تحقق من الحفظ
      setTimeout(async () => {
        try {
          const savedDoc = await import('firebase/firestore').then(({ getDoc, doc }) =>
            getDoc(doc(db, 'simple_calls', docRef.id))
          );
          console.log('🔍 Verification - Call saved:', {
            exists: savedDoc.exists(),
            data: savedDoc.exists() ? savedDoc.data() : null
          });
        } catch (error) {
          console.error('❌ Verification failed:', error);
        }
      }, 1000);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending call request:', error);
      throw error;
    }
  }

  // قبول المكالمة
  async acceptCall(callId: string): Promise<{ channelName: string }> {
    try {
      await updateDoc(doc(db, 'simple_calls', callId), {
        status: 'accepted'
      });

      // الحصول على معلومات المكالمة
      const callDoc = await import('firebase/firestore').then(({ getDoc }) => 
        getDoc(doc(db, 'simple_calls', callId))
      );
      
      if (!callDoc.exists()) {
        throw new Error('المكالمة غير موجودة');
      }

      const callData = callDoc.data() as SimpleCallRequest;
      
      console.log('✅ Call accepted:', {
        id: callId,
        channel: callData.channelName
      });

      return { channelName: callData.channelName };
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      throw error;
    }
  }

  // رفض المكالمة
  async rejectCall(callId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'simple_calls', callId), {
        status: 'rejected'
      });
      
      console.log('❌ Call rejected:', callId);
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      throw error;
    }
  }

  // إنهاء المكالمة
  async endCall(callId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'simple_calls', callId), {
        status: 'ended'
      });
      
      console.log('📞 Call ended:', callId);
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw error;
    }
  }

  // الاستماع للمكالمات الواردة - نسخة مبسطة لتجنب أخطاء QUIC
  listenForIncomingCalls(callback: (calls: SimpleCallRequest[]) => void): () => void {
    try {
      console.log('🎧 Setting up simplified call listener:', {
        userType: this.userType,
        userId: this.userId
      });

      // استعلام مبسط جداً - فقط المكالمات المعلقة
      const q = query(
        collection(db, 'simple_calls'),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🔍 Firestore snapshot received:', {
          size: snapshot.size,
          empty: snapshot.empty,
          userType: this.userType,
          userId: this.userId
        });

        const allCalls: SimpleCallRequest[] = [];
        const myCalls: SimpleCallRequest[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const call = {
            id: doc.id,
            ...data
          } as SimpleCallRequest;

          allCalls.push(call);

          // فلترة المكالمات الخاصة بي يدوياً
          const isForMe = this.userType === 'teacher'
            ? data.teacherId === this.userId
            : data.studentId === this.userId;

          if (isForMe) {
            myCalls.push(call);
          }

          console.log('📄 Call document:', {
            id: doc.id,
            studentId: data.studentId,
            teacherId: data.teacherId,
            status: data.status,
            studentName: data.studentName,
            teacherName: data.teacherName,
            isForMe: isForMe
          });
        });

        console.log('📞 Call filtering results:', {
          userType: this.userType,
          userId: this.userId,
          totalCalls: allCalls.length,
          myCallsCount: myCalls.length,
          myCalls: myCalls.map(c => ({
            id: c.id,
            from: c.studentName,
            to: c.teacherName
          }))
        });

        callback(myCalls);
      }, (error) => {
        console.error('❌ Firestore listener error:', error);
        // جرب مرة أخرى بعد تأخير
        setTimeout(() => {
          console.log('🔄 Retrying call listener...');
          this.listenForIncomingCalls(callback);
        }, 3000);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up call listener:', error);
      return () => {};
    }
  }

  // توليد Agora Token (مبسط للاختبار)
  generateToken(channelName: string): string {
    // في الإنتاج، يجب توليد Token من الخادم
    // للاختبار، سنستخدم null (يعمل في التطوير فقط)
    return '';
  }

  // الحصول على App ID
  getAppId(): string {
    return this.appId;
  }
}

// دالة إنشاء النظام
export function createSimpleCallSystem(userId: string, userType: 'student' | 'teacher'): SimpleCallSystem {
  return new SimpleCallSystem(userId, userType);
}
