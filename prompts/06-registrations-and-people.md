# Prompt 06 - Registrations and Players & teams

**Goal:** the daily workhorse screens: fast, legible tables with every action an organizer needs at the desk.

**Read again:** `design/11` W-02, W-03, `design/10` F8, `docs/02` section 4.20 (all current columns and actions).

## Build
1. **W-02 Registrations:** header counts from shared selectors, filters, default columns plus Columns picker (all collected fields available), friendly DUPR status chips, detail drawer with all actions (mark paid, send payment link, check in, move category, edit partner, refund with reason, withdraw), bulk actions bar, Add entry sheet with mobile lookup, Import (template download, sample upload, validation preview, confirm), Check-in mode (full screen, swipe or Space to check in, counter, celebration at 100%), waitlist promotion, Export (mock download of a generated CSV).
2. **W-03 Players & teams:** players (merge duplicates suggestion, edit, entries), teams (move category, swap partner with confirm), league squads, auction owners, draft captains.
3. Desk volunteer persona (Prototype switcher) sees only Registrations and Check-in.

## Acceptance
- [ ] Adding a walk-in, marking paid, refunding and moving categories all update Home, Money, Schedule counts.
- [ ] The table is comfortable with 96 rows: sticky header, smooth scrolling, no layout jank.
- [ ] Mobile shows registrations as cards with swipe to check in.
- [ ] No raw error text anywhere; every problem has a plain message and a fix.
