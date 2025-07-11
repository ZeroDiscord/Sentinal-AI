import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Menu,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AuthUI from "./auth-ui";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DialogTitle } from "@/components/ui/dialog";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast"; // Import useToast

// MaskIcon for avatar fallback
const MaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 50 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 25 2 C 15.058594 2 7 4.6875 7 8 C 7 8 7 16.082031 7 25 C 7 30.082031 12.417969 44.082031 25 47 C 37.582031 44.082031 43 30.082031 43 25 C 43 16.082031 43 8 43 8 C 43 4.6875 34.941406 2 25 2 Z M 17 11 C 20.4375 11 22.195313 14.074219 22.5625 14.4375 C 23.148438 15.023438 23.148438 15.976563 22.5625 16.558594 C 21.976563 17.144531 21.023438 17.144531 20.441406 16.558594 C 20.027344 16.148438 18.6875 13 16 13 C 14.613281 13 12.953125 13.640625 11 15 C 12.855469 11.878906 15.003906 11 17 11 Z M 20 18.5 C 19.082031 19.40625 17.640625 20 16 20 C 14.359375 20 12.917969 19.40625 12 18.5 C 12.917969 17.59375 14.359375 17 16 17 C 17.640625 17 19.082031 17.59375 20 18.5 Z M 27 43 L 25 45 L 23 43 L 23 38 L 27 38 Z M 34 34 L 27 34 L 25 32 L 23 34 L 16 34 L 11 26 L 17 31 L 21 31 L 24 28 L 26 28 L 29 31 L 33 31 L 39 26 Z M 30 18.5 C 30.917969 17.59375 32.359375 17 34 17 C 35.640625 17 37.082031 17.59375 38 18.5 C 37.082031 19.40625 35.640625 20 34 20 C 32.359375 20 30.917969 19.40625 30 18.5 Z M 34 13 C 31.3125 13 29.972656 16.148438 29.5625 16.5625 C 28.976563 17.148438 28.023438 17.148438 27.441406 16.5625 C 26.855469 15.976563 26.855469 15.023438 27.441406 14.441406 C 27.804688 14.074219 29.5625 11 33 11 C 34.996094 11 37.144531 11.878906 39 15 C 37.046875 13.640625 35.386719 13 34 13 Z"/>
  </svg>
);

export default function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { user, role } = useAuth(); // Destructure role from useAuth
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast(); // Initialize useToast

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "incidents"), (snapshot) => {
      const newNotifs = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const readBy = data.readBy || [];
        // Only show if not read by this user
        if (user && !readBy.includes(user.uid)) {
          // New critical incident
          if (data.severity === "critical" && data.status !== "resolved") {
            const notif = {
              type: "critical",
              id: doc.id,
              code: data.code || doc.id,
              title: `New Incident: #${data.code || doc.id.slice(-3)}`,
              message: `A critical incident of '${data.type || "Unknown"}' has been reported.`,
            };
            newNotifs.push(notif);
            // Trigger toast notification ONLY if user is CPO
            if (role === 'cpo') {
              toast({
                title: notif.title,
                description: notif.message,
                variant: "destructive", // Critical incidents often use destructive variant
              });
            }
          }
          // Escalation suggested
          if (data.escalate && data.status !== "resolved") {
            const notif = {
              type: "escalation",
              id: doc.id,
              code: data.code || doc.id,
              title: `Escalation Suggested for #${data.code || doc.id.slice(-3)}`,
              message: `AI suggests escalating the '${data.type || "Unknown"}' incident.`,
            };
            newNotifs.push(notif);
            // Trigger toast notification ONLY if user is CPO
            if (role === 'cpo') {
              toast({
                title: notif.title,
                description: notif.message,
                variant: "default", // Or a different variant for escalation
              });
            }
          }
        }
      });
      setNotifications(newNotifs);
      setLoading(false);
    });
    return () => unsub();
  }, [user, role, toast]); // Add role to dependency array

  // Mark notification as read
  async function markAsRead(incidentId) {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(`/api/incidents/${incidentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ readBy: [user.uid] }),
    });
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/10 bg-background/30 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30 w-full">
      {user && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden glass-card">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="glass-card border-r-0">
            <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-lg font-semibold mb-4"
              >
                <Shield className="h-6 w-6 text-primary" />
                <span className="">SentinelAI</span>
              </Link>
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link
                href="/dashboard/map"
                className="text-muted-foreground hover:text-foreground"
              >
                Live Map
              </Link>
              <Link
                href="/dashboard/report"
                className="text-muted-foreground hover:text-foreground"
              >
                Report Incident
              </Link>
              <Link
                href="/dashboard/profile"
                className="text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      )}
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {user && (
          <>
            <form className="ml-auto flex-1 sm:flex-initial">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search incidents..."
                  className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-accent"
                />
              </div>
            </form>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 glass-card" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      {loading ? "Loading..." : notifications.length === 0 ? "No new critical alerts." : `You have ${notifications.length} new critical alert${notifications.length > 1 ? "s" : ""}.`}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {notifications.map((notif, i) => (
                      <div key={notif.id + i} className="grid grid-cols-[25px_1fr_auto] items-start pb-4 last:mb-0 last:pb-0">
                        <span className={`flex h-2 w-2 translate-y-1 rounded-full ${notif.type === "critical" ? "bg-destructive" : "bg-amber-400"}`} />
                        <div className="grid gap-1">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                        </div>
                        <Button size="sm" variant="outline" className="ml-2 px-2 py-1 text-xs" onClick={() => markAsRead(notif.id)}>
                          Mark as read
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
        {!isLanding && user && (
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:inline text-sm text-foreground/80 font-medium">
              {user.displayName || user.email}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback>{(user.displayName || user.email || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card min-w-[180px]">
                <DropdownMenuItem asChild>
                  <AuthUI variant="dropdown" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}