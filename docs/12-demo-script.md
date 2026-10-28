# 12 - Demo script (the acceptance test)

A 10-minute click path for presenting the prototype to the Rizzfitt team and investors. Claude Code must run this end to end at 1440x900 before calling the build done. Every step must work with no dead ends, console errors or layout breaks. Start with "Reset demo data" from the Prototype switcher.

## Act 1 - First impression (1 min)
1. Open `/`. The living court (S1) appears behind "Run the game. We run everything else."
2. Scroll: the court tilts to top-down, lines become a bracket, then a dashboard card. Bento grid tiles tilt on hover.
3. Click **Start free**.

## Act 2 - A new organizer sets up a tournament (4 min)
4. M-02: enter mobile 90000 20002, code 123456, name "Rahul Menon".
5. SW-01: organization "Smash Factory Chennai", city Chennai, "Club or academy", "3-10" events.
6. SW-02: name "Chennai Smash Open". Pick **Pickleball** (paddle bounces the ball), **Tournament** (trophy token pops). Dates, venue (pick a suggestion), courts 6. The preview phone updates live.
7. SW-03: pick Men's Doubles (Open, Intermediate - Below 4), Women's Doubles Open, Mixed Doubles Open. Set Men's Doubles Open to groups of 4, top 2 advance. Read the live sentence.
8. SW-04: keep "Rally to 11, win by 2"; tick "Best of 3 for finals only".
9. SW-05: set prices, keep online and desk payments, add T-shirt size, set web address, connect a payout account (status: Under review).
10. SW-06: umpires on, court TV on with sponsors, public live page on.
11. SW-07: pick the blue accent, Neon cover. The preview re-themes instantly.
12. SW-08: review, then **Build my event app**. SW-09 plays the build animation and lands on Home (Before launch) with the trophy partly filled. "Open registrations" is disabled with reason "Payout account under review".

## Act 3 - Rizzfitt approves (30 s)
13. Prototype switcher: persona **Rizzfitt HQ**. H-02 shows Rahul's payout account. **Approve**.
14. Switch back to **New organizer (Rahul)**. Trophy fills to 100%. **Open registrations** (confirm). Confetti, share sheet with QR and poster.

## Act 4 - A player registers (1 min)
15. Click **View event page** (P-01 in the accent theme). Register for Mixed Doubles Open with a partner by mobile, pay with the mock UPI sheet, see the ticket-style confirmation.
16. Back in the workspace, Registrations shows the new entry; Home and Money counts updated.

## Act 5 - Match day at the Coimbatore Open (2.5 min)
17. Prototype switcher: persona **Organizer (Meera)**, event **Coimbatore Open**, moment **Match day**.
18. Home: blockers feed shows 2 results awaiting confirmation, Court 3 late, Court 4 idle umpire, 3 players not checked in. **Confirm** one result; the count drops everywhere.
19. Match day: court map (S7). Click Court 4, **Call next match** (3rd place, Men's Doubles Open).
20. Open a second browser tab with `/u/[court-4-token]` (Umpire). Score a few points. The court tile, the microsite live tab and `/tv/[event]/4` update in real time.
21. Open a match on Court 2, **Correct score** with a reason; the audit line appears.
22. Show `/tv/[event]/1`: the Men's Doubles Open final scoreboard with flip digits and sponsor rail.

## Act 6 - Leagues and auctions (1 min)
23. Switch event to **Founders Cup Auction League**: Auction room is live; watch two lots sell (gavel, coin stacks shrink).
24. Switch to **South Zone Pickleball League**: Ties and line-ups; approve a submitted line-up.

## Act 7 - After the event (30 s)
25. Coimbatore Open, moment **Finished**: Results podium (S11) for Men's Doubles Open, DUPR sync panel, reports grid. Money shows payouts timeline.

## Act 8 - Scope (30 s)
26. HQ `/hq/whats-new`: new capabilities, phases, assumptions to confirm.

## Quality checks during the run
- No em or en dashes in any UI text.
- Every number shown in two places matches.
- Every destructive action asked for confirmation.
- 3D scenes stayed smooth; turning on reduced motion in the switcher makes every scene static and the flow still works.
