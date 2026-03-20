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
          dark: '#0a0e17',
          card: '#111827',
          cardHover: '#1f2937',
          border: '#1e293b',
          muted: '#64748b',
          accent: '#3b82f6',
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(59, 130, 246, 0.3)',
        'glow-success': '0 0 40px -10px rgba(16, 185, 129, 0.3)',
        'glow-danger': '0 0 40px -10px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
};
