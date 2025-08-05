'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createAndSetSessionToken, clearSessionCookie } from '@/lib/server-auth';

interface UserData {
  uid: string;
  name: string;
  email: string;
  type: 'admin' | 'teacher' | 'student';
  avatarUrl?: string;
  photoURL?: string;
  displayName?: string;
  phone?: string;
  age?: number;
  educationLevel?: string;
  goals?: string;
  // إضافة خصائص المعلم
  experience?: string;
  specialization?: string;
  bio?: string;
  availableHours?: string;
  hourlyRate?: number;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  userProfile: UserData | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData({
            ...data,
            uid: user.uid
          });
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // تأخير قصير لتجنب مشاكل التحميل
    const initAuth = async () => {
      // التحقق من توفر Firebase قبل المحاولة
      if (!auth) {
        console.warn('Firebase Auth is not available');
        setLoading(false);
        return;
      }

      try {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            setUser(user);

            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const data = userDoc.data() as UserData;
                setUserData({
                  ...data,
                  uid: user.uid
                });

                // إنشاء JWT token وحفظه في cookie
                try {
                  await createAndSetSessionToken(user.uid, data.type, data.email);
                } catch (tokenError) {
                  console.warn('Warning: Could not create session token:', tokenError);
                  // لا نرمي خطأ هنا لأن المستخدم ما زال مسجل دخول
                }
              }
            } catch (firestoreError) {
              console.error('Error fetching user data from Firestore:', firestoreError);
              // في حالة فشل Firestore، نحتفظ بالمستخدم لكن بدون بيانات إضافية
              setUserData({
                uid: user.uid,
                name: user.displayName || 'مستخدم',
                email: user.email || '',
                type: 'student' // افتراضي
              });
            }
          } else {
            setUser(null);
            setUserData(null);
            try {
              await clearSessionCookie();
            } catch (clearError) {
              console.warn('Warning: Could not clear session cookie:', clearError);
            }
          }
        } catch (authError) {
          console.error('Error in auth state change handler:', authError);
        } finally {
          setLoading(false);
        }
      });
    } catch (initError) {
      console.error('Error initializing auth listener:', initError);
      setLoading(false);
    }
    };

    // تشغيل التهيئة مع تأخير قصير
    setTimeout(initAuth, 100);

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Warning: Error unsubscribing from auth:', error);
        }
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      userProfile: userData, 
      loading, 
      refreshUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
