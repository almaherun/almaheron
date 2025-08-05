'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function DebugAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkEmailExists = async () => {
    if (!email) {
      toast({
        title: "خطأ",
        description: "أدخل البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // البحث في مجموعة users
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      
      // البحث في مجموعة temp_users
      const tempUsersQuery = query(collection(db, 'temp_users'), where('email', '==', email));
      const tempUsersSnapshot = await getDocs(tempUsersQuery);

      let message = `البريد الإلكتروني: ${email}\n`;
      
      if (!usersSnapshot.empty) {
        message += `✅ موجود في مجموعة users (${usersSnapshot.size} سجل)\n`;
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          message += `   - ID: ${doc.id}, الاسم: ${data.name}, النوع: ${data.type}\n`;
        });
      } else {
        message += `❌ غير موجود في مجموعة users\n`;
      }

      if (!tempUsersSnapshot.empty) {
        message += `⏳ موجود في مجموعة temp_users (${tempUsersSnapshot.size} سجل)\n`;
        tempUsersSnapshot.forEach(doc => {
          const data = doc.data();
          message += `   - ID: ${doc.id}, الاسم: ${data.name}, النوع: ${data.type}\n`;
        });
      } else {
        message += `❌ غير موجود في مجموعة temp_users\n`;
      }

      toast({
        title: "نتيجة البحث",
        description: message,
        className: "bg-blue-600 text-white max-w-md",
      });
    } catch (error: any) {
      console.error("Error checking email:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const deleteUserAccount = async () => {
    if (!email || !password) {
      toast({
        title: "خطأ",
        description: "أدخل البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // تسجيل الدخول أولاً
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // حذف بيانات المستخدم من Firestore
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      
      for (const docSnapshot of usersSnapshot.docs) {
        await deleteDoc(doc(db, 'users', docSnapshot.id));
      }

      // حذف بيانات المستخدم من temp_users
      const tempUsersQuery = query(collection(db, 'temp_users'), where('email', '==', email));
      const tempUsersSnapshot = await getDocs(tempUsersQuery);
      
      for (const docSnapshot of tempUsersSnapshot.docs) {
        await deleteDoc(doc(db, 'temp_users', docSnapshot.id));
      }

      // حذف حساب Firebase Auth
      await deleteUser(user);

      toast({
        title: "تم الحذف",
        description: "تم حذف الحساب بنجاح من جميع المجموعات",
        className: "bg-green-600 text-white",
      });

      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error("Error deleting user:", error);
      let errorMessage = error.message;
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'المستخدم غير موجود في Firebase Auth';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور غير صحيحة';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'البيانات غير صحيحة';
      }

      toast({
        title: "خطأ في الحذف",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-red-600">
              🔧 أدوات تشخيص المصادقة
            </CardTitle>
            <p className="text-center text-gray-600">
              أدوات للمطورين لتشخيص مشاكل التسجيل
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور (للحذف فقط)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={checkEmailExists}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'جاري البحث...' : '🔍 فحص البريد الإلكتروني'}
              </Button>

              <Button
                onClick={deleteUserAccount}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? 'جاري الحذف...' : '🗑️ حذف الحساب'}
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ تحذير</h3>
              <p className="text-sm text-yellow-700">
                هذه الأدوات مخصصة للمطورين فقط. حذف الحساب نهائي ولا يمكن التراجع عنه.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">💡 كيفية الاستخدام</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. أدخل البريد الإلكتروني واضغط "فحص البريد الإلكتروني"</li>
                <li>2. إذا كان البريد موجود، أدخل كلمة المرور واضغط "حذف الحساب"</li>
                <li>3. جرب التسجيل مرة أخرى بنفس البريد</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
