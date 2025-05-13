'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopImage from '/public/assets/Top.ico';
import { BellDot, Building, Handshake, Inbox, Info, LayoutDashboard, LogOut, Settings, User, Users } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const TopImageComponent = () => <Image src={TopImage} alt="UniversityLane" width={40} height={40} />;

const data = {
  navMain: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Books', url: '/books', icon: Inbox },
    { title: 'Issue Books', url: '/issuebooks', icon: Users },
    { title: 'chatbot', url: '/chatbot', icon: Handshake },
  ],
  others: [
    { title: 'Notifications', url: '/notifications', icon: BellDot },
    { title: 'Settings', url: '/settings', icon: Settings },
    { title: 'Help', url: '/help', icon: Info },
  ],
};

// Hardcoded user data
const hardcodedUserData = {
  name: 'John Librarian',
  email: 'librarian@library.com',
  avatar: '/avatars/default-avatar.png',
};

export function AppSidebar({ ...props }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="h-full bg-sidebar border-r border-border" {...props}>
      <SidebarHeader className="flex h-14 items-center border-b px-4 py-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <TopImageComponent />
          {!isCollapsed && <span className="font-bold text-lg">LIBRARY SYSTEM</span>}
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.others.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={hardcodedUserData.avatar} alt={hardcodedUserData.name} />
            <AvatarFallback>{hardcodedUserData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{hardcodedUserData.name}</span>
              <span className="text-xs text-muted-foreground">{hardcodedUserData.email}</span>
            </div>
          )}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="ml-auto">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}
