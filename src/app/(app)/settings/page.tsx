
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const { user, setUser: setAuthUser } = useAuth(); // Assuming setUser updates context/storage
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setCurrentUser({ nom: user.nom, email: user.email });
    }
  }, [user]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // In a real app, this would call an API
    // For MVP, update local state and AuthContext
    const updatedUser = { ...user, nom: currentUser.nom || user.nom, email: currentUser.email || user.email };
    // Simulating update:
    // updateUserInMockData(updatedUser); // This function would need to be created in data.ts
    setAuthUser(updatedUser); 
    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 4) { // Simple validation for MVP
        toast({ title: "Password Too Short", description: "Password must be at least 4 characters.", variant: "destructive" });
        return;
    }
    // In a real app, this would call an API to change password
    // For MVP, we'll just show a success message
    toast({ title: "Password Changed", description: "Your password has been updated (simulated)." });
    setNewPassword('');
    setConfirmPassword('');
  };


  if (!user) {
    return <div className="p-6">Loading user settings...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your account preferences and settings.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={currentUser.nom || ''} 
                onChange={(e) => setCurrentUser(prev => ({...prev, nom: e.target.value}))} 
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={currentUser.email || ''} 
                onChange={(e) => setCurrentUser(prev => ({...prev, email: e.target.value}))} 
                disabled // Email usually not changeable or requires verification
              />
            </div>
            <Button type="submit">Save Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            {/* <div> // Current password field often included for security
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div> */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit">Change Password</Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Add more settings sections as needed, e.g., Notifications, Theme, etc. */}
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Theme Preferences</CardTitle>
          <CardDescription>Customize the application appearance (not functional in MVP).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Theme selection (Light/Dark) will be available in a future update.</p>
             <Button variant="outline" disabled>Toggle Dark Mode (Soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
