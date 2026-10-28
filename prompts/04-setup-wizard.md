# Prompt 04 - Guided setup wizard (the heart of the product)

**Goal:** the 10-15 minute self-serve setup with every branch, smart defaults, autosave and a live 3D preview.

**Read again:** `design/11` SW-00 to SW-08, `design/10` F2 to F6, `docs/04` (guided setup table), `design/07` S2, S3, S4, `docs/02` section 4.1 to 4.19 (so no existing setting is lost).

## Build
1. **SW-00 shell:** step rail with rolling ball, content column, live preview pane (S4: CSS 3D tilted phone and laptop rendering real DOM previews of "Your app", "Event page" and "Court TV"), mobile preview bottom sheet, autosave chip, Save and exit, "Have Rizzfitt set this up" contact sheet.
2. **SW-01 to SW-07** exactly as specified, including:
   - S2 sport picker and S3 event-type picker (canvas is decorative; real buttons carry the choice; image fallbacks).
   - All SW-03 branches: tournament, league, auction, draft, social, plus the cricket add-on. Disabled combinations with reasons.
   - The live sentence for groups and knockouts (compute groups, qualifiers, bracket size and byes correctly).
   - SW-04 presets by sport and the custom ranking drawer (sort and show toggles, drag order, all criteria from `docs/02` 4.8).
   - SW-05 prices and caps table with the totals sentence, payment methods, fields chips with form preview, consent default text, certifications with explanations, slug availability, payout account sheet with status.
   - SW-06 and SW-07 with instant re-theming of the preview by the event accent.
3. **SW-08 Review** with Edit links, module chips and go-live checklist preview.
4. Every answer writes to the event draft in the store and recomputes `modules` using the rules in `design/09` section 4.
5. Resuming: "Captain's Draft Night" opens at SW-03 from `/events` "Continue setup".

## Acceptance
- [ ] A first-time user can finish by mostly pressing Continue (defaults are valid).
- [ ] Each event type and sport combination shows only relevant questions and the preview sidebar shows only relevant modules.
- [ ] Every setting that exists today (docs/02) is reachable in setup or later in Settings; list any you could not place in `BUILD_LOG.md`.
- [ ] Works perfectly at 390 px (organizers set up on phones), including pickers, tables (stack into cards) and the preview sheet.
- [ ] Autosave survives a page refresh mid-step.
- [ ] Full keyboard operation; every choice card is a real button with a visible focus ring.
