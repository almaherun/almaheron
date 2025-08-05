
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, Check, RotateCw, Video, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserData, UserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import VideoCall from '@/components/VideoCall';


const TeacherList = ({ teachers, isLoading, onStartCall, canCall }: { teachers: User[], isLoading: boolean, onStartCall: (teacher: User) => void, canCall: boolean }) => {
    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        )
    }

    if (teachers.length === 0) {
        return <p className="text-center text-muted-foreground py-8">لا يوجد معلمون لعرضهم.</p>;
    }
    
    const handleCallClick = (e: React.MouseEvent, teacher: User) => {
        e.preventDefault();
        e.stopPropagation();
        onStartCall(teacher);
    }

    return (
        <div className="space-y-0">
            {teachers.map((teacher, index) => (
                <div key={teacher.uid}>
                    <div className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50 transition-colors">
                        <Link href={`/student/teachers/${teacher.uid}`} className="flex flex-1 items-center gap-4 text-right">
                             <Avatar className="h-12 w-12">
                                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} data-ai-hint="teacher avatar" />
                                <AvatarFallback className="text-xl">{teacher.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold">{teacher.name}</h3>
                                <p className="text-sm text-muted-foreground">{teacher.specialty}</p>
                            </div>
                        </Link>
                        <Button
                            variant={canCall ? "default" : "secondary"}
                            size="sm"
                            onClick={(e) => handleCallClick(e, teacher)}
                            disabled={!canCall}
                            className="flex items-center gap-2"
                        >
                            <Video className="h-4 w-4" />
                            <span>{canCall ? 'اتصال' : 'انتهت الصلاحية'}</span>
                        </Button>
                    </div>
                    {index < teachers.length - 1 && <Separator />}
                </div>
            ))}
        </div>
    );
};

export default function TeachersPage() {
    const { userData: student, loading: userLoading } = useUserData();
    const [teacherList, setTeacherList] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInCall, setIsInCall] = useState(false);
    const [currentCall, setCurrentCall] = useState<{roomId: string, teacherName: string} | null>(null);
    const { toast } = useToast();

    // Check if student can make calls (subscription not expired)
    const canMakeCalls = () => {
        if (!student) return false;

        // Check if subscription is still valid
        if ((student as any).subscriptionEndDate) {
            const endDate = (student as any).subscriptionEndDate.toDate ? (student as any).subscriptionEndDate.toDate() : new Date((student as any).subscriptionEndDate);
            return endDate > new Date();
        }

        // Check if trial is still valid
        if ((student as any).trialEndDate) {
            const trialEnd = (student as any).trialEndDate.toDate ? (student as any).trialEndDate.toDate() : new Date((student as any).trialEndDate);
            return trialEnd > new Date();
        }

        // Default: allow calls (can be changed based on business logic)
        return true;
    };

    useEffect(() => {
        const q = query(
            collection(db, 'users'), 
            where('type', '==', 'teacher'),
            where('gender', '==', student?.gender || 'male')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teachersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
            setTeacherList(teachersData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [student?.gender]);
    


    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const startCall = async (teacher: User) => {
        if (!student) return;

        try {
            const roomId = generateRoomId();

            // Create call session in database
            await addDoc(collection(db, 'call_sessions'), {
                teacherId: teacher.uid,
                teacherName: teacher.name,
                studentId: student.id,
                studentName: student.name,
                roomId: roomId,
                status: 'active',
                startTime: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            setCurrentCall({
                roomId: roomId,
                teacherName: teacher.name
            });
            setIsInCall(true);

            toast({
                title: "بدء المكالمة",
                description: `جاري الاتصال بـ ${teacher.name}...`,
                className: "bg-blue-600 text-white"
            });
        } catch (error) {
            console.error('Error starting call:', error);
            toast({
                title: "خطأ",
                description: "لم نتمكن من بدء المكالمة",
                variant: "destructive"
            });
        }
    };

    const endCall = async () => {
        setIsInCall(false);
        setCurrentCall(null);

        toast({
            title: "انتهت المكالمة",
            description: "تم إنهاء المكالمة بنجاح",
            className: "bg-green-600 text-white"
        });
    };

    const filteredTeachers = teacherList.filter(teacher => {
        const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (teacher.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Show video call interface - Full screen, no navigation
    if (isInCall && currentCall) {
        return (
            <div className="fixed inset-0 z-50">
                <VideoCall
                    roomId={currentCall.roomId}
                    userName={student?.name || 'طالب'}
                    userType="student"
                    onCallEnd={endCall}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">المعلمون</h1>
                    <p className="text-gray-600 mt-1">
                        {canMakeCalls() ? 'يمكنك الاتصال بأي معلم' : 'انتهت صلاحية الاشتراك - لا يمكن إجراء مكالمات'}
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث عن معلم بالاسم أو التخصص..."
                        className="pr-10 w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                     <TeacherList
                        teachers={filteredTeachers}
                        isLoading={isLoading || userLoading}
                        onStartCall={startCall}
                        canCall={canMakeCalls()}
                     />
                </CardContent>
            </Card>
        </div>
    )
}

    
