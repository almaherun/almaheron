
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Mail, HelpCircle, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const inviteCodeSchema = z.object({
  inviteCode: z.string().length(8, { message: "يجب أن يتكون كود الدعوة من 8 أحرف" }),
});

// Mock user data for now
const user = {
  name: "محمد عبدالله",
  avatarUrl: "",
  userType: "student" as "student" | "teacher" | "admin",
};

export default function InviteCodePage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof inviteCodeSchema>>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  function onSubmit(values: z.infer<typeof inviteCodeSchema>) {
    console.log(values);
    toast({
      title: "جاري التحقق من الكود...",
      description: `الكود المدخل: ${values.inviteCode}`,
    });
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "تم التحقق بنجاح!",
            description: "جاري توجيهك إلى لوحة التحكم.",
            className: "bg-green-600 border-green-600 text-white",
        });
    }, 2000);
  }

  const userTypeMap = {
    student: "طالب",
    teacher: "معلم",
    admin: "أدمن",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" style={{fontFamily: 'Cairo, sans-serif'}}>
       <div className="text-center mb-8">
        <Image src="/image/logo.png" alt="Academy logo" width={48} height={48} className="mx-auto" />
        <h1 className="text-3xl font-bold mt-2">أكاديمية الماهرون</h1>
      </div>
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
            <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile picture" />
                    <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl font-bold text-primary">مرحباً {user.name}</CardTitle>
                    <CardDescription className="mt-2">
                        <Badge variant="secondary">{userTypeMap[user.userType]}</Badge>
                    </CardDescription>
                </div>
            </div>
          <p className="pt-4">يرجى إدخال كود الدعوة للمتابعة</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="أدخل كود الدعوة هنا" 
                        {...field} 
                        className="text-center text-2xl tracking-[0.5em] h-16"
                        maxLength={8}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg" style={{backgroundColor: '#10B981'}}>
                <ShieldCheck className="ml-2" />
                تحقق من الكود
              </Button>
            </form>
          </Form>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="w-full">
                <HelpCircle className="ml-2" />
                طلب كود جديد
            </Button>
            <Button variant="ghost" className="w-full text-primary">
                <Mail className="ml-2" />
                التواصل مع المدير
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
