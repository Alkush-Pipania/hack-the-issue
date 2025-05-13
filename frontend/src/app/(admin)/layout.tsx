'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminPanel from '@/components/admin/AdminPanel';
import { AppSidebar } from '@/components/admin/AppSidebar';

interface LayoutProps {
  // title: string;
  children: React.ReactNode;
}

export default function Layout({ children }: Readonly<LayoutProps>) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/signin';
  }

  return (
    <div>
      <SidebarProvider>
        <div>
          <AppSidebar />
        </div>
        <AdminPanel>
          <SidebarTrigger
            className={cn(
              'fixed left-2 top-2 z-20 flex size-6 -translate-x-1/2 rounded-md border border-gray-300 bg-white shadow-md transition-transform duration-300 hover:scale-110 hover:shadow-lg sm:left-auto',
            )}
          />
          {children}
        </AdminPanel>
      </SidebarProvider>
    </div>
  );
}
