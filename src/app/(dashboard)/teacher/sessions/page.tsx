'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/useUser';
import VideoCall from '@/components/VideoCall';
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  Search,
  BookOpen
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface CallSession {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  roomId: string;
  status: 'scheduled' | 'active' | 'ended';
  scheduledTime: Date;
  startTime?: Date;
  endTime?: Date;
  subject: string;
  duration: number; // in minutes
}

export default function TeacherSessionsPage() {
  const { userData: teacher, loading } = useUserData();
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // Load sessions
  useEffect(() => {
    if (!teacher) return;

    const q = query(
      collection(db, 'call_sessions'),
      where('teacherId', '==', teacher.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledTime: doc.data().scheduledTime?.toDate(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
      })) as CallSession[];
      
      setSessions(sessionsData.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime()));
    });

    return () => unsubscribe();
  }, [teacher]);

  const acceptSession = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'call_sessions', sessionId), {
        status: 'scheduled'
      });

      toast({
        title: "تم قبول الجلسة",
        description: "تم إشعار الطالب بقبول طلبه",
        className: "bg-green-600 text-white"
      });
    } catch (error) {
      console.error('Error accepting session:', error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من قبول الجلسة",
        variant: "destructive"
      });
    }
  };

  const rejectSession = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'call_sessions', sessionId), {
        status: 'ended'
      });

      toast({
        title: "تم رفض الجلسة",
        description: "تم إشعار الطالب برفض الطلب",
        className: "bg-red-600 text-white"
      });
    } catch (error) {
      console.error('Error rejecting session:', error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من رفض الجلسة",
        variant: "destructive"
      });
    }
  };

  const joinCall = async (session: CallSession) => {
    try {
      // Update session status to active
      await updateDoc(doc(db, 'call_sessions', session.id), {
        status: 'active',
        startTime: serverTimestamp()
      });

      setActiveCall(session);
      setIsInCall(true);

      toast({
        title: "انضمام للمكالمة",
        description: "جاري الاتصال بالطالب...",
        className: "bg-blue-600 text-white"
      });
    } catch (error) {
      console.error('Error joining call:', error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من الانضمام للمكالمة",
        variant: "destructive"
      });
    }
  };

  const endCall = async () => {
    if (!activeCall) return;

    try {
      await updateDoc(doc(db, 'call_sessions', activeCall.id), {
        status: 'ended',
        endTime: serverTimestamp()
      });

      setIsInCall(false);
      setActiveCall(null);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (!teacher) {
    return <div className="text-center p-8">لم يتم العثور على بيانات المعلم.</div>;
  }

  // Show video call interface
  if (isInCall && activeCall) {
    return (
      <VideoCall
        roomId={activeCall.roomId}
        userName={teacher.name}
        userType="teacher"
        onCallEnd={endCall}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الجلسات التعليمية</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الجلسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد جلسات</h3>
              <p className="text-gray-500">ستظهر هنا طلبات الجلسات من الطلاب</p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">{session.studentName}</h3>
                      <Badge variant={
                        session.status === 'active' ? 'default' :
                        session.status === 'scheduled' ? 'secondary' : 'outline'
                      }>
                        {session.status === 'active' ? 'نشطة' :
                         session.status === 'scheduled' ? 'مجدولة' : 'انتهت'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{session.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{session.scheduledTime.toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{session.scheduledTime.toLocaleTimeString('ar-EG')} ({session.duration} دقيقة)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {session.status === 'scheduled' && (
                      <>
                        <Button onClick={() => joinCall(session)} className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          بدء الجلسة
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => acceptSession(session.id)} 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            قبول
                          </Button>
                          <Button 
                            onClick={() => rejectSession(session.id)} 
                            size="sm" 
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            رفض
                          </Button>
                        </div>
                      </>
                    )}
                    {session.status === 'active' && (
                      <Button onClick={() => joinCall(session)} variant="secondary" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        العودة للمكالمة
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
