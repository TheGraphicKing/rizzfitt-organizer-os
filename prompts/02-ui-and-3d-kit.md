# Prompt 02 - UI component library and 3D kit

**Goal:** every reusable UI component and every 3D building block, shown in two gallery pages, before building real screens.

**Read again:** `design/06` section 7, `design/07` sections 2-4, `design/08`.

## Build
### UI kit (`src/components/ui/`, gallery at `/lab/ui`)
Button (all variants, sizes, loading), Input with prefix and suffix, Select, Combobox with typeahead, Textarea, OTP input, Toggle, Checkbox, Radio, Segmented control with sliding indicator, Tabs, Chips (filter, status, category), Choice card (with icon or 3D slot, selected state), Stepper (court-line rail with rolling ball), Card, Tilt card with pointer spotlight, Stat tile with count-up and sparkline, Table (sticky glass header, column picker, row selection, bulk bar, mobile card mode), Drawer (right) and Bottom sheet (mobile), Dialog and Confirm dialog (destructive variant), Toast system with Undo, Empty state, Skeletons, Avatar and Team crest, Live badge, Score bug, Command palette (Cmd/Ctrl+K), Date range picker, Price input (₹), Phone input (+91), File dropzone (mock), Ball loader.
Every component: hover, focus-visible ring, active, disabled, loading; keyboard support; labels; reduced-motion variants.

### 3D kit (`src/components/3d/`, gallery at `/lab/3d`)
- `SceneCanvas`, `useQuality`, `useReducedMotion`, `Fallback3D`, error boundary, off-screen pause, fade-in after content.
- Lighting rig with `Environment` + `Lightformer` (no preset HDR downloads), `ContactShadows`.
- Every procedural object in `design/07` section 2 with accurate proportions: PickleballCourt (and sport variants), PickleballBall (40 holes), Paddle, Shuttlecock, CricketBat and ball, Football, Trophy with `fill`, Podium, Medal, Gavel, CoinStack, CardFan, GroupPot, ModuleBlock, ConfettiBurst.
- The gallery shows each object rotating slowly, with controls for quality (High, Medium, Low, Off) and reduced motion, plus an FPS meter.
- 3D spot icons from `design/08`: download into `public/3d/icons/` with `THIRD_PARTY_NOTICES.md`, or generate stills from the procedural objects if downloading is not possible.

## Acceptance
- [ ] `/lab/ui` shows every component in every state, on dark, readable at 390 px.
- [ ] `/lab/3d` shows every object; each looks like the real thing (ball has holes, shuttle has feathers).
- [ ] FPS stays around 50+ on high quality on a mid laptop; "Off" shows fallbacks; reduced motion shows still frames.
- [ ] No runtime network requests (check the browser network panel).
