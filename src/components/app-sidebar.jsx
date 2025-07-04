"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, FilePlus, User, LogOut, Map, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["school_proctor", "cpo", "secretary", "warden", "member"] },
  { href: "/dashboard/map", icon: Map, label: "Live Map", roles: ["student", "member", "secretary", "warden", "school_proctor", "cpo"] },
  { href: "/dashboard/my-reports", icon: FilePlus, label: "My Reports", roles: ["student", "member", "secretary"] },
  { href: "/dashboard/report", icon: FilePlus, label: "Report Incident", roles: ["student", "member", "secretary", "warden", "school_proctor", "cpo"] },
  { href: "/dashboard/admin", icon: Shield, label: "Admin Panel", roles: ["cpo"] },
  { href: "/dashboard/profile", icon: User, label: "Profile", roles: ["student", "member", "secretary", "warden", "school_proctor", "cpo"] },
];

export default function AppSidebar({ collapsed, setCollapsed }) {
  const { user, role, signOut, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    // Optionally render a sidebar skeleton here
    return null;
  }

  const filteredNavItems = navItems.filter(item => {
    if (!user) {
      return item.label === 'Live Map' || item.label === 'Report Incident';
    }
    if (user.isAnonymous) {
      return item.label !== 'My Reports' && item.label !== 'Admin Panel';
    }
    if (item.label === 'Admin Panel') {
      return role === 'cpo';
    }
    return item.roles.includes(role);
  });

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border/10 bg-background/30 transition-all duration-200",
        collapsed ? "w-20 p-2" : "w-64 p-4"
      )}
    >
      <div className={cn(
        collapsed
          ? "flex flex-col items-center justify-center mb-4 gap-2"
          : "flex items-center justify-between mb-8 px-2"
      )}>
        <Link
          href="/dashboard"
          className={cn(
            collapsed
              ? "flex flex-col items-center justify-center w-full"
              : "flex items-center gap-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        >
          <Shield className="w-8 h-8 text-primary" />
          {!collapsed && <h1 className="text-2xl font-bold text-foreground">SentinelAI</h1>}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "p-1 rounded hover:bg-accent focus:outline-none",
            collapsed ? "mt-2" : "ml-2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      <div className={collapsed ? "mb-2" : "mb-6"}></div>
      <nav className="flex flex-col gap-2 flex-1">
        {filteredNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
              pathname === item.href && "bg-accent text-foreground",
              collapsed ? "justify-center px-0 w-full" : "px-3"
            )}
          >
            <span className={cn("flex items-center justify-center", collapsed && "w-full")}> <item.icon className="h-5 w-5" /> </span>
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        {user && (
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent w-full text-left",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Logout"}
          </button>
        )}
      </div>
    </aside>
  );
}
