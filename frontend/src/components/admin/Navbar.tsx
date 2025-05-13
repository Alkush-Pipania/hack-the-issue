'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { FaSearch } from 'react-icons/fa';
import { IoIosAddCircle } from 'react-icons/io';

import { Button } from '@/components/ui/button';

interface NavbarButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

interface CommonNavbarProps {
  title: string;
  buttons?: NavbarButton[];
}
//eslint-disable-next-line
const CommonNavbar: React.FC<CommonNavbarProps> = ({ title, buttons = [] }) => {

  return (
    <div className="flex w-full flex-col items-center justify-between bg-gradient-to-r from-[#004366] to-[#003152] p-4 text-white border-b border-[#FF9800]/20 md:flex-row md:p-6">
      <div>
        <h1 className="w-full text-center text-lg font-bold md:w-auto md:text-left md:text-2xl">{title}</h1>
      </div>

      {/*  */}

      
    </div>
  );
};

export default CommonNavbar;
