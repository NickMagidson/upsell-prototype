import { NextResponse } from 'next/server';

import { clearUserCaches } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user to clear their specific caches
      const { data: { user } } = await supabase.auth.getUser();
      
      // Clear all user-related cached data to ensure fresh user data
      clearUserCaches(user?.id, user?.email);
      
      return NextResponse.redirect(requestUrl.origin);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${requestUrl.origin}/auth-error`);
}
