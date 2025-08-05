
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, Check, LoaderCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserData, UserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';


const TeacherList = ({ teachers, isLoading, onFollowToggle, student, followingInProgress }: { teachers: User[], isLoading: boolean, onFollowToggle: (teacherId: string) => void, student: UserData | null, followingInProgress: string | null }) => {
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
        return student?.followedTeachers?.includes(teacherId);
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
                            variant={isFollowing(teacher.uid) ? "secondary" : "default"} 
                            size="sm"
                            onClick={(e) => handleFollowClick(e, teacher.uid)}
                            disabled={followingInProgress === teacher.uid}
                            className="w-28"
                        >
                            {followingInProgress === teacher.uid ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
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
    const { toast } = useToast();

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
        const isCurrentlyFollowing = student.followedTeachers?.includes(teacherId);

        try {
            if (isCurrentlyFollowing) {
                await updateDoc(studentRef, {
                    followedTeachers: arrayRemove(teacherId)
                });
                toast({ title: 'تم إلغاء المتابعة' });
            } else {
                await updateDoc(studentRef, {
                    followedTeachers: arrayUnion(teacherId)
                });
                toast({ title: 'تمت المتابعة بنجاح!' });
            }
        } catch (error) {
            console.error("Follow toggle error: ", error);
            toast({ title: 'خطأ', description: 'لم نتمكن من إتمام العملية.', variant: 'destructive' });
        } finally {
            setFollowingInProgress(null);
        }
    };

    const filteredTeachers = teacherList.filter(teacher => {
        const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (teacher.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());

        const isFollowing = student?.followedTeachers?.includes(teacher.uid);

        const matchesTab = 
            activeTab === 'all' ||
            (activeTab === 'following' && isFollowing) ||
            (activeTab === 'explore' && !isFollowing);

        return matchesSearch && matchesTab;
    });

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
                            student={student}
                            followingInProgress={followingInProgress}
                         />
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    )
}

    
