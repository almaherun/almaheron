
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
import { ShieldCheck, Mail, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const inviteCodeSchema = z.object({
  inviteCode: z.string().length(8, { message: "يجب أن يتكون كود الدعوة من 8 أحرف" }),
});

export default function SubscriptionExpiredPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof inviteCodeSchema>>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  function onSubmit(values: z.infer<typeof inviteCodeSchema>) {
    console.log(values);
    // Simulate API call
    setTimeout(() => {
        // In a real app, you would verify the code and then redirect
        toast({
            title: "تم تفعيل الكود بنجاح!",
            description: "تم تجديد اشتراكك. جاري توجيهك...",
            className: "bg-green-600 border-green-600 text-white",
        });
        // Redirect to a dashboard, for now we redirect to home
        router.push('/');
    }, 1000);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4" style={{fontFamily: 'Cairo, sans-serif'}}>
       <div className="text-center mb-8">
        <Image src="/image/logo.png" alt="Academy logo" width={56} height={56} className="mx-auto" />
        <h1 className="text-3xl font-bold mt-4">أكاديمية الماهرون</h1>
      </div>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                <Ticket className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">انتهى اشتراكك!</CardTitle>
            <CardDescription className="pt-2">
                يرجى إدخال كود دعوة جديد لتجديد اشتراكك ومواصلة التعلم.
            </CardDescription>
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
                        placeholder="أدخل كود التفعيل هنا" 
                        {...field} 
                        className="text-center text-xl tracking-[0.3em] h-14"
                        maxLength={8}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg">
                <ShieldCheck className="ml-2" />
                تفعيل الكود
              </Button>
            </form>
          </Form>
          <div className="mt-6">
            <Button variant="ghost" className="w-full text-primary">
                <Mail className="ml-2" />
                التواصل مع المدير لطلب كود
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
