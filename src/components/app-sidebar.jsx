"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, FilePlus, User, LogOut, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["school_proctor", "cpo", "secretary", "warden", "member"] },
  { href: "/dashboard/map", icon: Map, label: "Live Map", roles: ["student", "member", "secretary", "warden", "school_proctor", "cpo"] },
  { href: "/dashboard/my-reports", icon: FilePlus, label: "My Reports", roles: ["student"] },
  { href: "/dashboard/report", icon: FilePlus, label: "Report Incident", roles: ["student", "member", "secretary", "warden", "school_proctor", "cpo"] },
  { href: "/dashboard/profile", icon: User, label: "Profile", roles: ["student", "member", "secretary", "warden", "school_proctor", "cpo"] },
  { href: "/dashboard/admin", icon: Shield, label: "Admin Panel", roles: ["cpo"] },
];

export default function AppSidebar() {
  const { user, role, signOut } = useAuth();
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border/10 p-4 bg-background/30">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">SentinelAI</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {filteredNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent",
              pathname === item.href && "bg-accent text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
