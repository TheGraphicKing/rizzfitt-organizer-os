# 07 - 3D and motion direction

## 1. Principles

1. **3D for moments, 2D for work.** 3D appears where emotion matters: first impression, choosing a sport, the "your app is built" moment, go-live, match day overview, winners, the TV screen, empty states. Anything people type into, scan or compare stays 2D.
2. **3D must react.** Objects follow the pointer, respond to answers (choose cricket and the bat spins forward), celebrate progress, and show live state (a court glows when a match is live). Nothing just spins forever for decoration.
3. **Procedural first.** Build every 3D object from code (primitives, lathe, extrude, instancing) so there are no external model downloads and everything works offline. Optional GLB models may replace them later through the same component API.
4. **Fast or not at all.** One WebGL canvas per screen, lazy-loaded, paused when off screen, with graceful fallbacks. A 3D scene that drops a laptop below 50 fps is a bug.
5. **Readable on top.** Text never sits on a moving 3D scene without a solid or glass backing.

## 2. The 3D kit (build in phase 02, show all on `/lab/3d`)

### Procedural objects (`src/components/3d/objects/`)
Each object is a component with props `{ accent?, highlight?, interactive?, quality }`. Proportions come from real equipment so they read instantly.

| Object | Build recipe |
|---|---|
| **PickleballCourt** | Plane 20 x 44 units (feet). Floor `--court-surface`, kitchen zones 7 units either side of the net in `--court-kitchen`, apron `--court-apron`. Lines as thin boxes in `--court-line` with optional emissive orange for "glow lines" mode. Net: thin box, slightly lower in the middle (36 to 34 in), posts as cylinders. |
| **BadmintonCourt / generic court** | Same component with a `sport` prop changing line layout and colours (badminton: green floor, doubles and singles lines). |
| **PickleballBall** | Sphere with 40 holes: instanced small dark discs placed by a Fibonacci sphere distribution, slightly inset; colour `--ball`, roughness 0.5. |
| **Paddle** | Rounded-rectangle face (extruded shape with bevel), carbon-black face with an orange edge guard, wrapped handle (cylinder with a spiral texture or segmented rings). |
| **Shuttlecock** | Cork hemisphere plus a cone of 16 thin feather planes. |
| **CricketBat + CricketBall** | Extruded bat blade profile with a handle cylinder; red ball with a raised seam (torus). |
| **Football** | Truncated icosahedron look: icosahedron geometry with flat shading and alternating dark and white faces. |
| **Trophy** | `LatheGeometry` cup profile, metallic gold (`metalness 1, roughness 0.25`), orange ribbon. Supports a `fill` prop (0 to 1) that raises an orange liquid inside using a clipping plane. |
| **Podium** | Three stepped rounded boxes labelled 1, 2, 3, with medals (cylinders) and confetti on cue. |
| **Medal** | Thin cylinder with bevel, ribbon from two planes. |
| **Gavel** | Cylinders for head and handle (auction). |
| **CoinStack** | Instanced cylinders; height bound to a value (auction budgets). |
| **CardFan** | 5 rounded thin boxes fanned (draft picks). |
| **GroupPot** | Glass bowl (lathe) with team tokens inside (draw animation). |
| **ModuleBlock** | Rounded box with an icon decal on the top face (used in "Building your app"). |
| **Phone / Laptop shells** | Rounded boxes with a screen plane. For the live wizard preview, prefer a CSS 3D transform on real DOM (crisp text) instead of rendering DOM inside WebGL. |
| **ConfettiBurst** | Instanced quads in brand and categorical colours with simple physics. |

### Look and lighting
- **Lighting:** use drei `<Environment>` with custom `<Lightformer>` panels (one warm key from top-left, a cool rim from behind, an orange floor bounce). Do not use drei's named `preset` environments: they download HDR files at runtime. If you want an HDR, bundle a small one in `public/3d/`.
- **Materials:** "clay gloss" = `meshPhysicalMaterial` with roughness about 0.35, clearcoat 1, clearcoat roughness 0.2. Metal for trophies and medals. Emissive orange for glow lines with Bloom on the landing hero and TV only.
- **Shadows:** `ContactShadows` under floating objects instead of real-time shadow maps.
- **Camera:** gentle perspective (fov 30-40) for objects; isometric-feeling orthographic camera for the court map.

### Performance utilities (`src/components/3d/perf/`)
- `<SceneCanvas>` wrapper used by every scene: lazy-loaded with `React.lazy`, `dpr={[1, 1.75]}`, `PerformanceMonitor` that steps dpr and effects down, `frameloop="demand"` for static scenes, pauses rendering when off screen (IntersectionObserver) or when the tab is hidden, fades in after the page's text has rendered.
- `useQuality()` returns `high | medium | low` from GPU tier detection (drei `useDetectGPU`) plus a user override in the Prototype switcher. Low: no postprocessing, no transmission, fewer instances, dpr 1.
- `useReducedMotion()`: when true, render one still frame, no Float, no camera moves, no confetti (show a static badge instead).
- `<Fallback3D>`: if WebGL is unavailable or the scene errors, show a crafted 2D fallback (gradient, SVG illustration or a 3D icon image from `design/08`). Wrap every scene in an error boundary.
- **Budgets:** hero scenes up to about 80k triangles, other scenes up to about 30k, textures up to 1024 px, one canvas per route (except `/lab/3d`), 3D code split per route.

## 3. Scene catalog

Each scene has an ID used in `design/11`.

| ID | Where | What it shows | Interaction | Fallback |
|---|---|---|---|---|
| **S1 Living court** | Landing hero (M-01) | A floating pickleball court at night, glowing orange lines, two paddles, a ball rallying in an arc over the net. On scroll, the camera tilts to top-down and the court lines morph into a bracket, then into the event dashboard card. | Pointer parallax on the whole scene; scroll-linked camera; hover makes lines glow. | Static render image plus CSS glow |
| **S2 Sport picker** | Setup step 2 (SW-02) | Six objects on glowing pedestals: paddle and ball, racquet and shuttle, bat and ball, football, a multi-sport cluster, a medal for circuit. | Hover lifts and rotates the object; selecting plays a short signature move (ball bounces, shuttle flips, bat swings, football spins) and an orange ring pulse. Keyboard selectable (the cards are real buttons; the canvas is decorative). | 3D icon images |
| **S3 Event-type tokens** | Setup step 2 (SW-02) | Five game-piece tokens: trophy on a bracket base (Tournament), shield with a table (League), gavel on coins (Auction), card fan (Draft), party popper cluster (Social). | Same as S2. | 3D icon images |
| **S4 Live preview device** | Setup shell (SW-00) | The organizer's event app and public page rendered as real DOM inside a phone and laptop frame, tilted in 3D with CSS transforms. Updates live with every answer (name, colours, modules in the sidebar, categories). | Tilts toward the pointer; toggle Phone / Laptop / Public page. | Flat preview |
| **S5 Building your app** | SW-09 | Module blocks (one per enabled module, labelled) fly in from around the screen and snap into an isometric tower/grid; each landing ticks a line in a checklist beside it; finishes with the event logo on top and a confetti burst. About 5 seconds, skippable. | "Skip" button; replays on demand in the Lab. | Animated 2D checklist |
| **S6 Go-live trophy** | Home before launch (W-01) | Trophy that fills with glowing orange as the go-live checklist completes. At 100% it shines and the "Open registrations" button lights up. | Hover rotates slightly. | Progress ring |
| **S7 Court map** | Match day (W-09), Home on event day | Isometric field of the event's courts (N from data) as 3D tiles. Live courts glow and float a glass score bug (DOM label positioned over the 3D tile). Late courts pulse amber; free courts are dim with a "Call next" label. | Click a court to zoom the camera and open its side panel; keyboard list beside it does the same. | 2D grid of court cards |
| **S8 Bracket** | Schedule and Results (W-06, W-11, P-03) | DOM bracket placed on a tilted plane (CSS 3D perspective) with depth on cards; the winner's path lights up in orange segment by segment. | Pan and zoom; hover a team highlights its path. | Flat bracket |
| **S9 Group draw** | Draw (W-05) | Team tokens tumble out of a glass pot into group columns (A, B, C...). | "Draw again" replays with a new seed; drag tokens between groups after. | Cards slide into columns |
| **S10 Auction stage** | Auction room (L-03) | Player card on a spotlight podium, gavel strikes on "Sold", each team's remaining budget as a coin stack that shrinks. | Bids animate the coin stack; timer ring around the player card. | 2D budget bars |
| **S11 Winners podium** | Results (W-11), microsite, TV | Podium with winner names on glass plates, medals, confetti on first view. | Category switcher swaps names with a flip. | Static podium image |
| **S12 Empty-state spots** | Everywhere | Static 3D icon images (see `design/08`), gently floating with CSS (not WebGL). | None. | Same image |
| **S13 Court TV** | T-01 | Broadcast-style scoreboard: giant flip digits (CSS 3D), team names, game count, server indicator, sponsor rail, up-next ticker, ambient court-line animation in the background. | Score changes flip digits; match point and game point banners. | Same, no ambient animation |
| **S14 Poster studio** | Launch kit (W-14) | Poster templates rendered from a 3D scene (court, objects, event name in large type) that organizers can rotate, pick an angle and export as PNG (canvas `toDataURL` with `preserveDrawingBuffer`). | Drag to rotate, pick template, Export. | 2D poster templates |
| **S15 Microsite hero** | P-01 | Event-accent-coloured version of S1, lighter (no postprocessing), mobile-optimized. | Pointer or device tilt parallax. | Static gradient hero |
| **S16 Loader** | Global | Bouncing pickleball loader (CSS or tiny SVG, not WebGL). | - | - |

## 4. Motion system

- **Durations:** micro 120 ms (hover, press), small 200 ms (toggles, chips), medium 320 ms (panels, drawers, tabs), large 480 ms (page transitions), celebration 1.2 to 5 s (S5, confetti).
- **Easing:** standard `cubic-bezier(0.2, 0, 0, 1)`; emphasized entrance `cubic-bezier(0.3, 0, 0, 1)`; exits `cubic-bezier(0.4, 0, 1, 1)`.
- **Springs (Framer Motion):** UI `{ stiffness: 380, damping: 30 }`; playful (ball, success) `{ stiffness: 260, damping: 18 }`.
- **Page transitions:** fade plus 8 px rise; shared-element transition from an event card to that event's Home header.
- **Numbers:** KPIs count up over 600 ms on first view; live scores flip per digit.
- **Lists:** stagger 30 ms per item, max 10 items animated.

### Micro-interactions (implement all)
- Primary button: glow grows on hover, 0.98 scale on press, ball loader while busy.
- Toggle: thumb slides with a tiny rolling-ball feel.
- Choice card select: lift, orange border draws around the card, check badge pops.
- Check-in: swipe right on a registration row (mobile) or press Space on a focused row; row turns green with a check.
- Score tap (umpire pad): ripple from the touch point, digit flips.
- Drag and drop: item lifts with a shadow and slight rotation; drop targets glow.
- Copy link: icon morphs into a check for 1.2 s, toast "Link copied".
- Success: ball bounces into a check mark. Error: short horizontal shake (fade only under reduced motion).
- Card spotlight: a soft radial light follows the pointer across tilt cards.

### Reduced motion
Under `prefers-reduced-motion: reduce`: no parallax, no tilt, no camera moves, no confetti, no count-ups (show final numbers), page transitions become 120 ms fades, 3D scenes render a single still frame.

## 5. Inspiration (patterns to borrow, not to copy)

- **Award-winning WebGL storytelling** (see the Awwwards WebGL and 3D inspiration collections, for example "Valerian Intergalactic Mission", tagged 3D navigation): scroll-linked cameras that turn a scene into a story. Use for S1 only.
- **2026 web design direction** (dark mode as a primary choice, Glassmorphism 2.0 where translucency signals depth, claymorphism and tactile 3D, bento grids, micro-interactions as core UX, scroll-driven animation). Night Court uses dark-first, restrained glass for floating layers, clay-gloss 3D objects, and bento layouts for Home and the landing page.
- **Sports broadcast graphics:** score bugs, lower thirds, match-point banners, up-next tickers. Use for S7 score bugs, S13 TV and the umpire pad.
- **Premium dark product sites** known for tasteful depth: crisp type on near-black, glow used sparingly, objects that respond to the cursor. Take the restraint, not the look.

## 6. Optional upgrade path: Spline scenes

If the design team later builds scenes in Spline, each scene component should accept an optional Spline scene file in place of the procedural version (Spline's React package loads `.splinecode` files; self-host the file in `public/3d/` to keep the no-network rule). Not required for this prototype.
