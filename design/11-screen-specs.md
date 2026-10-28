# 11 - Screen specifications

Format for each screen: **Purpose**, **Layout**, **Content and components**, **Interactions**, **3D and motion**, **States**, **Done when**. Copy in quotes is final copy; adjust only to fit. Scene IDs (S1...) are in `design/07`. Every screen follows `design/06` tokens and the hard rules in `CLAUDE.md`.

---

# A. Marketing and sign-in

## M-01 Organizer landing `/`
**Purpose:** convince an organizer to start setup now; explain the product in one scroll.
**Layout (desktop):** full-bleed hero with S1 behind a left-aligned headline; then bento sections; sticky glass top bar (logo, "How it works", "Pricing", "For clubs", "Sign in", primary "Start free").
**Content and components**
- Hero: overline "FOR TOURNAMENT ORGANIZERS". Display XL: "Run the game. We run everything else." Body L: "Set up registrations, draws, live scoring and court screens for your tournament in about 15 minutes. No calls, no spreadsheets." Buttons: primary "Start free", secondary "See a live event" (opens P-03 of the hero event in a new tab). Trust row: "Pickleball, badminton, cricket, football", "DUPR rated events", "Endorsed by [ASSOCIATIONS]".
- Scroll story (S1 camera moves with it), three beats, each a glass card that appears as the camera moves:
  1. "Answer a few questions." (wizard card mock)
  2. "Get your own event app." (S4-like device mock with the hero event)
  3. "Run match day from one screen." (court map mock)
- Bento grid "Everything a tournament needs": Registrations and UPI payments, Draws and brackets, Umpire scoring on any phone, Court TV screens, WhatsApp updates, DUPR sync, Sponsors, Results and payouts. Each tile has a 3D spot icon and one line; tiles tilt on hover.
- Event types strip: Tournament, League, Auction league, Draft league, Social mixer (S3 tokens as static images here).
- "Prefer we run it for you?" band with "Talk to us" (WhatsApp, email).
- Footer with company line.
**Interactions:** "Start free" to M-02. Smooth scroll; reduced motion removes scroll-linked camera (static hero image).
**3D and motion:** S1 with Bloom on high quality; hero text renders first, canvas fades in.
**States:** low quality shows static hero render.
**Done when:** loads to readable text instantly, scroll story works, mobile layout stacks with a shorter S1.

## M-02 Sign in / sign up `/start`
**Purpose:** frictionless start with a mobile number.
**Layout:** split screen: left a small S2-style floating paddle and ball over the court glow; right a glass card. Mobile: card only with a small 3D header.
**Content:** title "Let's set up your event". Mobile input with +91 prefix, "Send code". OTP 6 boxes, auto-advance, "Demo code: 123456" helper (prototype only), resend timer. Then "What should we call you?" (name). Invite variant: banner "Rizzfitt invited you to set up [Event name]" with prefilled organization.
**Interactions:** creates a draft and routes to SW-01. Returning organizer (Meera's mobile) goes to `/events`.
**States:** wrong code shake, expired code, network-style error toast (simulated).
**Done when:** whole flow is keyboard-usable and works at 390 px.

---

# B. Guided setup

## SW-00 Setup shell (wraps SW-01 to SW-08)
**Layout:** desktop: left content column (640 px) with the step; right preview pane (S4) on a glowing stage. Mobile: content full width; a floating "Preview" button opens the preview as a bottom sheet.
**Components:** top: logo, step rail (court-line stepper with rolling ball marker), "Save and exit". Bottom of the content: Back (ghost), Continue (primary, sticky on mobile). Small "Most organizers finish this step in about 2 minutes." Helper link "Have Rizzfitt set this up for me" (opens contact sheet).
**Behaviour:** every change autosaves with a subtle "Saved" chip; Continue is always enabled when defaults are valid; validation errors are inline and specific.
**Live preview (S4):** tabs "Your app" (workspace sidebar showing exactly the modules switched on, event name, accent dot), "Event page" (P-01 at phone size with categories and prices), "Court TV" (appears after SW-06). Updates with a soft highlight pulse on the changed part.

## SW-01 You
**Content:** "First, tell us about you." Organization name; city (typeahead, mock Indian cities); "What best describes you?" choice cards with spot icons: Club or academy, Association or federation, Company or college, Independent organizer; "How many events do you run a year?" segmented: 1-2, 3-10, 10+. Optional: Instagram handle.
**Done when:** values flow into the preview header and later into the microsite footer.

## SW-02 The event
**Content:**
- "Name your event" input, placeholder "Coimbatore Open 2026", live char count, slug suggestion shown below ("rizzfitt.com/e/coimbatore-open-2026").
- "Which sport?" S2 picker: Pickleball, Badminton, Cricket, Football, Multi-sport, Circuit. Real buttons laid over/under the canvas, with names and one line ("Doubles, singles, mixed. DUPR ready.").
- "What kind of event?" S3 picker: Tournament ("Categories, groups and knockouts over 1-3 days"), League ("Teams play a season of ties"), Auction league ("Owners bid for players, then play"), Draft league ("Captains pick squads round by round"), Social mixer ("Casual sessions, pay and play"). Combinations that make no sense are disabled with a reason (for example Football + Social mixer allowed, Circuit + Draft disabled "Circuits run as tournaments").
- Dates: range picker (single day allowed), start time.
- Venue: search with mock suggestions, map thumbnail (static styled image, no network), "Indoor / Outdoor" toggle.
- Courts: stepper 1-40 with a row of mini court icons that grows; label adapts by sport ("Courts", "Pitches", "Grounds").
- Logo: upload dropzone (mock image picker with 6 sample logos to choose from in the prototype).
**3D:** S2 and S3 in one canvas stacked, or two compact canvases only on desktop high quality; otherwise image fallbacks.
**Done when:** choosing a sport changes later steps (match rules, labels), choosing a type changes SW-03's branch and the preview modules immediately.

## SW-03 Format (branches)
**Tournament branch**
- "Which categories will you run?" chip groups from masters: Men's Doubles, Women's Doubles, Mixed Doubles, Men's Singles, Women's Singles, plus "Open category". Each chip opens a division picker: Open, Beginner, Intermediate - Below 4, Advanced, 35+, 40+, 50+. Result: a list of category rows.
- Each row (expandable card): label ("Men's Doubles, Open"), format segmented control with mini diagrams (Groups then knockout, Round robin, Knockout, King of the Court), group size (3-6) and "Top N advance" (1, 2, 4) when relevant, expected entries slider (used for the live sentence) and the live sentence: "About 28 teams make 7 groups of 4. Top 2 go to a 16-team knockout with 2 byes."
- "Copy settings to all categories" action. "Request a custom category" link (small form: name, description; status "Sent to Rizzfitt for review").
**League branch:** number of teams (stepper), players per team, match types per tie with counts (chips with steppers: Doubles x2, Mixed x1, Singles x1...), matches per player, eligibility (skill, age, gender multi-selects), ties on/off, auto knockout from the table on/off with "Top 4 play semi-finals", team formation (choice cards: You assign, Auto-balance by skill, Captains submit line-ups, Auction, Draft), team names and colours (auto-suggested names with a "shuffle" button, colour swatches).
**Auction branch:** league questions plus budget per team (₹ input with presets ₹50,000 / ₹1,00,000 / ₹2,00,000), squad size, tiers with base prices (table: Tier A, B, C), bid steps (chips), who bids (Owners on their phones / You on their behalf), auction date and time, owners per team (name + mobile).
**Draft branch:** league questions plus draft order (Snake / Straight with a mini diagram), pick timer (30, 60, 90 s), captains per team.
**Social branch:** capacity, price per person, format (Just social / Play rounds with rotating partners), what to collect (meal preference, T-shirt size, alias).
**Cricket add-on (any type with cricket):** overs per innings, players per side, impact player on/off with count.
**Done when:** every branch works from the Prototype switcher event types and writes the right modules.

## SW-04 Match rules
**Content:** "How are matches scored?" preset cards by sport:
- Pickleball: "Rally to 11, win by 2" (default), "Rally to 15, win by 2", "Side-out to 11, win by 2", "Custom".
- Badminton: "21 points, best of 3" default, "15 points, 1 game".
- Cricket: overs from SW-03; "Super over for ties" toggle.
- Football: "Two halves of [N] minutes", "Penalties for knockout ties".
- Then "Games per match": 1 / best of 3, with "Use best of 3 for finals only" checkbox. Golden point (None, 1, 2) with plain explanation. Fixed side alternate serve toggle with explanation. Apply to: "All categories" or per category table.
- Timeouts (Advanced, collapsed): per team per game (default 2), length (60 s), by stage (group, knockout, final).
- "How are group standings ranked?" presets: "Wins, then point difference, then head to head" (default), "Wins, then points scored", "Custom ranking" (opens a drawer with today's full criteria list: sort and show toggles, drag to order).
**Done when:** a sentence summary appears under each category: "Rally to 11, win by 2, best of 1. Finals best of 3."

## SW-05 Registration and money
**Content (sections with anchors):**
1. "Entry fees and spots": table of categories with price (₹), cap, "per team" or "per player", waitlist toggle per row. Summary card: "If every category fills: ₹1,68,800 in entries."
2. "How players pay": toggles: Online (UPI, cards, netbanking via Rizzfitt), At the desk (cash or UPI you collect). Fee note: "Online payments have a [PLATFORM FEE] per entry. You see the exact amount before each payout."
3. "What we ask players": default fields (name, mobile, email, gender, date of birth) plus chips: DUPR ID (on by default when DUPR rated), T-shirt size, District, Instagram, Emergency contact, Club name. Preview of the form on the right.
4. "Rules and consent": consent and declaration text (sensible default text, editable), guidelines PDF upload (mock), registration note.
5. "WhatsApp group": link input, "Show the link after payment" toggle.
6. "Certifications": DUPR rated (results sync to DUPR), IPA certified, PWR certified, each with a one-line explanation and "Ask Rizzfitt" link.
7. "Your event's web address": `rizzfitt.com/e/` + slug with availability check (mock).
8. "Where should we send your money?": payout account card: "Connect bank or UPI" (sheet: account holder, bank account + IFSC or UPI ID, PAN for KYC as a masked field; prototype only, never stores real data), status chip after submit: "Under review, usually within a day". Option "I'll do this later" (blocks go-live only).
**Done when:** prices flow to the microsite preview; payout status appears on the go-live checklist.

## SW-06 Match day
**Content:** choice toggles with explanations and small illustrations:
- "Umpires score on their phones" (on), umpires per court (1-2), "Invite umpires now" (name + mobile list, optional; can do later).
- "Court TV screens" (on/off). If on: what to show (Live score, Up next, Sponsors, Bracket, Player cards) and template (Arena, Glass, Minimal) with thumbnail previews.
- "Public live scores page" (on).
- "Check players in at the desk" (on).
**Done when:** preview gets a "Court TV" tab when TV is on.

## SW-07 Look and launch
**Content:** event accent (8 swatches incl. Rizzfitt orange; contrast-checked automatically), cover style (Court, Neon, Clay) shown as three live thumbnails of the microsite hero, sponsors (add name, tier, logo from sample set; or later), launch kit (checkbox cards: Event page, Posters, WhatsApp templates, Email templates).
**Done when:** accent instantly re-themes the preview phone and TV tabs.

## SW-08 Review
**Content:** title "Looks great, Meera. Here's your event." Summary cards per step with Edit links. "Your app will include" (module chips with icons, count). "Before you can take entries" (go-live checklist preview). Primary "Build my event app". Secondary "Save and finish later".

## SW-09 Building your app
**Content:** S5 full screen with a checklist beside it: "Creating Coimbatore Open 2026", "Adding 6 categories", "Setting match rules", "Building your event page", "Preparing 4 courts and umpire links", "Designing your posters", "Done". Skip button. Ends with confetti and routes to W-01 (Before launch state). Reduced motion: checklist ticks with fades only.

---

# C. Organizer workspace

## W-00 Workspace shell
Sidebar per `design/09` section 3 with lifecycle groups; collapsed mode with icons and tooltips; mobile bottom bar. Glass top bar with breadcrumb, Cmd+K command palette, "View event page", notifications (blockers, approvals, payouts), event status control (confirmed changes), user menu (Account, Switch event, Sign out). Event switcher shows logo, name, status chip, accent dot. Page header pattern: H1 title, one-line subtitle, primary action on the right.

## W-01 Home `/e/:id`
Three states driven by event status (Prototype switcher "Event moment"):

**Before launch**
- Hero card: "Coimbatore Open 2026 is almost ready" with S6 trophy filling to checklist progress.
- Go-live checklist (5 items with status, each links to the fix): Payout account verified, Every category has a price, Event page reviewed, Umpires invited (if on), Sponsors added (optional).
- Primary "Open registrations" (disabled until required items are done, with a reason tooltip). Launch kit preview tiles (event page, poster, WhatsApp message) with Share.

**Registrations open**
- "Needs your attention" feed (cards with one action each): "4 desk payments pending", "Women's Singles is 2 entries from full", "Men's Doubles Open is full. Open a waitlist?".
- Bento KPIs (tilt cards, count-up): Entries (with sparkline by day), Players, Collected (₹), Spots left; one consistent number each.
- Registrations by category (2D bars with caps as markers). Event page traffic (visits, conversion to entry; mock).
- Share card: link, QR, poster download.

**Match day (default demo state)**
- Top: status strip "Day 2 of 2 · Finals day · 186 of 190 matches done".
- Left: mini court map (S7 compact) with live courts; right: "Needs your attention" feed with the seeded blockers (2 awaiting confirmation, Court 3 running late 20 min, Court 4 umpire idle, 3 players not checked in for 5:15 pm). Each card has its action (Confirm result, Call next match, Message players).
- Up next (4 items), Live now (2 score bugs), quick links to TV and public page.
**Done when:** every blocker card action works and updates the counts everywhere.

## W-02 Registrations `/e/:id/registrations`
**Layout:** header with counts ("96 entries · 152 players · ₹[collected] collected", all computed by the shared selectors in `docs/05` section 3), primary "Add entry", secondary "Import", "Export", "Check-in mode". Filter row: search, category chips, status (Paid, Pending, Refunded, Waitlist), channel (Online, Desk), checked in.
**Table columns (default):** Team or player (avatars), Category, Status chip, Paid via, Checked in, Registered (date). "Columns" picker adds any collected field (DUPR ID, T-shirt, district...). DUPR problems show as a friendly chip "DUPR ID not found" with a fix action, never raw errors.
**Row click:** detail drawer: players with contact (masked until tapped), DUPR status, payment timeline, notes, actions: Mark paid, Send payment link, Check in, Move to another category, Edit partner, Refund (confirm with reason), Withdraw.
**Bulk actions:** select rows, bar slides up: Message, Mark checked in, Export, Move.
**Add entry (sheet):** category, players by mobile lookup (autofill returning players), payment (Paid cash / Paid UPI / Send link / Pending), success toast with Undo.
**Import (sheet, 3 steps):** download template (Singles, Doubles), upload (choose sample file), preview with row validation (duplicates, missing mobile highlighted), confirm.
**Check-in mode:** full-screen, big search, list of today's players, tap or swipe to check in, counter "128 of 152 checked in", celebrates at 100%.
**Waitlist:** promote to entry (sends payment link).
**Done when:** every action updates counts on Home and Money; mobile shows rows as cards.

## W-03 Players & teams `/e/:id/people`
Tabs: Players, Teams (tournament: pairs; league: squads), Owners (auction), Captains (draft). Players table with merge duplicates suggestion ("2 players may be the same person"), edit details, view entries. Teams: move team to another category, swap partner (confirm, notifies both). League squads: team cards with crests and members, link to Team builder.

## W-04 Schedule overview `/e/:id/schedule`
**Content:** one card per category showing a stage pipeline (Entries open, Ready to draw, Drawn, Matches created, Scheduled, Published) as a court-line progress bar with the ball at the current stage, counts (entries, groups, matches), and the single next action button ("Close entries", "Draw groups", "Create matches", "Assign courts", "Publish"). Global actions: "Courts and times" timeline, "Publish all ready". A banner explains dependencies only when relevant ("Assign courts after matches are created").

## W-05 Draw `/e/:id/schedule/:catId/draw`
**Content:** left: settings (format summary, group size, advance, seeding method: DUPR rating / Random / Manual), "Draw groups" primary; right: S9 animation then group columns (Group A, B, C...) with team cards (seed badge, DUPR rating). Drag between groups (dnd-kit) with live validation (group sizes). Actions: Draw again (confirm if edited), Lock groups.

## W-06 Matches and bracket `/e/:id/schedule/:catId/matches`
Tabs: Groups (match cards plus standings table: Pos, Team, P, W, L, PF, PA, +/-, qualified marker), Bracket (S8, byes shown, "TBD" slots), List (all matches with filters). "Create matches" if not created. Each match card: court, time, status, score, umpire; opens the match drawer (same as Match day).

## W-07 Courts and times `/e/:id/schedule/courts`
**Content:** timeline grid: rows = courts, columns = time (15 min ticks), match blocks coloured by category. "Auto-assign" (settings: match length default 20 min, rest between a player's matches 15 min, start and end times per day, breaks). Drag blocks to move; conflicts get a red outline and a reason tooltip ("Player has 5 min rest"); unassigned matches tray. Day switcher.

## W-08 Publish `/e/:id/schedule/publish`
**Content:** checklist of categories ready to publish, preview of the public schedule (phone frame), notify toggles (WhatsApp, email) with message preview, "Publish" (confirm). After publish: success state with share link.

## W-09 Match day `/e/:id/match-day`
**Layout:** desktop three areas: S7 court map (center), "Needs attention" feed (right), Up next queue (bottom strip). Mobile: tabs Courts, Attention, Up next.
**Court tile states:** Live (glow, score bug: teams, game score, current game points, server dot), Awaiting confirmation (amber), Late (amber pulse + minutes), Free (dim, "Call next"), Paused (grey).
**Court panel (drawer):** current match, umpire (name, call, reassign), scores, actions: Pause, Move to another court, End match, Correct score, Call next match.
**Match drawer:** teams and players, games editor (stepper per game), status, umpire, timeline (called, started, game ends, corrections), "Correct score" requires a reason and logs who changed what, "Confirm result" (advances bracket with a short animation), "Walkover" (confirm).
**Up next queue:** drag to reorder; each item shows players' check-in status and conflicts ("Playing on Court 2 now").
**Umpires tab:** list per court with status (active, idle, invited), resend link, QR code to open U-01.
**Done when:** calling a match, scoring in U-01, confirming, and bracket advance all flow through the store and appear on TV and microsite.

## W-10 Messages `/e/:id/messages`
**Content:** sent and scheduled list with channel icons and stats. "New message" composer: channel (WhatsApp, Email, Both), audience builder (Everyone, By category, Unpaid, Not checked in, Playing in the next hour, Custom list) with live recipient count and "5 players have no email" note, template picker (Registration confirmed, Schedule published, Match reminder, Results, Custom), variables (player name, category, match time, court), preview per channel (WhatsApp bubble, email card), send now or schedule. Confirmation toast with count.

## W-11 Results `/e/:id/results`
**Content:** category switcher; S11 podium for finished categories; standings and bracket; "Download certificates" (mock PDF); DUPR sync panel (per match status: Synced, Pending, Needs attention with "Retry" and plain reason); Reports grid (download cards): Winners, Registered players, Players missing DUPR ID, DUPR rating and reliability, Knockout matches, Divisions (Excel), Players export, Category report.

## W-12 Money `/e/:id/money`
**Content:** summary tiles: Collected, Refunded, Fees (single total, label "Rizzfitt and payment fees"), Your payout. Chart: collections by day; split online vs desk (donut). By category table. Payouts timeline (Scheduled 20 Oct, Paid 13 Oct...). Payments list with filters, refund action (confirm). Invoices (social and B2B, mock download). Payout account card with status. No fee rates anywhere.

## W-13 Sponsors & screens `/e/:id/screens`
**Content:** Sponsors list (drag to order, tier, active toggle, add). Court TV designer: pick court or "All courts", template (Arena, Glass, Minimal), toggles (score, up next, sponsors, bracket, player cards), colours from the event accent, live preview of T-01 scaled in a frame, "Open on a screen" (shows URL and QR, copy). Media playlist (images and short clips with duration and order).

## W-14 Launch kit `/e/:id/launch-kit`
**Content:** three tabs.
- **Event page:** cover style, accent, headline and about text, sections on/off (categories, schedule, live, sponsors, FAQ), preview phone and desktop, "Open page".
- **Posters (S14):** templates (Registrations open, Schedule out, Finals day, Champions), editable text fields, drag-to-rotate 3D scene, size presets (Instagram post, Story, WhatsApp status, A4), "Download PNG".
- **Message templates:** list of WhatsApp and email templates with edit and preview.

## W-15 Settings `/e/:id/settings`
**Sections:** Event details, Format and categories, Match rules, Registration and payments, Match day, Look, Team (co-organizers: invite by mobile, roles Owner, Manager, Desk, Court captain with court picker; remove with confirm), Advanced (ranking criteria editor with sort and show toggles and drag order, timeouts by stage, per-category rule overrides, registration form fields), Danger zone (close registrations, unpublish event, cancel event with type-to-confirm). Each section reuses the setup components (no new patterns).

## W-16 All my events `/events`
Cards for each event (logo, name, type and sport, dates, status, key number, accent glow on hover), filter (Upcoming, Live, Past, Drafts), "New event" (starts setup; shortcut "Duplicate a past event"). "Continue setup" on drafts (Captain's Draft Night).

## W-17 Account `/account`
Profile, organization, payout account (status, change with re-verification), team members across events, notification preferences, plan and fees info (placeholders), "Talk to Rizzfitt".

---

# D. League, auction, draft, social

## L-01 Team builder `/e/:id/team-builder`
Player pool (filter by skill, gender, DUPR) on the left; team columns (crest, name, colour, balance meter by average rating, gender mix) on the right. "Auto-balance" (animated redistribution), drag players, lock a player, captain badge. Validation per team (squad size, eligibility). Save squads (confirm if ties already published).

## L-02 Ties and line-ups `/e/:id/ties`
**Content:** league table (P, W, L, tie points, match points, net) with qualification line; rounds timeline; tie cards (Team A vs Team B, date, court, status, line-up status per team). Line-up approvals inbox ("2 line-ups waiting"): open a line-up, see slots (Doubles 1, Doubles 2, Mixed, Singles) with players, Approve or Ask for changes. Tie breaker panel (when a tie is level: plain explanation of the rule in use and "Start tie breaker"). Rearrange knockout (drag teams in the knockout bracket, confirm). Generate ties explainer ("8 teams play 7 rounds, 4 matches per tie, 28 ties in total") with "Generate ties".

## L-03 Auction room `/e/:id/auction`
**Layout:** center stage S10: player card on the block (photo placeholder avatar, name, skill, DUPR, tier, base price), current bid huge, leading team crest, timer ring (15 s per bid). Left: teams with coin stacks (remaining budget, squad slots filled). Right: bid feed and upcoming lots. Bottom (organizer): Start, Pause, Sold, Unsold, Undo last sale (confirm), Next player. Owner view (persona or toggle): big "Bid ₹X" buttons with steps, own budget and squad.
**Simulation:** other owners bid randomly within budgets while the timer runs; demo should be watchable hands-free for 60 seconds.

## L-04 Draft board `/e/:id/draft`
Grid of rounds x teams (snake order arrows), current pick highlighted with timer, available players list with filters, "Make pick" for captain or organizer, auto-pick on timeout (best available by rating). Card flip animation on each pick.

## S-01 Participants (social) `/e/:id/participants`
Header counts (Registered, Paid, Links sent, Men, Women). Table: name, alias, gender, meal preference, T-shirt, payment status, actions (Send payment link via WhatsApp, Mark paid, Payment history). Invoices tab (number, customer, amount, sent, view, download).

---

# E. Player microsite (mobile first, event-accent themed)

## P-01 Event home `/p/:slug`
S15 hero with event name, dates, venue, organizer; status pill ("Registrations open, closes 10 Oct" or "Live now"). Sections: Categories (price, spots left bar, Register), About, Schedule (when published), Live now (score bugs), Sponsors, Venue (static map image), FAQ, organizer contact (WhatsApp). Sticky bottom "Register" button.

## P-02 Register `/p/:slug/register`
Steps in a bottom-sheet style flow: 1 Category, 2 You (mobile first; returning player autofill "Welcome back, [name]"), 3 Partner (mobile lookup or invite by WhatsApp), 4 Details (fields chosen in SW-05), 5 Consent, 6 Pay (mock UPI sheet with app choices, "Pay ₹1,500"; or "Pay at the desk" if enabled), 7 Done (ticket-style confirmation with QR, "Add to calendar", "Join WhatsApp group"). Confetti burst.

## P-03 Live and my matches `/p/:slug/live`, `/p/:slug/me`
Tabs: Live (score bugs updating in real time from the store), Schedule (by court or category), Draw (groups and S8 bracket), Standings, Me (enter mobile to see "Your next match: 5:15 pm, Court 3, vs ..."). Pull to refresh feel.

---

# F. Umpire app (phone only)

## U-01 Umpire `/u/:courtToken`
**Join:** "Court 2 · Coimbatore Open 2026", umpire name confirm. **Match list:** Now (called match), Next. **Pre-match:** players, toss (who serves first, which side), Start.
**Scoring pad:** full-screen split in two tall halves (Team A, Team B) with huge points (Scoreboard size), tap a half for a rally point (rally scoring) or for side-out logic (pickleball side-out shows "Server 1/2" and only the serving team scores), server indicator, game count, Undo (top), Timeout (starts a countdown ring), Menu (switch sides, medical timeout, retire). Game point and match point banners. **End:** summary, "Confirm result" (or "Hand to players to confirm" showing both team names to tap). Then next match. High contrast; works one-handed; landscape supported.
**Done when:** points scored here update W-09, P-03 and T-01 live (same store, use BroadcastChannel so separate browser tabs stay in sync).

---

# G. Court TV

## T-01 Court TV `/tv/:eventId/:court`
1920x1080, S13. Layout (Arena template): top band with event logo, court name, category and round; center giant score (two team names with player names, game scores, current points as flip digits, server dot); right column "Up next on Court 2" (2 matches); bottom sponsor rail cycling logos; ambient court-line glow. Match point and game point banners animate in. Between matches: bracket or "Winners so far" carousel. `court=all` shows a 2x2 grid of live courts. Template switch (Arena, Glass, Minimal) and accent from W-13.

---

# H. Rizzfitt HQ console (violet "HQ" strip at the top of every page)

## H-01 Overview `/hq`
KPIs (organizers active, events live today, entries this week, platform collections, fees total), today's queue (approvals, flagged events), live events list with "Open", charts (entries by day, events by sport). Platform analytics summary (visits, top events).

## H-02 Approvals `/hq/approvals`
Inbox: organizer approvals, payout accounts, custom category requests. Detail panel: organizer profile, events, payout details (masked), risk notes field; actions Approve, Ask for changes (message), Reject (confirm). Approving updates the organizer's go-live checklist instantly (test via Prototype switcher).

## H-03 Organizers and events `/hq/organizers`, `/hq/events`
Tables with search and filters (status, city, sport). Organizer detail: profile, events, members, payments, notes. Actions: "View as organizer" (opens the workspace read-only with a banner "Viewing as Meera Iyer. Read only."), "Take over event" (confirm; banner "Rizzfitt is managing this event"; organizer sees a matching banner), "Send message".

## H-04 Platform `/hq/platform`
Tabs: Fees (platform fee, gateway fee, GST as `[PLATFORM FEE]` style placeholders, editable with an audit note), Masters (categories and divisions: add, reorder, archive; custom requests), Payments (all payments with filters: event, status, order ID, payment ID; Razorpay settlement upload), Access (users, roles incl. the new Organizer role, login methods per user, permission override grid for edge cases), Integrations (API keys with masked values, rate limits, scopes, revoke with confirm).

## H-05 What's new in this design `/hq/whats-new`
For stakeholders: list of new capabilities (from `docs/03`), the rollout phases with a phase tag per module, and "Assumptions to confirm" (from `docs/04`). Each item links to the screen that shows it.
