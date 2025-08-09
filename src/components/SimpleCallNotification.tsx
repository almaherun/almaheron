'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { SimpleCallRequest } from '@/lib/simpleCallSystem';

interface SimpleCallNotificationProps {
  call: SimpleCallRequest;
  onAccept: () => void;
  onReject: () => void;
}

export default function SimpleCallNotification({
  call,
  onAccept,
  onReject
}: SimpleCallNotificationProps) {

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* أيقونة المكالمة */}
          <div className="text-4xl mb-4">📞</div>
          
          {/* معلومات المتصل */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{call.studentName}</h2>
            <p className="text-white/90 mb-2">طالب تحفيظ القرآن</p>
            
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Video className="h-5 w-5" />
              <span className="text-lg">مكالمة فيديو</span>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-4 justify-center">
            {/* زر الرفض */}
            <Button
              onClick={onReject}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 p-0"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            {/* زر القبول */}
            <Button
              onClick={onAccept}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 p-0"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-6 text-sm text-white/70">
            <p>مكالمة واردة من طالب</p>
            <p>اضغط ✅ للقبول أو ❌ للرفض</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
