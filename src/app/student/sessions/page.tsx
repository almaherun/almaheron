
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { Session, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const SessionCard = ({ session }: { session: Session }) => {
    const isActive = session.status === 'active';
    return (
        <div className="flex items-center gap-4 p-4">
             <Button asChild variant={isActive ? "default" : "outline"} disabled={!isActive || !session.sessionLink} className="w-28">
                {isActive ? (
                    <a href={session.sessionLink} target="_blank" rel="noopener noreferrer">
                       انضم الآن
                    </a>
                ) : (
                    <span>انتهت</span>
                )}
            </Button>
            <div className="flex-1 text-right">
                <h3 className="font-semibold">{session.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    بواسطة {session.teacherName}
                </p>
            </div>
            <Avatar className="h-12 w-12 border">
                <AvatarImage src={session.teacherAvatar} alt={session.teacherName} data-ai-hint="teacher avatar"/>
                <AvatarFallback className="text-xl">{session.teacherName.charAt(0)}</AvatarFallback>
            </Avatar>
        </div>
    );
};

const SessionList = ({ sessions, isLoading, noSessionsText }: { sessions: Session[], isLoading: boolean, noSessionsText: string }) => {
    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }
    
    if (sessions.length === 0) {
        return <p className="text-center text-muted-foreground py-8">{noSessionsText}</p>;
    }
    
    return (
        <div className="divide-y divide-border rounded-md border">
            {sessions.map((session, index) => (
                <div key={session.id}>
                    <SessionCard session={session} />
                    {index < sessions.length - 1 && <Separator />}
                </div>
            ))}
        </div>
    );
}

export default function StudentSessionsPage() {
    const { userData: student, loading: userLoading } = useUserData();
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!student || !student.followedTeachers || student.followedTeachers.length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const q = query(collection(db, 'sessions'), where('teacherId', 'in', student.followedTeachers));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Session)
                .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setAllSessions(sessions);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [student]);

    const activeSessions = allSessions.filter(s => s.status === 'active');
    const endedSessions = allSessions.filter(s => s.status === 'ended');

    return (
        <div className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>حلقات المعلمين المتابَعين</CardTitle>
                </CardHeader>
                 <CardContent>
                     <Tabs defaultValue="active">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="active">
                                النشطة حاليًا
                            </TabsTrigger>
                            <TabsTrigger value="ended">المنتهية</TabsTrigger>
                        </TabsList>
                        <TabsContent value="active" className="mt-4">
                             <SessionList 
                                sessions={activeSessions} 
                                isLoading={isLoading || userLoading} 
                                noSessionsText="لا توجد حلقات نشطة حاليًا." 
                            />
                        </TabsContent>
                        <TabsContent value="ended" className="mt-4">
                            <SessionList 
                                sessions={endedSessions} 
                                isLoading={isLoading || userLoading}
                                noSessionsText="لا توجد حلقات منتهية بعد." 
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
