# 02 - Current state audit

This is what exists today, observed screen by screen in October 2026 on the super admin app (UAT, `uatadmin.rizzfitt.com`) and the organizer app (production, `manage.rizzfitt.com`). Nothing was changed during the audit. Use it to make sure the redesign keeps every capability, and to understand which problems the redesign must fix.

People's names seen during the audit are deliberately left out. Use invented names only.

---

## 1. How it works today

1. **Account:** a super admin creates a user in User Management. Roles available: Super Admin (SA), Admin (ADM), User (USR), Trainer (TR). There is no Organizer role.
2. **Login methods:** Login Configuration turns email, mobile and username sign-in on or off per user.
3. **Access:** User Permissions grants each of 64 screens with View, Create, Edit, Delete, Approve and Export checkboxes, per user.
4. **The event:** a 4-step Create Tournament form creates the event.
5. **Configuration:** the team fills configuration screens in an unwritten order.
6. **Handover:** the organizer logs in to the organizer app and sees whatever was ticked. In the account audited, the organizer's top-level menu has one item: My Tournaments.

## 2. Visual style today

- Font: **Gilroy** (Regular, Medium, SemiBold, Bold), fallback Arial.
- Primary colour: `--rizz-primary: hsl(22 90% 53%)` = **#F36A1B** orange.
- Page background `hsl(270 18% 96%)` = #F4F2F6 (light lavender grey). Cards white. Text near-black #0A0A0A.
- Sidebar: solid black with white text; active item has an orange left bar.
- Radius 8 px. Component base is shadcn/ui.
- Other tokens: link blue `hsl(214 84% 56%)`, `--rizz-primary-light: hsl(22 44% 23%)`, stepper active orange, stepper completed orange at 38% opacity.
- Logo: an orange angular "K"-like mark plus the wordmark "Rizzfitt".
- The public site (`tournament.rizzfitt.com`) is black with the orange logo.
- Browser tab title on both admin apps: "Rizzfit Admin" (one t).

## 3. Event types decide the menu

When an event is opened, the server returns a screen set for that event type. Screens seen in the super admin sidebar per type:

**Tournament (any sport), 21 screens**
Configuration (Tournament Configuration, Live TV Configuration, Cricket Configuration), Court & Umpire (Court Assignment, Umpire Management), Media Upload (Sponsors, Live TV Media), Fixtures (Generate Fixture, Manage Fixture), Superadmin Dashboard, Report, Razorpay Upload, Dashboard, Overview & Registration, Teams, Tournament Players, Upload Players, Categories, DUPR Requests, Reports, reports (duplicate).

**League, 29 screens**
Configuration (Tournament, Match, League, Team, Live TV, Fixture, Timeout Configuration), Media Upload (Sponsors, Live TV Media), Ties Management (Tie Generation, Tie Fixture Mapping, Manage Tie Fixtures, Rearrange Knockout, Tie Breaker), Umpire Management (Court & Umpire, Court Assignment), Superadmin Dashboard, Report, Razorpay Upload, Dashboard, Overview & Registration, League Players, Categories, DUPR Requests, Reports, Team Generation, Generate Groups, Manage Fixture, Team Submission Approval.

**Auction league, 15 screens**
Configuration (Tournament, League, Auction, Team Configuration), Superadmin Dashboard, Report, Razorpay Upload, Dashboard, Overview & Registration, League Players, League Teams, Auction, Team Owner, Auction Team, Bidding Amount.

**Event (social mixer), 6 screens**
Superadmin Dashboard, Report, Razorpay Upload, Participants, Invoice, Dashboard.

**Draft:** draft events appear in the list but do not open when clicked in UAT.

Sport does not change the menu: a pickleball tournament shows Cricket Configuration, and a cricket dashboard counts Singles, Doubles and Mixed.

**Organizer account audited (pickleball tournament), what they see:** Configuration (Tournament Configuration, Live TV Configuration, Cricket Configuration, Leaderboard Config Mapping), Court & Umpire (Court Assignment, Umpire Management), Media Upload (Sponsors, Live TV Media), Fixtures (Generate Fixture, Manage Fixture), Dashboard, Overview & Registration, Upload Players, Email Broadcast.

## 4. Screens and fields, in detail

### 4.1 Create / edit event (4 steps)
1. **Basic info:** Tournament name, Tournament type (Tournament, League, Event, Auction, Draft), Sport (cricket, pickleball, badminton, football, multi sports, circuit), Number of courts, Start date, End date, Contact email, Contact mobile, Club ID.
2. **Venue & options:** Tournament logo/image, Venue/place name, Location address (Google Places search, "Open in Google Maps"), toggles: Enable registration, DUPR rated tournament, IPA certified, PWR certified.
3. **Categories & pricing:** repeating rows of Category + Sub category (for example Singles + Beginner, Doubles + Intermediate - Below 4, Men's Doubles + Open).
4. **Registration & WhatsApp:** Registration content, Guideline content, Consent & declaration, Banner image, Guideline PDF upload, toggle "Show registered participants count", WhatsApp group content, WhatsApp group links.

The edit view shows these 4 parts as collapsible sections with "Tap to expand" and "Edit".

### 4.2 Categories (per event, super admin only)
Add mapping: Category, Sub category, **Amount** (entry fee), **Max participants**. Organizers cannot see or set price or cap.

### 4.3 Masters (global, super admin)
- **Category Master:** Category name, Position. (Was failing to load during the audit: "column mc.position does not exist".)
- **Subcategory Master:** Subcategory name, Position. Examples in use: Beginner, Women, Beginners Championship, Parent & Kid, Open, 35+, 40+, The Champions Trophy, The Midtown Championship, Mixed, Intermediate - Below 4.
- Categories in use include: Men's Doubles, Women's Singles, Women's Doubles, Mixed Doubles, Singles, Doubles, Men, Women, Open; cricket events used sub categories like RCME and NON RCME.

### 4.4 Tournament Configuration
Columns: Game type (Rally or Service), Service per team, Platform amount, Gateway amount, GST. **Organizers can see platform fee, gateway fee and GST here today.**

### 4.5 Match settings (per match, in Manage Fixture > Upcoming)
Court (select), Game type (Rally / Service), Points, Max sets, Golden point (0, 1, 2), Fixed side alternate serve (checkbox). Set one match at a time.

### 4.6 Match Configuration
Create form has no fields; it says it sends only the tournament ID from local storage.

### 4.7 Timeout Configuration
Match stage (for example PRELIMS), Timeouts per match, Timeouts per team, Timeout duration (seconds), Status.

### 4.8 Leaderboard Config Mapping
Pick ranking criteria, toggle **Sort** (ranking order) and **Show** (table columns), drag to order. Criteria: Tie Wins, Tie Losses, Ties Played, Tie Win %, Match Wins, Match Losses, Matches Played, Match Win %, Points, Net Points, Points For, Points Against, Final Points, Bonus, Penalty, Head to Head, Points Difference, Tie wins by match points. If nothing is configured, "legacy ranking" is used. On some events the empty state says a "leaderboard master seed script" must be run first.

### 4.9 Cricket Configuration
Number of teams, Players per team, Impact player enabled, Number of impact players.

### 4.10 League Configuration (create page)
Total teams, Players per team, Matches per player, Total matches, toggle Enable ties, toggle Auto knockout (create knockout from standings), Slot swap mode (for example "Leading score: higher team score reaches window"), Match types (Doubles, Mixed, Singles, Super Singles, Team Event), Skill level (multi-select), Age (multi-select), Gender (multi-select).

### 4.11 Team Configuration
Attribute name (select), Value, Max players, Min value, Max value.

### 4.12 Fixture Configuration
Line-ups, skill levels and scoring per match slot. Requires League Configuration first ("League configuration required").

### 4.13 Live TV Configuration (per court)
Template (for example Default, Liquid Glass), Court, Font colour, Background colour, toggles: Show logo, Show background images, Show team logo, Show matches, Show sponsors, Show player profile, Show players. Shows "Tournament has N courts. X configured, Y remaining."

### 4.14 Sponsors and Live TV Media
- Sponsors: Display order, Sponsor logo upload, Active.
- Live TV Media: Media type (Image), Upload, Duration (seconds), Display order, Active.

### 4.15 Court Assignment and Umpire Management
Per court: add one or more umpires (Name, Phone 10 digits). List: Umpire name, Phone, Court, Status, Created on.

### 4.16 Generate Fixture (tournaments)
Category tabs and subcategory chips, Fixture format radio (Group Stage, Round Robin, Knockout, King of Court), Group size (select 1..N or Custom), Custom group size, Advance per group, with a hint like "12 BYEs to 32-team knockout (top seeds get BYEs)". Buttons: Generate Groups, Reset. Then (after scrolling): Add Player to Group, **Save Group, Generate fixture, Publish**. Tabs Group A..D and Knockout ("Auto-generated knockout pattern"). This page uses a different header with a placeholder user "Laura Grace, Event Manager".

### 4.17 Manage Fixture
Tabs: Fixtures, Upcoming, Live. Category and subcategory chips, group tabs, Knockout Bracket view (quarterfinal, semifinal, final with winner highlighted). Group view: match cards (court, sets, points to win, score, status) beside a standings table (Pos, Players, P, W, L, PF, PA, +/-). Upcoming: court tabs with counts (Court N/A, Court 1..4), category and subcategory filters, a gear "Match settings" per match. Live: per court list of matches in progress. Leagues add Teams, Fixtures and Player Leaderboard tabs.

### 4.18 League tools
- **Tie Generation:** explains the formula (total ties = teams minus 1, matches per tie = teams divided by 2, total matches = teams x (teams minus 1) / 2), Generate Ties.
- **Tie Fixture Mapping:** assign fixtures to ties (Group, Tie name, Team A, Team B).
- **Manage Tie Fixtures:** All / Unpublished / Published, Publish all; columns Tie ID, Tie name, Group, Team A, Team B, Knockout position, Rounds, Status.
- **Rearrange Knockout:** drag matches or teams, save each tie.
- **Tie Breaker:** select group, tie and tie fixture, "Hit tie breaker".
- **Generate Groups (league):** Group size, Advance per group (2 or 4).
- **Team Generation:** number of teams, players pool, assign players to teams, team names.
- **Team Submission Approval:** approve line-ups submitted per group.
- **League Players:** create player (first, middle, last name, mobile, email, gender, date of birth, age, DUPR ID, skill level, player image), Download template, Upload players, **Download PPT**.

### 4.19 Auction tools
- **Auction:** Total budget, Max players per team, Start date, End date, Active; list shows status (for example Live).
- **Auction Configuration:** Bidding by (for example Organizer).
- **Auction Team:** Team, Total budget, Colour; list shows Remaining budget, Players, Current bid, Status, and an **Unlock** action.
- **Team Owner:** Name, Email, Mobile, Team.
- **Bidding Amount:** bid increments (for example 500, 5,000).
- **League Teams:** team name, image.

### 4.20 Registrations and people
- **Dashboard (organizer):** greeting, Email Players button, KPI tiles: Total teams, Online registration teams, Offline registration teams, Total unique players, Singles / Doubles / Mixed / Men / Women each split online vs offline, Total revenue, Total matches, Completed matches, Pending matches. Registrations matrix (category x subcategory counts), per category panel: total revenue, Add Team, total / online / offline registrations, recent registrations list with DUPR IDs.
- **Overview & Registration:** Overview tab (total registrations, total revenue, charts by age group and event type split by gender). Registrations tab: Export Excel, search, and a table of 25+ columns: name, middle name, last name, mobile, email, DUPR rating, DUPR ID, Instagram ID, age, gender, district, jersey, category, sub category, registration date, check-in status, country code, date of birth, DUPR rating error, DUPR last attempt, DUPR status, T-shirt size, details.
- **Upload Players:** category and subcategory, Singles template / Doubles template, upload, preview, instructions.
- **Teams:** filter by category and subcategory, team name, category, subcategory, actions.
- **Tournament Players:** name, mobile, email, gender, age, date of birth, jersey size.
- **Email Broadcast:** current tournament card, select division (category, subcategory), recipients list with checkboxes ("89 / 89 emailable, 5 missing email"), compose and send.
- **DUPR Requests:** review DUPR match sync requests per category.
- **Social events:** Event dashboard (registered players, participants, payment links sent, payments completed, men, women), Participants (name, alias, age, gender, email, mobile, Instagram, jersey size, meal preference, registered date, Send payment, Payment history), Invoices (invoice number, customer, mail sent, failed on, amount, mail invoice, view, download).

### 4.21 Money and reports
- **Superadmin Dashboard:** total registrations, unique players, singles, doubles, mixed, total revenue, revenue plus platform fees, total platform fees, daily breakdown (card or table view).
- **Razorpay Upload:** upload a Razorpay settlement file.
- **Razorpay Management (global):** filter by tournament, status, order ID, payment ID; table of ID, tournament, order ID, payment ID, customer, amount, method, status, created.
- **Report:** player reports by categories and subcategories.
- **Reports & Export Center:** Tournament Winners, Registered Players, DUPR Missing Players, DUPR Rating and Reliability, Knockout Matches, Tournament Divisions Excel, Sports Players Export, Category Based Player Report.
- **Tournament Report (global):** export by tournament and payment status.

### 4.22 Platform (global, super admin)
- **All tournaments / My tournaments:** Upcoming, Ongoing, Completed tabs; each card shows logo, name, type and sport, dates, venue, team count, a Registration open/closed switch and an Active switch, and an edit button.
- **Rizzfitt Players:** every player on the platform.
- **User Analytics:** visitors, sessions, page views, top tournaments, top pages, devices, browsers, operating systems, traffic over time.
- **Manage Registration Links:** ID, name, slug, route, alias per event (the public web address).
- **User Management:** add user (email, password, username, mobile, full name, short name, age, provider, gender, role, blocked, verified, active).
- **Login Configuration:** per user: email login, mobile login, username login.
- **User Permissions:** search user, grant screens with View / Create / Edit / Delete / Approve / Export.
- **API Clients / API & Integrations / External Endpoints:** API keys for court displays and scoreboards, rate limits, scopes, firewall rules.

## 5. Problems the redesign must fix

**Setup has hidden dependencies**
- League setup must go League config, then Team config, then Fixture config, then Generate Groups, Team Generation and Ties. No screen shows this order; pages only refuse when a step is missing.
- Generating fixtures is five steps on one screen (Generate Groups, edit groups, Save Group, Generate fixture, Publish), with the last three hidden below the fold.
- Match rules are set one match at a time. There is no default per category.
- Entry price and maximum participants exist only in super admin, so an organizer cannot open their own registrations.

**Organizers see things they should not**
- Every organizer sees an internal note about another client's tournament on Overview & Registration.
- Tournament Configuration shows Rizzfitt's platform fee, gateway fee and GST.
- Cricket Configuration appears on pickleball events.
- Generate Fixture shows a placeholder user in a different header design.

**Data and labels do not agree**
- One event showed 60 registrations on Overview but 96 teams and 80 players on Dashboard.
- The registrations table shows 25+ columns and raw errors such as "Request failed with status code 404".
- Cricket dashboards count Singles and Doubles; cricket player lists say "Pickleball Team not found".
- "Reports" and "reports" appear as two menu items.
- Generic greeting "Good Afternoon, Organizer!" with an empty avatar.

**Risky one-click actions**
- Registration and Active switches on every tournament card change live state without confirmation.
- Auction teams have an Unlock action in the list row.

**Dead ends**
- Draft events do not open.
- Match Configuration's form has no fields.
- DUPR Requests returned "Internal server error" on one event.

**Scoring is invisible to organizers**
- Umpires score somewhere outside both admin apps. Organizers have no visible way to enter or correct a score.
