import { createFreeCallManager, FreeCallManager, FreeCallRequest } from './freeCallSystem';

// استخدام النظام المجاني الجديد
export type SimpleCallRequest = FreeCallRequest;

export class SimpleCallSystem {
  private freeCallManager: FreeCallManager;

  constructor(userId: string, userType: 'student' | 'teacher' = 'teacher') {
    this.freeCallManager = createFreeCallManager(userId, userType);
  }

  async sendCallRequest(
    targetUserId: string,
    targetUserName: string,
    teacherName: string,
    roomId: string
  ): Promise<string> {
    return await this.freeCallManager.sendCallRequest(targetUserId, targetUserName);
  }

  async acceptCallRequest(requestId: string): Promise<SimpleCallRequest | null> {
    return await this.freeCallManager.acceptCallRequest(requestId);
  }

  async rejectCallRequest(requestId: string): Promise<void> {
    return await this.freeCallManager.rejectCallRequest(requestId);
  }

  listenForCallRequests(callback: (requests: SimpleCallRequest[]) => void): () => void {
    // مؤقت - إرجاع دالة فارغة
    return () => {};
  }

  on(event: string, callback: (data: any) => void): void {
    this.freeCallManager.on(event, callback);
  }

  off(event: string): void {
    this.freeCallManager.off(event);
  }
}

export function createSimpleCallSystem(userId: string, userType: 'student' | 'teacher' = 'teacher'): SimpleCallSystem {
  return new SimpleCallSystem(userId, userType);
}
