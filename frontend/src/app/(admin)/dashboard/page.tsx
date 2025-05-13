'use client';

import React from 'react';
import { Toaster } from 'sonner';
import CommonNavbar from '@/components/admin/Navbar';
import DashboardStats from '@/components/dashboard/DashboardStatus';
import { BookSearchTable } from '@/components/books/table/BookSearchTable';

const page = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Toaster position="top-right" theme="dark" richColors toastOptions={{
        style: {
          background: 'linear-gradient(to right, #004366, #003152)',
          color: 'white',
          border: '1px solid rgba(255, 152, 0, 0.2)',
        },
      }} />
      <CommonNavbar title="Dashboard" />
      <DashboardStats />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#FF9800] to-[#FF5722] bg-clip-text text-transparent">Book Catalog</h2>
          <p className="text-gray-600">Search and manage the library collection</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border border-[#FF9800]/10">
          <BookSearchTable />
        </div>
      </div>
    </div>
  );
};

export default page