# Prompt 03 - Landing page and sign-in

**Goal:** the first impression. A landing page that makes an organizer say "wow" and a sign-in that takes 30 seconds.

**Read again:** `design/11` M-01 and M-02, `design/07` S1, `design/10` F1, `docs/01` tone of voice.

## Build
1. **M-01** with the S1 "Living court" hero: night court, glowing orange lines, paddles rallying a ball in arcs, pointer parallax, scroll-linked camera that tilts to top-down while lines morph into a bracket and then a dashboard card (three story beats as glass cards). Bloom on high quality only.
2. Bento "Everything a tournament needs" grid with tilt tiles and 3D spot icons; event types strip; managed-service band; footer.
3. **M-02** sign-in with mobile (+91), OTP (demo code 123456), name; invite variant at `/start/invite/:token` with prefilled organization and banner; returning organizer (Meera's mobile 90000 10001) goes to `/events`; new organizer creates a draft and goes to SW-01.
4. Make the landing fully responsive: shorter hero on mobile, S1 at reduced quality, text first.

## Acceptance
- [ ] Hero headline and buttons are readable within the first frame, before the canvas loads.
- [ ] Scroll story works forwards and backwards; reduced motion shows a static hero image and normal scrolling.
- [ ] Lighthouse-style sanity: no layout shift when the canvas appears.
- [ ] Sign-in works by keyboard only and at 390 px.
- [ ] Copy matches `design/11` and has no em or en dashes.
