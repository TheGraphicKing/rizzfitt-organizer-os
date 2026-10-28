# 04 - Self-serve strategy

## The model in one paragraph

An organizer gets a link, signs in with their mobile number, and answers a guided setup of 7 short steps (10-15 minutes). Each answer writes the same configuration the Rizzfitt team writes by hand today. The organizer ends with an event in draft, a launch kit, and a go-live checklist. After Rizzfitt approves their payout account (once per organizer, not per event), they open registrations. From then on they run everything in a workspace organized by the event lifecycle: Home, Registrations, Players & teams, Schedule, Match day, Messages, Results, Money, plus Sponsors & screens, Launch kit and Settings. Only the modules their answers need appear. Rizzfitt keeps platform-level controls in an HQ console and can step in or take over any event in one click.

## Design principles

1. **Ask, don't configure.** Organizers answer questions in their language ("How do teams qualify for knockouts?"), never fill configuration tables.
2. **Every question has a smart default.** "Continue" always works. Rare settings live under "Advanced". A first-time organizer can finish setup by mostly tapping Continue.
3. **Show the result while they answer.** A live preview of their event app and public page updates with every answer.
4. **Order the work the way an event unfolds.** Before (setup, registrations), during (schedule, match day), after (results, money).
5. **Surface what needs attention.** Home is a feed of blockers and next actions, not a wall of equal-sized numbers.
6. **Guard the irreversible.** Confirm anything that changes live state, money, or a published draw.
7. **Only show what applies.** Sport and event type decide which modules and fields exist.
8. **Make it look like the best sports product in India.** Dark, bold, 3D moments that make organizers proud to share.
9. **Managed service is one tap away.** Every setup step and every empty state offers "Have Rizzfitt set this up for me".

## What can change and what cannot

The redesign must be buildable on today's platform. Use this to keep the prototype honest.

**Cannot change (design around it)**
- The core concepts: event types (tournament, league, auction, draft, social), sports, categories plus subcategories (divisions), groups, knockouts, ties, courts, umpires.
- Shared master data: categories and subcategories are global lists curated by Rizzfitt.
- Razorpay as the payment rail; DUPR as the rating integration; IPA and PWR as certifications.
- Platform fees, gateway fees and GST are set by Rizzfitt, not by organizers.
- The permission model exists underneath; the redesign generates permissions from setup answers instead of hand-ticking.

**Can change (and should)**
- Who does setup: the organizer, guided, instead of the team.
- Where things live: navigation by lifecycle, not by database table.
- How setup is ordered: dependencies handled by the wizard, never exposed as errors.
- Defaults: match rules per category, ranking presets, scheduling auto-assign.
- What organizers see: no internal notes, no fee rates, no irrelevant sport settings.
- How numbers are shown: one registration count everywhere, columns picker instead of 25 columns.
- Look and feel: from a light admin template to a dark, 3D-rich product.

## The guided setup (summary; full spec in design/11, SW-00 to SW-09)

| Step | Organizer answers | Writes today's records | Time |
|---|---|---|---|
| 0. Sign in | Mobile OTP, name, organization | User account, login methods | 1 min |
| 1. You | Organization name, city, role, how many events a year | Organizer profile | 1 min |
| 2. The event | Name, sport (3D picker), event type (3D picker), dates, venue, courts, logo | Event basic info, venue | 2 min |
| 3. Format | Branches by type: categories and formats (tournament); teams, match types, eligibility, team formation (league); budgets, owners, bid steps (auction); picks and rounds (draft); capacity (social); overs and squads (cricket) | Categories, fixture settings, league, team, fixture, auction, cricket config | 2-3 min |
| 4. Match rules | Scoring preset per category, points, games, golden point, serve rules, timeouts, ranking preset | Tournament config (game type), match defaults, timeouts, leaderboard mapping | 1-2 min |
| 5. Registration & money | Price and cap per category, online and desk payments, form fields, consent, guidelines, WhatsApp group, web address, certifications, payout account | Category amount and max, registration content, registration link, payments | 2-3 min |
| 6. Match day | Umpires per court, court TV on or off and what it shows, sponsors, public live page | Courts, umpires, live TV config, sponsors | 1 min |
| 7. Look & launch | Event accent colour, cover image style, launch kit picks | Branding, TV colours, templates | 1 min |
| Review | Every answer with Edit links, go-live checklist | - | 1 min |

Then the "Building your app" moment (a 3D assembly animation) and the event Home.

## Running the event (summary; full spec in design/11)

| Section | Organizer does | Replaces today |
|---|---|---|
| Home | Next actions, blockers, key numbers, go-live trophy | Dashboard |
| Registrations | Search, filter, check in, add walk-in, mark paid, import, export, refund, waitlist | Overview & Registration, Upload Players |
| Players & teams | Fix names and partners, move categories, league teams, auction owners | Teams, Tournament Players, League Players, Team Owner |
| Schedule | Per category: draw groups, create matches, assign courts and times, publish | Generate Fixture, Generate Groups, Manage Fixture, Ties |
| Match day | Court map, call next match, live scores, enter or correct a score, confirm results, umpires | Manage Fixture (Upcoming, Live), Match settings, Umpire Management |
| Messages | Email and WhatsApp to filtered players, templates, history | Email Broadcast |
| Results | Standings, winners podium, DUPR sync, reports and exports | Reports, Report, DUPR Requests |
| Money | Collected by category, online vs desk, refunds, payouts, invoices | Dashboard revenue, Invoices |
| Sponsors & screens | Sponsors, court TV designer, media playlist | Sponsors, Live TV Configuration, Live TV Media |
| Launch kit | Event page look, posters, message templates | New |
| Settings | All setup answers, co-organizers and roles, advanced rules | Create/edit event, Leaderboard config |

League events add **Team builder**, **Ties & line-ups**. Auction leagues add **Auction room**. Social events replace Registrations with **Participants**.

## What stays with Rizzfitt (HQ console)

| Stays with Rizzfitt | Why |
|---|---|
| Platform fee, gateway fee and GST rates | Commercial terms; organizers see only the total deducted |
| Category and subcategory masters | Shared across all events; organizer requests are reviewed |
| All players across the platform | Data across every client |
| All payments, Razorpay settlement uploads | Platform money |
| Platform-wide dashboard and analytics | Cross-client numbers |
| Users, roles, login methods, permission overrides | Access and security |
| API clients and integrations | Keys, rate limits, firewall |
| Organizer approval and payout approval | Trust and money safety |

## Guardrails

- **Approve before money moves.** New organizers can build and preview freely. Taking payments needs a one-time payout account approval by HQ.
- **Role, not ticks.** A new Organizer role whose modules follow from setup answers. The 64-screen grid stays as an HQ override.
- **Co-organizer roles:** Owner (everything), Manager (everything except money and settings), Desk (registrations and check-in only), Court captain (match day for assigned courts).
- **Confirm destructive actions:** close registrations, deactivate an event, regenerate a published draw, refund, unlock an auction team, remove a co-organizer.
- **One organizer, one tenant:** organizers only see their own events, data and payments.
- **HQ sees every self-serve event** in a queue (new, awaiting approval, live) with "View as organizer" and "Take over".

## Rollout phases (the prototype shows the end state of all phases)

| Phase | Scope | Gate to move on |
|---|---|---|
| 0. Make it safe | Hide internal notes and fee rates from organizers, confirm live switches, fix count mismatches | Safe to share with new organizers |
| 1. Tournaments | Setup wizard (tournament branch), Organizer role, Registrations, Schedule, Match day, Home | 3 organizers run an event without team help |
| 2. Leagues and auctions | League, auction and draft branches, team builder, ties and line-ups, auction room | 1 league run without team help |
| 3. Grow | Launch kit, WhatsApp, social events, organizer analytics, open sign-ups | Open sign-up from the website |

In the prototype, add a small phase tag to each module in the HQ "What's new in this design" page (H-05) so stakeholders see the build order. Organizers never see phase tags.

## Assumptions used by the prototype

These questions were open after the audit. The prototype makes the following assumptions. List them on the HQ page H-05 under "Assumptions to confirm".

1. **Umpire scoring:** umpires score in a mobile web app opened from a court link or QR code. No install. Results need a final confirmation.
2. **Payouts:** players pay through Rizzfitt's Razorpay. Rizzfitt pays out to the organizer's bank account or UPI after deducting fees, on a schedule shown in Money. The organizer connects a payout account once; HQ approves it.
3. **Pricing:** creating events is free; a per-entry platform fee applies to online payments. Fee amounts are shown as `[PLATFORM FEE]` placeholders.
4. **Public pages:** every event gets a microsite at `rizzfitt.com/e/[event-slug]` with registration, schedule, live scores and brackets.
5. **Draft leagues:** included as a setup branch with a draft board; Draft events do not open today, so this is the intended behaviour.
6. **Cricket scoring:** simplified in the prototype (runs, wickets, overs per innings). Full ball-by-ball scoring is out of scope.
7. **WhatsApp:** messages are sent through a Rizzfitt business number. The prototype simulates sending.
8. **Approvals:** HQ approves new organizers within one working day. The prototype shows "Usually within a day".
