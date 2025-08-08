"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  FileText,
  LogOut,
  Loader2,
  Users,
  Wand2,
  FileUp,
  FileSearch,
  MessageCircleQuestion,
  BookText,
  LineChart
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard/studies', icon: BookText, label: 'Studies' },
  { href: '/dashboard/analytics', icon: LineChart, label: 'Analytics' },
  { href: '/dashboard/upload', icon: FileUp, label: 'Upload Document' },
  { href: '/dashboard/documents', icon: FileSearch, label: 'View Documents' },
  { href: '/dashboard/ask', icon: MessageCircleQuestion, label: 'AI Chat' },
  { href: '/dashboard/summarize', icon: FileText, label: 'Summarize Text' },
  { href: '/dashboard/users', icon: Users, label: 'Users', adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const getHeadline = () => {
    if (pathname.includes('/dashboard/studies/') && pathname.includes('/forms/')) {
        return "Form Details";
    }
    if (pathname.startsWith('/dashboard/studies/')) {
        return "Study Details";
    }
    const currentItem = navItems.find(item => pathname.startsWith(item.href));
    return currentItem?.label || 'Dashboard';
  }
  
  const userIsAdmin = user?.role?.name === 'administrator';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold font-headline">AIRCID</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.adminOnly && !userIsAdmin) {
                return null;
              }
              return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )})}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="my-2"/>
          <div className="flex items-center gap-3 p-2">
             <Avatar>
                <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} alt={user?.email || 'User'} />
                <AvatarFallback>{getInitials(user?.full_name || user?.email || null)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-sm truncate">{user?.full_name || user?.email}</span>
                 <span className="text-xs text-muted-foreground truncate">{user?.role?.name}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut />
            <span>Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold md:text-xl font-headline">
            {getHeadline()}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
