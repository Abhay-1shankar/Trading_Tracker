-- F&O Trading Journal - Supabase Schema
-- Run this in your Supabase SQL Editor to create the trades table

CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  entry_price DECIMAL(18, 2) NOT NULL,
  exit_price DECIMAL(18, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  strategy VARCHAR(50) DEFAULT 'Other',
  pnl DECIMAL(18, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, for multi-user apps)
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
