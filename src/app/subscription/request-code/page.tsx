'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Clock, MessageCircle, Key } from 'lucide-react';

const codeRequestSchema = z.object({
  inviteCode: z.string().min(8, { message: "يجب أن يتكون كود الدعوة من 8 أحرف" }),
});

const contactSchema = z.object({
  message: z.string().min(10, { message: "يجب أن تكون الرسالة 10 أحرف على الأقل" }),
});

export default function RequestCodePage() {
  const [activeTab, setActiveTab] = useState<'code' | 'contact'>('code');
  const { toast } = useToast();

  const codeForm = useForm<z.infer<typeof codeRequestSchema>>({
    resolver: zodResolver(codeRequestSchema),
    defaultValues: { inviteCode: "" },
  });

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { message: "" },
  });

  function onCodeSubmit(values: z.infer<typeof codeRequestSchema>) {
    // هنا سيتم التحقق من الكود وتفعيل الاشتراك
    toast({
      title: "جاري التحقق من الكود...",
      description: "سيتم تفعيل اشتراكك إذا كان الكود صحيحاً.",
    });
  }

  function onContactSubmit(values: z.infer<typeof contactSchema>) {
    toast({
      title: "تم إرسال طلبك!",
      description: "سيتم التواصل معك قريباً من قبل الإدارة.",
      className: "bg-green-600 text-white",
    });
    contactForm.reset();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">انتهت فترة التجربة المجانية</CardTitle>
          <CardDescription>
            لمتابعة استخدام المنصة، يمكنك إدخال كود دعوة أو التواصل مع الإدارة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              إدخال كود
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'contact'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              طلب كود
            </button>
          </div>

          {activeTab === 'code' ? (
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
                <FormField
                  control={codeForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود الدعوة</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل كود الدعوة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  تفعيل الكود
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...contactForm}>
              <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                <FormField
                  control={contactForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رسالتك للإدارة</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اكتب رسالة للإدارة لطلب كود دعوة..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  إرسال الطلب
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">معلومات الاتصال:</h4>
            <p className="text-sm text-blue-700">
              📧 البريد الإلكتروني: admin@almaheron.com<br/>
              📱 الهاتف: 01000000000
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}