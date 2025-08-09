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
        studentName: user.displayName || 'طالب',
        teacherId: teacherId,
        teacherName: teacherName,
        channelName: channelName,
        status: 'pending',
        createdAt: serverTimestamp(),
        callType: 'video'
      };

      const docRef = await addDoc(collection(db, 'simple_calls'), callRequest);
      
      console.log('📞 Call request sent:', {
        id: docRef.id,
        from: callRequest.studentName,
        to: callRequest.teacherName,
        channel: channelName
      });

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

  // الاستماع للمكالمات الواردة
  listenForIncomingCalls(callback: (calls: SimpleCallRequest[]) => void): () => void {
    try {
      const fieldToQuery = this.userType === 'teacher' ? 'teacherId' : 'studentId';
      
      console.log('🎧 Listening for calls:', {
        userType: this.userType,
        userId: this.userId,
        field: fieldToQuery
      });

      const q = query(
        collection(db, 'simple_calls'),
        where(fieldToQuery, '==', this.userId),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const calls: SimpleCallRequest[] = [];
        
        snapshot.forEach((doc) => {
          calls.push({
            id: doc.id,
            ...doc.data()
          } as SimpleCallRequest);
        });

        console.log('📞 Incoming calls:', {
          count: calls.length,
          calls: calls.map(c => ({
            id: c.id,
            from: c.studentName,
            to: c.teacherName
          }))
        });

        callback(calls);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error listening for calls:', error);
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
