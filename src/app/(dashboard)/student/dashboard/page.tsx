
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, BookCopy, BarChart3, Loader2 } from 'lucide-react';
import { Session, User } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import Loading from '@/app/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/hooks/useUser';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


type Stats = {
    followedTeachers: number;
    sessionsThisWeek: number;
    dailyAverage: string;
}

function ValidityCircle({ subscriptionEndDate }: { subscriptionEndDate?: any }) {
    if (!subscriptionEndDate) {
        return null;
    }
    const endDate = subscriptionEndDate.toDate();
    const now = new Date();
    const totalDays = 30;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const percentage = (daysRemaining / totalDays) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative h-24 w-24">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                className="text-gray-200 dark:text-gray-700"
                                strokeWidth="10"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                            />
                            <circle
                                className="text-primary"
                                strokeWidth="10"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-primary">{daysRemaining}</span>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>ينتهي الاشتراك في: {endDate.toLocaleDateString('ar-EG')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

const StatCard = ({ title, value, icon: Icon, href, isLoading }: { title: string, value: string | number, icon: React.ElementType, href: string, isLoading: boolean }) => {
    return (
        <Link href={href}>
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-8 w-1/2" />
                    ) : (
                        <div className="text-2xl font-bold">{value}</div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
};


export default function StudentDashboardPage() {
    const { userData: student, loading: userLoading } = useUserData();
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!student || !student.followedTeachers || student.followedTeachers.length === 0) {
            setIsLoading(false);
            setStats({ followedTeachers: 0, sessionsThisWeek: 0, dailyAverage: '0' });
            return;
        }

        const unsubscribers: (() => void)[] = [];
        
        // Fetch sessions
        const sessionsQuery = query(collection(db, 'sessions'), where('teacherId', 'in', student.followedTeachers), where('status', '==', 'active'));
        const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Session);
            setRecentSessions(sessionsData);
        });
        unsubscribers.push(unsubSessions);
        
        // Calculate stats
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklySessionsQuery = query(collection(db, 'sessions'), where('teacherId', 'in', student.followedTeachers), where('createdAt', '>=', weekAgo));
        const unsubWeeklySessions = onSnapshot(weeklySessionsQuery, (snapshot) => {
             setStats({
                followedTeachers: student.followedTeachers?.length ?? 0,
                sessionsThisWeek: snapshot.size,
                dailyAverage: '0 د' // Placeholder
            });
        });
        unsubscribers.push(unsubWeeklySessions);

        setIsLoading(false);

        return () => unsubscribers.forEach(unsub => unsub());

    }, [student]);


    if (userLoading || isLoading) {
        return <Loading />;
    }
    
    if (!student) {
        return <div className="text-center p-8">لم يتم العثور على بيانات الطالب.</div>
    }
    
    const statCards = [
        { title: 'المعلمون المتابعون', value: stats?.followedTeachers ?? 0, icon: Users, href: '/student/teachers' },
        { title: 'الحلقات هذا الأسبوع', value: stats?.sessionsThisWeek ?? 0, icon: BookCopy, href: '/student/sessions' },
        { title: 'المعدل اليومي', value: stats?.dailyAverage ?? '0', icon: BarChart3, href: '/student/sessions' },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">مرحباً {student.name}</h2>
                    </div>
                     <div className="flex-shrink-0">
                        <ValidityCircle subscriptionEndDate={student.subscriptionEndDate} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map(stat => (
                    <StatCard 
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        href={stat.href}
                        isLoading={isLoading}
                    />
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>حلقات نشطة الآن</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                    ) : recentSessions.length > 0 ? (
                        <div className="space-y-2">
                            {recentSessions.map(session => (
                                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={session.teacherAvatar} alt={session.teacherName} data-ai-hint="teacher avatar" />
                                            <AvatarFallback>{session.teacherName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{session.title}</p>
                                            <p className="text-xs text-muted-foreground">بواسطة {session.teacherName}</p>
                                        </div>
                                    </div>
                                    <Button asChild variant="default" size="sm" disabled={!session.sessionLink}>
                                        <a href={session.sessionLink} target="_blank" rel="noopener noreferrer">
                                            انضم الآن
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">لا توجد حلقات نشطة حاليًا من المعلمين الذين تتابعهم.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
