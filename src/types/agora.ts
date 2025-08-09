// 🚀 أنواع البيانات لنظام المكالمات Agora.io الموحد

// واجهة موحدة لجميع أنواع المكالمات
export interface UnifiedCallRequest {
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
  token?: string;
  startedAt?: any; // Firebase Timestamp
  endedAt?: any; // Firebase Timestamp
  duration?: number; // بالثواني

  // سبب الانتهاء
  endReason?: 'completed' | 'cancelled' | 'rejected' | 'timeout' | 'error';
}

// للتوافق مع الكود الحالي
export interface AgoraCallRequest extends UnifiedCallRequest {}

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
