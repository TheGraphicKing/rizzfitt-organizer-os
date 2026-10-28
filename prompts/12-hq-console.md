# Prompt 12 - Rizzfitt HQ console

**Goal:** Rizzfitt keeps control of platform-level things, approves organizers and payouts, and can step into any event.

**Read again:** `design/11` H-01 to H-05, `design/10` F16, `docs/04` (what stays with Rizzfitt, guardrails, rollout, assumptions), `docs/03` (new capabilities), `docs/02` section 4.22.

## Build
1. **H-01 Overview:** platform KPIs, today's queue, live events, charts, analytics summary.
2. **H-02 Approvals:** organizer approvals, payout accounts, custom category requests with approve, ask for changes, reject (confirm). Approving updates the organizer's go-live checklist live.
3. **H-03 Organizers and events:** tables, organizer detail, "View as organizer" (read-only workspace with banner), "Take over event" (confirm, banners on both sides), message organizer.
4. **H-04 Platform:** Fees (placeholders, audit note), Masters (categories and divisions with reorder and archive), Payments (filters, settlement upload), Access (users, roles including Organizer, login methods, permission override grid of 64 screens x actions), Integrations (keys, limits, scopes, revoke).
5. **H-05 What's new in this design:** new capabilities list (from `docs/03`), rollout phases with phase tags per module (from `docs/04`), assumptions to confirm, each linking to the screen that shows it.
6. HQ uses the violet HQ strip on every page so it can never be confused with an organizer's workspace.

## Acceptance
- [ ] Demo script Act 3 works: approve Rahul's payout in HQ, his trophy fills and he can open registrations.
- [ ] "View as organizer" cannot change anything; "Take over" can, and both are clearly bannered.
- [ ] Fee rates appear only in HQ.
