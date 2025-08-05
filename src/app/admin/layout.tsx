
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Ticket,
  Settings,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  BookOpen,
  PanelLeft,
  Bell,
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
  SidebarTrigger,
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
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useUserData } from '@/hooks/useUser';
import Loading from '@/app/loading';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';


const menuItems = [
    { href: '/admin/dashboard', label: 'الرئيسية', icon: Home },
    { href: '/admin/users', label: 'المستخدمون', icon: Users },
    { href: '/admin/codes', label: 'الأكواد', icon: Ticket },
    { href: '/admin/notifications', label: 'الإشعارات', icon: Bell },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

const BottomNavItem = ({ href, label, icon: Icon, isActive, hasBadge }: { href: string; label: string; icon: React.ElementType; isActive: boolean; hasBadge?: boolean }) => (
    <Link href={href} className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-md text-xs w-full h-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        <Icon className="h-5 w-5 mb-0.5" />
        <span>{label}</span>
        {hasBadge && <span className="absolute top-2 right-1/2 translate-x-3 w-2 h-2 rounded-full bg-primary"></span>}
    </Link>
);

const BottomNavBar = ({ items, hasNotifications }: { items: { href: string; label: string; icon: React.ElementType; }[], hasNotifications: boolean }) => {
    const pathname = usePathname();
    const navItems = [
      { href: '/admin/dashboard', label: 'الرئيسية', icon: Home },
      ...items.filter(item => item.href !== '/admin/dashboard' && item.href !== '/admin/settings')
    ];
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => (
                    <BottomNavItem 
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={pathname === item.href}
                        hasBadge={item.href === '/admin/notifications' && hasNotifications}
                    />
                ))}
            </div>
        </div>
    );
};

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading } = useUserData();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = React.useState('light');
  const [unreadNotifications, setUnreadNotifications] = React.useState(false);
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  
  React.useEffect(() => {
    if (!loading && (!userData || userData.type !== 'admin')) {
        router.push('/auth');
    }
  }, [userData, loading, router]);
  
  React.useEffect(() => {
    const q = query(collection(db, "notifications"), where("isRead", "==", false));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadNotifications(!querySnapshot.empty);
    });
    return () => unsubscribe();
  }, []);


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  const getPageTitle = () => {
      const currentItem = menuItems.find(item => item.href === pathname);
      return currentItem ? currentItem.label : 'لوحة تحكم الأدمن';
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  if (loading || !userData || userData.type !== 'admin') {
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
                            <SidebarMenuButton 
                                asChild 
                                isActive={pathname === item.href}
                                tooltip={{
                                    children: item.label,
                                    side: "left"
                                }}
                            >
                                <Link href={item.href} onClick={handleLinkClick}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                     {item.href === '/admin/notifications' && unreadNotifications && (
                                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sidebar-primary-foreground group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1"></span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} asChild tooltip={{children: "تسجيل الخروج", side: "left"}}>
                            <Link href="">
                                <LogOut />
                                <span className="group-data-[collapsible=icon]:hidden">تسجيل الخروج</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>

        <SidebarInset>
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="flex">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl">{getPageTitle()}</h1>
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
                            <AvatarImage src={userData.avatarUrl} alt={userData.name} data-ai-hint="admin avatar" />
                            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{userData.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/admin/settings">
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
            <main className="flex-1 overflow-auto bg-muted/40 p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
            <BottomNavBar items={menuItems} hasNotifications={unreadNotifications} />
        </SidebarInset>
    </>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarProvider><AdminLayoutContent>{children}</AdminLayoutContent></SidebarProvider>;
}
