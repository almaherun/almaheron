export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  experience?: string;        // إضافة هذا
  specialization?: string;    // إضافة هذا
  bio?: string;              // إضافة هذا
  availableHours?: string;   // إضافة هذا
  role: 'student' | 'teacher' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}