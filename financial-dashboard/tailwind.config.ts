import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        border: '#eaeaea',
        muted: '#666',
        foreground: '#000',
        background: '#f8f8f6',
        success: '#0070f3',
        positive: '#0a7d32',
        negative: '#c0392b',
        warning: '#d9730d',
      },
    },
  },
  plugins: [],
};

export default config;
