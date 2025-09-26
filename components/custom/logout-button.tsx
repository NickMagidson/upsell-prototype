'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { signOut } from '@/db/auth';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut();
      
      // Force a hard refresh to clear all cached data
      window.location.href = '/login';
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  );
}
