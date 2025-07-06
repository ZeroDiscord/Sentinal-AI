"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <Card className="glass-card max-w-lg mx-auto mt-16">
      <CardHeader>
        <CardTitle>Thank You for Your Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground mb-4">
          Your report has been received. If you want to track your reports in the future, please sign in or create an account.
        </div>
        <div className="flex justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/dashboard/report">Report Another</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 