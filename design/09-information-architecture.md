# 09 - Information architecture

## 1. Surfaces

| Surface | Who | Device priority | Look |
|---|---|---|---|
| **Marketing + sign-in** | Prospective organizers | Mobile and desktop | Full Night Court, heaviest 3D (S1) |
| **Guided setup** | Organizer | Mobile first, desktop with live preview | Night Court, 3D pickers (S2, S3), preview (S4) |
| **Organizer workspace** | Organizer, co-organizers | Desktop first, works on tablet and phone | Night Court, calm; 3D on Home, Match day, Results |
| **Player microsite** | Players, spectators | Mobile first | Event-accent themed Night Court (S15) |
| **Umpire app** | Umpires | Phone only, one-handed | High contrast, huge tap targets |
| **Court TV** | Spectators | 1920x1080 screens | Broadcast style (S13) |
| **Rizzfitt HQ** | Rizzfitt team | Desktop | Night Court, denser, with an "HQ" violet accent strip to make it unmistakable |

## 2. Routes

```
/                                  M-01  Organizer landing
/start                             M-02  Sign in / sign up (mobile OTP)
/start/invite/:token               M-02  Same, prefilled from a Rizzfitt invite link

/setup/:draftId/you                SW-01
/setup/:draftId/event              SW-02
/setup/:draftId/format             SW-03 (branches by type and sport)
/setup/:draftId/rules              SW-04
/setup/:draftId/registration       SW-05
/setup/:draftId/match-day          SW-06
/setup/:draftId/look               SW-07
/setup/:draftId/review             SW-08
/setup/:draftId/building           SW-09

/events                            W-16  All my events
/account                           W-17  Profile, payout account, team, plan
/e/:eventId                        W-01  Home
/e/:eventId/registrations          W-02  (social events: /participants, S-01)
/e/:eventId/people                 W-03  Players & teams (+ owners for auctions)
/e/:eventId/team-builder           L-01  (league, auction after auction, draft)
/e/:eventId/schedule               W-04  Overview by category
/e/:eventId/schedule/:catId/draw   W-05
/e/:eventId/schedule/:catId/matches W-06 (groups, standings, bracket, list)
/e/:eventId/schedule/courts        W-07  Courts and times timeline
/e/:eventId/schedule/publish       W-08
/e/:eventId/ties                   L-02  (league)
/e/:eventId/auction                L-03  (auction)
/e/:eventId/draft                  L-04  (draft)
/e/:eventId/match-day              W-09
/e/:eventId/messages               W-10
/e/:eventId/results                W-11
/e/:eventId/money                  W-12
/e/:eventId/screens                W-13  Sponsors & screens
/e/:eventId/launch-kit             W-14
/e/:eventId/settings               W-15

/p/:slug                           P-01  Microsite home
/p/:slug/register                  P-02
/p/:slug/live                      P-03  Live scores, schedule, draw, standings
/p/:slug/me                        P-03  My matches (after entering mobile)

/u/:courtToken                     U-01  Umpire app

/tv/:eventId/:court                T-01  Court TV (court = number or "all")

/hq                                H-01  Overview
/hq/approvals                      H-02
/hq/organizers                     H-03  (+ /hq/organizers/:id)
/hq/events                         H-03  All events
/hq/platform                       H-04  Fees, masters, payments, access, integrations
/hq/whats-new                      H-05  Build scope, phases, assumptions

/lab/ui                            Component gallery
/lab/3d                            3D kit gallery with quality toggle
```

## 3. Organizer workspace navigation

Sidebar groups follow the event lifecycle. Only enabled modules show (section 4).

```
[Event switcher: logo, name, status chip, accent dot]
  Home

BEFORE
  Registrations   (or Participants for social)
  Players & teams
  Launch kit

DURING
  Schedule
  Ties            (league)
  Auction room    (auction)
  Draft board     (draft)
  Match day       (pulsing LIVE badge when matches are live)
  Messages

AFTER
  Results
  Money

---
  Sponsors & screens
  Settings
[Help, Talk to Rizzfitt]  [User menu]
```

Top bar (glass): breadcrumb, global search / command palette (Cmd+K), "View public page" button, notifications bell (blockers, approvals, payouts), event status control (for example "Registrations open" with a dropdown to close, always confirmed).

Mobile: sidebar becomes a bottom bar with Home, Registrations, Schedule, Match day, More.

## 4. Module rules (what appears for which event)

| Module | Tournament | League | Auction league | Draft league | Social |
|---|---|---|---|---|---|
| Home | Yes | Yes | Yes | Yes | Yes |
| Registrations | Yes | Yes (player sign-ups) | Yes (player pool sign-ups) | Yes | Replaced by Participants |
| Players & teams | Yes | Yes | Yes + Owners | Yes + Captains | No |
| Team builder | No | If formation is organizer-assigned or auto-balance | After auction (review squads) | After draft | No |
| Schedule | Yes | Yes (groups, ties) | Yes | Yes | Only if "play rounds" chosen |
| Ties & line-ups | No | If ties on | If ties on | If ties on | No |
| Auction room | No | No | Yes | No | No |
| Draft board | No | No | No | Yes | No |
| Match day | Yes | Yes | Yes | Yes | Only if "play rounds" |
| Messages | Yes | Yes | Yes | Yes | Yes |
| Results | Yes | Yes (league table) | Yes | Yes | No |
| Money | If payments on | If payments on | If payments on | If payments on | Yes |
| Sponsors & screens | If sponsors or TV on | Same | Same | Same | If sponsors on |
| Launch kit | Yes | Yes | Yes | Yes | Yes |
| Settings | Yes | Yes | Yes | Yes | Yes |

Sport rules: cricket shows cricket match rules (overs, players per side, impact player) and a simplified cricket scoring pad; racquet sports show rally or side-out scoring; football shows halves and goals. Settings never show options for other sports.

## 5. Prototype switcher (always on)

A small floating button (bottom-left, "Demo") opens a glass panel with:
- **Persona:** Organizer (Meera), New organizer (Rahul, starts at /start), Desk volunteer (limited menu), Umpire (pick a court; opens `/u/:courtToken` in a new tab), Player (microsite), TV (pick a court or "all"; opens in a new tab), Rizzfitt HQ. Tokens for each court are listed in the panel so the demo can open them directly.
- **Live sync:** the store syncs across tabs (BroadcastChannel plus the `storage` event) so an umpire tab, a TV tab and the workspace update together.
- **Jump to event:** Coimbatore Open (live), South Zone League, Founders Cup Auction, Sunday Social, Captain's Draft Night (setup in progress).
- **Event moment** for the hero event: Before launch (draft, checklist), Registrations open, Draw day, Match day (default), Finished.
- **3D quality:** Auto, High, Medium, Low, Off (fallbacks). **Reduced motion:** on/off.
- **Reset demo data.**
- Keyboard: press `\` to open.

Changing persona or moment updates the store so every screen reflects it (for example "Before launch" shows the go-live trophy on Home and an empty schedule).
