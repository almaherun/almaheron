'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserData, UserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AgoraCallManager, { useAgoraCallSystem } from '@/components/DailyCallManager';

interface User extends UserData {
    uid: string;
    name: string;
    email: string;
    type: 'teacher' | 'student';
    isOnline?: boolean;
    lastSeen?: Date;
    specialization?: string;
    rating?: number;
    studentsCount?: number;
    avatarUrl?: string;
}

export default function TeachersPage() {
    const { userData: student, loading: userLoading } = useUserData();
    const [teacherList, setTeacherList] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    
    // استخدام نظام المكالمات الجديد
    const { startCall, cancelCall, waitingCallId, callSystem } = useAgoraCallSystem(
        student?.id || '',
        student?.name || 'طالب',
        'student'
    );

    // حالة الانتظار خاصة بكل معلم
    const [waitingForTeacher, setWaitingForTeacher] = useState<string | null>(null);

    // الاستماع لتغييرات حالة المكالمة لإزالة حالة الانتظار
    useEffect(() => {
        if (!waitingCallId) {
            setWaitingForTeacher(null);
        }
    }, [waitingCallId]);

    // Check if student can make calls
    const canMakeCalls = () => {
        if (!student) return false;
        return true; // مبسط للآن
    };

    // جلب قائمة المعلمين
    useEffect(() => {
        if (!student) return;

        const teachersQuery = query(
            collection(db, 'users'),
            where('type', '==', 'teacher')
        );

        const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
            const teachers: User[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                teachers.push({
                    uid: doc.id,
                    id: doc.id,
                    ...data
                } as User);
            });
            
            setTeacherList(teachers);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [student]);

    // دالة بدء المكالمة
    const handleStartCall = async (teacher: User) => {
        if (!student) return;

        if (!canMakeCalls()) {
            toast({
                title: "غير متاح",
                description: "المكالمات غير متاحة حالياً",
                variant: "destructive"
            });
            return;
        }

        try {
            // تعيين حالة الانتظار لهذا المعلم فقط
            setWaitingForTeacher(teacher.uid);

            await startCall(teacher.uid, teacher.name, 'video');

            toast({
                title: "تم إرسال طلب المكالمة",
                description: `جاري انتظار رد ${teacher.name}...`,
                className: "bg-blue-600 text-white"
            });
        } catch (error) {
            console.error('Error starting call:', error);
            setWaitingForTeacher(null); // إزالة حالة الانتظار عند الخطأ
            toast({
                title: "خطأ",
                description: "حدث خطأ أثناء إرسال طلب المكالمة",
                variant: "destructive"
            });
        }
    };

    // دالة إلغاء المكالمة
    const handleCancelCall = async (teacherId: string) => {
        try {
            await cancelCall();
            setWaitingForTeacher(null);
            toast({
                title: "تم إلغاء المكالمة",
                description: "تم إلغاء طلب المكالمة",
                className: "bg-gray-600 text-white"
            });
        } catch (error) {
            console.error('Error canceling call:', error);
        }
    };

    // تصفية المعلمين حسب البحث
    const filteredTeachers = teacherList.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.specialization && teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (userLoading || !student) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (student.type !== 'student') {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-red-600">هذه الصفحة مخصصة للطلاب فقط</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* شريط البحث */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="ابحث عن معلم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* قائمة المعلمين */}
            <div className="grid gap-4">
                {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index}>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4 space-x-reverse">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-10 w-24" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : filteredTeachers.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-gray-500">لا توجد معلمون متاحون حالياً</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredTeachers.map((teacher) => (
                        <Card key={teacher.uid} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 space-x-reverse">
                                        <div className="relative">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={teacher.avatarUrl} />
                                                <AvatarFallback className="bg-green-100 text-green-800">
                                                    {teacher.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {teacher.isOnline && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">{teacher.name}</h3>
                                            {teacher.specialization && (
                                                <p className="text-sm text-gray-600">{teacher.specialization}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {teacher.rating && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        ⭐ {teacher.rating.toFixed(1)}
                                                    </Badge>
                                                )}
                                                {teacher.studentsCount && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {teacher.studentsCount} طالب
                                                    </Badge>
                                                )}
                                                <Badge 
                                                    variant={teacher.isOnline ? "default" : "secondary"}
                                                    className={teacher.isOnline ? "bg-green-600" : ""}
                                                >
                                                    {teacher.isOnline ? 'متصل' : 'غير متصل'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            onClick={() => handleStartCall(teacher)}
                                            disabled={!canMakeCalls() || waitingForTeacher === teacher.uid}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Video className="h-4 w-4 mr-2" />
                                            {waitingForTeacher === teacher.uid ? 'جاري الاتصال...' : 'بدء مكالمة'}
                                        </Button>

                                        {waitingForTeacher === teacher.uid && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelCall(teacher.uid)}
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                إلغاء
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
            
            {/* نظام المكالمات */}
            {student && (
                <AgoraCallManager
                    userId={student.id}
                    userName={student.name || 'طالب'}
                    userType="student"
                />
            )}
        </div>
    );
}
