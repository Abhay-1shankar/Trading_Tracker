import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Debug endpoint to check authentication and RLS status
 * Access at: /api/debug
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Try to query trades (will fail if RLS blocks it)
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .limit(1);

    // Return comprehensive debug info
    return NextResponse.json({
      debug: {
        timestamp: new Date().toISOString(),
        authentication: {
          isAuthenticated: !!user,
          userId: user?.id || null,
          userEmail: user?.email || null,
          hasSession: !!session,
          sessionExpiry: session?.expires_at || null,
          userError: userError?.message || null,
          sessionError: sessionError?.message || null,
        },
        database: {
          tradesQuerySucceeded: !tradesError,
          tradesError: tradesError?.message || null,
          tradesErrorCode: tradesError?.code || null,
          tradesErrorHint: tradesError?.hint || null,
          tradesCount: trades?.length || 0,
        },
        environment: {
          supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        diagnosis: getDiagnosis(user, tradesError),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        message: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}

function getDiagnosis(user, tradesError) {
  if (!user) {
    return {
      issue: 'NOT_AUTHENTICATED',
      message: 'User is not logged in. Session cookies may not be set.',
      fix: 'Log in through /login and try again. Check if email confirmation is causing issues.',
    };
  }

  if (tradesError && tradesError.code === '42501') {
    return {
      issue: 'RLS_PERMISSION_DENIED',
      message: 'Authenticated but RLS is blocking the query. auth.uid() might not match user_id.',
      fix: 'Check Supabase dashboard policies. Verify auth.uid() returns your user ID in SQL editor.',
    };
  }

  if (tradesError) {
    return {
      issue: 'DATABASE_ERROR',
      message: `Database error: ${tradesError.message}`,
      fix: 'Check if trades table exists and columns match schema.',
    };
  }

  return {
    issue: 'NONE',
    message: 'Everything looks good! ✅',
    fix: 'No action needed.',
  };
}
