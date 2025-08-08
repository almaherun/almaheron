// نظام مكالمات مبسط وفعال - بدون تعقيدات
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';

export interface SimpleCallRequest {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  status: 'calling' | 'accepted' | 'rejected' | 'ended';
  timestamp: any;
  type: 'video' | 'audio';
}

export class SimpleCallSystem {
  private currentUser: any;

  constructor() {
    this.currentUser = auth.currentUser;
    console.log('📞 Simple Call System initialized for:', this.currentUser?.uid);

    // إذا لم يكن المستخدم متصل، انتظر حتى يتصل
    if (!this.currentUser) {
      console.log('⏳ Waiting for Firebase Auth...');
      auth.onAuthStateChanged((user: any) => {
        if (user) {
          this.currentUser = user;
          console.log('✅ Firebase Auth ready:', user.uid);
        }
      });
    }
  }

  // إرسال مكالمة
  async makeCall(toUserId: string, toUserName: string, callType: 'video' | 'audio' = 'video'): Promise<string> {
    // التأكد من وجود المستخدم
    const user = this.currentUser || auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user found');
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    this.currentUser = user;

    console.log('📞 Making call:', {
      from: user.uid,
      fromName: user.displayName || 'مستخدم',
      to: toUserId,
      toName: toUserName,
      type: callType
    });

    try {
      const callData = {
        from: user.uid,
        fromName: user.displayName || 'مستخدم',
        to: toUserId,
        toName: toUserName,
        status: 'calling',
        timestamp: new Date(),
        type: callType
      };

      const docRef = await addDoc(collection(db, 'simple_calls'), callData);
      console.log('✅ Call created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error making call:', error);
      throw error;
    }
  }

  // الاستماع للمكالمات الواردة
  listenForIncomingCalls(callback: (calls: SimpleCallRequest[]) => void): () => void {
    const user = this.currentUser || auth.currentUser;
    if (!user) {
      console.error('❌ No user authenticated for listening to calls');
      return () => {};
    }

    this.currentUser = user;
    console.log('👂 Listening for incoming calls for user:', user.uid);

    // استعلام مبسط بدون orderBy لتجنب مشكلة Index
    const q = query(
      collection(db, 'simple_calls'),
      where('to', '==', user.uid),
      where('status', '==', 'calling')
    );

    return onSnapshot(q, (snapshot) => {
      const calls: SimpleCallRequest[] = [];
      snapshot.forEach((doc) => {
        calls.push({
          id: doc.id,
          ...doc.data()
        } as SimpleCallRequest);
      });

      // ترتيب المكالمات يدوياً بدلاً من orderBy
      calls.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return timeB.getTime() - timeA.getTime();
      });

      console.log('📞 Incoming calls found:', calls.length);
      callback(calls);
    }, (error) => {
      console.error('❌ Error listening for calls:', error);
      callback([]);
    });
  }

  // قبول مكالمة
  async acceptCall(callId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'simple_calls', callId), {
        status: 'accepted'
      });
      console.log('✅ Call accepted:', callId);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      throw error;
    }
  }

  // رفض مكالمة
  async rejectCall(callId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'simple_calls', callId), {
        status: 'rejected'
      });
      console.log('✅ Call rejected:', callId);
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      throw error;
    }
  }

  // إنهاء مكالمة
  async endCall(callId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'simple_calls', callId), {
        status: 'ended'
      });
      console.log('✅ Call ended:', callId);
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw error;
    }
  }
}

// دالة لإنشاء نظام مكالمات جديد
export function createSimpleCallSystem(): SimpleCallSystem {
  return new SimpleCallSystem();
}

// إنشاء instance واحد للاستخدام
export const simpleCallSystem = new SimpleCallSystem();
