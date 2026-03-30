/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        trading: {
          dark: '#0b0e11',         // Pure background - Deep Charcoal/Black
          card: '#15191e',          // Surface/Cards - Navy-Black
          cardHover: '#1a1f24',     // Slightly lighter hover state
          border: '#334155',        // Subtle borders (slate-800)
          muted: '#64748b',         // Secondary text - Slate grey
          accent: '#00d09c',        // Primary accent (can be used for neutral highlights)
          green: '#00d09c',         // Trading Green - Vibrant neon green for profits/buy
          red: '#eb5b3c',           // Trading Red - High-visibility red for losses/sell
          warning: '#f59e0b',       // Warning amber (kept for alerts)
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(0, 208, 156, 0.15)',           // Subtle green glow
        'glow-success': '0 0 40px -10px rgba(0, 208, 156, 0.25)',  // Trading green glow
        'glow-danger': '0 0 40px -10px rgba(235, 91, 60, 0.25)',   // Trading red glow
      },
    },
  },
  plugins: [],
};
