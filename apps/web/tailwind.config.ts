import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#f3f6fb',
        ink: '#0f172a',
        accent: '#2563eb',
        accentDeep: '#1d4ed8',
        ocean: '#0b1220',
        mint: '#e8f5ee',
      },
      boxShadow: {
        panel: '0 16px 36px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        riseIn: 'riseIn 260ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
