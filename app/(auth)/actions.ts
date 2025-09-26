'use server';

import { z } from 'zod';

import { clearUserCaches, getUser } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const supabase = await createClient();
    
    // Clear any existing session first
    await supabase.auth.signOut();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return { status: 'failed' };
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const supabase = await createClient();

    // Clear any existing session first
    await supabase.auth.signOut();

    // Check if user exists
    const existingUser = await getUser(validatedData.email);
    if (existingUser) {
      return { status: 'user_exists' };
    }

    // Sign up new user
    const { error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { status: 'failed' };
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export const logout = async (): Promise<void> => {
  const supabase = await createClient();
  
  // Get current user before signing out to clear their specific caches
  const { data: { user } } = await supabase.auth.getUser();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Clear all user-related cached data
  clearUserCaches(user?.id, user?.email);
};

export const clearCaches = async (): Promise<void> => {
  const supabase = await createClient();
  
  // Get current user to clear their specific caches
  const { data: { user } } = await supabase.auth.getUser();
  
  // Clear all user-related cached data
  clearUserCaches(user?.id, user?.email);
};
