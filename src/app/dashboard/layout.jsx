"use client";
import AppSidebar from "@/components/app-sidebar";
import AdminPanel from '@/components/admin-panel';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from "@/components/header";

export default function DashboardLayout({ children }) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAdminError, setShowAdminError] = useState(false);

  useEffect(() => {
    // Only allow signed out users to view the live map page
    if (typeof window !== 'undefined') {
      const isLiveMap = window.location.pathname === '/dashboard/map';
      const isAdmin = window.location.pathname === '/dashboard/admin';
      if (!user && !isLiveMap) {
        router.replace('/'); // Redirect to login/signup page
      }
      // Prevent non-cpo users and anonymous users from accessing admin
      if (isAdmin && (!user || user.isAnonymous || role !== 'cpo')) {
        setShowAdminError(true);
      } else {
        setShowAdminError(false);
      }
    }
  }, [user, role, router]);

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-[#101624] via-[#181f2e] to-[#101624]">
      <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {showAdminError ? (
            <div className="text-center text-red-500 font-bold text-xl mt-12">You are not authorized to view the Admin Panel.</div>
          ) : (role === 'cpo' && typeof window !== 'undefined' && window.location.pathname === '/dashboard/admin' ? <AdminPanel /> : children)}
        </main>
      </div>
    </div>
  );
}
