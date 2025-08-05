
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Loading from '@/app/loading';
import { useUserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


const StudentList = ({ students, isLoading }: { students: User[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    if (students.length === 0) {
        return <p className="text-center text-muted-foreground py-8">لا يوجد طلاب يتابعونك حاليًا.</p>;
    }

    return (
        <div className="divide-y divide-border rounded-md border">
            {students.map((student) => (
                <div key={student.uid}>
                    <div className="flex items-center justify-between gap-4 p-3">
                         <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="student avatar" />
                                <AvatarFallback className="text-xl">{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div>
                                <h3 className="font-semibold">{student.name}</h3>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">متابع</Badge>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function TeacherStudentsPage() {
    const { userData: teacher, loading: userLoading } = useUserData();
    const [studentList, setStudentList] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!teacher) return;
        
        setIsLoading(true);
        const q = query(
            collection(db, "users"), 
            where('followedTeachers', 'array-contains', teacher.id),
            where('gender', '==', teacher.gender)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const students = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
            setStudentList(students);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [teacher]);

    const filteredStudents = studentList.filter(student => {
        return student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               student.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (userLoading) {
        return <Loading />;
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="ابحث عن طالب بالاسم أو البريد..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <Card className="mt-4">
                <CardContent className="p-0">
                    <StudentList students={filteredStudents} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>
    )
}

    
