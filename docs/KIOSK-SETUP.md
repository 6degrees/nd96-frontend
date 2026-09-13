# Kiosk setup notes

This becomes the operations handbook section SATORP staff use on the day (spec §10).

## Per-surface URLs

Once the build is served from Laravel `public/app/`:

| Kiosk | URL |
|---|---|
| ApiMessage booth iPads | `https://<host>/app/booth/message/` |
| ApiMessage wall player | `https://<host>/app/wall/` |
| Timeline touch screen | `https://<host>/app/timeline/` |
| Participation screen | `https://<host>/app/participation/` |
| Operations laptop | `https://<host>/app/console/` |

## Screen players — Chrome kiosk mode

```
chrome --kiosk --incognito --noerrdialogs --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required https://<host>/app/wall/
```

## iPads — Guided Access

1. Settings → Accessibility → Guided Access → on; set a passcode only the operators know.
2. Settings → Display & Brightness → Auto-Lock → **Never**.
3. Open the booth URL in Safari (or the kiosk app), triple-click the side button, start Guided Access.
4. Disable the home gesture and hardware buttons inside Guided Access options.

## Fonts

Drop subset WOFF2 files into `public/fonts/` and declare `@font-face 'ND96'` in
`app/globals.css`. **The venue network has no internet — never a CDN font.**

## Recovery expectations (spec §7)

- Wi-Fi pulled: wall self-heals unaided within 10s (resync on reconnect).
- Player power-cycled: full wall restored within 30s, zero input.
