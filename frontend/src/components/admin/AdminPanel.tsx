'use client';

import React from 'react';

// import { useAppSelector } from '@/store/hooks';

import { cn } from '@/lib/utils';

export default function AdminPanel({ children }: Readonly<{ children: React.ReactNode }>) {
  // const { isSidebarOpen } = useAppSelector((state) => state.app);
  return (
    <>
      <main
        className={cn(
          'w-full transition-[margin-left] duration-300 ease-in-out dark:bg-zinc-900',
          // !isSidebarOpen ? 'lg:ml-20' : 'lg:ml-72',
          // isSidebarOpen ? 'ml-[18%]' : 'ml-[5%]',
        )}
      >
        {children}
      </main>
    </>
  );
}
