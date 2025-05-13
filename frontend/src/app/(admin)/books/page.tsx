'use client';

import React from 'react';
import { Toaster } from 'sonner';
import CommonNavbar from '@/components/admin/Navbar';
import { BookForm } from '@/components/books/BookForm';

const BooksPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Toaster position="top-right" theme="dark" richColors toastOptions={{
        style: {
          background: 'linear-gradient(to right, #004366, #003152)',
          color: 'white',
          border: '1px solid rgba(255, 152, 0, 0.2)',
        },
      }} />
      <CommonNavbar title="Manage Books" />
      <div className="container mx-auto py-8 px-4">
        <BookForm />
      </div>
    </div>
  );
};

export default BooksPage;