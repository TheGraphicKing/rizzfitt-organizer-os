# Rizzfitt Organizer OS - redesign prompt pack for Claude Code

This folder contains everything Claude Code needs to build a **clickable, 3D-rich design prototype** of the complete Rizzfitt product, redesigned for **self-serve organizers**. It is a design prototype only: real screens, real interactions and realistic mock data, with no backend, no real payments and no real messages.

It replaces the earlier light-theme concept. The direction now is "Night Court": a dark, floodlit, 3D sports product.

---

## How to use it (3 steps)

1. **Add your brand files** (optional, 5 minutes): logo SVGs and Gilroy font files. See `assets/README.md`.
2. **Open the folder in Claude Code.** Unzip, then start Claude Code inside the unzipped folder. It reads `CLAUDE.md` automatically.
3. **Paste the kickoff prompt.** Copy everything in `prompts/00-kickoff.md` into Claude Code. It reads every document, writes a plan, then builds phase by phase (prompts 01 to 13), checking its own work after each phase.

**Two modes:**
- **Autopilot (default):** it runs all 13 phases in a row and logs progress in `BUILD_LOG.md`.
- **Step mode:** type "step mode" after the kickoff. It stops after each phase with a summary and screenshots, and waits for you to say "continue". Recommended for the first two phases so you can steer the look early.

If a session ends midway, start Claude Code again in the same folder and say: "Read CLAUDE.md and BUILD_LOG.md, then continue from the next unfinished phase."

This is a large build (about 45 screens across 7 surfaces). Expect a long run.

---

## What Claude Code will build

A single web app you run locally (`npm run dev`) with a floating **Demo** switcher to jump between people, events and moments. Seven surfaces:

### 1. Organizer landing and sign-in
- A night-time pickleball court floats in 3D behind "Run the game. We run everything else." Paddles rally a glowing ball; scrolling tilts the camera until the court lines become a bracket, then a dashboard.
- Bento grid of features with tilting cards and 3D icons. Sign in with a mobile number and OTP.

### 2. Guided setup (10-15 minutes, the heart of the redesign)
- 7 short steps: You, The event, Format, Match rules, Registration and money, Match day, Look and launch, then Review.
- Pick your sport from 3D objects (paddle and ball, shuttlecock, bat, football) and your event type from 3D tokens (trophy, league shield, auction gavel, draft cards, party popper).
- Questions branch by type: tournaments get categories, formats and groups with a live sentence ("28 teams make 7 groups of 4. Top 2 go to a 16-team knockout with 2 byes."); leagues get teams, ties and team formation; auctions get budgets, owners and bid steps; drafts get pick order; socials get capacity and pricing; cricket gets overs and squads.
- Every question has a sensible default. A live 3D-tilted phone and laptop preview shows the organizer's app and public page changing as they answer.
- Finish with a "Building your app" moment: module blocks fly in and assemble in 3D, then confetti.

### 3. Organizer workspace (run the event day to day)
Organized by the event lifecycle, showing only the modules the setup switched on:
- **Home:** before launch, a 3D trophy fills as the go-live checklist completes. During registrations, an attention feed and a few big numbers. On match day, a live court map and a blockers feed.
- **Registrations:** fast table, walk-ins with mobile lookup, mark paid, refunds, move category, Excel import, and a full-screen check-in mode.
- **Players & teams**, **Team builder** (leagues), **Ties & line-ups**, **Auction room** (live bidding with shrinking 3D coin stacks), **Draft board**.
- **Schedule:** one checklist per category: draw groups (3D draw animation), create matches, a 3D-tilted bracket, a courts-and-times timeline with auto-assign and conflict checks, publish.
- **Match day:** an isometric 3D map of your courts glowing with live scores; call next match, confirm results, correct scores with an audit trail.
- **Messages** (WhatsApp and email), **Results** (3D winners podium, DUPR sync, every report), **Money** (collections, refunds, payouts), **Sponsors & screens** (court TV designer), **Launch kit** (event page, 3D poster studio with PNG export, message templates), **Settings** (co-organizer roles, advanced rules).

### 4. Player microsite
The event's public page in the organizer's chosen colour: register and pay by mock UPI in about 2 minutes, get a ticket-style confirmation, follow live scores, the draw and "my next match".

### 5. Umpire app
A phone-first scoring pad with huge tap zones, correct pickleball side-out scoring, timeouts, undo and result confirmation. Opening it in another tab updates everything live.

### 6. Court TV
Broadcast-style 1920x1080 scoreboards with flip digits, match point banners, up-next and a sponsor rail.

### 7. Rizzfitt HQ console
Approvals for organizers and payout accounts, all organizers and events, "View as organizer" and "Take over event", platform fees, master categories, payments, access and integrations, plus a "What's new in this design" page listing build scope, phases and assumptions for stakeholders.

### What makes it more than a re-skin
- **Self-serve:** what the Rizzfitt team does by hand today (accounts, 64-screen permissions, about 15 configuration pages) becomes 7 guided steps.
- **Lifecycle navigation:** Before, During, After, instead of 29 configuration screens in a sidebar.
- **Only what applies:** no cricket settings at a pickleball event; leagues get team tools, auctions get an auction room.
- **Fixes from the audit:** no internal notes or fee rates shown to organizers, one consistent registration count, confirmations on live switches, friendly errors, scoring visible to organizers.
- **Every current feature has a home** (`docs/03-feature-map.md` maps all 43).

### What it will not do
No real login, payments, WhatsApp, email, DUPR sync or database. Everything is simulated with mock data that resets from the Demo switcher.

---

## What is inside

```
CLAUDE.md                         Standing instructions Claude Code reads automatically
README.md                         This file
assets/README.md                  Where to put your logo and fonts
docs/
  01-product-context.md           Rizzfitt, personas, goals, tone of voice
  02-current-state-audit.md       Every screen and field in today's super admin and organizer apps
  03-feature-map.md               43 current features and where each lives in the redesign
  04-self-serve-strategy.md       Product model, what can and cannot change, guardrails, rollout, assumptions
  05-domain-model-and-mock-data.md Entities and the full demo dataset (invented people only)
  12-demo-script.md               10-minute click path; the final acceptance test
design/
  06-brand-and-visual-system.md   Night Court tokens, type, colour, components, do and don't
  07-3d-and-motion-direction.md   3D kit, 16 scenes, motion system, performance budgets, inspiration
  08-iconography-and-illustration.md UI icons, 3D icon sources and licences, empty states
  09-information-architecture.md  Surfaces, every route, navigation, module rules, Demo switcher
  10-user-flows.md                16 flows that must work by clicking
  11-screen-specs.md              About 45 screens specified in detail
prompts/
  00-kickoff.md ... 13-polish-and-qa.md   The build phases, in order
```

---

## Assumptions to confirm with the team

The prototype assumes the following; they are also listed inside the prototype on the HQ "What's new" page. Changing any of them later is easy.

1. Umpires score in a phone web app opened from a court link or QR code.
2. Players pay through Rizzfitt's Razorpay; Rizzfitt pays out to the organizer after fees.
3. Creating events is free; a per-entry platform fee applies (shown as `[PLATFORM FEE]`).
4. Every event gets a public page at `rizzfitt.com/e/[event-slug]`.
5. Draft leagues work as a setup branch with a draft board (they do not open today).
6. Cricket scoring is simplified (runs, wickets, overs).
7. WhatsApp messages go out from a Rizzfitt business number.
8. Rizzfitt approves new organizers' payout accounts, usually within a day.

---

## Sources used for the 3D and visual direction

- Awwwards WebGL and 3D inspiration collections (for example "Valerian Intergalactic Mission", WebGL 3D navigation)
- Line25, "Web Design Trends 2026: The Definitive Guide" (dark mode first, Glassmorphism 2.0, claymorphism, bento grids, micro-interactions)
- Microsoft Fluent Emoji (3D style), MIT licence; 3dicons, CC0 licence
- React Three Fiber and drei performance practices (Noqta tutorial, 2026)
