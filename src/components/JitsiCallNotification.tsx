'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Video, Mic, BookOpen, Clock } from 'lucide-react';
import { JitsiSession } from '@/lib/jitsiSystem';

interface JitsiCallNotificationProps {
  session: JitsiSession;
  onAccept: () => void;
  onReject: () => void;
}

export default function JitsiCallNotification({ 
  session, 
  onAccept, 
  onReject 
}: JitsiCallNotificationProps) {
  
  // تنسيق وقت الإنشاء
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على أيقونة نوع المكالمة
  const getCallIcon = () => {
    switch (session.type) {
      case 'video':
        return <Video className="h-16 w-16 text-blue-500" />;
      case 'audio':
        return <Mic className="h-16 w-16 text-green-500" />;
      case 'quran':
        return <BookOpen className="h-16 w-16 text-emerald-500" />;
      default:
        return <Phone className="h-16 w-16 text-gray-500" />;
    }
  };

  // الحصول على نص نوع المكالمة
  const getCallTypeText = () => {
    switch (session.type) {
      case 'video':
        return 'مكالمة فيديو';
      case 'audio':
        return 'مكالمة صوتية';
      case 'quran':
        return 'حصة قرآن';
      default:
        return 'مكالمة';
    }
  };

  // الحصول على لون البادج
  const getBadgeColor = () => {
    switch (session.type) {
      case 'video':
        return 'bg-blue-500';
      case 'audio':
        return 'bg-green-500';
      case 'quran':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 border-white/20 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          {/* أيقونة المكالمة */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              {getCallIcon()}
              {/* تأثير النبض */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-20">
                {getCallIcon()}
              </div>
            </div>
          </div>

          {/* معلومات المكالمة */}
          <div className="mb-6 space-y-3">
            <Badge 
              className={`${getBadgeColor()} text-white px-3 py-1 text-sm font-medium`}
            >
              {getCallTypeText()}
            </Badge>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              📞 مكالمة واردة
            </h3>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-800">
                من: <span className="text-blue-600">{session.hostName}</span>
              </p>
              
              <p className="text-md text-gray-600">
                {session.title}
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatTime(session.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* معلومات إضافية للقرآن */}
          {session.type === 'quran' && (
            <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">حصة تحفيظ القرآن الكريم</span>
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                ستتضمن أدوات تعليمية خاصة
              </p>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onReject}
              variant="destructive"
              size="lg"
              className="flex-1 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <PhoneOff className="h-6 w-6 mr-2" />
              رفض
            </Button>
            
            <Button
              onClick={onAccept}
              size="lg"
              className="flex-1 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Phone className="h-6 w-6 mr-2" />
              قبول
            </Button>
          </div>

          {/* معلومات تقنية */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 مكالمة آمنة</span>
              <span>•</span>
              <span>🌐 Jitsi Meet</span>
              <span>•</span>
              <span>🆓 مجاني</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
