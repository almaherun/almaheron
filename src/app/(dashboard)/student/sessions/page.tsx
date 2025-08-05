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
  Plus,
  Search,
  BookOpen
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

export default function StudentSessionsPage() {
  const { userData: student, loading } = useUserData();
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSessionTeacher, setNewSessionTeacher] = useState('');
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  // Load sessions
  useEffect(() => {
    if (!student) return;

    const q = query(
      collection(db, 'call_sessions'),
      where('studentId', '==', student.id)
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
  }, [student]);

  // Load followed teachers
  useEffect(() => {
    if (!student?.followedTeachers?.length) return;

    const q = query(
      collection(db, 'users'),
      where('type', '==', 'teacher')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(teacher => student.followedTeachers?.includes(teacher.id));
      
      setTeachers(teachersData);
    });

    return () => unsubscribe();
  }, [student]);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const requestSession = async () => {
    if (!student || !newSessionTeacher || !newSessionSubject) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    try {
      const teacher = teachers.find(t => t.id === newSessionTeacher);
      if (!teacher) return;

      const roomId = generateRoomId();
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 5); // Schedule 5 minutes from now

      await addDoc(collection(db, 'call_sessions'), {
        teacherId: teacher.id,
        teacherName: teacher.name,
        studentId: student.id,
        studentName: student.name,
        roomId: roomId,
        status: 'scheduled',
        scheduledTime: serverTimestamp(),
        subject: newSessionSubject,
        duration: 60, // Default 60 minutes
        createdAt: serverTimestamp()
      });

      toast({
        title: "تم إرسال طلب الجلسة",
        description: "سيتم إشعار المعلم بطلبك",
        className: "bg-green-600 text-white"
      });

      setNewSessionTeacher('');
      setNewSessionSubject('');
    } catch (error) {
      console.error('Error requesting session:', error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من إرسال طلب الجلسة",
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
        description: "جاري الاتصال بالمعلم...",
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
    session.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (!student) {
    return <div className="text-center p-8">لم يتم العثور على بيانات الطالب.</div>;
  }

  // Show video call interface
  if (isInCall && activeCall) {
    return (
      <VideoCall
        roomId={activeCall.roomId}
        userName={student.name}
        userType="student"
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

      {/* Request New Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            طلب جلسة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">المعلم</label>
              <select
                value={newSessionTeacher}
                onChange={(e) => setNewSessionTeacher(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر معلم</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">موضوع الجلسة</label>
              <Input
                value={newSessionSubject}
                onChange={(e) => setNewSessionSubject(e.target.value)}
                placeholder="مثال: تجويد سورة البقرة"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={requestSession} className="w-full">
                إرسال طلب الجلسة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد جلسات</h3>
              <p className="text-gray-500">اطلب جلسة جديدة مع أحد المعلمين المتابعين</p>
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
                      <h3 className="text-lg font-semibold">{session.teacherName}</h3>
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
                      <Button onClick={() => joinCall(session)} className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        انضمام للجلسة
                      </Button>
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
