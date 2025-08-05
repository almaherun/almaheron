
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UserCheck, GraduationCap, BookOpen, Camera, Eye, EyeOff, LoaderCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sendVerificationCodeEmailJS } from '@/lib/emailjs';
// import { useAuth } from '@/contexts/AuthContext'; // تم تعطيله مؤقتاً

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني المدخل غير صحيح." }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

const registerSchema = z.object({
  profileImage: z.any().optional(),
  fullName: z.string().min(3, { message: "يجب أن يكون الاسم 3 أحرف على الأقل" }).max(50, { message: "يجب أن يكون الاسم 50 حرفًا على الأكثر" }),
  phoneNumber: z.string().regex(/^01[0-9]{9}$/, { message: "رقم الهاتف غير صحيح" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(8, { message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: "يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم" }),
  userType: z.enum(["student", "teacher", "admin"], { required_error: "نوع المستخدم مطلوب" }),
  gender: z.enum(["male", "female"], { required_error: "الجنس مطلوب" }),
  inviteCode: z.string().optional(),
}).refine(data => {
    if (data.userType === 'teacher' && (!data.inviteCode || data.inviteCode.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "كود الدعوة مطلوب للمعلمين",
    path: ["inviteCode"],
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  // const { user, userData, loading } = useAuth(); // تم تعطيله مؤقتاً
  const router = useRouter();

  // تم تعطيل إعادة التوجيه التلقائي مؤقتاً
  // useEffect(() => {
  //   if (!loading && user && userData) {
  //     switch (userData.type) {
  //       case 'admin':
  //         router.push('/admin/dashboard');
  //         break;
  //       case 'teacher':
  //         router.push('/teacher/dashboard');
  //         break;
  //       case 'student':
  //         router.push('/student/dashboard');
  //         break;
  //       default:
  //         router.push('/');
  //     }
  //   }
  // }, [user, userData, loading, router]);

  // تم تعطيل loading screen مؤقتاً
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <LoaderCircle className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  if (emailSent) {
    return <EmailVerificationPage />;
  }

  return (
    <div className="min-h-screen bg-white flex" style={{fontFamily: 'Cairo, sans-serif'}}>
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center">
            <Image src="/image/logo.png" alt="Academy logo" width={48} height={48} className="mx-auto" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin ? 'إلى حسابك في أكاديمية الماهرون' : 'انضم إلى أكاديمية الماهرون'}
            </p>
          </div>

          <div className="mt-8">
            {isLogin ? (
              <LoginForm setIsLogin={setIsLogin} />
            ) : (
              <RegisterForm setIsLogin={setIsLogin} setEmailSent={setEmailSent} />
            )}
          </div>
        </div>
      </div>

      {/* Right side - Image (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/image/hero-quran.jpg"
          alt="القرآن الكريم"
          fill
          style={{ objectFit: 'cover' }}
          className="z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-800/80 z-10">
        أكاديمية الماهرون

منصة تعليمية متخصصة في تحفيظ وتجويد القرآن الكريم
معلمون مجازون ومتخصصون
دروس تفاعلية مباشرة
متابعة شخصية لتقدمك
شهادات معتمدة  <div className="absolute inset-0 bg-black/20 z-20"></div>
          <div className="relative z-30 h-full flex flex-col justify-center items-center text-white p-12">
            <div className="text-center space-y-8">
              <h1 className="text-4xl font-bold">أكاديمية الماهرون</h1>
              <p className="text-xl opacity-90">منصة تعليمية متخصصة في تحفيظ وتجويد القرآن الكريم</p>
              
              <div className="space-y-4 text-right">
                <div className="flex items-center justify-center space-x-3 space-x-reverse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>معلمون مجازون ومتخصصون</span>
                </div>
                <div className="flex items-center justify-center space-x-3 space-x-reverse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>دروس تفاعلية مباشرة</span>
                </div>
                <div className="flex items-center justify-center space-x-3 space-x-reverse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>متابعة شخصية لتقدمك</span>
                </div>
                <div className="flex items-center justify-center space-x-3 space-x-reverse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>شهادات معتمدة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ setIsLogin }: { setIsLogin: (value: boolean) => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error("لم يتم العثور على بيانات المستخدم");
      }

      const userData = userDoc.data();
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك، ${userData.name}!`,
        className: "bg-green-600 text-white",
      });

      // توجيه المستخدم حسب نوعه
      switch (userData.type) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'student':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      
      let errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "لا يوجد مستخدم بهذا البريد الإلكتروني";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "تم حظر الحساب مؤقت<lemma بسبب محاولات تسجيل دخول كثيرة";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "البريد الإلكتروني غير صحيح";
      }
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-sm font-medium text-gray-700">البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-sm font-medium text-gray-700">كلمة المرور</FormLabel>
              <FormControl>
                <div className="relative mt-1">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
              جاري التحقق...
            </>
          ) : (
            'تسجيل الدخول'
          )}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">ليس لديك حساب؟ </span>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            إنشاء حساب
          </button>
        </div>
      </form>
    </Form>
  );
}

function RegisterForm({ setIsLogin, setEmailSent }: { 
  setIsLogin: (value: boolean) => void;
  setEmailSent: (value: boolean) => void;
}) {
  const { toast } = useToast();
  const router = useRouter(); // إضافة هذا السطر
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<'student' | 'teacher' | ''>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      password: "",
      inviteCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    
    try {
      // التحقق من كود المعلم أولاً
      if (values.userType === 'teacher' && values.inviteCode) {
        const codeRef = doc(db, 'codes', values.inviteCode);
        const codeDoc = await getDoc(codeRef);

        if (!codeDoc.exists() || codeDoc.data().status !== 'active' || codeDoc.data().type !== 'teacher') {
          toast({ 
            title: "خطأ", 
            description: "كود الدعوة غير صحيح أو غير مخصص للمعلمين.", 
            variant: "destructive" 
          });
          setIsLoading(false);
          return;
        }
      }

      // إنشاء حساب Firebase Auth مباشرة (سيرمي خطأ إذا كان البريد مستخدماً)
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // رفع الصورة
      let avatarUrl = '';
      if (preview) {
        try {
          avatarUrl = await uploadToCloudinary(preview, 'avatars');
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(values.fullName)}&background=1E3A8A&color=fff&size=200`;
        }
      } else {
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(values.fullName)}&background=1E3A8A&color=fff&size=200`;
      }
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 1);
      
      // حفظ بيانات المستخدم في users collection
      await setDoc(doc(db, 'users', user.uid), {
        name: values.fullName,
        email: values.email,
        phone: values.phoneNumber,
        type: values.userType,
        avatarUrl: avatarUrl,
        gender: values.gender,
        createdAt: serverTimestamp(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
        status: 'active',
        emailVerified: true,
        ...(values.userType === 'student' && {
          subscriptionEndDate: trialEndDate,
          followedTeachers: []
        }),
        ...(values.userType === 'teacher' && {
          description: 'مدرس جديد، في انتظار تحديث الوصف.',
          specialty: 'تجويد وقراءات',
          achievements: ['حاصل على شهادات متعددة'],
          descriptionStatus: 'approved',
        })
      });

      // استخدام كود المعلم إذا كان موجود
      if (values.userType === 'teacher' && values.inviteCode) {
        await setDoc(doc(db, 'codes', values.inviteCode), { 
          status: 'used', 
          usedBy: user.uid 
        }, { merge: true });
      }

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: `مرحباً بك، ${values.fullName}!`,
        className: "bg-green-600 text-white",
      });

      // توجيه المستخدم حسب نوعه
      switch (values.userType) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'student':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (error: any) {
      console.error("Registration Error:", error);
      
      let errorMessage = 'حدث خطأ غير متوقع.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة المرور ضعيفة<lemma.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'البريد الإلكتروني غير صحيح.';
      }
      
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="profileImage"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormControl>
                <div className="relative cursor-pointer" onClick={() => document.getElementById('profileImageInput')?.click()}>
                  <Avatar className="w-20 h-20 border-2 border-gray-200 hover:border-blue-400 transition-colors">
                    <AvatarImage src={preview || ''} alt="Profile Preview" />
                    <AvatarFallback className="bg-gray-100">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-3 h-3" />
                  </div>
                  <input
                    id="profileImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                        field.onChange(file);
                      }
                    }}
                  />
                </div>
              </FormControl>
              <p className="text-xs text-gray-500 text-center">انقر لإضافة صورة شخصية</p>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">الاسم الكامل</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    className="h-10"
                    placeholder="أدخل اسمك الكامل"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="email"
                    className="h-10"
                    placeholder="example@email.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">رقم الهاتف</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="tel"
                    className="h-10"
                    placeholder="01xxxxxxxxx"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">كلمة المرور</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      className="h-10 pr-10"
                      placeholder="كلمة مرور قوية"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">الجنس</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div
                      onClick={() => field.onChange('male')}
                      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        field.value === 'male'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">ذكر</span>
                    </div>
                    <div
                      onClick={() => field.onChange('female')}
                      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        field.value === 'female'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">أنثى</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">نوع المستخدم</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div
                      onClick={() => {
                        field.onChange('student');
                        setSelectedUserType('student');
                      }}
                      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        field.value === 'student'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm font-medium">طالب</span>
                    </div>
                    <div
                      onClick={() => {
                        field.onChange('teacher');
                        setSelectedUserType('teacher');
                      }}
                      className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        field.value === 'teacher'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-medium">معلم</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedUserType === 'teacher' && (
          <FormField
            control={form.control}
            name="inviteCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">كود الدعوة للمعلمين</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    className="h-10"
                    placeholder="أدخل كود الدعوة المخصص للمعلمين"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500">
                  يمكنك الحصول على كود الدعوة من{' '}
                  <a 
                    href="https://wa.me/201062084964" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    الإدارة
                  </a>
                </p>
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-11 text-sm font-medium"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
              جاري إنشاء الحساب...
            </>
          ) : (
            'إنشاء حساب'
          )}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">لديك حساب بالفعل؟ </span>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            تسجيل الدخول
          </button>
        </div>
      </form>
    </Form>
  );
}

function EmailVerificationPage() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كود مكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const tempUserId = localStorage.getItem('tempUserId');
      if (!tempUserId) {
        throw new Error('لم يتم العثور على بيانات التسجيل');
      }

      // التحقق من الكود في المستخدمين المؤقتين
      const tempUserDoc = await getDoc(doc(db, 'temp_users', tempUserId));
      if (!tempUserDoc.exists()) {
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      const tempUserData = tempUserDoc.data();
      const now = new Date();
      
      if (tempUserData.verificationCode !== verificationCode) {
        throw new Error('كود التحقق غير صحيح');
      }

      if (tempUserData.verificationCodeExpiry && tempUserData.verificationCodeExpiry.toDate() < now) {
        throw new Error('انتهت صلاحية كود التحقق');
      }

      // إنشاء حساب Firebase Auth الآن
      const userCredential = await createUserWithEmailAndPassword(auth, tempUserData.email, tempUserData.password);
      const user = userCredential.user;

      // نقل البيانات من temp_users إلى users
      const userDocRef = doc(db, 'users', user.uid);
      const userData = { ...tempUserData };
      delete userData.password; // حذف كلمة المرور
      delete userData.verificationCode;
      delete userData.verificationCodeExpiry;
      
      await setDoc(userDocRef, {
        ...userData,
        emailVerified: true,
        status: 'active'
      });

      // استخدام كود المعلم إذا كان موجود
      if (tempUserData.type === 'teacher' && tempUserData.inviteCode) {
        await setDoc(doc(db, 'codes', tempUserData.inviteCode), { 
          status: 'used', 
          usedBy: user.uid 
        }, { merge: true });
      }

      // حذف البيانات المؤقتة
      await deleteDoc(doc(db, 'temp_users', tempUserId));
      localStorage.removeItem('tempUserId');

      toast({
        title: "تم التحقق بنجاح!",
        description: `مرحباً بك، ${tempUserData.name}!`,
        className: "bg-green-600 text-white",
      });

      // توجيه المستخدم حسب نوعه
      switch (tempUserData.type) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'student':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التحقق",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
    setIsVerifying(false);
  };

  const resendCode = async () => {
    setIsResending(true);
    try {
      const tempUserId = localStorage.getItem('tempUserId');
      if (!tempUserId) {
        throw new Error('لم يتم العثور على بيانات التسجيل');
      }

      const tempUserDoc = await getDoc(doc(db, 'temp_users', tempUserId));
      if (!tempUserDoc.exists()) {
        throw new Error('لم يتم العثور على بيانات المستخدم');
      }

      const tempUserData = tempUserDoc.data();
      const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // إرسال كود جديد
      const emailResult = await sendVerificationCodeEmailJS(
        tempUserData.email,
        tempUserData.name,
        newVerificationCode
      );

      if (emailResult.status !== 200) {
        throw new Error('فشل في إرسال كود التحقق');
      }

      // تحديث الكود في قاعدة البيانات
      await setDoc(doc(db, 'temp_users', tempUserId), {
        verificationCode: newVerificationCode,
        verificationCodeExpiry: new Date(Date.now() + 3 * 60 * 1000)
      }, { merge: true });

      toast({
        title: "تم إرسال كود جديد",
        description: "تحقق من بريدك الإلكتروني",
        className: "bg-green-600 text-white",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال الكود",
        variant: "destructive",
      });
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4" style={{fontFamily: 'Cairo, sans-serif'}}>
      <div className="max-w-md w-full">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <Image src="/image/logo.png" alt="Academy logo" width={60} height={60} className="mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-900">أدخل كود التحقق</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                </svg>
              </div>
              
              <p className="text-gray-600">
                أدخل كود التحقق المكون من 6 أرقام المرسل إلى بريدك الإلكتروني
              </p>
              
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
                
                <Button
                  onClick={verifyCode}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full bg-blue-800 hover:bg-blue-900"
                >
                  {isVerifying ? (
                    <>
                      <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    'تحقق من الكود'
                  )}
                </Button>
                
                <Button
                  onClick={resendCode}
                  disabled={isResending}
                  variant="outline"
                  className="w-full border-blue-800 text-blue-800 hover:bg-blue-50"
                >
                  {isResending ? (
                    <>
                      <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إعادة إرسال الكود'
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                لم تجد البريد؟ تحقق من مجلد البريد العشوائي (Spam)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
