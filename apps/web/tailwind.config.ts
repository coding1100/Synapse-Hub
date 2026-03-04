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
        base: '#f4f7f8',
        ink: '#1f2a37',
        accent: '#eb5e28',
        accentDeep: '#c34f1f',
        ocean: '#2f6690',
        mint: '#d7f3e3',
      },
      boxShadow: {
        panel: '0 20px 40px rgba(25, 37, 44, 0.08)',
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