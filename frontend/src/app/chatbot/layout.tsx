"use client"

import { useRouter } from "next/navigation";



export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const token = localStorage.getItem('token');
  if (!token) {
   router.push('/signin')
  }

  return <div className="h-screen bg-gradient-to-b from-[#004366] via-[#004B73] to-[#005C80] text-white">
    {children}</div>
}