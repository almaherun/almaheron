'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { SimpleCallRequest } from '@/lib/simpleCallSystem';

interface SimpleCallNotificationProps {
  call: SimpleCallRequest;
  onAccept: () => void;
  onReject: () => void;
}

export default function SimpleCallNotification({ call, onAccept, onReject }: SimpleCallNotificationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 mx-4">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            {call.type === 'video' ? (
              <Video className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            ) : (
              <Phone className="h-16 w-16 mx-auto text-green-500 mb-4" />
            )}
            
            <h3 className="text-xl font-bold mb-2">
              📞 مكالمة {call.type === 'video' ? 'فيديو' : 'صوتية'} واردة
            </h3>
            
            <p className="text-lg text-muted-foreground mb-4">
              من: <span className="font-semibold">{call.fromName}</span>
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={onReject}
              variant="destructive"
              size="lg"
              className="flex-1"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              رفض
            </Button>
            
            <Button
              onClick={onAccept}
              variant="default"
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-5 w-5 mr-2" />
              قبول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
