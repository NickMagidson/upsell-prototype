import { createClient } from '@/lib/supabase/client';

export type AuthError = {
  message: string;
  status: number;
};

// Helper function to get the correct redirect URL based on environment
function getRedirectUrl(path: string = '/auth/callback') {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  
  // For server-side, use environment variables or fallback to localhost
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();

  // Clear any existing session first - use 'global' to clear all sessions
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw {
      message: error.message,
      status: error.status || 500,
    } as AuthError;
  }

  return data;
}

export async function signUp(email: string, password: string) {
  const supabase = createClient();

  // Clear any existing session first - use 'global' to clear all sessions
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl('/auth/callback'),
    },
  });

  if (error) {
    throw {
      message: error.message,
      status: error.status || 500,
    } as AuthError;
  }

  return data;
}

export async function signInWithGoogle() {
  const supabase = createClient();

  // Clear any existing session first - use 'global' to clear all sessions
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl('/auth/callback'),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw {
      message: error.message,
      status: error.status || 500,
    } as AuthError;
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  // Clear any cached data
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }

  if (error) {
    throw {
      message: error.message,
      status: error.status || 500,
    } as AuthError;
  }
}
