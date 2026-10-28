# 10 - User flows

Every flow below must be completable by clicking in the prototype. Screen IDs refer to `design/11`.

## F1. A new organizer signs up (from a shared link)
1. Opens `/` (M-01) from a link. Sees the living court hero and "Set up your tournament in 15 minutes". Taps **Start free**.
2. M-02: enters mobile (+91), gets an OTP (prototype: any 6 digits; show "Demo code: 123456"), enters name. If arriving via `/start/invite/:token`, name and organization are prefilled and a banner says "Rizzfitt invited you".
3. Lands on SW-01 with a new draft.

## F2. Guided setup, tournament (the core flow, 10-15 minutes)
1. **SW-01 You:** organization name, city, "What best describes you" (club or academy, association, company or college, independent organizer), events per year. Continue.
2. **SW-02 Event:** event name (live preview updates), sport (S2 picker), event type (S3 picker), dates (range picker), venue (search with suggestions, mock), number of courts (stepper with a mini court row that grows), logo upload (optional, mock).
3. **SW-03 Format (tournament branch):** pick categories from chips (masters) with divisions; for each category a compact row: entry type (singles or doubles inferred), format (groups then knockout default, round robin, knockout, king of the court) with a one-line explanation and a mini diagram; group size and how many advance, with a live sentence like "28 teams make 7 groups of 4. Top 2 go to a 16-team knockout." "Request a custom category" opens a small form (goes to HQ).
4. **SW-04 Match rules:** scoring preset cards ("Rally to 11, win by 2, best of 1" default for pickleball; "Rally to 15"; "Side-out to 11"; "Custom"). Apply to all categories or set per category. Golden point, fixed-side serve, timeouts (default 2 per team, 60 s). Ranking preset for groups: "Wins, then point difference, then head to head" (default), "Wins, then points scored", "Custom" (opens the full criteria editor from today's Leaderboard config). All under clear defaults.
5. **SW-05 Registration & money:** per category price and cap (table with ₹ inputs, totals preview "If every category fills: ₹1,68,800" for the seed event's prices and caps), payments online and/or at the desk, waitlist when full, what to collect (chips: DUPR ID, T-shirt size, date of birth, district, Instagram, emergency contact), consent text (default provided, editable), guidelines PDF (optional), WhatsApp group link, show registered count, certifications (DUPR rated, IPA, PWR) with explanations, event web address (`rizzfitt.com/e/` + slug, availability check), payout account (connect now or later; "Takes 2 minutes, needed before you can take payments").
6. **SW-06 Match day:** umpires scoring on phones (on by default; how many per court), court TV screens (on or off; what they show: score, up next, sponsors, bracket), public live scores page (on), check-in at the desk (on).
7. **SW-07 Look & launch:** event accent colour (8 swatches, live preview), cover style (Court, Neon, Clay), sponsors (add now or later), launch kit picks (event page, posters, WhatsApp and email templates).
8. **SW-08 Review:** every answer grouped by step with Edit links; "Your app will include" module list; go-live checklist preview. Primary: **Build my event app**.
9. **SW-09 Building:** S5 animation, then lands on W-01 Home in "Before launch" state with confetti.

Throughout: progress rail, autosave toast ("Saved"), "Save and exit", back navigation, "Have Rizzfitt set this up" link opening a contact sheet (WhatsApp +91 78450 45444, hello@rizzfitt.com, or "Request a call back").

## F3. Guided setup, league branch (differences from F2)
- SW-03 asks: number of teams, players per team, match types per tie (doubles, mixed, singles, super singles, team event) with counts, matches per player, eligibility (skill, age, gender), ties on or off, auto knockout from the table, and **how teams are formed**: you assign, auto-balance by skill, captains submit line-ups, auction, draft. Team names and colours (auto-suggested, editable).
- SW-04 adds tie scoring (points per match win, tie breaker rule) and slot swap mode explained in plain words.
- Result: modules add Team builder and Ties & line-ups.

## F4. Guided setup, auction league
- Everything in F3 plus: budget per team (₹), squad size, player tiers and base prices, bid steps, who bids (owners on their phones, or you on their behalf), auction date and time, team owners (name, mobile; they get an invite).
- Result: Auction room module and an owner invite list.

## F5. Guided setup, draft league
- F3 plus: draft order (snake or straight), rounds (computed from squad size), captains per team, pick timer.
- Result: Draft board module.

## F6. Guided setup, social mixer
- SW-03 becomes: capacity, price per person, play format (just social, or play rounds with rotating partners), what to collect (meal preference, T-shirt size, alias). SW-04 and SW-06 are skipped unless "play rounds" is chosen.
- Result: Participants instead of Registrations; payment links.

## F7. Go live
1. W-01 Home (Before launch): go-live checklist with trophy (S6): payout account verified, every category has a price, event page looks right (preview), at least one umpire invited (if umpires on), sponsors (optional).
2. If the organizer is new, "Payout account under review. Usually within a day." The prototype lets you switch to HQ (Prototype switcher) and approve it in H-02, then return.
3. **Open registrations** (confirm dialog: "Players can now register and pay. You can close entries any time.") Then confetti, status chip changes, share sheet (copy link, WhatsApp share, QR code, download poster).

## F8. Registrations, day to day
1. W-02: see entries, filter by category, status (paid, pending, refunded, waitlist), channel, checked in.
2. **Add a walk-in:** "Add entry", pick category, look up players by mobile (existing players autofill), mark paid by cash or UPI, or "Send payment link".
3. **Check-in mode:** big search, tap or swipe to check in, counts at the top.
4. **Mark paid**, **Refund** (confirm, reason), **Move to another category** (from the detail drawer), **Edit partner**.
5. **Import from Excel:** download singles or doubles template, upload (mock file), preview with validation (duplicates, missing mobile), confirm.
6. **Close entries** for one category or all (confirm).
7. **Export** (CSV or Excel, mock download).

## F9. Draw and schedule
1. W-04: every category is a card with a status pipeline: Entries open, Ready to draw, Drawn, Matches created, Scheduled, Published.
2. W-05 Draw: choose seeding (by DUPR rating, random, manual), "Draw groups" plays S9; drag teams between groups; warning if two teams from the same club meet early (optional nicety); **Lock groups**.
3. W-06: "Create matches" makes group matches and the knockout bracket (byes shown).
4. W-07 Courts and times: auto-assign matches to courts using match length estimate (default 20 min) and rest time between a player's matches (default 15 min); timeline by court, drag to adjust, conflicts highlighted (player double-booked, rest too short).
5. W-08 Publish: preview of the public schedule, choose to notify players (WhatsApp and email), **Publish** (confirm). Published draws need a confirm with a stronger warning to regenerate later.

## F10. Match day
1. W-09: court map (S7) plus a blockers feed (awaiting confirmation, late courts, idle umpires, players not checked in) and an up-next queue.
2. **Call next match** on a free court: assigns, notifies players (WhatsApp, simulated), umpire sees it.
3. Umpire (switch persona to Umpire, U-01) scores the match; the organizer sees the live score update on the court tile and on TV (T-01).
4. Match ends: umpire taps "End match", both captains or the umpire confirm, status "Awaiting confirmation" until the organizer or umpire confirms. Organizer can **Confirm result** from the blockers feed.
5. **Correct a score:** open match drawer, edit games, reason required, saved with an audit entry.
6. Bracket advances automatically; next round matches appear in the queue.

## F11. Messages
1. W-10: New message, choose channel (WhatsApp, email, both), audience (everyone, by category, by status: unpaid, not checked in, playing in the next hour), template (confirmation, schedule, reminder, results, custom), preview per channel, send now or schedule. Sent list with delivery stats.

## F12. Results and money
1. W-11: standings and brackets per category, winners podium (S11), DUPR sync status per match (synced, pending, failed with retry), reports (all of today's exports as download cards).
2. W-12: collected by category, online vs desk, refunds, fees total, payout timeline (scheduled, paid), invoices list.

## F13. Player registers (microsite)
1. P-01: event hero (S15), dates, venue, categories with price and spots left, register button.
2. P-02: pick category; enter mobile (lookup prefills a returning player); partner by mobile (invite partner if new); collected fields; consent; pay (mock UPI sheet with "Pay ₹1,500"); success with match-time promise ("We will WhatsApp your schedule"), WhatsApp group button, add to calendar.
3. P-03: live scores, my matches, draw and standings.

## F14. Umpire scores a match
1. U-01: opens court link; sees court name, assigned matches; taps the called match.
2. Coin toss result (who serves), side, then the pad: big tap zones per team, server indicator (pickleball side-out shows server 1 or 2), undo, timeout button with countdown, game end and match end prompts.
3. End: summary, "Confirm result" (or hand phone to captains to confirm). Next match loads.

## F15. Auction day
1. L-03: player on the block with tier and base price, owners bid from their phones (simulate other owners' bids with a timer), organizer view shows bids streaming, timer ring, Sold (gavel strike, coin stack shrinks), Unsold, Undo last sale (confirm), pause auction.
2. After the auction: squads summary, then Team builder for adjustments.

## F16. Rizzfitt HQ
1. H-01: platform overview and today's queue.
2. H-02: approve a new organizer's payout account (view details, approve or ask for changes); approve or reject a custom category request.
3. H-03: open an organizer, "View as organizer" (read-only banner across the workspace), "Take over event" (HQ can edit, banner shows "Rizzfitt is managing this event").
4. H-04: platform fees (placeholders), category and division masters, all payments, access (roles, login methods, permission override grid), integrations (API keys).
5. H-05: what is new in this design, phases and assumptions.
