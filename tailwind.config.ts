import type { Config } from 'tailwindcss';

// Logical utilities only (ms-/me-/ps-/pe-) — ml-/mr- break RTL silently.
// See docs/FRONTEND-SPEC.md §3 "Bilingual and RTL".
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0b1220',
        sand: '#f5efe4',
        saudi: '#165d31',
      },
    },
  },
  plugins: [],
};

export default config;
