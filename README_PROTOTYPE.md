# Rizzfitt Organizer OS: clickable prototype

A front-end-only design prototype of the self-serve Rizzfitt redesign ("Night Court"). Everything runs in the browser on invented mock data. There is no backend, no real payments and no real messages.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. Node 20 or newer.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Type-check and production build |
| `npm test` | Selector and scoring unit tests (Vitest) |
| `npm run e2e` | The full demo script as a Playwright test (starts the dev server if needed) |
| `node scripts/shot.mjs <dir> <path...>` | Screenshots at 1440x900 (set `W` and `H` for other sizes) |
| `node scripts/sync-test.mjs` | Umpire, TV and workspace in three tabs, scoring live |

## The Demo switcher

The **Demo** button (bottom left, or press `\`) jumps between people, events and moments:

- **Persona:** Organizer (Meera), New organizer (Rahul, starts at sign-in), Desk volunteer (Registrations and check-in only), Umpire and Court TV (pick a court below, opens a new tab), Player (event page), Rizzfitt HQ.
- **Courts:** direct links to each court's umpire app and TV screen, with their tokens.
- **Jump to event:** Coimbatore Open (live), South Zone League, Founders Cup Auction (live auction), Sunday Social, Captain's Draft Night (setup in progress).
- **Event moment** for the Coimbatore Open: Before launch, Registrations open, Draw day, Match day (default), Finished.
- **3D quality** (Auto, High, Medium, Low, Off) and **Reduced motion**.
- **Reset demo data** restores the seed in every open tab.

Open tabs stay in sync (BroadcastChannel plus the storage event), so an umpire tab, a TV tab and the workspace update together.

## The demo script

`docs/12-demo-script.md` is the 10-minute click path. It is automated in `e2e/demo.spec.ts` and passes end to end with no console errors and no external network requests. Useful values:

- Sign-in demo code: **123456**. Meera is 90000 10001; a new organizer is 90000 20002 (name prefills as Rahul Menon).
- Invite link: `/start/invite/smash-factory`.
- Payout sheet: UPI ID `smashfactory@okaxis`, PAN `ABCDE1234F` (nothing is stored or sent).
- Returning player on the event page: 90000 10005.

## Surfaces

| Surface | Start here |
|---|---|
| Landing and sign-in | `/`, `/start` |
| Guided setup | `/setup/evt-cdn/format` (resume Captain's Draft Night) |
| Organizer workspace | `/e/evt-cbe` |
| Player microsite | `/p/coimbatore-open-2026` |
| Umpire app | `/u/evt-cbe-c4` |
| Court TV | `/tv/evt-cbe/1`, `/tv/evt-cbe/all` |
| Rizzfitt HQ | `/hq`, `/hq/whats-new` |
| Galleries | `/lab/ui`, `/lab/3d` |

## Known limitations

- Everything is simulated: OTP, payments, WhatsApp, email, DUPR sync and payouts. Fees use a demo figure; rates show only as `[PLATFORM FEE]` placeholders in HQ.
- The official logo from the brand guidelines is used. Gilroy needs a licence, so Urbanist stands in for marketing type.
- Every question has a small (i) with a plain-words explanation; the text lives in `src/lib/help.ts`.
- Cricket and football scoring are simple point counters on the umpire pad.
- The auction simulation runs in whichever tab has the Auction room open; open it in one tab at a time.
- Headless screenshots use software WebGL, so their frame rate is not representative.

## Assumptions to confirm

1. **Umpire scoring:** umpires score in a mobile web app opened from a court link or QR code. No install. Results need a final confirmation.
2. **Payouts:** players pay through Rizzfitt's Razorpay. Rizzfitt pays out to the organizer's bank account or UPI after deducting fees, on a schedule shown in Money. The organizer connects a payout account once; HQ approves it.
3. **Pricing:** creating events is free; a per-entry platform fee applies to online payments, shown as `[PLATFORM FEE]`.
4. **Public pages:** every event gets a microsite at `rizzfitt.com/e/[event-slug]` with registration, schedule, live scores and brackets (served at `/p/[slug]` in the prototype).
5. **Draft leagues:** included as a setup branch with a draft board; Draft events do not open today.
6. **Cricket scoring:** simplified (runs, wickets, overs per innings).
7. **WhatsApp:** messages go out from a Rizzfitt business number. The prototype simulates sending.
8. **Approvals:** HQ approves new organizers within one working day ("Usually within a day").

The same list, with links to each screen, is on `/hq/whats-new`.
