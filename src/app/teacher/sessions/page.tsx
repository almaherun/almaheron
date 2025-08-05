
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, X, PlusCircle, Loader2 } from 'lucide-react';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/app/loading';
import { useUserData } from '@/hooks/useUser';
import { Session } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';


function CreateSessionForm({ onSessionCreated, setOpen, teacherId, teacherName, teacherAvatar }: { onSessionCreated: () => void, setOpen: (open: boolean) => void, teacherId: string, teacherName: string, teacherAvatar: string }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [sessionLink, setSessionLink] = useState('');

    const handleSessionStart = async () => {
        if (!title || !sessionLink) {
            toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            await addDoc(collection(db, 'sessions'), {
                title,
                sessionLink,
                teacherId: teacherId,
                teacherName: teacherName,
                teacherAvatar: teacherAvatar,
                status: 'active',
                listeners: 0,
                createdAt: serverTimestamp()
            });
            toast({ title: 'نجاح', description: 'تم بدء الحلقة بنجاح!', className: 'bg-green-600 text-white' });
            onSessionCreated();
            setOpen(false);
        } catch (error) {
            console.error("Error creating session: ", error);
            toast({ title: 'خطأ', description: 'لم نتمكن من بدء الحلقة.', variant: 'destructive' });
        }
        setIsLoading(false);
    };

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle>بدء حلقة جديدة</DialogTitle>
                <DialogDescription>
                    املأ التفاصيل أدناه لبدء حلقة جديدة مع طلابك.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">عنوان الحلقة</Label>
                    <Input id="title" placeholder="مثال: تسميع سورة البقرة" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sessionLink">رابط الجلسة (Google Meet, etc.)</Label>
                    <Input id="sessionLink" placeholder="https://meet.google.com/..." value={sessionLink} onChange={e => setSessionLink(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button size="lg" onClick={handleSessionStart} disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    بدء الحلقة
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}


function ActiveSessionCard({ session, onSessionEnd }: { session: Session, onSessionEnd: (sessionId: string) => void }) {
    const [elapsedTime, setElapsedTime] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        const startTime = session.createdAt.toMillis();
        const updateTimer = () => {
            const now = Date.now();
            setElapsedTime(Math.floor((now - startTime) / 1000));
        };
        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, [session.createdAt]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }
    
    const handleEndClick = () => {
        setIsLoading(true);
        onSessionEnd(session.id);
        // No need to set loading to false, as component will unmount
    }

    return (
        <Card className="max-w-2xl mx-auto overflow-hidden border-destructive/50 shadow-lg shadow-destructive/10">
            <div className="p-8 bg-gradient-to-br from-background to-destructive/10 text-center space-y-6">
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute h-40 w-40 rounded-full bg-destructive/20 animate-ping -z-0"></div>
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                        <Mic className="h-16 w-16" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold">الحلقة نشطة الآن</h2>
                <p className="text-muted-foreground">عنوان الحلقة: {session.title}</p>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-lg bg-background/50">
                        <div className="text-4xl font-bold font-mono text-destructive">{formatTime(elapsedTime)}</div>
                        <div className="text-sm text-muted-foreground mt-1">المدة</div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50">
                        <div className="text-4xl font-bold font-mono text-destructive">{session.listeners || 0}</div>
                        <div className="text-sm text-muted-foreground mt-1">المستمعون</div>
                    </div>
                </div>
            </div>
            <CardFooter className="p-4 bg-background">
                <Button variant="destructive" size="lg" className="w-full text-lg" onClick={handleEndClick} disabled={isLoading}>
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <X className="ml-2 h-5 w-5" />
                    إنهاء الحلقة
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function TeacherSessionsPage() {
    const { userData: teacher, loading: userLoading } = useUserData();
    const [isDialogOpen, setDialogOpen] = React.useState(false);
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!teacher) return;
        
        setIsLoading(true);
        const q = query(
            collection(db, 'sessions'), 
            where('teacherId', '==', teacher.id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Session);
            setAllSessions(sessionsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [teacher]);

    const activeSession = allSessions.find(s => s.status === 'active');

    const handleEndSession = async (sessionId: string) => {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            status: 'ended',
            endedAt: serverTimestamp()
        });
        toast({ title: 'تم إنهاء الحلقة بنجاح' });
    };
    
    if (userLoading || isLoading) {
        return <Loading />
    }

    if (!teacher) {
        return <div className="text-center p-8">لم يتم العثور على بيانات المعلم.</div>
    }

    if (activeSession) {
        return <ActiveSessionCard session={activeSession} onSessionEnd={handleEndSession} />;
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <div className="space-y-4">
                <Card className="w-full max-w-lg mx-auto">
                    <CardHeader className="text-center">
                        <CardTitle>بدء حلقة جديدة</CardTitle>
                        <CardDescription>انقر على الزر أدناه لبدء حلقة مباشرة مع طلابك.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <DialogTrigger asChild>
                            <Button size="lg">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                بدء حلقة جديدة
                            </Button>
                        </DialogTrigger>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>سجل الحلقات</CardTitle>
                        <CardDescription>عرض لجميع الحلقات التي قمت بإنشائها.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="overflow-x-auto">
                           {isLoading ? (
                               <div className="space-y-2">
                                   <Skeleton className="h-12 w-full" />
                                   <Skeleton className="h-12 w-full" />
                                   <Skeleton className="h-12 w-full" />
                               </div>
                           ) : allSessions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>عنوان الحلقة</TableHead>
                                            <TableHead className="hidden sm:table-cell">تاريخ الإنشاء</TableHead>
                                            <TableHead>المستمعون</TableHead>
                                            <TableHead>الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allSessions.map((session) => (
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
                             <p className="text-center text-muted-foreground py-8">لم تقم بإنشاء أي حلقات بعد.</p>
                           )}
                       </div>
                    </CardContent>
                </Card>
            </div>
            {teacher && <CreateSessionForm onSessionCreated={() => {}} setOpen={setDialogOpen} teacherId={teacher.id} teacherName={teacher.name} teacherAvatar={teacher.avatarUrl || ''} />}
        </Dialog>
    );
}
