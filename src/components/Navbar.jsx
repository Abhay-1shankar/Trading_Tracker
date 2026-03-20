'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, TrendingUp, User, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
     
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-trading-border bg-trading-dark/95 backdrop-blur-xl">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold text-white hover:text-trading-accent transition-colors"
          >
            <TrendingUp className="h-7 w-7 text-trading-accent" />
            <span className="font-mono font-bold text-emerald-500 border-l-4 border-emerald-500 pl-3 uppercase tracking-widest">
  Trade_Ledger
</span>
          </Link>
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link
                      href="/add-trade"
                      className="flex items-center gap-2 rounded-lg bg-trading-accent px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                    >
                      <PlusCircle className="h-5 w-5" />
                      Add Trade
                    </Link>
                    <div className="flex items-center gap-2 rounded-lg border border-trading-border bg-trading-card/50 px-3 py-2">
                      <User className="h-4 w-4 text-trading-accent" />
                      <span className="max-w-[140px] truncate text-sm text-slate-300" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-lg border border-trading-border px-4 py-2 text-sm font-medium text-slate-300 hover:bg-trading-danger/10 hover:text-trading-danger hover:border-trading-danger/50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-lg bg-trading-accent px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                  >
                    Sign in
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
