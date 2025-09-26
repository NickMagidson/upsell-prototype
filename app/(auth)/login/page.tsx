'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { clearCaches } from '@/app/(auth)/actions';
import { GoogleIcon } from '@/components/custom/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, signInWithGoogle } from '@/db/auth';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      // Force get user instead of getSession to ensure authentication
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        // User is already authenticated, redirect to home
        router.push('/');
        router.refresh();
      }
    };

    checkAuth();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      // Clear any cached data before signing in
      localStorage.clear();
      sessionStorage.clear();
      
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      await signIn(email, password);
      
      // Clear server-side cache after successful login
      await clearCaches();
      
      // Clear the session cache to ensure fresh data
      const supabase = createClient();
      await supabase.auth.getUser(); // Force refresh session
      
      // Force a hard refresh to clear all cached data
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your email below to login to your account
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          variant="outline"
          className="w-full"
        >
          {isGoogleLoading ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <GoogleIcon size={20} />
          )}
          <span className="ml-2">Continue with Google</span>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="m@example.com"
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" required type="password" />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            )}
            Sign In
          </Button>
        </form>
        <div className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link className="underline" href="/register">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}