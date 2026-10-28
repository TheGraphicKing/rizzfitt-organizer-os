# 08 - Iconography and illustration

Three layers, each with one job. Never mix layers inside the same row or list.

| Layer | Source | Licence | Job |
|---|---|---|---|
| **UI icons** | Lucide (`lucide-react`) | ISC (permissive) | Navigation, buttons, table actions, inputs, status. 20 px in UI, 24 px in nav, stroke 1.75. Colour follows text tokens. |
| **3D spot icons** | Microsoft **Fluent Emoji, 3D style** (GitHub `microsoft/fluentui-emoji`) and **3dicons** (3dicons.co) | Fluent Emoji: MIT. 3dicons: CC0, no attribution required. | Empty states, wizard choice cards (fallback for S2/S3), checklist items, onboarding hints, toasts for big moments. Minimum 48 px, usually 64 to 120 px. |
| **3D scenes** | Procedural React Three Fiber objects (`design/07`) | Own code | Hero moments only. |

## Getting the 3D spot icons

1. Download the needed PNGs at build time into `public/3d/icons/` (they must be bundled; no runtime network). Fluent Emoji files live under `assets/<Emoji name>/3D/` in the repository; verify the exact folder and file names before scripting. 3dicons are downloadable from 3dicons.co (choose the "colour" style, isometric angle).
2. Keep a `public/3d/icons/THIRD_PARTY_NOTICES.md` with the Fluent Emoji MIT licence text and a note that 3dicons are CC0.
3. If downloading is not possible in your environment, render the equivalent procedural object from `design/07` as a small still image, or use a Lucide icon on a glowing orange disc. Log it in `BUILD_LOG.md`.

## Concept to icon mapping

Use these consistently across the product. Names are Fluent Emoji names unless marked (3di) for 3dicons.

| Concept | Spot icon |
|---|---|
| Tournament | Trophy |
| League | Shield (3di) or Sports medal |
| Auction | Money bag + gavel (procedural) |
| Draft | Joker / playing cards (or procedural card fan) |
| Social mixer | Party popper |
| Pickleball | Ping pong (closest emoji) or procedural paddle |
| Badminton | Badminton |
| Cricket | Cricket game |
| Football | Soccer ball |
| Multi-sport | Sports medal |
| Circuit | 1st place medal |
| Registrations | Admission tickets |
| Players and teams | Busts in silhouette |
| Schedule | Calendar / Spiral calendar |
| Match day | Stadium |
| Messages | Megaphone (broadcast), Envelope (email) |
| Results | 1st place medal |
| Money | Money bag |
| Sponsors and screens | Television |
| Launch kit | Rocket |
| Settings | Gear |
| Waiting / pending | Hourglass |
| Success | Check mark button |
| Payout account | Bank |
| Umpire | Whistle (3di) or Stopwatch |

## Empty states (copy plus icon)

| Screen | Icon | Title | Help | Primary action |
|---|---|---|---|---|
| Registrations, none yet | Admission tickets | No entries yet | Share your event link to start taking entries. | Copy event link |
| Schedule, category not ready | Hourglass | Waiting for entries | Draw groups once entries close or the category is full. | Close entries for this category |
| Match day, no live matches | Stadium | All courts are quiet | Call the next match to get things going. | Call next match |
| Messages, none sent | Megaphone | Say hello to your players | Send confirmations, schedules and reminders on WhatsApp or email. | New message |
| Sponsors, none | Television | Show off your sponsors | Add logos to show on court screens and your event page. | Add sponsor |
| Results, nothing final | 1st place medal | Results appear as matches finish | Winners and standings update live. | Go to match day |
| HQ approvals, none | Check mark button | Inbox zero | No organizers waiting for approval. | - |

Every empty state also shows a quiet link: "Want us to set this up? Talk to Rizzfitt".

## Illustration style rules

- 3D spot icons sit on a soft orange or event-accent glow disc, float gently with CSS (6 px, 4 s loop), and stop floating under reduced motion.
- Never place a 3D icon inside a dense table or a form row.
- Never recolour Fluent Emoji or 3dicons; pick ones that work on dark.
- One spot icon per card or empty state. No collages.
- Sports objects must look like the real thing (a pickleball has holes, a shuttle has feathers). Sports people notice.
