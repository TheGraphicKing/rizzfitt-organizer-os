# 06 - Brand and visual system: "Night Court"

## 1. Art direction in one paragraph

Night Court is Rizzfitt at 9 pm under floodlights: a deep, near-black arena, glowing orange court lines, glass scoreboards, and tactile 3D objects (balls, paddles, trophies) that float, bounce and react. The orange is the floodlight: used with intent on the one action that matters, on live moments and on progress. Working screens are calm and legible; celebration moments are loud. It must never look like a white admin template.

Keep from today's brand: the orange (#F36A1B), the Gilroy typeface, the black sidebar heritage, the logo. Change everything else.

## 2. Brand basics

- **Name:** `BRAND_NAME = "Rizzfitt"` (single constant; the product wordmark uses this casing today).
- **Logo:** put the official files in `public/brand/` (see `assets/README.md`). If no logo file is provided, render the wordmark "Rizzfitt" in Gilroy Bold with a simple orange rounded-square mark beside it and show a dev-only warning in the Prototype switcher. Never draw a replica of the official mark.
- **Tagline:** "Run the game. We run everything else."
- **Company line in footers:** "© Rizzfitt by AGG Technology Pvt Ltd."

## 3. Colour tokens (dark, default)

Define these as CSS custom properties in `src/theme/tokens.css` and expose them to Tailwind. Components use tokens only.

### Surfaces
| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | `#06060A` | Behind everything, TV background |
| `--bg-base` | `#0B0B10` | App background |
| `--surface-1` | `#121219` | Cards, panels, inputs |
| `--surface-2` | `#191922` | Raised cards, hover rows, popovers |
| `--surface-3` | `#22222D` | Pressed, selected rows, nested panels |
| `--glass` | `rgba(20, 20, 28, 0.62)` + `backdrop-filter: blur(18px) saturate(140%)` | Floating bars, overlays, TV panels |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Dividers |
| `--border` | `rgba(255,255,255,0.12)` | Inputs, cards |
| `--border-strong` | `rgba(255,255,255,0.22)` | Focused containers, selected cards |

### Text
| Token | Value | Contrast on `--surface-1` |
|---|---|---|
| `--text-primary` | `#F6F4F8` | about 17:1 |
| `--text-secondary` | `#B9B4C3` | about 9:1 |
| `--text-tertiary` | `#8D8899` | about 5.4:1 (meta text, captions) |
| `--text-disabled` | `#5F5A6B` | decorative or disabled only |

### Brand
| Token | Value | Use |
|---|---|---|
| `--brand` | `#F36A1B` | Primary buttons, active states, progress, key highlights |
| `--brand-hover` | `#FF7B2E` | Hover |
| `--brand-pressed` | `#D9560B` | Pressed |
| `--brand-text` | `#FF8A4C` | Orange text and links on dark (about 8:1) |
| `--brand-soft` | `rgba(243,106,27,0.14)` | Selected chips, soft fills |
| `--brand-glow` | `rgba(243,106,27,0.45)` | Glows, focus halos, 3D emissive |
| `--on-brand` | `#0A0A0A` | Text and icons on orange (white on orange fails contrast; never use it) |

### Sport and court
| Token | Value | Use |
|---|---|---|
| `--court-surface` | `#17306E` | 3D court floor |
| `--court-kitchen` | `#22479C` | Pickleball non-volley zone |
| `--court-apron` | `#0E1A3A` | Area around court |
| `--court-line` | `#F3F1F5` | Court lines |
| `--ball` | `#D4F24A` | Pickleball optic yellow; 3D ball and rare sparkle highlights only |

### Status
| Token | Value | Soft background |
|---|---|---|
| `--success` | `#34D399` | `rgba(52,211,153,0.14)` |
| `--warning` | `#FBBF24` | `rgba(251,191,36,0.14)` |
| `--danger` | `#F87171` (text), `#EF4444` (solid) | `rgba(239,68,68,0.14)` |
| `--info` | `#60A5FA` | `rgba(96,165,250,0.14)` |
| `--live` | `#FF3B5C` | pulsing dot + "LIVE" label |

Never rely on colour alone: every status chip has an icon or a word.

### Categorical (teams, chart series, avatars)
`#F36A1B` orange, `#4C7DFF` blue, `#2DD4BF` teal, `#A78BFA` violet, `#F472B6` pink, `#FACC15` yellow, `#34D399` green, `#FB7185` coral. In charts, the first two series are orange and blue (distinct in hue and lightness).

### Event accent (organizer theming)
Organizers pick an event accent in setup from 8 presets (the categorical list plus "Rizzfitt orange"). It themes their **public microsite, posters, court TV and the event chip in the workspace header**. The workspace chrome stays Rizzfitt-branded. Compute `--event-accent-on` automatically (black or white, whichever has higher contrast).

## 4. Typography

- **Primary family: Gilroy** (Regular 400, Medium 500, SemiBold 600, Bold 700). It is a licensed font: load it only from files the team drops in `public/fonts/` (see `assets/README.md`).
- **Fallback: Outfit** (open licence, closest geometric match). Install `@fontsource/outfit` so it is bundled, no network.
- Use `font-variant-numeric: tabular-nums` for every score, time, price and KPI.

| Style | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| Display XL | 72 / 76 | 700 | -0.03em | Landing hero (40/44 on mobile) |
| Display L | 56 / 60 | 700 | -0.025em | Wizard step titles on desktop, celebrations |
| Display M | 40 / 44 | 700 | -0.02em | Section heroes, KPI hero number |
| H1 | 32 / 38 | 700 | -0.015em | Page titles |
| H2 | 24 / 30 | 700 | -0.01em | Section titles |
| H3 | 20 / 26 | 600 | 0 | Card titles |
| Title | 17 / 24 | 600 | 0 | List item titles |
| Body L | 17 / 26 | 400 | 0 | Marketing, wizard helper text |
| Body | 15 / 22 | 400 | 0 | Workspace default |
| Small | 13 / 18 | 500 | 0 | Meta, table secondary |
| Overline | 12 / 16 | 600 | 0.08em, uppercase | Section labels, chip labels |
| Scoreboard | 120-240 | 700 | -0.04em | Court TV, umpire pad |

Minimum text size is 12 px anywhere.

## 5. Space, radius, elevation

- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Radius:** `--r-xs 6`, `--r-sm 10`, `--r-md 14` (buttons, inputs), `--r-lg 20` (cards), `--r-xl 28` (hero panels, sheets), `--r-pill 999`.
- **Elevation on dark** is light, not shadow: cards get `inset 0 1px 0 rgba(255,255,255,0.06)` (top highlight) plus `0 12px 32px rgba(0,0,0,0.45)` when floating. Primary buttons and live elements get a brand glow `0 0 0 1px var(--brand), 0 8px 28px var(--brand-glow)` on hover.
- **Layout:** workspace max content width 1440, 12-column grid, 24 gutters. Sidebar 264 px, collapsed 76 px. Wizard content column 640 px with a preview pane on the right on wide screens.

## 6. Background and texture motifs

- **Court-line pattern:** a faint SVG of court lines (opacity 0.035) behind page headers and empty areas.
- **Floodlight glow:** a large, soft radial gradient of `--brand-glow` at 8-12% opacity in the top corner of hero areas and the wizard.
- **Grain:** a 2% noise overlay on large gradients to prevent banding.
- **Glass panels** for floating UI (top bar, bottom sheets, TV overlays). Do not put glass behind dense tables.

## 7. Components (visual spec)

Build these in `src/components/ui/` and show them all on a `/lab/ui` page.

- **Button:** sizes 36 / 44 / 52 px tall. Variants: *Primary* (orange fill, `--on-brand` text, glow on hover, scale 0.98 on press), *Secondary* (`--surface-2`, border, white text), *Ghost*, *Danger* (red solid), *Icon* (44 px square, `aria-label`). Loading state replaces label with a bouncing-ball loader, keeps width.
- **Input / select / textarea:** `--surface-1`, 1px `--border`, radius 14, 48 px tall. Focus: 2px `--brand` ring plus 4px `--brand-soft` halo. Label above, helper below, error in `--danger` with icon. Prefix and suffix slots (₹, +91, `.rizzfitt.com`).
- **Choice cards:** large selectable cards for wizard answers (icon or 3D object, title, one-line description). Selected: `--brand` border 2px, `--brand-soft` fill, check badge, subtle 3D tilt.
- **Toggle / switch:** pill, 52x30, on = orange track with black thumb icon.
- **Chips:** filter chips (toggle), status chips (icon + word), category chips (category colour dot).
- **Segmented control / tabs:** sliding indicator using a shared layout animation.
- **Stepper (wizard):** a horizontal "court line" rail with a small 3D-looking ball marker that rolls to the current step; completed steps show a check; labels below.
- **Cards:** `--surface-1`, radius 20, padding 20-24. *Tilt card* variant (KPIs, module cards): follows the pointer with max 6 degrees of tilt and a moving spotlight sheen; disabled under reduced motion.
- **Stat tile:** overline label, big tabular number, delta or sub-line, optional sparkline.
- **Table:** 52 px rows, sticky glass header, row hover `--surface-2`, selected `--surface-3` with a left orange bar, column picker, search, filter chips, bulk action bar that slides up from the bottom. Mobile: rows become cards.
- **Drawer / sheet:** right drawer 480 px on desktop, bottom sheet on mobile with a grab handle.
- **Dialog:** centered glass dialog. Destructive dialogs state the consequence in one sentence and use a red primary button.
- **Toast:** bottom-right on desktop, bottom-center on mobile; success, info, warning, error; "Undo" for reversible actions.
- **Empty state:** 3D spot illustration (see `design/08`), one-line title, one-line help, primary action, and a quiet "Have Rizzfitt set this up" link.
- **Skeletons:** shimmer blocks matching final layout.
- **Avatar:** initials on a categorical colour; team crest = rounded shield with team initials.
- **Live badge:** pulsing `--live` dot + "LIVE".
- **Command palette:** Cmd/Ctrl + K, searches players, teams, matches, pages and actions.
- **Bracket, standings, court timeline, scoreboard:** see `design/11` and `design/07`.

## 8. Data visualization

Charts are 2D and precise (3D is decorative only, never for data). Orange for the primary series, blue for comparison, gridlines `rgba(255,255,255,0.06)`, axis labels `--text-tertiary`, tooltips on glass. Prefer bars and lines; donuts only for 2-3 part splits like online vs desk.

## 9. Do and don't

| Do | Don't |
|---|---|
| One orange primary action per view | Orange everywhere |
| Big confident numbers with tabular digits | Thirteen equal-sized KPI tiles |
| 3D objects that react to the pointer and to events | 3D behind text people must read |
| Real copy, sports words | Lorem ipsum, "Submit", "Data not found" |
| Glass on floating layers only | Glass on everything |
| Confirm live and money actions | Toggles that change live state silently |
| Hyphens and colons in copy | Em or en dashes |
