# F&O Trading Journal

A professional full-stack trading journal for Futures & Options built with Next.js, Tailwind CSS, and Supabase.

## Features

- **Dashboard** – Total P&L card and recent trades table with dark theme
- **Add Trade** – Form with Symbol, Entry/Exit Price, Quantity, and Strategy
- **Supabase Backend** – Real-time data persistence
- **Premium Fintech UI** – Lucide icons, glass cards, responsive design

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Copy `.env.local.example` to `.env.local`
4. Add your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.js           # Dashboard
│   ├── add-trade/page.js # Add Trade form
│   ├── api/trades/       # Trades API routes
│   ├── layout.js
│   └── globals.css
├── components/
│   └── Navbar.jsx
└── lib/
    └── supabaseClient.js
```

## Demo Mode

If Supabase is not configured, the dashboard displays sample trades so you can preview the UI.
