
'use client'

import React, { useState, useEffect } from 'react';
import { PlusCircle, FileDown, MoreHorizontal, Copy, Trash2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Code } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';


const statusMap = {
    used: { text: 'مستخدم', className: 'bg-gray-100 text-gray-800' },
    active: { text: 'نشط', className: 'bg-green-100 text-green-800' },
    expired: { text: 'منتهي الصلاحية', className: 'bg-yellow-100 text-yellow-800' },
    banned: { text: 'محظور', className: 'bg-red-100 text-red-800' },
};

const userTypeMap = {
    student: 'طالب',
    teacher: 'معلم',
    admin: 'أدمن',
};

function generateCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function AddCodeDialog({ onCodeAdded }: { onCodeAdded: () => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newCode, setNewCode] = useState<Partial<Code>>({
        id: generateCode(),
        type: 'student',
        validity: 30,
    });
    const { toast } = useToast();

    const handleAddCode = async () => {
        setIsLoading(true);
        
        try {
            const codeRef = doc(db, 'codes', newCode.id!);
            await setDoc(codeRef, {
                type: newCode.type,
                validity: newCode.validity,
                status: 'active',
                usedBy: null,
                createdAt: serverTimestamp()
            });
            toast({ title: 'نجاح', description: 'تم إضافة الكود بنجاح.', className: 'bg-green-600 text-white' });
            onCodeAdded();
            setOpen(false);
        } catch (error) {
            console.error("Error adding code: ", error);
            toast({ title: 'خطأ', description: 'لم يتم إضافة الكود.', variant: 'destructive' });
        }
        
        setIsLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1 flex-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        إضافة كود
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة كود دعوة جديد</DialogTitle>
                    <DialogDescription>
                        سيتم إنشاء كود جديد يمكن للمستخدمين استخدامه للانضمام.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">الكود</Label>
                        <Input id="code" value={newCode.id} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">نوع المستخدم</Label>
                        <Select
                            value={newCode.type}
                            onValueChange={(value) => setNewCode({ ...newCode, type: value as Code['type'] })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">طالب</SelectItem>
                                <SelectItem value="teacher">معلم</SelectItem>
                                <SelectItem value="admin">أدمن</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="validity">الصلاحية (بالأيام)</Label>
                        <Input
                            id="validity"
                            type="number"
                            value={newCode.validity}
                            onChange={(e) => setNewCode({ ...newCode, validity: parseInt(e.target.value, 10) })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                    <Button onClick={handleAddCode} disabled={isLoading}>
                        {isLoading && <RotateCw className="ml-2 h-4 w-4 animate-spin" />}
                        إضافة
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function CodesPage() {
    const [codes, setCodes] = useState<Code[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "codes"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const codesData: Code[] = [];
            querySnapshot.forEach((doc) => {
                codesData.push({ id: doc.id, ...doc.data() } as Code);
            });
            setCodes(codesData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: 'تم النسخ!', description: `تم نسخ الكود ${code} إلى الحافظة.` });
    };

    const handleDelete = async (codeId: string) => {
        if (confirm(`هل أنت متأكد من حذف الكود ${codeId}؟`)) {
            await deleteDoc(doc(db, "codes", codeId));
            toast({ title: 'تم الحذف', description: `تم حذف الكود ${codeId} بنجاح.`, className: "bg-green-600 text-white" });
        }
    }
    
    const exportToCsv = () => {
        const headers = ['الكود', 'النوع', 'الصلاحية', 'الحالة', 'تاريخ الإنشاء'];
        const rows = codes.map(code => [
            code.id,
            userTypeMap[code.type as keyof typeof userTypeMap],
            code.validity,
            statusMap[code.status as keyof typeof statusMap].text,
            code.createdAt && code.createdAt.toDate 
                ? new Date(code.createdAt.toDate()).toLocaleDateString('ar-EG')
                : 'غير محدد'
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "codes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>أكواد الدعوة</CardTitle>
                        <CardDescription>إدارة أكواد الدعوة للمستخدمين الجدد.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                         <Button variant="outline" size="sm" className="h-9 gap-1 flex-1" onClick={exportToCsv}>
                            <FileDown className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            تصدير
                            </span>
                        </Button>
                        <AddCodeDialog onCodeAdded={() => {}} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الكود</TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead className="hidden sm:table-cell">الصلاحية (أيام)</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead className="hidden md:table-cell">تاريخ الإنشاء</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <RotateCw className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : codes.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono">{item.id}</TableCell>
                                    <TableCell>{userTypeMap[item.type as keyof typeof userTypeMap]}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{item.validity}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`status-badge ${statusMap[item.status as keyof typeof statusMap].className}`}>
                                            {statusMap[item.status as keyof typeof statusMap].text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {item.createdAt && item.createdAt.toDate 
                                            ? new Date(item.createdAt.toDate()).toLocaleDateString('ar-EG')
                                            : 'غير محدد'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">فتح القائمة</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleCopy(item.id)}>
                                                    <Copy className="ml-2 h-4 w-4" />
                                                    نسخ الكود
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="ml-2 h-4 w-4" />
                                                    حذف
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

