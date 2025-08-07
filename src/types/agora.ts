// أنواع البيانات لنظام المكالمات Agora.io

export interface AgoraCallRequest {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  channelName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'expired';
  createdAt: any; // Firebase Timestamp
  expiresAt: any; // Firebase Timestamp or Date
  callType: 'audio' | 'video';
  
  // حقول إضافية للتتبع المحسن
  senderId?: string;
  senderName?: string;
  senderType?: 'student' | 'teacher';
  
  // معلومات المكالمة
  token?: string;
  startedAt?: any; // Firebase Timestamp
  endedAt?: any; // Firebase Timestamp
  duration?: number; // بالثواني
  
  // سبب الانتهاء
  endReason?: 'completed' | 'cancelled' | 'rejected' | 'timeout' | 'error';
}

export interface AgoraCallData {
  channelName: string;
  token?: string;
  uid?: number;
  appId: string;
}

export interface CallSystemInterface {
  sendCallRequest(
    receiverId: string,
    receiverName: string,
    senderName: string,
    callType?: 'audio' | 'video'
  ): Promise<string>;
  
  acceptCallRequest(requestId: string): Promise<AgoraCallData>;
  rejectCallRequest(requestId: string): Promise<void>;
  endCall(requestId: string): Promise<void>;
  
  listenForIncomingCalls(
    callback: (requests: AgoraCallRequest[]) => void
  ): () => void;
  
  generateToken(channelName: string, uid?: number): Promise<string>;
}

export type UserType = 'student' | 'teacher' | 'admin';

export interface CallManagerProps {
  userId: string;
  userName: string;
  userType: UserType;
}
