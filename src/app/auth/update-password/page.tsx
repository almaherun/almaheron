
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: "يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
});


function PasswordField({ name, label, placeholder }: { name: "newPassword" | "confirmPassword", label: string, placeholder: string }) {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  return (
     <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                {...field}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}


export default function UpdatePasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    if (code) {
      setOobCode(code);
    } else {
      setError('رابط إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية');
    }
  }, []);

  const form = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: 'onBlur',
  });


  async function onSubmit(values: z.infer<typeof updatePasswordSchema>) {
    if (!oobCode) {
      setError('رابط إعادة تعيين كلمة المرور غير صحيح');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await confirmPasswordReset(auth, oobCode, values.newPassword);
      
      toast({
        title: "تم تحديث كلمة المرور بنجاح",
        description: "يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة",
        className: "bg-green-600 text-white",
      });
      
      router.push('/auth');
    } catch (error: any) {
      let errorMessage = "حدث خطأ أثناء تحديث كلمة المرور";
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = "انتهت صلاحية الرابط، يرجى طلب رابط جديد";
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = "الرابط غير صحيح أو تم استخدامه من قبل";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "كلمة المرور ضعيفة";
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" style={{fontFamily: 'Cairo, sans-serif'}}>
      <div className="text-center mb-8">
        <Image src="/image/logo.png" alt="Academy logo" width={48} height={48} className="mx-auto" />
        <h1 className="text-3xl font-bold mt-2">أكاديمية الماهرون</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>تعيين كلمة مرور جديدة</CardTitle>
          <CardDescription>
            أدخل كلمة مرور قوية وجديدة لحسابك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <PasswordField name="newPassword" label="كلمة المرور الجديدة" placeholder="••••••••" />
                <PasswordField name="confirmPassword" label="تأكيد كلمة المرور الجديدة" placeholder="••••••••" />

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
