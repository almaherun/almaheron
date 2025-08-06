'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Clock, ExternalLink, PhoneOff } from 'lucide-react';
import { createJitsiUrl } from '@/lib/freeCallSystem';

interface SimpleFreeVideoCallProps {
  roomId: string;
  userName: string;
  userType: 'student' | 'teacher';
  onCallEnd: () => void;
  remoteUserName?: string;
}

export default function SimpleFreeVideoCall({
  roomId,
  userName,
  userType,
  onCallEnd,
  remoteUserName = 'المستخدم الآخر'
}: SimpleFreeVideoCallProps) {
  const [callStarted, setCallStarted] = useState(false);

  const jitsiUrl = createJitsiUrl(roomId, userName);

  const handleStartCall = () => {
    // فتح Jitsi في نافذة جديدة
    window.open(jitsiUrl, '_blank', 'width=1200,height=800');
    setCallStarted(true);
  };

  const handleEndCall = () => {
    setCallStarted(false);
    onCallEnd();
  };

  if (callStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Video className="h-6 w-6 text-green-600" />
              مكالمة نشطة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                المكالمة نشطة في نافذة منفصلة
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Users className="h-3 w-3 mr-1" />
                مجاني تماماً
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">معلومات المكالمة:</p>
              <ul className="text-sm space-y-1">
                <li><strong>الغرفة:</strong> {roomId}</li>
                <li><strong>المستخدم:</strong> {userName}</li>
                <li><strong>النوع:</strong> {userType === 'teacher' ? 'معلم' : 'طالب'}</li>
                <li><strong>مع:</strong> {remoteUserName}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => window.open(jitsiUrl, '_blank')} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                فتح المكالمة مرة أخرى
              </Button>
              
              <Button 
                onClick={handleEndCall} 
                variant="destructive" 
                className="w-full"
                size="lg"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                إنهاء المكالمة
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>إذا أُغلقت النافذة بالخطأ، اضغط "فتح المكالمة مرة أخرى"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            مكالمة مرئية مجانية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              ستبدأ المكالمة في نافذة جديدة
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              مجاني تماماً - بلا حدود
            </Badge>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">معلومات المكالمة:</p>
            <ul className="text-sm space-y-1">
              <li><strong>الغرفة:</strong> {roomId}</li>
              <li><strong>المستخدم:</strong> {userName}</li>
              <li><strong>النوع:</strong> {userType === 'teacher' ? 'معلم' : 'طالب'}</li>
              <li><strong>مع:</strong> {remoteUserName}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleStartCall} 
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Video className="h-4 w-4 mr-2" />
              بدء المكالمة المجانية
            </Button>
            
            <Button 
              onClick={onCallEnd} 
              variant="outline" 
              className="w-full"
            >
              إلغاء
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• مجاني تماماً بدون حدود زمنية</p>
            <p>• يدعم حتى 100 مشارك</p>
            <p>• آمن ومشفر</p>
            <p>• لا يحتاج تسجيل</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
