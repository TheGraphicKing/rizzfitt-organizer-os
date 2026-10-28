# Prompt 13 - Polish, performance, accessibility and the final demo run

**Goal:** make it feel finished and prove it with the demo script.

**Read again:** `CLAUDE.md` section 6, `docs/12-demo-script.md`, `design/06` section 9, `design/07` sections 2 and 4.

## Do
1. **Run the demo script** (`docs/12`) end to end at 1440x900 with Playwright if available (script it as an end-to-end test in `e2e/demo.spec.ts`), otherwise manually. Fix every dead end, console error and layout break.
2. **Responsive pass:** screenshot every route at 1440x900, 1024x768, 768x1024 and 390x844. Fix overflow, clipped text, cramped tables, tap targets under 44 px.
3. **Accessibility pass:** contrast (AA) on every text style and status chip, focus order, focus rings, labels, `aria-label` on icon buttons, screen reader alternatives for S7 court map and S8 bracket, reduced motion across all scenes and transitions.
4. **Performance pass:** each 3D scene at about 50+ fps on high quality, quality fallbacks work, canvases pause off screen, route-level code splitting for 3D, no runtime network requests.
5. **Copy pass:** search the codebase for em and en dashes and replace them; check INR formatting, dates and times; remove any leftover screen-ID headings; no lorem ipsum.
6. **Consistency pass:** every number shown in two places matches; every destructive action confirms; every action gives feedback.
7. **Micro-interaction pass:** confirm every item in `design/07` section 4 is implemented.
8. Finalise `README_PROTOTYPE.md`: how to run, how to use the Prototype switcher, the demo script, known limitations, assumptions to confirm (copy from `docs/04`).
9. Finalise `BUILD_LOG.md` with a summary table: every screen ID, status (done, partial), notes.

## Acceptance
- [ ] Demo script passes end to end, twice in a row, after Reset demo data.
- [ ] Zero console errors and zero failed network requests.
- [ ] Every route looks intentional at 390 px.
- [ ] `BUILD_LOG.md` summary shows every screen ID from `design/11` as done.
