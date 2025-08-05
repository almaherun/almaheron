
'use client'

import { useState, useEffect } from 'react';
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, Eye, UserX, RotateCw, Ticket, Camera, UserCheck, UserCog } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { User, Code } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';


const statusMap: { [key: string]: { text: string; className: string } } = {
    active: { text: 'نشط', className: 'bg-green-100 text-green-800' },
    pending: { text: 'قيد المراجعة', className: 'bg-yellow-100 text-yellow-800' },
    inactive: { text: 'غير نشط', className: 'bg-red-100 text-red-800' },
};

const userTypeMap: { [key: string]: string } = {
    student: 'طالب',
    teacher: 'معلم',
    admin: 'أدمن',
};

function generateCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}


function UserDialog({ user, mode, onSave, onOpenChange }: { user: Partial<User> | null; mode: 'view' | 'edit' | 'add'; onSave: (user: Partial<User>) => void; onOpenChange: (open: boolean) => void }) {
    if (!user) return null;

    const [editedUser, setEditedUser] = useState<Partial<User>>(user);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [isUnlimited, setIsUnlimited] = useState(true);
    const [validity, setValidity] = useState(30);

    const handleInputChange = (field: keyof User, value: string) => {
        setEditedUser(prev => ({ ...prev, [field]: value }));
    };
    
     const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newAvatarUrl = reader.result as string;
                setAvatarPreview(newAvatarUrl);
                setEditedUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        // onSave({ ...editedUser, code_validity: finalValidity } as any);
        // This will be handled by a cloud function or backend logic
        console.log("Saving user... (Cloud function needed)");
    };
    
    const isEditMode = mode === 'edit' || mode === 'add';

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{isEditMode ? (mode === 'add' ? 'إضافة مستخدم جديد' : 'تعديل المستخدم') : 'عرض تفاصيل المستخدم'}</DialogTitle>
                <DialogDescription>
                    {isEditMode ? 'قم بإدخال البيانات أدناه.' : 'تفاصيل المستخدم المسجل في النظام.'}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                {isEditMode && (
                     <div className="flex flex-col items-center gap-4">
                         <div className="relative">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={avatarPreview || ''} data-ai-hint="user avatar" />
                                <AvatarFallback><Camera className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                            </Avatar>
                             <Button asChild size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full cursor-pointer">
                               <label htmlFor="avatar-upload">
                                    <Camera className="h-4 w-4" />
                                    <span className="sr-only">تغيير الصورة</span>
                               </label>
                            </Button>
                            <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </div>
                    </div>
                )}
                {!isEditMode && (
                     <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={editedUser.avatarUrl} />
                            <AvatarFallback>{editedUser.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-2 flex-1">
                            <h3 className="font-semibold text-lg">{editedUser.name}</h3>
                            <p className="text-sm text-muted-foreground">{editedUser.email}</p>
                        </div>
                    </div>
                )}
                
                <div className="grid gap-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input id="name" value={editedUser.name} readOnly={!isEditMode} onChange={e => handleInputChange('name', e.target.value as keyof User)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" value={editedUser.email} readOnly={!isEditMode} onChange={e => handleInputChange('email', e.target.value as keyof User)} />
                </div>
                 {isEditMode && mode === 'add' && (
                    <div className="grid gap-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Input id="password" type="password" onChange={e => setEditedUser(p => ({...p, password: e.target.value}))} />
                    </div>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" value={editedUser.phone} readOnly={!isEditMode} onChange={e => handleInputChange('phone', e.target.value as keyof User)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="type">النوع</Label>
                        <Select value={editedUser.type} disabled={!isEditMode} onValueChange={(value) => handleInputChange('type', value)}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">طالب</SelectItem>
                                <SelectItem value="teacher">معلم</SelectItem>
                                <SelectItem value="admin">أدمن</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">الحالة</Label>
                        <Select value={editedUser.status} disabled={!isEditMode} onValueChange={(value) => handleInputChange('status', value)}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statusMap).map(([key, {text}]) => (
                                    <SelectItem key={key} value={key}>{text}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {mode === 'add' && (
                     <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-semibold">إعدادات كود الدعوة</h4>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="unlimited-validity" className="flex flex-col gap-1">
                                <span>صلاحية غير محدودة</span>
                                <span className="text-xs font-normal text-muted-foreground">الكود لن ينتهي أبدًا.</span>
                            </Label>
                            <Switch id="unlimited-validity" checked={isUnlimited} onCheckedChange={setIsUnlimited} />
                        </div>
                        {!isUnlimited && (
                             <div className="space-y-2">
                                <Label htmlFor="validity">الصلاحية (بالأيام)</Label>
                                <Input
                                    id="validity"
                                    type="number"
                                    value={validity}
                                    onChange={(e) => setValidity(parseInt(e.target.value, 10))}
                                />
                            </div>
                        )}
                    </div>
                )}
                 {!isEditMode && editedUser.createdAt && (
                    <div className="grid gap-2">
                        <Label>تاريخ الإنشاء</Label>
                        <Input value={new Date(editedUser.createdAt.toDate()).toLocaleString('ar-EG')} readOnly />
                    </div>
                )}
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                 <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">إغلاق</Button>
                </DialogClose>
                {isEditMode && <Button onClick={handleSave} className="w-full sm:w-auto">حفظ</Button>}
            </DialogFooter>
        </DialogContent>
    );
}

// NOTE: Add User Dialog is removed because user creation should happen via registration flow or a secure backend function.
// Admin can edit users, but creating them from scratch here is complex and requires backend logic to create auth user.

const UserTable = ({ users, onAction }: { users: User[], onAction: (action: 'view' | 'edit' | 'disable' | 'delete', user: User) => void }) => (
    <div className="overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الإجراءات</TableHead>
                        <TableHead className="hidden lg:table-cell">تاريخ التسجيل</TableHead>
                        <TableHead className="hidden md:table-cell">البريد الإلكتروني</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="hidden sm:table-cell">النوع</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead className="w-[80px]">الصورة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.uid}>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onAction('view', user)}>
                                            <Eye className="ml-2 h-4 w-4" />
                                            عرض
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAction('edit', user)}>
                                            <Edit className="ml-2 h-4 w-4" />
                                            تعديل
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAction('disable', user)}>
                                            <UserX className="ml-2 h-4 w-4" />
                                            {user.status === 'active' ? 'تعطيل' : 'تفعيل'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onAction('delete', user)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            حذف
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                                {user.createdAt && typeof user.createdAt.toDate === 'function' 
                                    ? user.createdAt.toDate().toLocaleDateString('ar-EG')
                                    : 'غير محدد'
                                }
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell>
                                <Badge className={statusMap[user.status]?.className || 'bg-gray-100 text-gray-800'}>
                                    {statusMap[user.status]?.text || user.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline">
                                    {userTypeMap[user.type] || user.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
);

export default function UsersPage() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    
    // State for dialogs
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'view' | 'edit' | null>(null);
    const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData: User[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ uid: doc.id, ...doc.data() } as User);
            });
            setAllUsers(usersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleAction = (action: 'view' | 'edit' | 'disable' | 'delete', user?: User) => {
        if (action === 'delete') {
            setUserToDelete(user!);
        } else if (action === 'disable') {
            setUserToToggleStatus(user!);
        } else {
            setDialogMode(action);
            setSelectedUser(user!);
            setIsDialogOpen(true);
        }
    };
    
    const handleSaveUser = async (userData: Partial<User>) => {
        if (selectedUser?.uid) {
            const userRef = doc(db, 'users', selectedUser.uid);
            await updateDoc(userRef, userData);
            toast({ title: 'نجاح', description: 'تم تحديث المستخدم بنجاح.' });
        }
        setIsDialogOpen(false);
    };

    const handleDeleteUser = async () => {
        if (userToDelete) {
            // Note: This only deletes the Firestore record.
            // A cloud function is needed to delete the Firebase Auth user.
            await deleteDoc(doc(db, "users", userToDelete.uid));
            toast({ title: 'نجاح', description: `تم حذف المستخدم ${userToDelete.name} من قاعدة البيانات.` });
            setUserToDelete(null);
        }
    };

    const handleToggleUserStatus = async () => {
        if (userToToggleStatus) {
            const newStatus = userToToggleStatus.status === 'active' ? 'inactive' : 'active';
            const userRef = doc(db, 'users', userToToggleStatus.uid);
            await updateDoc(userRef, { status: newStatus });
            toast({ title: 'نجاح', description: `تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} المستخدم ${userToToggleStatus.name}.` });
            setUserToToggleStatus(null);
        }
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setDialogMode(null);
            setSelectedUser(null);
        }
    }

    const filteredUsers = allUsers.filter(user => {
        const byType =
            activeTab === 'all' ||
            (activeTab === 'students' && user.type === 'student') ||
            (activeTab === 'teachers' && user.type === 'teacher') ||
            (activeTab === 'admins' && user.type === 'admin');

        const bySearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return byType && bySearch;
    });

    const isDisabling = userToToggleStatus?.status === 'active';

    if (loading) {
        return <div className="flex justify-center items-center h-full"><RotateCw className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <>
            <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
                            className="pl-10 w-full" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <p className="text-sm text-muted-foreground">لإضافة مستخدم، قم بإنشاء كود دعوة.</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">الكل</TabsTrigger>
                        <TabsTrigger value="students">الطلاب</TabsTrigger>
                        <TabsTrigger value="teachers">المعلمين</TabsTrigger>
                        <TabsTrigger value="admins">الأدمن</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Card className="mt-4">
                    <CardContent className="p-0">
                        <UserTable users={filteredUsers} onAction={handleAction} />
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <UserDialog user={selectedUser} mode={dialogMode!} onSave={handleSaveUser} onOpenChange={handleDialogChange} />
            </Dialog>

            <AlertDialog open={!!userToToggleStatus} onOpenChange={(open) => !open && setUserToToggleStatus(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        {isDisabling
                         ? 'سيؤدي هذا إلى تعطيل حساب المستخدم ومنعه من تسجيل الدخول. يمكنك إعادة تفعيله لاحقًا.'
                         : 'سيؤدي هذا إلى إعادة تفعيل حساب المستخدم والسماح له بتسجيل الدخول.'
                        }
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleToggleUserStatus} 
                        className={isDisabling ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}>
                        {isDisabling ? 'تعطيل' : 'تفعيل'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                    <AlertDialogDescription>
                       سيؤدي هذا الإجراء إلى حذف سجل المستخدم من قاعدة البيانات. لن يتم حذف حساب المصادقة الخاص به. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

