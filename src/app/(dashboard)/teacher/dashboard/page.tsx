
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookCopy, ChartColumn, Clock, CheckCircle, XCircle } from 'lucide-react';
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


const statusMap = {
    approved: { text: 'معتمد', icon: CheckCircle, className: 'text-green-600' },
    pending: { text: 'في انتظار الموافقة', icon: Clock, className: 'text-yellow-600' },
    rejected: { text: 'مرفوض', icon: XCircle, className: 'text-red-600' },
}

export default function TeacherDashboardPage() {
    const { userData: teacher, loading: userLoading } = useUserData();
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [stats, setStats] = useState<{followers: number, sessionsThisWeek: number, totalSessions: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (!teacher) return;
        
        const unsubscribers: (()=>void)[] = [];

        // Fetch recent sessions
        const sessionsQuery = query(
            collection(db, 'sessions'), 
            where('teacherId', '==', teacher.id),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Session);
            setRecentSessions(sessionsData);
        });
        unsubscribers.push(unsubSessions);

        // Fetch user count for stats (as a proxy for followers)
         const usersQuery = query(
             collection(db, 'users'), 
             where('followedTeachers', 'array-contains', teacher.id),
             where('gender', '==', teacher.gender)
         );
         const unsubFollowers = onSnapshot(usersQuery, (snapshot) => {
             setStats(prev => ({...prev!, followers: snapshot.size}));
         });
        unsubscribers.push(unsubFollowers);


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
        { title: 'عدد المتابعين', value: stats?.followers ?? 0, icon: Users },
        { title: 'الحلقات هذا الأسبوع', value: stats?.sessionsThisWeek ?? 0, icon: BookCopy },
        { title: 'إجمالي الحلقات', value: stats?.totalSessions ?? 0, icon: ChartColumn },
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
                    <CardTitle>آخر الحلقات</CardTitle>
                     <CardDescription>عرض لآخر 5 حلقات قمت بإنشائها.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="overflow-x-auto">
                       {isLoading ? (
                           <div className="space-y-2">
                               <Skeleton className="h-12 w-full" />
                               <Skeleton className="h-12 w-full" />
                               <Skeleton className="h-12 w-full" />
                           </div>
                       ) : recentSessions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>عنوان الحلقة</TableHead>
                                        <TableHead className="hidden sm:table-cell">تاريخ الرفع</TableHead>
                                        <TableHead>المستمعون</TableHead>
                                        <TableHead>الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentSessions.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-medium">{session.title}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{new Date(session.createdAt.toDate()).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell>{session.listeners || 0}</TableCell>
                                            <TableCell>
                                                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>{session.status === 'active' ? 'نشطة' : 'منتهية'}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                       ) : (
                        <p className="text-center text-muted-foreground py-4">لم تقم بإنشاء أي حلقات بعد.</p>
                       )}
                   </div>
                </CardContent>
            </Card>
        </div>
    )
}
