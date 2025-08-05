
import { Timestamp } from "firebase/firestore";

export type User = {
    uid: string;
    name: string;
    email: string;
    phone: string;
    type: 'student' | 'teacher' | 'admin';
    status: 'active' | 'pending' | 'inactive';
    createdAt: Timestamp;
    avatarUrl: string;
    gender?: 'male' | 'female';
    trialEndDate?: Date;
    isTrialActive?: boolean;
    // Teacher specific
    description?: string; 
    descriptionStatus?: 'approved' | 'pending' | 'rejected';
    specialty?: string;
    achievements?: string[];
    // Student specific
    subscriptionEndDate?: Timestamp;
    followedTeachers?: string[]; // array of teacher uids
};

export type Code = {
    id: string; // The code itself
    type: 'student' | 'teacher' | 'admin';
    validity: number; // in days, -1 for unlimited
    usedBy: string | null; // user uid
    status: 'used' | 'active' | 'expired' | 'banned';
    createdAt: Timestamp;
};

export interface Notification {
  id: string;
  type: 'approval_request' | 'general' | 'system';
  title: string;
  details?: string;
  sender: {
    name: string;
    avatar?: string;
  };
  payload?: {
    type: 'avatar' | 'description';
    teacherId: string;
    oldData: any;
    newData: any;
  };
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
}

export type Session = {
    id: string;
    teacherId: string;
    teacherName: string;
    teacherAvatar: string;
    title: string;
    listeners: number;
    status: 'active' | 'ended';
    sessionLink?: string;
    createdAt: Timestamp;
    endedAt?: Timestamp;
};

// This represents the custom claims that will be set on a user in Firebase Auth
export interface UserRole {
  role: 'admin' | 'teacher' | 'student';
}
