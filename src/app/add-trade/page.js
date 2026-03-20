'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react'; 
import { createClient } from '@/lib/supabase/client';

const STRATEGIES = ['Call Option', 'Put Option', 'Spread', 'Straddle', 'Strangle', 'Other'];

export default function AddTrade() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    symbol: '',
    entry_price: '',
    exit_price: '',
    quantity: '',
    strategy: STRATEGIES[0],
    notes: '' 
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const entry = parseFloat(form.entry_price);
    const exit = parseFloat(form.exit_price);
    const qty = parseInt(form.quantity, 10);
    const pnl = (exit - entry) * qty;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Session expired. Please login again.');

      const { error: dbError } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: form.symbol.toUpperCase().trim(),
        entry_price: entry,
        exit_price: exit,
        quantity: qty,
        strategy: form.strategy,
        notes: form.notes,
        pnl,
      });

      if (dbError) throw dbError;
      
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to save trade');
    } finally {
      setLoading(false);
    }
  };

  // Simple Human logic for the preview
  const entry = Number(form.entry_price);
  const exit = Number(form.exit_price);
  const qty = Number(form.quantity);
  const previewPnL = (exit - entry) * qty;

  return (
    <div className="mx-auto max-w-xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <PlusCircle className="text-blue-500" /> New Trade Entry
        </h1>
        <p className="text-slate-500 text-sm">Keep your journal updated for better analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-[#111] p-6 rounded-xl border border-white/10 space-y-5">
          
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Symbol</label>
            <input 
              name="symbol" 
              placeholder="e.g. NIFTY24MAR22000CE"
              value={form.symbol} 
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-blue-500 outline-none transition-all"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Avg Entry</label>
              <input name="entry_price" type="number" step="0.01" value={form.entry_price} onChange={handleChange} className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Avg Exit</label>
              <input name="exit_price" type="number" step="0.01" value={form.exit_price} onChange={handleChange} className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-blue-500 outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Lot Size / Qty</label>
              <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Strategy</label>
              <select name="strategy" value={form.strategy} onChange={handleChange} className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-blue-500 outline-none cursor-pointer">
                {STRATEGIES.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Trade Logic / Psychology</label>
            <textarea 
              name="notes" 
              rows="2"
              placeholder="Vwap crossover? Support bounce?"
              value={form.notes} 
              onChange={handleChange}
              className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {previewPnL !== 0 && !isNaN(previewPnL) && (
          <div className="flex justify-between items-center px-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Projected P&L</span>
            <span className={`text-xl font-mono font-bold ${previewPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{previewPnL.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {error && <p className="text-red-400 text-xs font-medium bg-red-400/10 p-2 rounded">{error}</p>}

        <div className="flex gap-3 pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest py-4 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Executing...' : 'Post to Journal'}
          </button>
        </div>
      </form>
    </div>
  );
}