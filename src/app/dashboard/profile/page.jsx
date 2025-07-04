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
import { getAuth, updateProfile } from "firebase/auth";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.string(),
  school: z.string(),
});

const SCHOOL_OPTIONS = [
  'School of Computer Science',
  'School of Engineering',
  'School of Business',
  'School of Law',
  'School of Design',
  'School of Health Sciences',
];

export default function ProfilePage() {
    const { user, role, loading, refreshUserFromFirestore } = useAuth();
    const { toast } = useToast();

    // Always call useForm, even if user is not loaded yet
    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: user?.displayName || "",
            email: user?.email || "",
            role: role || "",
            school: user?.school || "",
        },
    });

    // Dynamically update form values when user or role changes
    useEffect(() => {
        form.reset({
            displayName: user?.displayName || "",
            email: user?.email || "",
            role: role || "",
            school: user?.school || "",
        });
    }, [user, role]);

    const isAnonymous = user?.isAnonymous;

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

    async function onSubmit(values) {
        try {
            // Update Firestore
            await fetch(`/api/users/${user.uid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName: values.displayName, school: values.school }),
            });
            // Update Firebase Auth profile
            const auth = getAuth();
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: values.displayName });
            }
            // Refresh user context from Firestore (no reload needed)
            if (refreshUserFromFirestore) await refreshUserFromFirestore(user.uid);
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved.",
            });
        } catch (err) {
            toast({
                title: "Update Failed",
                description: err.message || "Could not update profile.",
                variant: "destructive",
            });
        }
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
                        <CardTitle className="text-2xl">{form.getValues('displayName')}</CardTitle>
                        <CardDescription>{role}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {isAnonymous && (
                        <div className="mb-4 text-yellow-400 font-medium">Anonymous users cannot edit their profile information.</div>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your display name" {...field} disabled={isAnonymous} />
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
                            <Button type="submit" disabled={isAnonymous}>Save Changes</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
