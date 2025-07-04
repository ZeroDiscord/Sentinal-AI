"use client";
import AppSidebar from "@/components/app-sidebar";
import AdminPanel from '@/components/admin-panel';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from "@/components/header";

export default function DashboardLayout({ children }) {
  const { role } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/dashboard/admin' && role !== 'cpo') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-[#101624] via-[#181f2e] to-[#101624]">
      <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {role === 'cpo' && window.location.pathname === '/dashboard/admin' ? <AdminPanel /> : children}
        </main>
      </div>
    </div>
  );
}
