'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, BookOpen, Star, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserData, UserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSimpleCall } from '@/hooks/useSimpleCall';
import SimpleCallNotification from '@/components/SimpleCallNotification';
import SimpleVideoCall from '@/components/SimpleVideoCall';

interface User extends UserData {
    uid: string;
    id: string;
    name: string;
    email: string;
    type: 'student' | 'teacher';
    isOnline?: boolean;
    lastSeen?: any;
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
    
    // معلومات الطالب
    const studentName = student?.name || 'طالب';

    // 📞 نظام المكالمات البسيط
    const {
        incomingCalls,
        isLoading: isCallLoading,
        currentCall,
        isInCall,
        sendCall,
        acceptCall,
        rejectCall,
        endCall
    } = useSimpleCall();

    // حالة منفصلة لكل معلم
    const [callingTeacher, setCallingTeacher] = useState<string | null>(null);

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

                // تحديد حالة الاتصال بناءً على آخر نشاط
                const lastSeen = data.lastSeen?.toDate?.() || data.lastSeen;
                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                const isOnline = lastSeen && lastSeen > fiveMinutesAgo;

                // استخدام نفس المعرف الذي يستخدمه المعلم (Firebase Auth UID)
                const teacherId = data.authUid || doc.id;

                teachers.push({
                    uid: teacherId,
                    id: teacherId,
                    ...data,
                    isOnline,
                    lastSeen
                } as User);
            });

            setTeacherList(teachers);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [student]);

    // دالة بدء المكالمة
    const handleStartCall = async (teacher: User) => {
        if (!teacher.isOnline) {
            toast({
                title: "❌ المعلم غير متصل",
                description: "المعلم غير متصل حالياً، جرب لاحقاً",
                variant: "destructive"
            });
            return;
        }

        // تعيين حالة الاتصال لهذا المعلم فقط
        setCallingTeacher(teacher.uid);

        try {
            console.log('🚀 Starting call to teacher:', {
                teacherId: teacher.uid,
                teacherName: teacher.name,
                teacherAuthUid: (teacher as any).authUid,
                teacherDocId: teacher.id,
                teacherData: teacher
            });

            // جرب إرسال المكالمة بالمعرف الصحيح
            const teacherIdToUse = teacher.uid; // Firebase Auth UID
            console.log('📞 Using teacher ID:', teacherIdToUse);

            await sendCall(teacherIdToUse, teacher.name);
        } catch (error) {
            console.error('Error starting call:', error);
            setCallingTeacher(null); // إزالة حالة الاتصال عند الخطأ
        }
    };

    // إزالة حالة الاتصال عند انتهاء المكالمة أو بدء مكالمة جديدة
    React.useEffect(() => {
        if (!isCallLoading) {
            // تأخير قصير لإزالة الحالة
            const timer = setTimeout(() => {
                setCallingTeacher(null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isCallLoading]);

    // إزالة حالة الاتصال عند بدء مكالمة فعلية
    React.useEffect(() => {
        if (isInCall) {
            setCallingTeacher(null);
        }
    }, [isInCall]);

    // دالة التواصل مع المعلم عبر الدردشة
    const handleContactTeacher = (teacher: User) => {
        toast({
            title: "💬 التواصل مع المعلم",
            description: `يمكنك التواصل مع ${teacher.name} عبر نظام الدردشة`,
            className: "bg-blue-600 text-white"
        });
    };

    // فلترة المعلمين حسب البحث
    const filteredTeachers = teacherList.filter(teacher =>
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (userLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                            <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                            <Skeleton className="h-4 w-1/2 mx-auto" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* العنوان والبحث */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    🕌 معلمو تحفيظ القرآن الكريم
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    اختر معلمك المفضل وابدأ رحلتك في تعلم وتحفيظ القرآن الكريم مع أفضل المعلمين المتخصصين
                </p>
                
                {/* شريط البحث */}
                <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="ابحث عن معلم أو تخصص..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-right"
                    />
                </div>
            </div>

            {/* قائمة المعلمين */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    // Loading skeletons
                    [...Array(6)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <CardContent className="text-center space-y-4">
                                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                                <Skeleton className="h-4 w-3/4 mx-auto" />
                                <Skeleton className="h-4 w-1/2 mx-auto" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : filteredTeachers.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            لا توجد معلمين متاحين
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'لم يتم العثور على معلمين يطابقون بحثك' : 'لا يوجد معلمين مسجلين حالياً'}
                        </p>
                    </div>
                ) : (
                    filteredTeachers.map((teacher) => (
                        <Card key={teacher.uid} className="hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-6">
                                <div className="text-center space-y-4">
                                    {/* صورة المعلم */}
                                    <div className="relative">
                                        <Avatar className="h-20 w-20 mx-auto">
                                            <AvatarImage 
                                                src={teacher.avatarUrl || (teacher as any).photoURL} 
                                                alt={teacher.name} 
                                            />
                                            <AvatarFallback className="text-lg font-semibold bg-green-100 text-green-700">
                                                {teacher.name?.charAt(0) || 'م'}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        {/* مؤشر الحالة */}
                                        <div className={`absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full border-2 border-white ${
                                            teacher.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`} />
                                    </div>

                                    {/* معلومات المعلم */}
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                            {teacher.name}
                                        </h3>
                                        
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Badge variant={teacher.isOnline ? "default" : "secondary"} className="text-xs">
                                                {teacher.isOnline ? '🟢 متصل الآن' : '⚫ غير متصل'}
                                            </Badge>
                                        </div>

                                        {teacher.specialization && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                📚 {teacher.specialization}
                                            </p>
                                        )}

                                        {teacher.rating && (
                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                <span className="text-sm font-medium">{teacher.rating}</span>
                                                <span className="text-xs text-gray-500">
                                                    ({teacher.studentsCount || 0} طالب)
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* أزرار التواصل */}
                                    <div className="space-y-2">
                                        {/* زر المكالمة */}
                                        <Button
                                            onClick={() => handleStartCall(teacher)}
                                            disabled={!teacher.isOnline || callingTeacher === teacher.uid}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                        >
                                            <Video className="h-4 w-4 mr-2" />
                                            {callingTeacher === teacher.uid ? 'جاري الاتصال...' : '📞 مكالمة فيديو'}
                                        </Button>

                                        {/* زر الدردشة */}
                                        <Button
                                            onClick={() => handleContactTeacher(teacher)}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            💬 دردشة
                                        </Button>

                                        <p className="text-xs text-gray-500 text-center">
                                            {teacher.isOnline ? 'متاح للمكالمات الآن' : 'غير متصل حالياً'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* رسالة ترحيبية */}
            {!isLoading && filteredTeachers.length > 0 && (
                <div className="text-center py-8">
                    <div className="bg-green-50 rounded-lg p-6 max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                            🌟 مرحباً بك في منصة تحفيظ القرآن الكريم
                        </h3>
                        <p className="text-green-700 text-sm">
                            يمكنك الآن التواصل مع المعلمين مباشرة عبر نظام الدردشة للاستفسار عن الدروس وتحديد مواعيد الحصص
                        </p>
                    </div>
                </div>
            )}

            {/* إشعارات المكالمات الواردة */}
            {incomingCalls.map((call) => (
                <SimpleCallNotification
                    key={call.id}
                    call={call}
                    onAccept={() => acceptCall(call)}
                    onReject={() => rejectCall(call.id)}
                />
            ))}

            {/* واجهة المكالمة النشطة */}
            {isInCall && currentCall && (
                <SimpleVideoCall
                    call={currentCall}
                    onEndCall={endCall}
                />
            )}
        </div>
    );
}
