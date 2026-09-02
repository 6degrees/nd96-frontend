# Self-hosted fonts

Place subset WOFF2 files here and declare them via `@font-face` in
`app/globals.css`. The event network must be assumed offline — a CDN font that
fails leaves the wall in a fallback face in front of leadership (spec §3).

Required families (see docs/BRANDING.md):

| Family | Role | Source |
|---|---|---|
| `Saudi Font` | SND primary — display/headings (`.font-display`) | `public/fonts/Saudi-Regular.otf` (from SNDGUIDLINES.ai) |
| `IBM Plex Sans` + `IBM Plex Sans Arabic` | SND secondary — body text | Open source (OFL), download and self-host |
| `SATORP` Light/Regular/Medium/Bold | Console + SATORP-branded UI | SATORP brand team (bespoke family) |

Until the files are dropped in, the stacks in `globals.css` fall back to
system faces — layout-safe, but not brand-accurate.
