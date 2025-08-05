import { database } from './firebase';
import { ref, push, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left';
  data: any;
  sender: string;
  target?: string;
  timestamp: any;
}

export interface RoomUser {
  id: string;
  name: string;
  userType: 'student' | 'teacher';
  joinedAt: any;
}

export class FirebaseSignaling {
  private roomId: string;
  private userId: string;
  private userName: string;
  private userType: 'student' | 'teacher';
  private listeners: Map<string, (data: any) => void> = new Map();

  constructor(roomId: string, userId: string, userName: string, userType: 'student' | 'teacher') {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.userType = userType;
  }

  // Join room and announce presence
  async joinRoom(): Promise<void> {
    const roomRef = ref(database, `rooms/${this.roomId}`);
    const userRef = ref(database, `rooms/${this.roomId}/users/${this.userId}`);
    
    // Set user presence
    await set(userRef, {
      id: this.userId,
      name: this.userName,
      userType: this.userType,
      joinedAt: serverTimestamp(),
      online: true
    });

    // Remove user on disconnect
    onDisconnect(userRef).remove();

    // Listen for other users
    const usersRef = ref(database, `rooms/${this.roomId}/users`);
    onValue(usersRef, (snapshot) => {
      const users = snapshot.val() || {};
      const otherUsers = Object.values(users).filter((user: any) => user.id !== this.userId);
      
      // Notify about existing users
      otherUsers.forEach((user: any) => {
        this.emit('user-joined', user);
      });
    });

    // Listen for signaling messages
    const messagesRef = ref(database, `rooms/${this.roomId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val() || {};
      
      Object.values(messages).forEach((message: any) => {
        if (message.target === this.userId && message.sender !== this.userId) {
          this.emit(message.type, {
            ...message.data,
            sender: message.sender
          });
          
          // Remove processed message
          remove(ref(database, `rooms/${this.roomId}/messages/${message.id}`));
        }
      });
    });
  }

  // Send signaling message
  async sendMessage(type: string, data: any, target?: string): Promise<void> {
    const messagesRef = ref(database, `rooms/${this.roomId}/messages`);
    const messageRef = push(messagesRef);
    
    const message: SignalingMessage = {
      type: type as any,
      data,
      sender: this.userId,
      target,
      timestamp: serverTimestamp()
    };

    await set(messageRef, {
      ...message,
      id: messageRef.key
    });
  }

  // Send WebRTC offer
  async sendOffer(offer: any, target: string): Promise<void> {
    await this.sendMessage('offer', { offer }, target);
  }

  // Send WebRTC answer
  async sendAnswer(answer: any, target: string): Promise<void> {
    await this.sendMessage('answer', { answer }, target);
  }

  // Send ICE candidate
  async sendIceCandidate(candidate: any, target: string): Promise<void> {
    await this.sendMessage('ice-candidate', { candidate }, target);
  }

  // Event listener system
  on(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  private emit(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  // Leave room and cleanup
  async leaveRoom(): Promise<void> {
    const userRef = ref(database, `rooms/${this.roomId}/users/${this.userId}`);
    await remove(userRef);
    
    // Clean up empty rooms
    const roomRef = ref(database, `rooms/${this.roomId}/users`);
    onValue(roomRef, (snapshot) => {
      const users = snapshot.val();
      if (!users || Object.keys(users).length === 0) {
        // Remove empty room
        remove(ref(database, `rooms/${this.roomId}`));
      }
    }, { onlyOnce: true });
  }

  // Get room users
  async getRoomUsers(): Promise<RoomUser[]> {
    return new Promise((resolve) => {
      const usersRef = ref(database, `rooms/${this.roomId}/users`);
      onValue(usersRef, (snapshot) => {
        const users = snapshot.val() || {};
        const userList = Object.values(users) as RoomUser[];
        resolve(userList.filter(user => user.id !== this.userId));
      }, { onlyOnce: true });
    });
  }
}

// Helper function to generate room ID
export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Helper function to create signaling instance
export function createSignaling(
  roomId: string, 
  userId: string, 
  userName: string, 
  userType: 'student' | 'teacher'
): FirebaseSignaling {
  return new FirebaseSignaling(roomId, userId, userName, userType);
}
