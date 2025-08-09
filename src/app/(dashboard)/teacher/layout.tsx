
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Settings,
  Sun,
  Moon,
  LogOut,
  Users,
  Radio,
  PanelLeft,
} from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Loading from '@/app/loading';
import { useUserData } from '@/hooks/useUser';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useSimpleCall } from '@/hooks/useSimpleCall';
import SimpleCallNotification from '@/components/SimpleCallNotification';
import SimpleVideoCall from '@/components/SimpleVideoCall';


const menuItems = [
    { href: '/teacher/dashboard', label: 'الرئيسية', icon: Home },
    { href: '/teacher/students', label: 'الطلاب', icon: Users },
    { href: '/teacher/profile', label: 'الإعدادات', icon: Settings },
];

const BottomNavItem = ({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: React.ElementType; isActive: boolean; }) => (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md text-xs w-full h-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        <Icon className="h-5 w-5 mb-0.5" />
        <span>{label}</span>
    </Link>
);

const BottomNavBar = ({ items }: { items: typeof menuItems }) => {
    const pathname = usePathname();
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50">
            <div className="flex justify-around items-center h-16">
                {items.map(item => (
                    <BottomNavItem 
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={pathname.startsWith(item.href)}
                    />
                ))}
            </div>
        </div>
    );
};


function TeacherLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading } = useUserData();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  // تم إزالة النظام القديم - سيتم استخدام DailyCallManager
  const [theme, setTheme] = React.useState('light');
  const { isMobile, setOpenMobile } = useSidebar();

  // 📞 نظام المكالمات البسيط
  const {
    incomingCalls,
    currentCall,
    isInCall,
    acceptCall,
    rejectCall,
    endCall
  } = useSimpleCall();


  
  React.useEffect(() => {
    if (!loading && (!userData || userData.type !== 'teacher')) {
        router.push('/auth');
    }
  }, [userData, loading, router]);

  // تحديث حالة الاتصال للمعلم
  React.useEffect(() => {
    if (!userData || userData.type !== 'teacher') return;

    const updateOnlineStatus = async () => {
      try {
        const userRef = doc(db, 'users', userData.id);
        await updateDoc(userRef, {
          lastSeen: new Date(),
          isOnline: true,
          authUid: userData.id // حفظ authUid للتطابق مع نظام المكالمات
        });
        console.log('🟢 Teacher online status updated with authUid:', userData.id);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // تحديث فوري
    updateOnlineStatus();

    // تحديث كل دقيقة
    const interval = setInterval(updateOnlineStatus, 60000);

    // تحديث عند إغلاق الصفحة
    const handleBeforeUnload = async () => {
      try {
        const userRef = doc(db, 'users', userData.id);
        await updateDoc(userRef, {
          lastSeen: new Date(),
          isOnline: false
        });
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // تحديث حالة عدم الاتصال عند مغادرة المكون
      handleBeforeUnload();
    };
  }, [userData]);

  // تم إزالة النظام القديم - سيتم استخدام DailyCallManager


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  }

  // تم إزالة دوال المكالمات القديمة

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => pathname.startsWith(item.href));
     if (pathname.startsWith('/teacher/profile')) return 'الملف الشخصي والإعدادات';
    return currentItem ? currentItem.label : 'لوحة تحكم المعلم';
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  if (loading || !userData || userData.type !== 'teacher') {
    return <Loading />;
  }

  return (
    <>
        <Sidebar side="right" collapsible="icon">
            <SidebarHeader className="p-2 justify-center">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:hidden h-9 w-9">
                        <Image src="/image/logo.png" alt="Academy logo" width={24} height={24} className="text-primary dark:invert" />
                    </Button>
                    <h1 className="text-xl font-bold group-data-[collapsible=icon]:hidden">أكاديمية</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={{ children: item.label, side: "left"}}>
                                <Link href={item.href} onClick={handleLinkClick}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={{children: "تسجيل الخروج", side: "left"}}>
                             <button onClick={handleLogout} className="w-full">
                                <LogOut />
                                <span className="group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>

        <SidebarInset>
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="flex">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                    <h1 className="text-lg font-semibold md:text-xl">{getPageTitle()}</h1>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={userData.avatarUrl} alt={userData.name} data-ai-hint="teacher avatar" />
                            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{userData.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem asChild>
                                <Link href="/teacher/profile">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>الإعدادات</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>تسجيل الخروج</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
            <BottomNavBar items={menuItems} />
        </SidebarInset>

        {/* إشعارات المكالمات الواردة */}
        {incomingCalls.map((call) => (
            <SimpleCallNotification
                key={call.id}
                call={call}
                onAccept={() => acceptCall(call)}
                onReject={() => rejectCall(call.id)}
            />
        ))}

        {/* واجهة المكالمة النشطة */}
        {isInCall && currentCall && (
            <SimpleVideoCall
                call={currentCall}
                onEndCall={endCall}
            />
        )}
    </>
  );
}


export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarProvider><TeacherLayoutContent>{children}</TeacherLayoutContent></SidebarProvider>;
}

