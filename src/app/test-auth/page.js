'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TestAuthPage() {
  const [authState, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();

    try {
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Try to query trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .limit(1);

      setAuthState({
        user,
        userError: userError?.message,
        session,
        sessionError: sessionError?.message,
        trades,
        tradesError: tradesError?.message,
        tradesErrorCode: tradesError?.code,
      });
    } catch (err) {
      setAuthState({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const isAuthenticated = !!authState?.user;
  const canAccessTrades = !authState?.tradesError;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Authentication Test</h1>
        <p className="text-slate-400">This page helps debug authentication and RLS issues</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-6 rounded-lg border ${isAuthenticated ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <div className="text-sm font-medium text-slate-400 mb-1">Authentication</div>
          <div className={`text-2xl font-bold ${isAuthenticated ? 'text-green-500' : 'text-red-500'}`}>
            {isAuthenticated ? '✓ Logged In' : '✗ Not Logged In'}
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${authState?.session ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <div className="text-sm font-medium text-slate-400 mb-1">Session</div>
          <div className={`text-2xl font-bold ${authState?.session ? 'text-green-500' : 'text-red-500'}`}>
            {authState?.session ? '✓ Active' : '✗ None'}
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${canAccessTrades ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
          <div className="text-sm font-medium text-slate-400 mb-1">Database Access</div>
          <div className={`text-2xl font-bold ${canAccessTrades ? 'text-green-500' : 'text-red-500'}`}>
            {canAccessTrades ? '✓ Allowed' : '✗ Denied'}
          </div>
        </div>
      </div>

      {/* Detailed Info */}
      <div className="bg-[#111] border border-white/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">User Information</h2>
        {isAuthenticated ? (
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="text-slate-400 w-32">User ID:</span>
              <span className="text-white font-mono">{authState.user.id}</span>
            </div>
            <div className="flex">
              <span className="text-slate-400 w-32">Email:</span>
              <span className="text-white">{authState.user.email}</span>
            </div>
            <div className="flex">
              <span className="text-slate-400 w-32">Email Verified:</span>
              <span className={authState.user.email_confirmed_at ? 'text-green-500' : 'text-yellow-500'}>
                {authState.user.email_confirmed_at ? 'Yes' : 'No (Email confirmation disabled)'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-red-400">No user logged in</p>
        )}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Database Query Test</h2>
        {authState?.tradesError ? (
          <div className="space-y-2">
            <div className="text-red-400 font-semibold">❌ Query Failed</div>
            <div className="text-sm space-y-1">
              <div className="flex">
                <span className="text-slate-400 w-32">Error:</span>
                <span className="text-white">{authState.tradesError}</span>
              </div>
              <div className="flex">
                <span className="text-slate-400 w-32">Error Code:</span>
                <span className="text-white font-mono">{authState.tradesErrorCode}</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded">
              <p className="text-yellow-500 font-semibold mb-2">Diagnosis:</p>
              {authState.tradesErrorCode === '42501' && (
                <>
                  {isAuthenticated ? (
                    <p className="text-sm text-slate-300">
                      You're logged in but RLS is blocking access. This means auth.uid() doesn't match user_id.
                      Check your RLS policies in Supabase dashboard.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-300">
                      You're not logged in. RLS is correctly blocking unauthenticated access.
                      <br />
                      <strong>Solution:</strong> Go to <Link href="/login" className="text-blue-400 underline">/login</Link> and sign in.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-green-500 font-semibold">✓ Query Successful - RLS is working correctly!</div>
        )}
      </div>

      {/* Raw JSON */}
      <div className="bg-[#111] border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Raw Debug Data</h2>
        <pre className="text-xs text-slate-300 overflow-auto max-h-96">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/add-trade"
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
            >
              Add Trade
            </Link>
          </>
        )}
        <button
          onClick={checkAuth}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
        >
          Refresh Test
        </button>
      </div>
    </div>
  );
}
