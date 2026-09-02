# SND brand source

**Guidelines file (local):** `~/Desktop/SNDGUIDLINES.ai`

| Property | Value |
|---|---|
| Format | PDF-compatible Illustrator (`.ai`) |
| Pages | 71 |
| Illustrator | 29.8 / 30.5 |
| Artboard | 1920 × 1080 |

## Already extracted into the build

| Asset | Output |
|---|---|
| Saudi display font | `public/fonts/Saudi-Regular.otf` |
| SND logo | `public/brand/snd-logo.png` |
| SATORP logo | `public/brand/satorp-logo.svg` + `satorp-logo-white.png` |
| Side motif strip | `public/brand/patterns/side.png` |
| Bottom diamond row | `public/brand/patterns/bottom.png` |
| Circle-cluster border | `public/brand/patterns/circle-cluster.png` |
| Sleeping line (multi-motif) | `public/brand/patterns/sadu-sleeping-line.jpg` |
| Purple geometric tile | `public/brand/patterns/purple-tile.png` |
| Cover reference render | `design/extracted/SNDGUIDLINES.ai.png` |

## Best exports to request from Illustrator

Export these from the `.ai` file (File → Export → Export for Screens, or Save As):

1. **`snd-logo.svg`** — horizontal عزّنا بطبعنا lockup (vector, for crisp kiosk scaling)
2. **`snd-logo-vertical.svg`** — stacked lockup if present in the file
3. **Color swatch page** — screenshot or ASE file from the “Download colors” section
4. **Sadu / checker pattern tile** — repeating SVG pattern
5. **Timeline imagery** — king portraits + milestone photos → `public/assets/timeline/`
6. **IBM Plex Sans Arabic** — OFL download from Google Fonts, subset to WOFF2

Drop SVGs into `public/brand/` and tell the agent to wire them in.
