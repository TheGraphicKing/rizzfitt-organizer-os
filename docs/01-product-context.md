# 01 - Product context

## What Rizzfitt is

Rizzfitt (company: AGG Technology Pvt Ltd) is a sports technology platform for tournament organizers in India. It runs tournaments end to end: event setup, player registration with online payments, team and category management, fixtures (groups, round robin, knockouts), live scoring by umpires, court TV displays, sponsors, communications, results and reports.

- **Positioning line:** "Run the game. We run everything else."
- **Category line:** Sports & community OS
- **Sports supported today:** pickleball (the deepest), badminton, cricket, football, plus "multi sports" and "circuit" events.
- **Event types supported today:** Tournament, League, Auction league, Draft league, Event (social mixers).
- **Payments:** Razorpay is the payment rail.
- **Ratings and certification:** DUPR rating sync for pickleball, IPA and PWR certification flags.
- **Contact (public):** hello@rizzfitt.com, WhatsApp +91 78450 45444. Use these for "Talk to us" buttons.
- **Business model:** self-serve software plus a managed "done for you" service. Both must stay possible after the redesign.

## The problem

Today every event is configured by the Rizzfitt team in a super admin panel (`uatadmin.rizzfitt.com` in UAT). The team creates the organizer's login, ticks which of 64 screens they can see, creates the tournament, fills about 15 configuration screens in an order only the team knows, then hands over a dashboard (`manage.rizzfitt.com`). The organizer then works in a menu organized by database table, not by how an event actually unfolds.

This does not scale. Every new organizer costs team time, and organizers cannot change much themselves.

## The goal of this redesign

1. **Self-serve setup:** an organizer opens a link, answers a guided setup in 10-15 minutes, and finishes with a working event in draft: registration page, categories and prices, format, match rules, umpires, screens and a launch kit.
2. **An app shaped by their answers:** only the modules their event needs appear. A pickleball tournament never sees cricket rules; a league sees team building and ties; an auction league gets an auction room.
3. **Day-to-day operations that feel effortless:** registrations, players and teams, draws and fixtures, match day with live scoring, messages, results and money, all organized by the event lifecycle.
4. **A product that impresses:** bold, dark, 3D-rich design that makes organizers proud to share their event and makes Rizzfitt look like the most advanced product in the category.
5. **Rizzfitt stays in control where it must:** platform fees, shared master data, payouts approval, access, and a one-click "take over" for managed-service clients.

## Who uses it (proto-personas, invented for design)

| Persona | Who | What they need | Where they work |
|---|---|---|---|
| **Organizer (owner)** | Runs a club, academy, association or corporate event. Often sets up on a phone between other jobs. Not technical. | Get an event live fast, fill categories, run match day without chaos, get paid. | Setup wizard, organizer workspace (desktop on match day, phone otherwise) |
| **Co-organizer / desk volunteer** | Helps at the registration desk or runs a court. | Check players in, add walk-ins, mark cash or UPI paid, call matches. | Workspace, limited role, mostly phone or tablet |
| **Umpire** | Scores a court. May be a volunteer with no training. | Open a link, see the next match, tap points, confirm the result. | Umpire app (phone) |
| **Player** | Amateur to semi-pro. Registers, pays, wants their match time and live scores. | Register in 2 minutes, pay by UPI, know when and where to play. | Event microsite (phone) |
| **Team owner** | Owns a franchise in an auction league. | Bid for players live within a budget. | Auction room (phone or laptop) |
| **Spectators** | At the venue. | Watch live scores and brackets. | Court TV display, microsite |
| **Rizzfitt Ops (HQ)** | Rizzfitt's internal team. | Approve organizers and payouts, manage fees and master data, help or take over an event. | HQ console |

## Tone of voice

- Short, confident, friendly, a little playful. Sporty, never corporate.
- Speak to the organizer as "you". Use sports words they use: draw, bracket, court, kitchen, match day, walk-in, seed.
- Never use em or en dashes in copy.
- Examples: "Your tournament is ready to take entries." / "3 matches are waiting for a final score." / "Draw groups" / "Call next match" / "Nice. Registrations are open."
