
'use client';

import { useState, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Palette, Bell, Lock, Paintbrush, ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const themes = [
  { name: 'افتراضي', primary: '#1E3A8A', accent: '#10B981', background: '#F8FAFC' },
  { name: 'محيط', primary: '#3B82F6', accent: '#06B6D4', background: '#EFF6FF' },
  { name: 'صحراء', primary: '#D97706', accent: '#F59E0B', background: '#FFFBEB' },
  { name: 'غابة', primary: '#16A34A', accent: '#4ADE80', background: '#F0FDF4' },
];

function hexToHsl(hex: string) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ThemeCustomizerDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [currentThemeName, setCurrentThemeName] = useState(themes[0].name);
  const [colors, setColors] = useState({
      primary: themes[0].primary,
      accent: themes[0].accent,
      background: themes[0].background,
  });

  const selectTheme = (theme: typeof themes[0]) => {
    setCurrentThemeName(theme.name);
    setColors({
        primary: theme.primary,
        accent: theme.accent,
        background: theme.background,
    });
  }

  const applyCustomColors = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary', hexToHsl(colors.primary));
    root.style.setProperty('--accent', hexToHsl(colors.accent));
    root.style.setProperty('--background', hexToHsl(colors.background));

    toast({
        title: "تم تطبيق المظهر بنجاح!",
        description: "تم تحديث ألوان التطبيق.",
        className: "bg-green-600 border-green-600 text-white",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>تخصيص مظهر التطبيق</DialogTitle>
          <DialogDescription>
            اختر أحد الثيمات الجاهزة أو قم بتعيين الألوان بنفسك.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
           <div className="md:col-span-1 space-y-4">
                <h3 className="text-lg font-medium">الثيمات الجاهزة</h3>
                <div className="flex flex-row md:flex-col gap-2">
                    {themes.map(theme => (
                        <div key={theme.name} className="cursor-pointer flex-1" onClick={() => selectTheme(theme)}>
                            <div className="p-1 border-2 rounded-lg" style={{ borderColor: currentThemeName === theme.name ? colors.primary : 'transparent' }}>
                                <div className="flex items-center justify-center h-12 rounded-md" style={{ backgroundColor: theme.background }}>
                                    <div className="flex gap-2">
                                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.accent }}></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-center mt-1">{theme.name}</p>
                        </div>
                    ))}
                </div>
            </div>
             <div className="md:col-span-3">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="primaryColor">اللون الرئيسي</Label>
                        <div className="flex items-center gap-2">
                            <Input type="color" id="primaryColor" value={colors.primary} onChange={(e) => setColors({...colors, primary: e.target.value})} className="p-1 h-10 w-14" />
                            <Input value={colors.primary.toUpperCase()} onChange={(e) => setColors({...colors, primary: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accentColor">اللون الثانوي (Accent)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="color" id="accentColor" value={colors.accent} onChange={(e) => setColors({...colors, accent: e.target.value})} className="p-1 h-10 w-14" />
                            <Input value={colors.accent.toUpperCase()} onChange={(e) => setColors({...colors, accent: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="backgroundColor">الخلفية</Label>
                        <div className="flex items-center gap-2">
                            <Input type="color" id="backgroundColor" value={colors.background} onChange={(e) => setColors({...colors, background: e.target.value})} className="p-1 h-10 w-14" />
                            <Input value={colors.background.toUpperCase()} onChange={(e) => setColors({...colors, background: e.target.value})} />
                        </div>
                    </div>
                </div>
             </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 pt-4">
             <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">إلغاء</Button>
            <Button onClick={applyCustomColors} className="w-full sm:w-auto">
                <Paintbrush className="ml-2 h-4 w-4" />
                تطبيق التغييرات
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const adminData = {
    fullName: "الأدمن الرئيسي",
    email: "admin@example.com",
    avatar: "https://placehold.co/100x100.png",
};


const SettingsListItem = ({ label, value, onClick }: { label: string, value?: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full text-right p-4 border-b transition-colors hover:bg-muted/50">
        <div>
            <p className="font-semibold">{label}</p>
            {value && <p className="text-sm text-muted-foreground">{value}</p>}
        </div>
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
    </button>
);

export default function AdminSettingsPage() {
    const [view, setView] = useState('main'); // 'main', 'profile', 'general', 'security'
    const [isCustomizerOpen, setCustomizerOpen] = useState(false);
    const { toast } = useToast();
    const [avatarPreview, setAvatarPreview] = useState(adminData.avatar);


    const handleSave = () => {
        toast({
            title: "تم حفظ التغييرات بنجاح!",
        });
    }
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderSubViewHeader = (title: string, onBack: () => void) => (
         <div className="flex items-center p-2 border-b mb-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
                <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
    );

    const renderMainView = () => (
        <Card>
            <CardHeader>
                <CardTitle>الإعدادات</CardTitle>
                <CardDescription>إدارة إعدادات حسابك والتطبيق.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                     <SettingsListItem label="الملف الشخصي للمدير" onClick={() => setView('profile')} />
                     <SettingsListItem label="إعدادات التطبيق العامة" onClick={() => setView('general')} />
                     <SettingsListItem label="الأمان" onClick={() => setView('security')} />
                </div>
            </CardContent>
        </Card>
    );

    const renderProfileView = () => (
        <Card>
            {renderSubViewHeader("الملف الشخصي للمدير", () => setView('main'))}
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                     <div className="relative">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarPreview} data-ai-hint="admin avatar" />
                            <AvatarFallback>أ</AvatarFallback>
                        </Avatar>
                         <Button asChild size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full cursor-pointer">
                           <label htmlFor="avatar-upload">
                                <Camera className="h-4 w-4" />
                                <span className="sr-only">تغيير الصورة</span>
                           </label>
                        </Button>
                        <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                     <div className="flex-1">
                        <h3 className="text-lg font-semibold">{adminData.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{adminData.email}</p>
                    </div>
                </div>
                <Separator />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">الاسم الكامل</Label>
                        <Input id="fullName" defaultValue={adminData.fullName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input id="email" type="email" defaultValue={adminData.email} />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 mt-6">
                <Button onClick={handleSave}>حفظ التغييرات</Button>
            </CardFooter>
        </Card>
    );

    const renderGeneralView = () => (
        <Card>
            {renderSubViewHeader("إعدادات التطبيق العامة", () => setView('main'))}
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                    <div className="flex items-center gap-3">
                        <Palette className="h-6 w-6 text-primary" />
                        <div>
                            <Label>تخصيص المظهر</Label>
                            <p className="text-sm text-muted-foreground">
                                تغيير الألوان الرئيسية للتطبيق.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setCustomizerOpen(true)} className="w-full sm:w-auto flex-shrink-0">تخصيص</Button>
                </div>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                    <div className="flex items-center gap-3">
                        <Bell className="h-6 w-6 text-primary" />
                        <div>
                            <Label>إشعارات النظام</Label>
                            <p className="text-sm text-muted-foreground">
                                إرسال إشعارات لجميع المستخدمين.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto flex-shrink-0">إرسال إشعار</Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderSecurityView = () => (
         <Card>
            {renderSubViewHeader("الأمان", () => setView('main'))}
            <CardContent className="grid gap-4 pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                    <div className="flex items-center gap-3">
                        <Lock className="h-6 w-6 text-primary" />
                        <div>
                            <Label>كلمة المرور</Label>
                            <p className="text-sm text-muted-foreground">
                                تغيير كلمة المرور الخاصة بحساب المدير.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full sm:w-auto flex-shrink-0">تغيير</Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderCurrentView = () => {
        switch (view) {
            case 'profile':
                return renderProfileView();
            case 'general':
                return renderGeneralView();
            case 'security':
                return renderSecurityView();
            case 'main':
            default:
                return renderMainView();
        }
    };

    return (
        <div className="space-y-6">
            {renderCurrentView()}
            <ThemeCustomizerDialog open={isCustomizerOpen} onOpenChange={setCustomizerOpen} />
        </div>
    );
}

    
