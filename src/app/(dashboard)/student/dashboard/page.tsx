
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, BookCopy, BarChart, RotateCw } from 'lucide-react';
import { Session, User } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import Loading from '@/app/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserData } from '@/hooks/useUser';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


type Stats = {
    availableTeachers: number;
    callsThisWeek: number;
    totalCalls: number;
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
        if (!student) {
            setIsLoading(false);
            setStats({ availableTeachers: 0, callsThisWeek: 0, totalCalls: 0 });
            return;
        }

        // تحديث الإحصائيات الأساسية فوراً
        setIsLoading(false);

        const unsubscribers: (() => void)[] = [];

        // Set basic stats for calls
        setStats({
            availableTeachers: 0, // Will be updated with actual data
            callsThisWeek: 0, // Will be updated with actual data
            totalCalls: 0 // Will be updated with actual data
        });

        // Load available teachers count
        const teachersQuery = query(collection(db, 'users'), where('type', '==', 'teacher'));
        const unsubTeachers = onSnapshot(teachersQuery, (snapshot) => {
            setStats(prevStats => ({
                availableTeachers: snapshot.size,
                callsThisWeek: prevStats?.callsThisWeek || 0,
                totalCalls: prevStats?.totalCalls || 0
            }));
        });
        unsubscribers.push(unsubTeachers);

        // Load call statistics
        const callsQuery = query(collection(db, 'call_sessions'), where('studentId', '==', student.id));
        const unsubCalls = onSnapshot(callsQuery, (snapshot) => {
            const calls = snapshot.docs.map(doc => doc.data());
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const callsThisWeek = calls.filter(call => {
                const callDate = call.createdAt?.toDate() || new Date(0);
                return callDate >= weekAgo;
            }).length;

            setStats(prevStats => ({
                availableTeachers: prevStats?.availableTeachers || 0,
                callsThisWeek,
                totalCalls: calls.length
            }));
        });
        unsubscribers.push(unsubCalls);

        setRecentSessions([]);
        setIsLoading(false);

        return () => unsubscribers.forEach(unsub => unsub());

    }, [student, student?.followedTeachers?.length]); // إضافة dependency للطول


    if (userLoading || isLoading) {
        return <Loading />;
    }
    
    if (!student) {
        return <div className="text-center p-8">لم يتم العثور على بيانات الطالب.</div>
    }
    
    const statCards = [
        { title: 'المعلمون المتاحون', value: stats?.availableTeachers ?? 0, icon: Users, href: '/student/teachers' },
        { title: 'المكالمات هذا الأسبوع', value: stats?.callsThisWeek ?? 0, icon: BookCopy, href: '/student/teachers' },
        { title: 'إجمالي المكالمات', value: stats?.totalCalls ?? 0, icon: BarChart, href: '/student/teachers' },
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
                    <CardTitle>آخر المكالمات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <BookCopy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>لا توجد مكالمات حديثة</p>
                        <p className="text-sm mt-2">ابدأ مكالمة مع أحد المعلمين</p>
                        <Button className="mt-4" onClick={() => window.location.href = '/student/teachers'}>
                            تصفح المعلمين
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
