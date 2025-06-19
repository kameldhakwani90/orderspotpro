
"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
// New component to encapsulate the form and useSearchParams logic
// New component to encapsulate the form and useSearchParams logic
function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // useSearchParams is called here
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(email, password);
    // if (success) {
    //   const redirectUrl = searchParams.get('redirect_url');
    //   if (redirectUrl) {
    //     router.push(redirectUrl);
    //   } else {
    //     router.push('/dashboard');
    //   }
    //   toast({ title: "Login Successful", description: "Welcome back!" });
    // } else {
    //   toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    //   setLoading(false);
    // }

      try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ Connexion réussie, redirection...');
        router.push('/dashboard');
      } else {
        setError('Email ou mot de passe incorrect');
         toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
       toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto p-3 bg-primary rounded-full w-fit mb-4">
          <LogIn className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-3xl font-bold">OrderSpot.pro</CardTitle>
        <CardDescription>Sign in to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  // The main LoginPage component now only sets up the Suspense boundary
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Suspense fallback={
        <div className="w-full max-w-md text-center p-8 bg-card rounded-lg shadow-2xl">
          <p className="text-lg text-foreground">Loading login form...</p>
          <div className="mt-4 h-2 w-32 bg-muted rounded-full mx-auto animate-pulse"></div>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
