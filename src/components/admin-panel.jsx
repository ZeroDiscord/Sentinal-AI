"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users, Settings, RefreshCw } from "lucide-react";
import UserManagementTab from "./admin/user-management-tab";
import SystemConfigTab from "./admin/system-config-tab";
import BatchProcessingTab from "./admin/batch-processing-tab";

export default function AdminPanel() {
  return (
    <Card className="glass-card max-w-6xl mx-auto mt-10 p-0">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex justify-center gap-4 bg-transparent">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-5 h-5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> System Configuration
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" /> Batch Processing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagementTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemConfigTab />
        </TabsContent>
        <TabsContent value="batch">
          <BatchProcessingTab />
        </TabsContent>
      </Tabs>
    </Card>
  );
} 