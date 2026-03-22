'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RLSFixerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function testDirectInsert() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (!user) {
        setResult({
          success: false,
          message: 'Not logged in. Please go to /login first.',
        });
        return;
      }

      console.log('Current user:', user);

      // Try to insert a test trade
      const testTrade = {
        user_id: user.id,
        symbol: 'TEST',
        entry_price: 100.00,
        exit_price: 110.00,
        quantity: 1,
        pnl: 10.00,
        strategy: 'Test Trade',
      };

      console.log('Attempting to insert:', testTrade);

      const { data, error } = await supabase
        .from('trades')
        .insert(testTrade)
        .select()
        .single();

      if (error) {
        setResult({
          success: false,
          message: `Insert failed: ${error.message}`,
          error: error,
          userId: user.id,
          userEmail: user.email,
        });
        console.error('Insert error:', error);
      } else {
        setResult({
          success: true,
          message: '✅ SUCCESS! Trade inserted successfully!',
          data: data,
          userId: user.id,
          userEmail: user.email,
        });
        console.log('Insert success:', data);
      }
    } catch (err) {
      setResult({
        success: false,
        message: `Unexpected error: ${err.message}`,
        error: err,
      });
    } finally {
      setLoading(false);
    }
  }

  async function testSelect() {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setResult({
          success: false,
          message: 'Not logged in. Please go to /login first.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        setResult({
          success: false,
          message: `Select failed: ${error.message}`,
          error: error,
          userId: user.id,
        });
      } else {
        setResult({
          success: true,
          message: `✅ Found ${data.length} trades`,
          data: data,
          userId: user.id,
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: `Unexpected error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">RLS Fixer Tool</h1>

      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6 mb-8">
        <h2 className="text-yellow-500 font-bold mb-2">⚠️ Before Using This Tool</h2>
        <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
          <li>Make sure you're logged in (go to <a href="/login" className="text-blue-400 underline">/login</a>)</li>
          <li>Run the SQL script in <code className="bg-black/50 px-2 py-1 rounded">supabase/fix_rls.sql</code> in Supabase SQL Editor</li>
          <li>Wait for all policies to be recreated</li>
          <li>Come back here and test</li>
        </ol>
      </div>

      <div className="space-y-4">
        <button
          onClick={testSelect}
          disabled={loading}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Testing...' : 'Test SELECT (Read Trades)'}
        </button>

        <button
          onClick={testDirectInsert}
          disabled={loading}
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Testing...' : 'Test INSERT (Add Test Trade)'}
        </button>
      </div>

      {result && (
        <div className={`mt-8 p-6 rounded-lg border ${
          result.success
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          <h3 className={`text-lg font-bold mb-4 ${
            result.success ? 'text-green-500' : 'text-red-500'
          }`}>
            {result.message}
          </h3>

          <div className="bg-black/50 p-4 rounded text-xs">
            <pre className="text-slate-300 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {result.success && (
            <div className="mt-4">
              <p className="text-green-400 font-semibold">
                🎉 RLS is working! You can now use the app normally.
              </p>
              <a
                href="/dashboard"
                className="inline-block mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          )}

          {!result.success && result.error?.code === '42501' && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded">
              <p className="text-yellow-500 font-semibold mb-2">Next Steps:</p>
              <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Run the script in <code className="bg-black/50 px-2 py-1 rounded">supabase/fix_rls.sql</code></li>
                <li>Make sure all 4 policies are created (check Step 7 in the script)</li>
                <li>Come back and click "Test INSERT" again</li>
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-[#111] border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Manual Fix Instructions</h2>
        <div className="text-sm text-slate-300 space-y-3">
          <p><strong className="text-white">Step 1:</strong> Open Supabase SQL Editor</p>
          <p><strong className="text-white">Step 2:</strong> Run the SQL file at <code className="bg-black/50 px-2 py-1 rounded">supabase/fix_rls.sql</code></p>
          <p><strong className="text-white">Step 3:</strong> Come back here and click "Test INSERT"</p>
          <p><strong className="text-white">Step 4:</strong> If successful, go to <a href="/add-trade" className="text-blue-400 underline">/add-trade</a></p>
        </div>
      </div>
    </div>
  );
}
