'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  async function fetchTrades() {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTrades([]);
        setTotalPnL(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setTrades(data || []);
      const pnl = (data || []).reduce((sum, t) => sum + (t.pnl || 0), 0);
      setTotalPnL(pnl);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setTrades([]);
      setTotalPnL(0);
    } finally {
      setLoading(false);
    }
  }

  const isProfit = totalPnL >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-400">Overview of your F&O trading performance</p>
      </div>

      {/* Total P&L Card */}
      <div
        className={`glass-card overflow-hidden transition-all duration-300 ${
          isProfit ? 'hover:shadow-glow-success' : 'hover:shadow-glow-danger'
        }`}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Total P&L
              </p>
              {loading ? (
                <div className="mt-2 h-10 w-32 animate-pulse rounded bg-trading-cardHover" />
              ) : (
                <p
                  className={`mt-2 text-4xl font-bold sm:text-5xl ${
                    isProfit ? 'text-trading-success' : 'text-trading-danger'
                  }`}
                >
                  ₹{(totalPnL >= 0 ? '+' : '') + totalPnL.toLocaleString('en-IN')}
                </p>
              )}
              <p className="mt-2 text-sm text-slate-500">All time cumulative</p>
            </div>
            <div
              className={`rounded-xl p-4 ${
                isProfit ? 'bg-trading-success/10' : 'bg-trading-danger/10'
              }`}
            >
              {isProfit ? (
                <TrendingUp className="h-10 w-10 text-trading-success" />
              ) : (
                <TrendingDown className="h-10 w-10 text-trading-danger" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-trading-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Activity className="h-5 w-5 text-trading-accent" />
              Recent Trades
            </h2>
            <Link
              href="/add-trade"
              className="flex items-center gap-1 text-sm font-medium text-trading-accent hover:text-blue-400 transition-colors"
            >
              Add Trade
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-trading-cardHover/50"
                />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Activity className="h-12 w-12 mb-4 opacity-50" />
              <p>No trades yet</p>
              <Link
                href="/add-trade"
                className="mt-2 text-trading-accent hover:underline"
              >
                Add your first trade
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-trading-border text-left text-sm text-slate-400">
                  <th className="px-6 py-4 font-medium">Symbol</th>
                  <th className="px-6 py-4 font-medium">Entry</th>
                  <th className="px-6 py-4 font-medium">Exit</th>
                  <th className="px-6 py-4 font-medium">Qty</th>
                  <th className="px-6 py-4 font-medium">Strategy</th>
                  <th className="px-6 py-4 font-medium text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => {
                  const pnl = trade.pnl ?? (trade.exit_price - trade.entry_price) * trade.quantity;
                  const profitable = pnl >= 0;
                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-trading-border/50 transition-colors hover:bg-trading-cardHover/30"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">{trade.symbol}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        ₹{Number(trade.entry_price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        ₹{Number(trade.exit_price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{trade.quantity}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-trading-accent/10 px-3 py-1 text-xs font-medium text-trading-accent">
                          {trade.strategy}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          profitable ? 'text-trading-success' : 'text-trading-danger'
                        }`}
                      >
                        {(pnl >= 0 ? '+' : '')}₹{pnl.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
