# Prompt 01 - Foundation: project, tokens, store, shells

**Goal:** a running app with the Night Court design system, the mock data store, routing for every surface, the Prototype switcher and empty shells for every route.

**Read again:** `CLAUDE.md` sections 3-5, `design/06`, `design/09`, `docs/05`.

## Build
1. Scaffold Vite + React + TypeScript with the stack in `CLAUDE.md` section 4. Folder structure as suggested there.
2. **Tokens:** `src/theme/tokens.css` with every token in `design/06` (surfaces, text, brand, court, status, categorical, radius, spacing, elevation, motion durations and easings). Wire Tailwind to the CSS variables. Add the court-line SVG pattern, floodlight glow and grain utilities.
3. **Fonts:** copy any files from `assets/fonts/` into `public/fonts/` and any from `assets/brand/` into `public/brand/` (see `assets/README.md`). Load Gilroy if the files exist; otherwise bundle `@fontsource/outfit` as the fallback. Log which one is active.
4. **Brand:** `BRAND_NAME` constant; logo component that uses `public/brand/logo.svg` if present, else the text wordmark fallback described in `design/06` section 2 plus a warning shown only in the Prototype switcher.
5. **Mock data:** implement the entities and the full seed in `docs/05` with a deterministic generator. Selectors for every derived number (entries, players, collected, matches done) so numbers always agree.
6. **Store:** Zustand with persist to `localStorage`, `resetDemo()`, cross-tab sync (BroadcastChannel plus `storage` event), simulated async helper (`fakeDelay`).
7. **Routing:** every route in `design/09` section 2, each rendering its surface layout and an H1 with the screen ID (to be replaced in later phases).
8. **Layouts:** marketing layout, setup shell layout (SW-00 frame without step content yet), workspace shell (W-00: sidebar with lifecycle groups and module rules from `design/09` section 4, glass top bar, mobile bottom bar), microsite layout, umpire layout, TV layout (fixed 1920x1080 scaled to fit), HQ layout with the violet HQ strip.
9. **Prototype switcher** exactly as `design/09` section 5 (persona, event, event moment, 3D quality, reduced motion, reset, court tokens, `\` shortcut).
10. **Formatters:** INR with Indian grouping, dates "17 Oct 2026", times "4:30 pm", masked phone.
11. `BUILD_LOG.md` and `README_PROTOTYPE.md` (how to run).

## Acceptance
- [ ] `npm run dev` shows the landing shell in Night Court styling; no white backgrounds anywhere.
- [ ] Every route in `design/09` resolves.
- [ ] Workspace sidebar shows different modules for each seeded event type (tournament, league, auction, draft, social), matching the module rules table.
- [ ] Prototype switcher changes persona, event and moment, and Reset restores the seed.
- [ ] Two browser tabs stay in sync when the store changes.
- [ ] Shared selectors return the same counts everywhere (write a tiny unit test for the selectors).
