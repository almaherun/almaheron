
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


const TeacherList = ({ teachers, isLoading, onFollowToggle, onStartCall, localFollowedTeachers, followingInProgress }: { teachers: User[], isLoading: boolean, onFollowToggle: (teacherId: string) => void, onStartCall: (teacher: User) => void, localFollowedTeachers: string[], followingInProgress: string | null }) => {
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
    
    const handleFollowClick = (e: React.MouseEvent, teacherId: string) => {
        e.preventDefault();
        e.stopPropagation();
        onFollowToggle(teacherId);
    }

    const isFollowing = (teacherId: string) => {
        return localFollowedTeachers.includes(teacherId);
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
                        <div className="flex gap-2">
                            {isFollowing(teacher.uid) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onStartCall(teacher);
                                    }}
                                    className="flex items-center gap-1"
                                >
                                    <Video className="h-4 w-4" />
                                    <span>اتصال</span>
                                </Button>
                            )}
                            <Button
                                variant={isFollowing(teacher.uid) ? "secondary" : "default"}
                                size="sm"
                                onClick={(e) => handleFollowClick(e, teacher.uid)}
                                disabled={followingInProgress === teacher.uid}
                                className="w-28"
                            >
                                {followingInProgress === teacher.uid ? (
                                    <RotateCw className="h-4 w-4 animate-spin" />
                                ) : isFollowing(teacher.uid) ? (
                                    <>
                                        <Check className="ml-1 h-4 w-4" />
                                        <span>تتابعه</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="ml-1 h-4 w-4" />
                                        <span>متابعة</span>
                                    </>
                                )}
                            </Button>
                        </div>
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
    const [activeTab, setActiveTab] = useState('all');
    const [followingInProgress, setFollowingInProgress] = useState<string | null>(null);
    const [localFollowedTeachers, setLocalFollowedTeachers] = useState<string[]>([]);
    const [isInCall, setIsInCall] = useState(false);
    const [currentCall, setCurrentCall] = useState<{roomId: string, teacherName: string} | null>(null);
    const { toast } = useToast();

    // تحديث الحالة المحلية عند تغيير بيانات الطالب
    useEffect(() => {
        if (student?.followedTeachers) {
            setLocalFollowedTeachers(student.followedTeachers);
        }
    }, [student?.followedTeachers]);

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
    
    const handleFollowToggle = async (teacherId: string) => {
        if (!student) return;
        setFollowingInProgress(teacherId);

        const studentRef = doc(db, 'users', student.id);
        const isCurrentlyFollowing = localFollowedTeachers.includes(teacherId);

        try {
            if (isCurrentlyFollowing) {
                // تحديث فوري للحالة المحلية أولاً
                const updatedFollowed = localFollowedTeachers.filter(id => id !== teacherId);
                setLocalFollowedTeachers(updatedFollowed);

                // ثم تحديث قاعدة البيانات
                await updateDoc(studentRef, {
                    followedTeachers: arrayRemove(teacherId)
                });

                toast({ title: 'تم إلغاء المتابعة' });
            } else {
                // تحديث فوري للحالة المحلية أولاً
                const updatedFollowed = [...localFollowedTeachers, teacherId];
                setLocalFollowedTeachers(updatedFollowed);

                // ثم تحديث قاعدة البيانات
                await updateDoc(studentRef, {
                    followedTeachers: arrayUnion(teacherId)
                });

                toast({ title: 'تمت المتابعة بنجاح!' });
            }

        } catch (error) {
            console.error("Follow toggle error: ", error);
            // في حالة الخطأ، إرجاع الحالة المحلية للوضع السابق
            if (student?.followedTeachers) {
                setLocalFollowedTeachers(student.followedTeachers);
            }
            toast({ title: 'خطأ', description: 'لم نتمكن من إتمام العملية.', variant: 'destructive' });
        } finally {
            setFollowingInProgress(null);
        }
    };

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

        const isFollowing = localFollowedTeachers.includes(teacher.uid);

        const matchesTab = 
            activeTab === 'all' ||
            (activeTab === 'following' && isFollowing) ||
            (activeTab === 'explore' && !isFollowing);

        return matchesSearch && matchesTab;
    });

    // Show video call interface
    if (isInCall && currentCall) {
        return (
            <VideoCall
                roomId={currentCall.roomId}
                userName={student?.name || 'طالب'}
                userType="student"
                onCallEnd={endCall}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="ابحث عن معلم بالاسم أو التخصص..." 
                    className="pr-10" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">الكل</TabsTrigger>
                    <TabsTrigger value="following">المتابعون</TabsTrigger>
                    <TabsTrigger value="explore">استكشاف</TabsTrigger>
                </TabsList>
                <Card className="mt-4">
                    <CardContent className="p-0">
                         <TeacherList
                            teachers={filteredTeachers}
                            isLoading={isLoading || userLoading}
                            onFollowToggle={handleFollowToggle}
                            onStartCall={startCall}
                            localFollowedTeachers={localFollowedTeachers}
                            followingInProgress={followingInProgress}
                         />
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    )
}

    
