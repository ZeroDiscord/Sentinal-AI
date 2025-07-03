"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import AuthUI from "@/components/auth-ui";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user) return null;

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">SentinelAI</CardTitle>
          <CardDescription className="text-muted-foreground">
            AI-Powered Incident Management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthUI variant="card" />
        </CardContent>
      </Card>
    </main>
  );
}
