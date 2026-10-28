# Rizzfitt Organizer OS - design prototype

You are building a **clickable, front-end-only design prototype** of a complete redesign of Rizzfitt, a sports tournament platform. The goal of the redesign: any tournament organizer can open a link, answer a guided setup in 10-15 minutes, and get a ready-to-run event app configured for exactly their event. Today the Rizzfitt team configures every event by hand from a super admin panel. This prototype shows the self-serve future, end to end, so the company can see it, click it, and approve it before engineering starts.

This file is your standing instruction set. Read it fully before every phase.

---

## 1. Read these first (source of truth)

Read in this order before writing any code:

| # | File | What it gives you |
|---|------|-------------------|
| 1 | `CLAUDE.md` (this file) | Hard rules, stack, way of working |
| 2 | `docs/01-product-context.md` | What Rizzfitt is, who uses it, the goal |
| 3 | `docs/02-current-state-audit.md` | Every screen and field that exists today |
| 4 | `docs/03-feature-map.md` | Every existing feature and where it lives in the redesign |
| 5 | `docs/04-self-serve-strategy.md` | The product model, guardrails, assumptions |
| 6 | `docs/05-domain-model-and-mock-data.md` | Entities, fields, and the seed data to generate |
| 7 | `design/06-brand-and-visual-system.md` | Tokens, type, colour, components |
| 8 | `design/07-3d-and-motion-direction.md` | Every 3D scene, motion rules, performance budgets |
| 9 | `design/08-iconography-and-illustration.md` | Icon and 3D asset sources and rules |
| 10 | `design/09-information-architecture.md` | Surfaces, routes, navigation, conditional modules |
| 11 | `design/10-user-flows.md` | Step-by-step flows that must work |
| 12 | `design/11-screen-specs.md` | Screen-by-screen specification |
| 13 | `docs/12-demo-script.md` | The click path that must run without dead ends |
| 14 | `prompts/` | The build phases, in order |

**Precedence when files disagree:** hard rules in this file win. Then a specific screen spec (`design/11`) beats a general rule (`design/06`, `design/07`). If something is still unclear, pick the option that best serves "an organizer can do this alone in 15 minutes", log it under **Decisions** in `BUILD_LOG.md`, and keep going.

---

## 2. What this is, and what it is not

**It is:**
- A high-fidelity, clickable prototype of every surface: organizer landing, guided setup, organizer workspace, player microsite, umpire scoring app, court TV display, and the Rizzfitt HQ console.
- Realistic mock data, so screens look like a real event in progress.
- Bold, dark, 3D-rich visual design that feels like a premium sports product, not a generic admin template.
- Every button does something believable: navigates, opens a panel, updates mock state, shows a toast.

**It is not:**
- A backend, an API, real authentication, real payments, real WhatsApp or email sending.
- Production architecture. Keep code clean and componentised, but do not build data layers, API clients, or server code.

---

## 3. Hard rules

1. **No backend, no runtime network calls.** All data comes from `src/mock/`. State lives in one client store persisted to `localStorage`. A "Reset demo data" action restores the seed. Fonts, 3D assets and images are bundled locally. Fake every async action with a short delay (300-900 ms) and a loading state.
2. **No real people's data.** Every name, phone and email in mock data is invented. Phones look like `+91 90000 1xxxx`, emails end in `@example.com`. Do not reuse any person's name from the audit docs.
3. **Brand from tokens only.** Colours, radii, shadows, fonts come from the tokens in `design/06`. No ad-hoc hex values in components. The brand name is a single constant (`BRAND_NAME = "Rizzfitt"`) so it can be changed in one place.
4. **Copy rules.** Never use em dashes or en dashes in any UI string; use hyphens, commas or colons. Currency is INR with Indian digit grouping (₹1,37,300). Dates like "17 Oct 2026", times like "4:30 pm", timezone IST. Mobile numbers are Indian (+91). Plain, confident, friendly language. No lorem ipsum: write real copy, and use `[BRACKETED PLACEHOLDERS]` only for business facts we do not know (fee rates, legal text).
5. **Dark "Night Court" theme is the default** for every surface (see `design/06`). Do not ship a white admin template look.
6. **3D for moments, 2D for work.** 3D lives in onboarding, celebrations, empty states, summaries, the landing page, the court map and the TV display. Forms, tables and anything an organizer types into stay flat, fast and legible. Every 3D scene follows the performance and fallback rules in `design/07`.
7. **Accessibility is not optional.** WCAG 2.2 AA contrast, full keyboard use, visible focus rings, labels on every input, `aria-label` on icon-only buttons, touch targets at least 44 px. Respect `prefers-reduced-motion`. Every 3D canvas is decorative (`aria-hidden`) or has a text equivalent next to it.
8. **Every interactive element has hover, focus, active, disabled and loading states.** Destructive or live-changing actions (close registrations, unpublish, regenerate a published draw, refund, unlock an auction team, remove a co-organizer) always ask for confirmation and say what will happen.
9. **Responsive.** Setup wizard, player microsite and umpire app are mobile-first and must work perfectly at 390 px wide. Organizer workspace and HQ are desktop-first (1280-1600 px) and must remain usable at 768 px and readable at 390 px (sidebar collapses to a bottom bar). Court TV is 1920x1080.
10. **Stay inside the prototype stack below.** Ask (log in `BUILD_LOG.md`) before adding any heavy dependency.

---

## 4. Prototype stack

Use this so the prototype is fast to build and easy to run. It is a prototype stack, not a recommendation for production.

- **Vite + React + TypeScript**, React Router for routes.
- **Tailwind CSS** wired to CSS custom properties from `design/06` (tokens live in `src/theme/tokens.css`; Tailwind config reads them).
- **Zustand** (with `persist`) for the single demo store.
- **Framer Motion** for UI motion, layout transitions and micro-interactions.
- **three + @react-three/fiber + @react-three/drei** for 3D. Use versions that are compatible with the installed React major version (check the React Three Fiber docs; do not mix majors). `@react-three/postprocessing` is allowed for the landing hero and TV display only.
- **lucide-react** for UI icons.
- **@dnd-kit** for drag and drop (draw, scheduling, team builder).
- Optional: `canvas-confetti` for celebrations.

Install with npm. Pin exact versions in `package.json` once it builds.

**Suggested structure**
```
src/
  app/            routes, layouts, providers
  surfaces/
    marketing/    landing, sign-in
    setup/        guided setup wizard
    workspace/    organizer workspace (all modules)
    microsite/    player-facing event site
    umpire/       umpire scoring app
    tv/           court TV display
    hq/           Rizzfitt HQ console
  components/
    ui/           buttons, inputs, tables, dialogs, toasts...
    3d/           procedural objects, scenes, fallbacks, perf utils
    data/         charts, brackets, standings, court timeline
  mock/           seed data + generators
  store/          zustand store, selectors, actions
  theme/          tokens.css, typography, motion presets
  lib/            formatters (INR, dates), helpers
public/
  brand/          logo files (see assets/README.md)
  fonts/          licensed Gilroy files if provided
  3d/             3D icons, optional GLB models
```

---

## 5. Way of working

1. Work through `prompts/` in numeric order. Each prompt is one phase with its own acceptance checklist.
2. At the end of every phase:
   - Run `npm run build` and the TypeScript check. Fix every error.
   - Run the dev server and visit every route added in that phase. If Playwright is available, take screenshots at 1440x900 and 390x844 into `screenshots/phase-XX/` and look at them. Fix what looks wrong (overflow, clipped text, low contrast, broken 3D).
   - Tick the phase's acceptance checklist in `BUILD_LOG.md`, plus **Decisions**, **Deviations** and **Open issues**.
3. Finish a phase fully before starting the next. Do not leave placeholder screens that say "coming soon" unless the spec says so.
4. Keep the **Prototype switcher** working at all times (see `design/09`). It is how stakeholders jump between personas and surfaces during a demo.
5. When the last phase is done, run the full demo script in `docs/12-demo-script.md` yourself, end to end, at 1440x900, and fix any dead end.

---

## 6. Definition of done

- Every route in `design/09-information-architecture.md` exists and renders with mock data.
- Every flow in `design/10-user-flows.md` can be completed by clicking.
- The demo script in `docs/12-demo-script.md` runs end to end with no dead ends, console errors or layout breaks.
- 3D scenes hold about 50 fps or better on a mid-range laptop, pause when off screen, and fall back gracefully (reduced motion, WebGL unavailable, low-power devices).
- No em or en dashes in UI copy (search the codebase for them before finishing).
- `BUILD_LOG.md` is complete and `README_PROTOTYPE.md` explains how to run the prototype and the demo.
