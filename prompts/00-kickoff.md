# Prompt 00 - Kickoff (paste this first)

You are going to build the Rizzfitt Organizer OS design prototype described in this folder.

1. Read `CLAUDE.md` completely, then every file it lists in section 1, in order. Do not skip the long ones (`docs/02`, `design/07`, `design/11`).
2. Write a short plan in `BUILD_LOG.md`:
   - A one-paragraph summary of what you are building, in your own words.
   - The phase list (prompts 01 to 13) with the routes each phase delivers.
   - Anything that looks contradictory or missing, with the decision you will take.
3. Then execute the phases by reading and following `prompts/01-foundation.md`, then `02`, `03` and so on through `13`, in order.

**Mode:**
- Default is **autopilot**: after finishing a phase and its checks, continue straight to the next one without waiting for me.
- If I say "step mode", stop after each phase, summarise what was built with screenshot paths, and wait for "continue".

**At every phase end** (from `CLAUDE.md` section 5): build and type-check clean, visit every new route, screenshot at 1440x900 and 390x844 if Playwright is available, fix issues, update `BUILD_LOG.md`.

**Never:** add a backend, call a real API at runtime, use real people's data, put em or en dashes in UI copy, or ship a white admin look.

Start now with step 1.
