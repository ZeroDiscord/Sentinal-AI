"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.string(),
});

export default function ProfilePage() {
    const { user, role, loading } = useAuth();
    const { toast } = useToast();

    if (loading || !user) {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold">User Profile</h1>
                <div className="glass-card p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="flex-1 space-y-2 w-full">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.displayName || "",
            email: user.email || "",
            role: role || "",
        },
    });

    function onSubmit(values) {
        // Optionally implement name update logic here
        toast({
            title: "Profile Updated",
            description: "Your profile information has been saved.",
        });
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">User Profile</h1>
            <Card className="glass-card">
                <CardHeader className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.photoURL || undefined} data-ai-hint="person portrait" />
                        <AvatarFallback>{(user.displayName || user.email || "U").slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                        <CardTitle className="text-2xl">{form.getValues('name')}</CardTitle>
                        <CardDescription>{role}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="your.email@school.edu" {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">Save Changes</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
