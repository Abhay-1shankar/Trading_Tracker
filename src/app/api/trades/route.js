import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, entry_price, exit_price, quantity, strategy } = body;

    if (!symbol || !entry_price || !exit_price || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, entry_price, exit_price, quantity' },
        { status: 400 }
      );
    }

    const pnl = (parseFloat(exit_price) - parseFloat(entry_price)) * parseInt(quantity, 10);

    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        entry_price: parseFloat(entry_price),
        exit_price: parseFloat(exit_price),
        quantity: parseInt(quantity, 10),
        strategy: strategy || 'Other',
        pnl,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
