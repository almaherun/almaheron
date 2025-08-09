
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookCopy, BarChart, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { Session, User } from '@/lib/types';
import Loading from '@/app/loading';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUserData } from '@/hooks/useUser';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import ProfessionalVideoCall from '@/components/ProfessionalVideoCall';


const statusMap = {
    approved: { text: 'معتمد', icon: CheckCircle, className: 'text-green-600' },
    pending: { text: 'في انتظار الموافقة', icon: Clock, className: 'text-yellow-600' },
    rejected: { text: 'مرفوض', icon: XCircle, className: 'text-red-600' },
}

export default function TeacherDashboardPage() {
    const { userData: teacher, loading: userLoading } = useUserData();
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [stats, setStats] = useState<{students: number, callsThisWeek: number, totalCalls: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (!teacher) return;
        
        const unsubscribers: (()=>void)[] = [];

        // Set basic stats for calls
        setStats({
            students: 0,
            callsThisWeek: 0,
            totalCalls: 0
        });

        // Load students count
        const studentsQuery = query(collection(db, 'users'), where('type', '==', 'student'));
        const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStats(prevStats => ({
                students: snapshot.size,
                callsThisWeek: prevStats?.callsThisWeek || 0,
                totalCalls: prevStats?.totalCalls || 0
            }));
        });
        unsubscribers.push(unsubStudents);

        // Load call statistics
        const callsQuery = query(collection(db, 'call_sessions'), where('teacherId', '==', teacher.id));
        const unsubCalls = onSnapshot(callsQuery, (snapshot) => {
            const calls = snapshot.docs.map(doc => doc.data());
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const callsThisWeek = calls.filter(call => {
                const callDate = call.createdAt?.toDate() || new Date(0);
                return callDate >= weekAgo;
            }).length;

            setStats(prevStats => ({
                students: prevStats?.students || 0,
                callsThisWeek,
                totalCalls: calls.length
            }));
        });
        unsubscribers.push(unsubCalls);


        setIsLoading(false);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        }

    }, [teacher]);

    if (userLoading || isLoading || !teacher) {
        return <Loading />
    }

    const statusInfo = statusMap[teacher.descriptionStatus || 'pending'];
    const statCards = [
        { title: 'عدد الطلاب', value: stats?.students ?? 0, icon: Users },
        { title: 'المكالمات هذا الأسبوع', value: stats?.callsThisWeek ?? 0, icon: BookCopy },
        { title: 'إجمالي المكالمات', value: stats?.totalCalls ?? 0, icon: BarChart },
    ];


    return (
        <div className="space-y-4 md:space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>مرحباً {teacher.name}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 pt-1">
                        <span>حالة الوصف:</span>
                         <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Badge variant="outline" className={`gap-1 border-dashed cursor-pointer ${statusInfo.className}`}>
                                <statusInfo.icon className="h-3 w-3" />
                                {statusInfo.text}
                                </Badge>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>حالة وصف الملف الشخصي</DialogTitle>
                                    <DialogDescription>
                                        {statusInfo.text}. {teacher.descriptionStatus === 'rejected' && 'يرجى مراجعة الوصف وتعديله ثم إرساله مرة أخرى للموافقة.'}
                                        {teacher.descriptionStatus === 'pending' && 'وصفك قيد المراجعة من قبل الإدارة.'}
                                        {teacher.descriptionStatus === 'approved' && 'وصفك معتمد ويظهر للطلاب.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button onClick={() => setDialogOpen(false)}>حسناً</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

             <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>آخر المكالمات</CardTitle>
                     <CardDescription>عرض لآخر المكالمات مع الطلاب.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <BookCopy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>لا توجد مكالمات حديثة</p>
                        <p className="text-sm mt-2">ستظهر هنا المكالمات مع الطلاب</p>
                    </div>
                </CardContent>
            </Card>

            {/* نظام المكالمات الاحترافي الجديد */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">📞</span>
                        نظام المكالمات المباشر
                    </CardTitle>
                    <CardDescription>
                        نظام مكالمات فيديو احترافي مخصص لأكاديمية تحفيظ القرآن
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {teacher && (
                        <ProfessionalVideoCall
                            userId={teacher.id}
                            userType="teacher"
                            userName={teacher.name}
                            currentSurah="سورة البقرة"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
