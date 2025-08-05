
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserData {
  id: string;
  name: string;
  email: string;
  type: 'admin' | 'teacher' | 'student';
  avatarUrl?: string;
  phone?: string;
  createdAt?: any;
  followedTeachers?: string[];
  subscriptionEndDate?: any;
  gender?: 'male' | 'female';
  descriptionStatus?: 'approved' | 'pending' | 'rejected';
  description?: string;
  displayName?: string;
  experience?: string;
  specialization?: string;
  bio?: string;
  availableHours?: string;
  // إضافة خصائص أخرى حسب الحاجة
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              id: user.uid,
              name: data.name || user.displayName || '',
              email: user.email || '',
              type: data.type || 'student',
              avatarUrl: data.avatarUrl || user.photoURL || '',
              phone: data.phone || '',
              createdAt: data.createdAt,
              ...data
            });
          } else {
            // إذا لم يوجد المستخدم في Firestore، إنشاء بيانات أساسية
            setUserData({
              id: user.uid,
              name: user.displayName || '',
              email: user.email || '',
              type: 'student',
              avatarUrl: user.photoURL || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { userData, loading };
}

// إضافة export للتوافق مع الكود الموجود
export const useUser = useUserData;
