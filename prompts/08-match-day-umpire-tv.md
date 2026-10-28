# Prompt 08 - Match day, umpire app and court TV

**Goal:** the live heart of the product: an organizer runs every court from one screen, umpires score on any phone, and screens look like broadcast TV. All three stay in sync across tabs.

**Read again:** `design/11` W-09, U-01, T-01, `design/10` F10, F14, `design/07` S7, S13, `docs/02` sections 4.5, 4.7, 4.13, 4.15.

## Build
1. **W-09 Match day:** S7 court map (N courts from data, isometric 3D tiles, live glow, DOM score bugs over tiles, late and free states), click or keyboard to open the court panel; blockers feed; up-next queue with drag reorder and conflict hints; court panel and match drawer (correct score with required reason and audit trail, confirm result that advances the bracket with a short animation, walkover with confirm, move court, pause); umpires tab with links and QR codes; match rules override for one match (court, scoring, points, games, golden point, fixed-side serve, timeouts).
2. **U-01 Umpire app:** join, match list, toss, scoring pad (rally and side-out logic for pickleball with server 1/2, badminton rally to 21, simplified cricket runs/wickets/overs, football goals), undo, timeouts with countdown, game and match point banners, end and confirm, next match. One-handed, high contrast, landscape support.
3. **T-01 Court TV:** Arena, Glass and Minimal templates; flip digits; server dot; game and match point banners; up next; sponsor rail; between-match bracket or winners carousel; `all` courts grid; scaled to fit any window.
4. Cross-tab sync so umpire points appear instantly on W-09, P-03 and T-01.

## Acceptance
- [ ] Run demo script Act 5 (`docs/12`) end to end.
- [ ] Pickleball side-out scoring is correct (only the serving side scores; server rotation 1 to 2 to side out; first-server exception at game start).
- [ ] Correcting a score updates standings and the bracket and leaves an audit entry.
- [ ] The court map has a full keyboard and screen reader alternative (a list of courts with the same information and actions).
- [ ] TV looks right at 1920x1080 and remains legible from across a room (score at least 160 px).
