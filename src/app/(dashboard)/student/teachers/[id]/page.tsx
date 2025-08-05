
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { useUserData } from '@/hooks/useUser';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Star, Plus, Loader2 } from 'lucide-react';
import Loading from '@/app/loading';
import { useToast } from '@/hooks/use-toast';

export default function TeacherProfilePage() {
    const router = useRouter();
    const params = useParams();
    const teacherId = params.id as string;
    
    const [teacher, setTeacher] = useState<User | null>(null);
    const { userData: student, loading: studentLoading } = useUserData();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!teacherId) return;
        const fetchTeacher = async () => {
            const docRef = doc(db, 'users', teacherId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setTeacher({ uid: docSnap.id, ...docSnap.data() } as User);
            } else {
                setTeacher(null); // Teacher not found
            }
        }
        fetchTeacher();
    }, [teacherId]);

    useEffect(() => {
        if (student && teacher) {
            setIsFollowing(student.followedTeachers?.includes(teacher.uid) || false);
        }
    }, [student, teacher]);


    const handleFollowToggle = async () => {
        if (!student || !teacher || !student.id) return;
        setIsFollowLoading(true);
        
        const studentRef = doc(db, 'users', student.id);

        try {
            if (isFollowing) {
                await updateDoc(studentRef, {
                    followedTeachers: arrayRemove(teacher.uid)
                });
                toast({ title: 'تم إلغاء المتابعة' });
                setIsFollowing(false);
            } else {
                await updateDoc(studentRef, {
                    followedTeachers: arrayUnion(teacher.uid)
                });
                toast({ title: 'تمت المتابعة بنجاح!', className: 'bg-green-600 text-white' });
                setIsFollowing(true);
            }
        } catch (error) {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء تنفيذ العملية.',
                variant: 'destructive',
            });
        } finally {
            setIsFollowLoading(false);
        }
    };

    if (studentLoading || teacher === null) {
        return <Loading />
    }

    if (!teacher) {
        return <div className="text-center py-10">لم يتم العثور على المعلم.</div>;
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-start">
                 <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة للمعلمين
                </Button>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} data-ai-hint="teacher avatar" />
                    <AvatarFallback className="text-5xl">{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{teacher.name}</h1>
                    <p className="text-lg text-muted-foreground">{teacher.specialty}</p>
                </div>
                 
                 <Button 
                    variant={isFollowing ? "secondary" : "default"} 
                    className="w-40"
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                >
                    {isFollowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFollowing ? <Check className="ml-2 h-4 w-4" /> : <Plus className="ml-2 h-4 w-4" />)}
                    {isFollowing ? 'تتابعه' : 'متابعة'}
                </Button>

            </div>

            <Card>
                <CardHeader>
                    <CardTitle>نبذة عن المعلم</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        {teacher.description}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>أبرز الإنجازات</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {teacher.achievements?.map((achievement, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <Star className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                                <span className="text-muted-foreground">{achievement}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

    