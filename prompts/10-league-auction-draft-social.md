# Prompt 10 - League, auction, draft and social modules

**Goal:** the event types that are hardest to run today (league setup is a 6-step hidden chain) become guided and visual.

**Read again:** `design/11` L-01 to L-04, S-01, `design/10` F3 to F6, F15, `design/07` S10, `docs/02` sections 4.10 to 4.12, 4.18, 4.19, 4.20 (social).

## Build
1. **L-01 Team builder:** player pool with filters, team columns with crests, balance meters (average rating, gender mix), auto-balance animation, drag, lock, captain badge, validation, save with confirm.
2. **L-02 Ties and line-ups:** league table with qualification line, rounds timeline, tie cards with line-up status, approvals inbox (approve or ask for changes), tie breaker panel with the rule explained, rearrange knockout (drag, confirm), generate ties explainer with the correct formula.
3. **L-03 Auction room:** S10 stage, timer ring, live bid feed, coin stacks per team, organizer controls (start, pause, sold, unsold, undo last sale with confirm, next), owner view with bid step buttons, hands-free simulation of rival bids within budgets.
4. **L-04 Draft board:** rounds x teams grid with snake order arrows, pick timer, available players, make pick, auto-pick on timeout, card flip on each pick.
5. **S-01 Participants:** counts, table with payment link via WhatsApp, mark paid, payment history, invoices.

## Acceptance
- [ ] Switching the Prototype switcher between the five seeded events shows the right modules and each module is fully clickable.
- [ ] The auction can run unattended for 60 seconds and selling updates budgets, squads and Team builder.
- [ ] Approving a line-up updates the tie card and the league view.
- [ ] Ties formula: 8 teams give 7 rounds, 4 ties per round, 28 ties in total.
