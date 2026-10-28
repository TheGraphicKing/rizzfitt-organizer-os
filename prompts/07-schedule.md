# Prompt 07 - Schedule: draw, matches, courts and times, publish

**Goal:** turn today's five hidden steps (generate groups, save, generate fixture, publish, per-match settings) into one clear checklist per category, with delightful draws and a smart court timeline.

**Read again:** `design/11` W-04 to W-08, `design/10` F9, `design/07` S8, S9, `docs/02` sections 4.16, 4.17.

## Build
1. **W-04 Schedule overview:** category cards with the stage pipeline (court-line progress with ball marker), counts and the single next action.
2. **W-05 Draw:** seeding options, S9 draw animation, drag between groups with validation, Draw again (confirm if edited), Lock groups.
3. **W-06 Matches and bracket:** groups with standings (P, W, L, PF, PA, +/-, qualified marker), S8 bracket with byes and TBD slots and highlighted paths, list view; match drawer shared with Match day.
4. **W-07 Courts and times:** timeline by court with auto-assign (match length, rest time, day hours, breaks), drag to move, conflicts with reasons, unassigned tray, day switcher.
5. **W-08 Publish:** readiness checklist, public schedule preview, notify toggles with message preview, publish with confirm; regenerating a published draw needs a stronger confirmation.
6. Correct algorithms: group splitting, round robin pairing, knockout bracket with byes for top seeds, King of the Court rotation (simple version).

## Acceptance
- [ ] For each seeded category the pipeline shows the right stage and the right next action.
- [ ] Drawing groups for 28 teams with groups of 4 and top 2 advancing gives 7 groups and a 16-team bracket with 2 byes, matching the setup sentence.
- [ ] Auto-assign never double-books a player and respects rest time; conflicts are explained.
- [ ] Published schedules appear on the microsite (P-03).
