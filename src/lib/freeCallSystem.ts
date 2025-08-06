/**
 * نظام المكالمات المجاني الجديد - مجاني تماماً
 * يستخدم Jitsi Meet كخدمة أساسية بدون أي تكلفة
 */

import { db } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';

export interface FreeCallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  callType: 'jitsi';
}

export class FreeCallManager {
  private userId: string;
  private userType: 'student' | 'teacher';
  private listeners: Map<string, (data: any) => void> = new Map();

  constructor(userId: string, userType: 'student' | 'teacher') {
    this.userId = userId;
    this.userType = userType;
  }

  generateRoomId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `room_${timestamp}_${random}`;
  }

  async sendCallRequest(targetUserId: string, targetUserName: string): Promise<string> {
    const roomId = this.generateRoomId();
    const requestId = `call_${this.userId}_${targetUserId}_${Date.now()}`;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    const callRequest: FreeCallRequest = {
      id: requestId,
      studentId: this.userType === 'student' ? this.userId : targetUserId,
      studentName: this.userType === 'student' ? 'أنت' : targetUserName,
      teacherId: this.userType === 'teacher' ? this.userId : targetUserId,
      teacherName: this.userType === 'teacher' ? 'أنت' : targetUserName,
      roomId,
      status: 'pending',
      createdAt: serverTimestamp() as Timestamp,
      expiresAt: Timestamp.fromDate(expiresAt),
      callType: 'jitsi'
    };

    const docRef = doc(db, 'free_call_requests', requestId);
    await setDoc(docRef, callRequest);
    return requestId;
  }

  async acceptCallRequest(requestId: string): Promise<FreeCallRequest | null> {
    try {
      const docRef = doc(db, 'free_call_requests', requestId);
      await setDoc(docRef, { status: 'accepted' }, { merge: true });
      
      const docSnap = await getDocs(query(collection(db, 'free_call_requests'), where('id', '==', requestId)));
      if (!docSnap.empty) {
        return docSnap.docs[0].data() as FreeCallRequest;
      }
      return null;
    } catch (error) {
      console.error('Error accepting call:', error);
      return null;
    }
  }

  async rejectCallRequest(requestId: string): Promise<void> {
    const docRef = doc(db, 'free_call_requests', requestId);
    await setDoc(docRef, { status: 'rejected' }, { merge: true });
  }

  on(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  off(event: string): void {
    this.listeners.delete(event);
  }

  private emit(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }
}

export function createFreeCallManager(userId: string, userType: 'student' | 'teacher'): FreeCallManager {
  return new FreeCallManager(userId, userType);
}

export function createJitsiUrl(roomId: string, userName: string): string {
  const baseUrl = 'https://meet.jit.si';
  const roomName = `almaheron_${roomId}`;
  return `${baseUrl}/${roomName}`;
}
