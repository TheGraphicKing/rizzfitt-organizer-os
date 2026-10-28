# 05 - Domain model and mock data

The prototype runs on one in-memory dataset persisted to `localStorage`. This file defines the entities (based on the fields that exist today, see `docs/02`) and the seed data to generate. Build the seed as TypeScript modules in `src/mock/` with a deterministic random generator (fixed seed) so every reset produces the same demo.

## 1. Entities

Field lists are the minimum. Add what screens need, but keep names consistent.

```ts
type Sport = 'pickleball' | 'badminton' | 'cricket' | 'football' | 'multi' | 'circuit';
type EventType = 'tournament' | 'league' | 'auction' | 'draft' | 'social';
type EventStatus = 'draft' | 'awaiting_approval' | 'registrations_open' | 'registrations_closed'
                 | 'scheduled' | 'live' | 'completed';

Organizer      { id, name, orgName, city, mobile, email, avatarColor, approval: 'not_started'|'pending'|'approved'|'rejected',
                 payoutAccount?: { type: 'bank'|'upi', maskedNumber, holderName, status: 'pending'|'verified' } }
Member         { id, organizerId, name, mobile, role: 'owner'|'manager'|'desk'|'court_captain', courts?: number[] }
Event          { id, organizerId, name, slug, sport, type, status, startDate, endDate, venue: Venue, courts: number,
                 logo?, accent: string, coverStyle: 'court'|'neon'|'clay', certifications: { dupr, ipa, pwr },
                 modules: ModuleKey[], settings: EventSettings, createdVia: 'self_serve'|'rizzfitt_team' }
Venue          { name, address, city, mapUrl }
EventSettings  { payments: { online: boolean, desk: boolean }, registrationFields: FieldKey[], consentText, guidelinesPdf?,
                 whatsappGroupUrl?, showRegisteredCount, waitlist, checkIn, umpiresPerCourt, tv: TvSettings,
                 publicLivePage, ranking: RankingPreset, timeouts: TimeoutRule[] }
CategoryMaster { id, name, position }                 // global, HQ-managed: Men's Doubles, Women's Singles...
DivisionMaster { id, name, position }                 // global subcategories: Open, Beginner, Intermediate - Below 4, 35+...
EventCategory  { id, eventId, categoryId, divisionId, label, format: 'groups_knockout'|'round_robin'|'knockout'|'king_of_court',
                 teamSize: 1|2, price, cap, groupSize?, advancePerGroup?, matchRules: MatchRules,
                 stage: 'registrations'|'ready_to_draw'|'drawn'|'matches_created'|'scheduled'|'published'|'in_play'|'done' }
MatchRules     { scoring: 'rally'|'side_out', pointsToWin: 11|15|21, winBy: 1|2, games: 1|3, goldenPoint: 0|1|2,
                 fixedSideAlternateServe: boolean, timeoutsPerTeam, timeoutSeconds }
Player         { id, firstName, lastName, gender: 'M'|'F', dob, mobile, email, city, district, duprId?, duprRating?,
                 skill: 'beginner'|'intermediate'|'advanced'|'open', tshirt: 'S'|'M'|'L'|'XL'|'XXL', instagram? }
Registration   { id, eventId, categoryId, playerIds: string[], teamName?, status: 'paid'|'pending'|'refunded'|'waitlist',
                 channel: 'online'|'desk', amount, paidVia?: 'upi'|'card'|'netbanking'|'cash', createdAt, checkedIn: boolean, seed? }
Group          { id, categoryId, name: 'A'|'B'|..., registrationIds: string[] }
Match          { id, eventId, categoryId, stage: 'group'|'r32'|'r16'|'qf'|'sf'|'third'|'final', groupId?, round, sideA, sideB,
                 court?, scheduledAt?, status: 'scheduled'|'called'|'live'|'awaiting_confirmation'|'done'|'walkover',
                 games: { a: number, b: number }[], server?: 'A'|'B', umpireId?, confirmedBy?, corrections: Correction[] }
Correction     { at, by, from, to, reason }
Umpire         { id, eventId, name, mobile, court, status: 'invited'|'active'|'idle' }
Sponsor        { id, eventId, name, tier: 'title'|'gold'|'partner', logoText, order, active }
MediaItem      { id, eventId, kind: 'image'|'video', title, seconds, order, active }
TvSettings     { enabled, template: 'arena'|'glass'|'minimal', showSponsors, showUpNext, showBracket, showPlayerCards }
Message        { id, eventId, channel: 'whatsapp'|'email', audience: AudienceFilter, templateId?, body, sentAt?, scheduledFor?,
                 stats: { sent, delivered, read? } }
Payment        { id, eventId, registrationId, amount, fee, method, status: 'captured'|'refunded'|'failed', at, orderRef }
Payout         { id, organizerId, eventId, amount, fees, status: 'scheduled'|'paid', date }
// League
LeagueConfig   { teams, playersPerTeam, matchesPerPlayer, matchTypes: ('doubles'|'mixed'|'singles'|'super_singles'|'team_event')[],
                 eligibility: { skill?: string[], age?: string[], gender?: string[] }, ties: boolean, autoKnockout: boolean,
                 teamFormation: 'organizer_assigns'|'auto_balance'|'captains_submit'|'auction'|'draft' }
LeagueTeam     { id, eventId, name, short, color, ownerId?, captainId?, playerIds, budget?, spent? }
Tie            { id, eventId, round, teamA, teamB, matchIds, status, lineupStatus: { a: 'pending'|'submitted'|'approved', b: ... } }
// Auction
AuctionConfig  { budgetPerTeam, squadSize, bidSteps: number[], biddingBy: 'organizer'|'owners', basePriceByTier }
Bid            { id, playerId, teamId, amount, at }
AuctionLot     { playerId, tier: 'A'|'B'|'C', basePrice, status: 'upcoming'|'on_block'|'sold'|'unsold', soldTo?, soldFor? }
// Social
Participant    { id, eventId, name, alias, gender, mobile, mealPreference, tshirt, paymentStatus, paymentLinkSentAt? }
// HQ
Approval       { id, organizerId, kind: 'organizer'|'payout'|'custom_category', submittedAt, status, notes }
PlatformFee    { id, label, amount: '[PLATFORM FEE]', appliesTo }
```

**Module keys** (drive navigation): `home, registrations, participants, people, team_builder, schedule, ties, auction, draft_board, matchday, messages, results, money, sponsors_screens, launch_kit, settings`.

**Module rules** (compute from event type and settings, see `design/09` section 4 for the matrix).

## 2. Seed data

All names below are invented. Generate players from invented first and last name lists of mixed Indian origins (Tamil, Telugu, Kannada, Malayalam, Hindi, Marathi, Bengali, Punjabi, Gujarati), roughly 70% men and 30% women to mirror real pickleball entries. Phones `+91 90000 1xxxx`, emails `firstname.lastname@example.com`.

### The demo organizer (logged-in user)
- **Meera Iyer**, owner of **Baseline Pickleball Club**, Coimbatore. Mobile +91 90000 10001. Approved organizer, payout account verified (UPI, masked).
- Co-organizers: Karthik Rao (Manager), Ananya Pillai (Desk), Farhan Qureshi (Court captain, courts 3 and 4).

### Event A: "Coimbatore Open 2026" (the hero event)
- Pickleball tournament, 2 days, 4 courts, venue "Baseline Pickleball Club, Saravanampatti, Coimbatore".
- DUPR rated: yes. Status: **live** (day 2, finals day, around 4:20 pm IST). Accent: Rizzfitt orange.
- Categories (price, cap, teams, format, stage):
  - Men's Doubles, Open: ₹1,500 per team, cap 32, 28 teams, groups then knockout (group size 4, top 2 advance), stage: in play (semi-finals done, final live on Court 1).
  - Women's Doubles, Open: ₹1,500, cap 16, 12 teams, groups then knockout, stage: in play (semi-finals live).
  - Mixed Doubles, Open: ₹1,500, cap 24, 18 teams, groups then knockout, stage: in play (semi-finals).
  - Men's Doubles, Intermediate - Below 4: ₹1,200, cap 32, 22 teams, groups then knockout, stage: done (winners set).
  - Men's Singles, Beginner: ₹800, cap 16, 10 players, round robin, stage: done.
  - Women's Singles, Open: ₹800, cap 12, 6 players, round robin, stage: done.
- Total: 96 active entries (84 paid online, 8 paid at the desk by cash or UPI, 4 pending at the desk), 152 unique players. Plus 2 refunded registrations that are not counted as entries.
- Revenue collected: compute from paid entries. Gross value of all 96 entries is ₹1,26,200 (sum of price x teams above); with 4 pending, collected lands around ₹1,20,000. Fees shown as one total line using `[PLATFORM FEE]` until rates are confirmed.
- Matches: about 190 total; about 186 done, 1 live on Court 1 (Men's Doubles Open final), 1 live on Court 2 (Women's Doubles Open semi-final 2), Court 3 running 20 minutes late (Mixed semi-final), Court 4 free with "3rd place, Men's Doubles Open" ready to call.
- **Blockers seeded for the demo:** 2 matches finished but awaiting score confirmation; 1 umpire idle on Court 4; 3 players not checked in for the 5:15 pm Mixed final; 4 desk payments pending.
- Umpires: 6 (two on Courts 1 and 2), invented names.
- Sponsors: "Smashline Paddles" (title), "Kovai Fresh Juices" (gold), "Ace Physio" (partner). Use text logos rendered in-app, no real brands.
- Messages history: registration confirmation (email + WhatsApp), schedule published (WhatsApp), day-2 reminder (WhatsApp).

### Event B: "South Zone Pickleball League, Season 1"
- League, pickleball, 8 teams, 6 players per team, match types doubles + mixed + singles, ties on, auto knockout on, team formation: auto-balance by skill, status: scheduled (round 3 of 7 next weekend).
- Team names (invented): Marina Smashers, Nilgiri Ninjas, Cauvery Kings, Deccan Dinks, Malabar Mavericks, Palk Bay Pirates, Western Ghats Warriors, Coromandel Comets. Each with a colour from the categorical palette.
- Ties: rounds 1-2 complete, round 3 line-ups: 5 approved, 2 submitted awaiting approval, 1 pending.

### Event C: "Founders Cup Auction League"
- Auction league, pickleball, 6 teams, budget ₹1,00,000 per team, squad 6, bid steps ₹500 / ₹1,000 / ₹5,000, bidding by owners, status: **auction live**.
- 48 players in the pool (tiers A 12, B 18, C 18, base price ₹5,000 / ₹2,500 / ₹1,000). 17 sold, 1 on the block, rest upcoming.
- Owners (invented), team colours from palette.

### Event D: "Sunday Social Mixer"
- Social, pickleball, capacity 32, ₹499 per person, 26 registered, 21 paid, 5 payment links sent, meal preferences and T-shirt sizes collected.

### Event E: "Captain's Draft Night" (in setup)
- Draft league in **draft** status at setup step 3, so the wizard can be resumed in the demo ("Continue setup").

### A brand-new organizer (for the onboarding demo)
- Name prefilled when the demo starts the sign-up flow: "Rahul Menon", "Smash Factory Chennai". Approval: not started.

### HQ data
- Organizers list: 24 organizers (mix of approved, pending, rejected), including Meera Iyer and the new organizer once they finish setup.
- Approvals queue: 3 organizer approvals, 2 payout approvals, 1 custom category request ("Parent & Kid Doubles").
- Platform payments: 300 recent payments generated from the events above.
- Master lists: categories (Men's Doubles, Women's Doubles, Mixed Doubles, Men's Singles, Women's Singles, Singles, Doubles, Open) and divisions (Open, Beginner, Intermediate - Below 4, Advanced, 35+, 40+, 50+, Women, Parent & Kid).

## 3. Derived numbers must agree

Write selectors so the same number is computed once and used everywhere. For example "entries" (registrations not refunded), "players" (unique player IDs across non-refunded registrations), "collected" (captured payments minus refunds). The current product shows different counts on different screens; the prototype must never do that.
