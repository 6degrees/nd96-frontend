import type { Config } from 'tailwindcss';

// Two identities, one build — see docs/BRANDING.md.
// SND (Saudi National Day 96): leads the celebration surfaces.
// SATORP: leads the console, and appears as gradient accents + co-brand.
// Logical utilities only (ms-/me-/ps-/pe-) — ml-/mr- break RTL silently.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SND identity (SND-GUIDELINE.pdf §02) — deep green ground, cream type
        night: '#0B2E25', // page ground (kept name: used across surfaces)
        sand: '#F2ECDD', // cream — slogan/type color on dark green
        saudi: '#0E8A46', // primary Saudi green
        snd: {
          night: '#0B2E25',
          grid: '#14382D', // hairline grid on the dark ground
          green: '#0E8A46',
          bright: '#4CB944', // bright green accent (patterns, hovers)
          sand: '#F2ECDD',
          berry: '#A32A5D', // sadu motif accents — pattern use only
          blue: '#1F6BD6',
        },
        // SATORP primary palette (Brand Guidelines p59). Rules (p61):
        // never lime/cyan as backgrounds; text only blue/ice/white/gradient.
        satorp: {
          blue: '#2E378E',
          green: '#00843D',
          green50: '#8DBF9D',
          lime: '#84BD00',
          lime50: '#C0D78B',
          cyan: '#00A3E0',
          cyan50: '#82CAEB',
          ice: '#D8EEF3',
          ice50: '#EDF7F8',
          red: '#D30D2E', // secondary palette — destructive actions only
        },
      },
    },
  },
  plugins: [],
};

export default config;
