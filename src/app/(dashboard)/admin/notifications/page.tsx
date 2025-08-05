
'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Eye, RotateCw, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Notification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';


function NotificationCard({ notification, onAction }: { notification: Notification, onAction: (id: string, action: 'approve' | 'reject', payload?: any) => void }) {
    const isApprovalRequest = notification.type === 'approval_request';
    const hasPayload = isApprovalRequest && notification.payload;
    const isAvatarChange = hasPayload && notification.payload?.type === 'avatar';
    const isDescriptionChange = hasPayload && notification.payload?.type === 'description';
    const [isRejecting, setIsRejecting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const handleApproval = () => {
        setIsApproving(true);
        setTimeout(() => {
            onAction(notification.id, 'approve', notification.payload);
            setIsApproving(false);
        }, 500);
    }
    
    return (
        <>
            <div className={`p-2 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-4 transition-colors ${!notification.isRead ? 'bg-primary/5' : 'bg-transparent hover:bg-muted/50'}`}>
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border">
                    <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} data-ai-hint="sender avatar" />
                    <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm sm:text-base">{notification.sender.name}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(notification.createdAt.toDate()).toLocaleTimeString('ar-EG')}</p>
                    </div>
                    <p className="text-sm font-medium text-primary mt-1">{notification.title}</p>
                    
                    {isDescriptionChange && (
                        <Card className="mt-2 bg-background">
                            <CardHeader className="p-2">
                                <CardDescription>الوصف الجديد المقترح:</CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 pt-0">
                                <p className="text-sm text-muted-foreground">{notification.payload?.newData?.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {isAvatarChange && (
                         <Card className="mt-2 bg-background">
                            <CardHeader className="p-2">
                                <CardDescription>الصورة الجديدة المقترحة:</CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 pt-0 flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <p className="text-xs font-semibold mb-1">القديمة</p>
                                    <Avatar className="h-16 w-16 border">
                                        <AvatarImage src={notification.payload?.oldData?.avatarUrl} />
                                        <AvatarFallback>??</AvatarFallback>
                                    </Avatar>
                                </div>
                                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                                <div className="text-center">
                                     <p className="text-xs font-semibold mb-1">الجديدة</p>
                                    <Avatar className="h-16 w-16 border-2 border-primary">
                                        <AvatarImage src={notification.payload?.newData?.avatarUrl} />
                                         <AvatarFallback>??</AvatarFallback>
                                    </Avatar>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!hasPayload && <p className="text-sm text-muted-foreground mt-1">{notification.details}</p>}

                    {isApprovalRequest && (
                         <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" onClick={handleApproval} disabled={isApproving || isRejecting}>
                                {isApproving ? <RotateCw className="ml-1 h-4 w-4 animate-spin" /> : <Check className="ml-1 h-4 w-4" />}
                                موافقة
                            </Button>
                             <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => setIsRejecting(true)} disabled={isApproving || isRejecting}>
                                <X className="ml-1 h-4 w-4" />
                                رفض
                            </Button>
                        </div>
                    )}
                </div>
                 {!notification.isRead && <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>}
            </div>

             <AlertDialog open={isRejecting} onOpenChange={setIsRejecting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من رفض الطلب؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم إشعار المستخدم بالرفض. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onAction(notification.id, 'reject', notification.payload)} className="bg-destructive hover:bg-destructive/90">
                            نعم، قم بالرفض
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function NotificationList({ notifications, onAction, isLoading }: { notifications: Notification[], onAction: (id: string, action: 'approve' | 'reject', payload?: any) => void, isLoading: boolean }) {
    if (isLoading) {
        return <div className="text-center p-8"><RotateCw className="mx-auto h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    return (
        <div className="space-y-4">
            {notifications.length > 0 ? notifications.map(notification => (
                <NotificationCard key={notification.id} notification={notification} onAction={onAction} />
            )) : <p className="text-center text-muted-foreground py-8">لا توجد إشعارات لعرضها.</p>}
        </div>
    )
}


export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        const q = query(collection(db, "notifications"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() } as Notification))
                                        .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setNotifications(notifs);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject', payload?: any) => {
        if (!payload || !payload.teacherId) return;

        const teacherRef = doc(db, 'users', payload.teacherId);

        try {
            if (action === 'approve') {
                let updateData = {};
                if (payload.type === 'description') {
                    updateData = { description: payload.newData.description, descriptionStatus: 'approved' };
                } else if (payload.type === 'avatar') {
                    updateData = { avatarUrl: payload.newData.avatarUrl };
                }
                await updateDoc(teacherRef, updateData);
            } else { // reject
                if (payload.type === 'description') {
                     await updateDoc(teacherRef, { descriptionStatus: 'rejected' });
                }
            }

            // Delete the notification
            await deleteDoc(doc(db, 'notifications', id));

            toast({
                title: 'تم تنفيذ الإجراء',
                description: action === 'approve' ? 'تمت الموافقة على الطلب.' : 'تم رفض الطلب.',
                className: 'bg-green-600 text-white',
            });
        } catch (error) {
            console.error("Error handling action: ", error);
            toast({ title: "خطأ", description: "لم نتمكن من تنفيذ الإجراء.", variant: "destructive"});
        }
    };

    const markAllAsRead = async () => {
        const batch = writeBatch(db);
        const unreadNotifs = notifications.filter(n => !n.isRead && n.type !== 'approval_request');
        if (unreadNotifs.length === 0) return;

        unreadNotifs.forEach(notif => {
            const notifRef = doc(db, "notifications", notif.id);
            batch.update(notifRef, { isRead: true });
        });
        await batch.commit();
        toast({ title: 'تم تحديد جميع الإشعارات كمقروءة.' });
    };
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const approvalRequests = notifications.filter(n => n.type === 'approval_request');

    return (
        <Card>
            <CardHeader>
                <CardTitle>مركز الإشعارات</CardTitle>
                <CardDescription>عرض جميع الإشعارات والطلبات الواردة.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <TabsList className="w-full sm:w-auto grid grid-cols-3">
                            <TabsTrigger value="all">الكل</TabsTrigger>
                            <TabsTrigger value="unread">غير المقروءة</TabsTrigger>
                            <TabsTrigger value="requests">الطلبات</TabsTrigger>
                        </TabsList>
                         <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={markAllAsRead} disabled={unreadCount === 0}>تحديد الكل كمقروء</Button>
                    </div>

                    <TabsContent value="all">
                        <NotificationList notifications={notifications} onAction={handleAction} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="unread">
                        <NotificationList notifications={notifications.filter(n => !n.isRead)} onAction={handleAction} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="requests">
                         <NotificationList notifications={approvalRequests} onAction={handleAction} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
