# ND96 dual branding

Two identities share the build, split by surface. Sources of truth:
**SATORP Brand Guidelines v1 (Nov 2024)** and the **Saudi National Day
brand guideline** (عزّنا بطبعنا identity).

## The split

| Surface | Leads | SATORP presence |
|---|---|---|
| Booth, Wall, Timeline, Participation | **SND** — deep-green ground, cream type, sadu motifs | Gradient rule/accents, co-brand lockup |
| Console | **SATORP** — ice ground, blue type, gradient CTAs | (SND only in the co-brand lockup) |
| Highlights | Co-branded hybrid — cream ground | Gradient rule, blue accents |

## Tokens (tailwind.config.ts)

**SND** — `snd.night #0B2E25` (ground) · `snd.green #0E8A46` · `snd.bright
#4CB944` · `snd.sand #F2ECDD` (type on dark) · sadu accents `berry #A32A5D`,
`blue #1F6BD6` (pattern use only). Helpers: `.snd-grid` (hairline grid),
`.snd-checker` (logo-frame checker strip), `<SaduDivider/>`.

> SND hexes are sampled from the guideline PDF — replace with the official
> values from the guideline's "Download colors" package when received.

**SATORP** (p59, exact) — `blue #2E378E` · `green #00843D` · `lime #84BD00` ·
`cyan #00A3E0` · `ice #D8EEF3` (+ 50% tints) · `red #D30D2E` (destructive
only). Helpers: `.satorp-text-gradient` (lime→cyan, typography), 
`.satorp-line-gradient` / `<SatorpRule/>` (lime→green→cyan, elements),
`Button variant="satorp"` (gradient CTA, p85).

## SATORP hard rules honored (p61, p66)

- Lime and cyan are **never** backgrounds.
- On SATORP surfaces, text is blue / ice / white / gradient only.
- Typography gradient uses only lime→cyan; element gradient lime→green→cyan.
- No white text on ice; colors sit on blue or white.
- SATORP red only for destructive actions (resetEvent).

## Typography

- SND primary **Saudi Font** → `.font-display` (headings/display).
- SND secondary **IBM Plex Sans / Arabic** → body default.
- **SATORP** bespoke family → console when the files arrive.
- All self-hosted in `public/fonts/` — the venue network is offline.

## Outstanding assets (request from SATORP / brand team)

1. Official SND 96 logo SVGs (horizontal + vertical عزّنا بطبعنا lockups).
2. SATORP primary logo SVG + co-brand clear-space spec (logo gap = 'sa'
   width; SATORP sits left in Arabic contexts — guidelines p2/p42).
3. Font files: Saudi Font, IBM Plex Sans (+Arabic), SATORP family WOFF2.
4. Official SND color package ("Download colors" in the SND guideline).

`<CoBrand/>` in `src/shared/ui/Brand.tsx` renders the official SATORP + SND
logo lockup from `public/brand/`. Swap PNGs for SVGs when vector exports arrive.
