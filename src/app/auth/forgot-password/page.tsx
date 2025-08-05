
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RotateCw, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني المدخل غير صحيح." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, values.email, {
        url: `${window.location.origin}/auth`,
        handleCodeInApp: false,
      });
      setIsSubmitted(true);
      toast({
        title: "تم إرسال رابط إعادة تعيين كلمة المرور",
        description: "تحقق من بريدك الإلكتروني واتبع التعليمات",
        className: "bg-green-600 text-white",
      });
    } catch(error: any) {
      let errorMessage = "حدث خطأ غير متوقع";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "لا يوجد مستخدم بهذا البريد الإلكتروني";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "البريد الإلكتروني غير صحيح";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "تم إرسال عدد كبير من الطلبات، حاول مرة أخرى لاحق<|im_start|>";
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" style={{fontFamily: 'Cairo, sans-serif'}}>
             <div className="text-center mb-8">
                <Image src="/image/logo.png" alt="Academy logo" width={48} height={48} className="mx-auto" />
                <h1 className="text-3xl font-bold mt-2">أكاديمية الماهرون</h1>
            </div>
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>تم إرسال الرابط بنجاح</CardTitle>
                    <CardDescription>
                        لقد أرسلنا رابطًا لإعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك (والبريد العشوائي).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/auth">
                            <ArrowRight className="ml-2 h-4 w-4" />
                            العودة لتسجيل الدخول
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" style={{fontFamily: 'Cairo, sans-serif'}}>
      <div className="text-center mb-8">
        <Image src="/image/logo.png" alt="Academy logo" width={48} height={48} className="mx-auto" />
        <h1 className="text-3xl font-bold mt-2">أكاديمية الماهرون</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني أدناه وسنرسل لك رابطًا لإعادة تعيين كلمة مرورك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="example@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <RotateCw className="ml-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center">
                <Button variant="link" asChild>
                    <Link href="/auth">العودة لتسجيل الدخول</Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
