# 03 - Feature map: every feature and where it lives in the redesign

Every capability that exists today must have a home in the redesign. This table is the checklist. Screen IDs refer to `design/11-screen-specs.md`.

**Columns**
- **Today:** who can reach it now. SA = super admin only. Org = organizer app.
- **Self-serve home:** where it lives in the redesign. "Setup" = guided setup wizard. "Workspace" = organizer workspace. "HQ" = Rizzfitt HQ console.
- **Change type:** *Keep* (same capability, new UI), *Reshape* (capability exists but is moved, merged or simplified), *New* (capability the platform does not have today; flag it in the prototype with a small "New" badge in HQ only, not to organizers).

| # | Area | Feature today | Today | Self-serve home | Screen | Change type |
|---|---|---|---|---|---|---|
| 1 | Setup | Create / edit event (basic info, venue, options, registration content) | SA + Org (edit) | Setup steps 2, 5 | SW-02, SW-05 | Reshape |
| 2 | Setup | Categories & pricing (category, subcategory, amount, max participants) | SA (price, cap), Org (categories only) | Setup step 3 and 5; Settings | SW-03, SW-05, W-15 | Reshape |
| 3 | Setup | Category and Subcategory Master | SA | HQ masters; organizers can request a custom one | H-04 | Keep + request flow (New) |
| 4 | Setup | Tournament Configuration: game type, serves | SA + Org | Setup step 4 match rules | SW-04 | Reshape |
| 5 | Setup | Tournament Configuration: platform fee, gateway fee, GST | SA + Org (visible) | HQ only; organizer sees a single "fees" total in Money | H-04, W-12 | Reshape (hide from organizers) |
| 6 | Setup | Match settings per match (court, rally/service, points, sets, golden point, fixed side serve) | Org | Defaults per category in setup; override one match in Match day | SW-04, W-09 | Reshape |
| 7 | Setup | Match Configuration (no fields) | SA | Removed; covered by match rules defaults | - | Reshape (remove) |
| 8 | Setup | Timeout Configuration | SA | Setup step 4, Advanced | SW-04 | Keep |
| 9 | Setup | Leaderboard Config Mapping (ranking and columns) | SA + Org | Setup step 4 preset; full editor in Settings > Advanced | SW-04, W-15 | Reshape |
| 10 | Setup | Cricket Configuration | SA + Org (even pickleball) | Setup step 3, cricket only | SW-03 | Reshape (show only for cricket) |
| 11 | Setup | League Configuration | SA | Setup step 3, league branch | SW-03 | Reshape |
| 12 | Setup | Team Configuration (team make-up rules) | SA | Setup step 3, league branch, Advanced | SW-03 | Reshape |
| 13 | Setup | Fixture Configuration (line-up slots) | SA | Generated from league answers; editable in Schedule | SW-03, L-02 | Reshape |
| 14 | Setup | Live TV Configuration per court | SA + Org | Setup step 6 (on/off, what shows); Sponsors & screens | SW-06, W-13 | Reshape |
| 15 | Setup | Manage Registration Links (slug) | SA | Setup step 5 "Your event's web address" | SW-05 | Reshape |
| 16 | People | Overview & Registration | SA + Org | Registrations | W-02 | Reshape |
| 17 | People | Teams | SA | Players & teams | W-03 | Keep |
| 18 | People | Tournament Players | SA | Players & teams | W-03 | Keep |
| 19 | People | Upload Players (Excel templates) | SA + Org | Registrations > Import | W-02 | Keep |
| 20 | People | League Players (create, import, export PPT) | SA | Players & teams (league) | W-03 | Keep |
| 21 | People | Team Generation | SA | Team builder | L-01 | Reshape |
| 22 | People | Team Submission Approval (line-ups) | SA | Ties & line-ups | L-02 | Keep |
| 23 | People | Participants, payment links, invoices (social) | SA | Participants (social) | S-01 | Keep |
| 24 | People | DUPR Requests | SA | Results > DUPR sync | W-11 | Keep |
| 25 | People | Email Broadcast | Org | Messages (email + WhatsApp) | W-10 | Reshape (WhatsApp is New) |
| 26 | Matches | Generate Fixture (format, groups, advance, save, generate, publish) | SA + Org | Schedule: Draw, Matches, Publish as one checklist | W-04 to W-08 | Reshape |
| 27 | Matches | Generate Groups (league) | SA | Schedule (league) | W-05 | Keep |
| 28 | Matches | Manage Fixture (groups, standings, bracket, upcoming, live) | SA + Org | Schedule + Match day | W-06, W-09 | Reshape |
| 29 | Matches | Court Assignment and Umpire Management | SA + Org | Setup step 6 (how many), Match day > Umpires (invite) | SW-06, W-09 | Reshape |
| 30 | Matches | Ties: generate, map, manage, rearrange knockout, tie breaker | SA | Ties & line-ups | L-02 | Reshape |
| 31 | Matches | Auction: auction, config, teams, owners, bid steps | SA | Setup auction branch; Auction room; owners in Players & teams | SW-03, L-03 | Reshape |
| 32 | Media | Sponsors | SA + Org | Setup step 7; Sponsors & screens | SW-07, W-13 | Keep |
| 33 | Media | Live TV Media playlist | SA + Org | Sponsors & screens | W-13 | Keep |
| 34 | Money | Organizer Dashboard KPIs | SA + Org | Home (rebuilt around actions) | W-01 | Reshape |
| 35 | Money | Superadmin Dashboard (revenue with platform fees by day) | SA | HQ overview | H-01 | Keep |
| 36 | Money | Razorpay Upload (settlement file) | SA | HQ payments (automate later) | H-04 | Keep |
| 37 | Money | Razorpay Management (all payments) | SA | HQ payments; organizer gets own Money page | H-04, W-12 | Reshape |
| 38 | Results | Report and Reports export center | SA | Results & reports | W-11 | Reshape |
| 39 | Results | Tournament Report (export by status) | SA | Results & reports | W-11 | Keep |
| 40 | Platform | Rizzfitt Players (all players) | SA | HQ; organizers get player lookup by mobile during registration | H-03, P-02 | Reshape |
| 41 | Platform | User Analytics | SA | HQ (platform); organizer sees own event traffic in Home | H-01, W-01 | Reshape |
| 42 | Platform | User Management, Login Configuration, User Permissions | SA | HQ access; organizers invite co-organizers with simple roles | H-04, W-15 | Reshape (Organizer role is New) |
| 43 | Platform | API Clients, Integrations, External Endpoints | SA | HQ integrations | H-04 | Keep |

## New capabilities the redesign introduces

These do not exist today. The prototype shows them; engineering will need to build them later. Keep a list of them on an HQ page called "What's new in this design" (H-05) so stakeholders can see the build scope.

1. Guided setup wizard with branching by event type and sport.
2. Organizer role with modules switched on by setup answers (replaces hand-ticked permissions for organizers).
3. Organizer sign-up with mobile OTP, and an HQ approval step before an organizer can collect money.
4. Payout account onboarding for organizers (bank or UPI, KYC status).
5. Match rule defaults per category (instead of per match only).
6. One consistent registration count everywhere.
7. Schedule as a per-category checklist, plus a courts-and-times timeline with auto-assign.
8. Organizer score entry and correction with an audit trail.
9. Match day court map with live status and blockers feed.
10. WhatsApp messaging and message templates.
11. Launch kit: event microsite theming, poster generator, message templates.
12. Confirmation for destructive and live-changing actions.
13. Co-organizer invites with simple roles (Owner, Manager, Desk, Court captain).
14. HQ console: approvals queue, organizer list, "View as organizer", "Take over event".
15. Custom category requests reviewed by HQ.
