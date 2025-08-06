import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';

export interface SimpleCallRequest {
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

export class SimpleCallSystem {
  private teacherId: string;

  constructor(teacherId: string) {
    this.teacherId = teacherId;
  }

  // إرسال طلب مكالمة (مبسط)
  async sendCallRequest(
    studentId: string,
    studentName: string,
    teacherName: string,
    roomId: string
  ): Promise<string> {
    try {
      const requestId = `call_${studentId}_${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 2);

      const callRequest = {
        id: requestId,
        studentId,
        studentName,
        teacherId: this.teacherId,
        teacherName,
        roomId,
        status: 'pending' as const,
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      console.log('📤 Sending call request:', callRequest);
      
      const docRef = doc(db, 'simple_call_requests', requestId);
      await setDoc(docRef, callRequest);
      
      console.log('✅ Call request sent successfully');

      // حذف تلقائي بعد دقيقتين
      setTimeout(async () => {
        try {
          await this.cancelCallRequest(requestId);
        } catch (error) {
          console.error('Error auto-cancelling request:', error);
        }
      }, 120000);

      return requestId;
    } catch (error) {
      console.error('❌ Error sending call request:', error);
      throw error;
    }
  }

  // الاستماع لطلبات المكالمات (للمعلم)
  listenForCallRequests(callback: (requests: SimpleCallRequest[]) => void): () => void {
    console.log('🔔 Setting up simple listener for teacher:', this.teacherId);
    
    const collectionRef = collection(db, 'simple_call_requests');
    
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      console.log('📞 Received snapshot with', snapshot.size, 'documents');
      const requests: SimpleCallRequest[] = [];
      const now = new Date();
      
      snapshot.forEach((doc) => {
        const data = doc.data() as SimpleCallRequest;
        console.log('📋 Processing document:', data);
        
        // فقط الطلبات للمعلم الحالي والمعلقة
        if (data.teacherId === this.teacherId && data.status === 'pending') {
          // تحقق من انتهاء الصلاحية
          if (data.expiresAt.toDate() > now) {
            requests.push(data);
            console.log('✅ Added valid request for teacher:', data.id);
          } else {
            console.log('⏰ Expired request:', data.id);
            // حذف الطلب المنتهي الصلاحية
            deleteDoc(doc.ref).catch(console.error);
          }
        }
      });
      
      console.log('📤 Calling callback with', requests.length, 'requests');
      callback(requests);
    }, (error) => {
      console.error('❌ Error in simple listener:', error);
      callback([]);
    });

    return unsubscribe;
  }

  // قبول طلب المكالمة
  async acceptCallRequest(requestId: string): Promise<void> {
    try {
      console.log('✅ Accepting call request:', requestId);
      const docRef = doc(db, 'simple_call_requests', requestId);
      await updateDoc(docRef, {
        status: 'accepted'
      });
      console.log('✅ Call request accepted');
    } catch (error) {
      console.error('❌ Error accepting call request:', error);
      throw error;
    }
  }

  // رفض طلب المكالمة
  async rejectCallRequest(requestId: string): Promise<void> {
    try {
      console.log('❌ Rejecting call request:', requestId);
      const docRef = doc(db, 'simple_call_requests', requestId);
      await updateDoc(docRef, {
        status: 'rejected'
      });
      
      // حذف بعد 3 ثوان
      setTimeout(async () => {
        try {
          await deleteDoc(docRef);
        } catch (error) {
          console.error('Error deleting rejected request:', error);
        }
      }, 3000);
      
      console.log('❌ Call request rejected');
    } catch (error) {
      console.error('❌ Error rejecting call request:', error);
      throw error;
    }
  }

  // إلغاء طلب المكالمة
  async cancelCallRequest(requestId: string): Promise<void> {
    try {
      console.log('🚫 Cancelling call request:', requestId);
      const docRef = doc(db, 'simple_call_requests', requestId);
      await updateDoc(docRef, {
        status: 'cancelled'
      });
      
      // حذف بعد ثانية واحدة
      setTimeout(async () => {
        try {
          await deleteDoc(docRef);
        } catch (error) {
          console.error('Error deleting cancelled request:', error);
        }
      }, 1000);
      
      console.log('🚫 Call request cancelled');
    } catch (error) {
      console.error('❌ Error cancelling call request:', error);
      throw error;
    }
  }

  // مراقبة حالة طلب المكالمة (للطالب)
  listenForCallRequestStatus(
    requestId: string, 
    callback: (status: 'pending' | 'accepted' | 'rejected' | 'cancelled') => void
  ): () => void {
    console.log('👀 Listening for status of request:', requestId);
    
    const docRef = doc(db, 'simple_call_requests', requestId);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as SimpleCallRequest;
        console.log('📊 Status update:', data.status);
        callback(data.status);
      } else {
        console.log('📊 Document deleted, status: cancelled');
        callback('cancelled');
      }
    }, (error) => {
      console.error('❌ Error listening for status:', error);
      callback('cancelled');
    });

    return unsubscribe;
  }

  // تنظيف الطلبات المنتهية الصلاحية
  async cleanupExpiredRequests(): Promise<void> {
    try {
      const q = query(
        collection(db, 'simple_call_requests'),
        where('teacherId', '==', this.teacherId)
      );
      
      const snapshot = await getDocs(q);
      const now = new Date();
      
      snapshot.forEach(async (doc) => {
        const data = doc.data() as SimpleCallRequest;
        if (data.expiresAt.toDate() <= now) {
          await deleteDoc(doc.ref);
          console.log('🧹 Cleaned up expired request:', data.id);
        }
      });
    } catch (error) {
      console.error('❌ Error cleaning up expired requests:', error);
    }
  }
}

// Helper function
export function createSimpleCallSystem(teacherId: string): SimpleCallSystem {
  return new SimpleCallSystem(teacherId);
}
