# Changelog

All notable changes to critters. "Confirmed" means verified live by a human, not just by the headless harness.

## [Unreleased] — v0.3 in progress (2026-07-06)

### Added
- Local co-op: up to 8 gamepads plus a WASD keyboard seat, each player possessing their own critter (colored rings, no stealing, hot-plug). Group-follow camera zooms to keep everyone framed.
- Per-archetype special moves on A/Space (never a no-op): hopper DASH, serpent coil-lunge, flyer boost, walker bunny-hop, owl launch/land.
- Owl archetype (key 7): perch and glide state machine, perches on real tree canopies, wide head swivel, angry-owl easter egg (`CRITTERS.angryOwl()`).
- SDF blend-shell meadow: trees (swaying canopies), half-buried rocks, mushrooms with decal spots, flower tufts. Seeded scatter, re-rolls with the scene, ~11 props, zero plain meshes: everything is the same prim + shader pipeline as the creatures.
- `tools/inspect.mjs` multi-angle visual QA harness + `CRITTERS.view(i, theta, dist, h)` camera API.
- Idle jiggle on all archetypes, wavier tree canopies, soft collision reactions instead of hard wall stops.
- Autonomous ecology: a vignette director runs 1-2 little scenes at a time with zero input — critters nap (eyes shut, zzz, wake with a jiggle), gather and peck-bob around a mushroom, play tag (roles swap on a happy bounce), greet each other, a flyer lazily circles a tree canopy, serpents form a conga line behind a leader, and idlers amble over to a neighbor out of curiosity. Weighted so the meadow never goes to chaos; owls keep their own perch/glide life.
- Procedural per-archetype voices (chirp / squeak / buzz / hiss / hoot, pitch scaled by size) with occasional ambient self-chatter; a music-note pops overhead and nearby critters glance over. Petting, tag swaps and nap wake-ups all vocalize.
- Reaction pops: a "?" floats up when a critter notices a neighbor; a "!" and a star burst punctuate a solid bump.
- Ambient meadow motes: leaves drift down off the tree canopies and pollen floats up from flowers, so the world feels alive even with no critters nearby.
- Gentle golden-hour drift: the sky slowly warms toward a soft golden horizon and cools back over a few minutes, so the meadow's mood shifts as you watch.
- Ambient butterflies and bees: colorful butterflies drift flower to flower and a couple of bees buzz around faster and tighter. Critters glance up at ones that pass close.
- Petting a critter sends a little wave of joy through its neighbors (they bounce and look over).
- Face-button emotes: **E** (or gamepad **X**) = a happy pose (puff up, look at you, hearts); **Q** (or gamepad **B**) = a trick (joy-hop + stars). Acts on your possessed critter, or the one you're looking at.
- Ambient audio bed: a soft wind (brown noise + slow gusts) with sparse birdsong under the voices; respects the mute toggle.
- Two more vignettes: a solo yawn-stretch, and hopper races to a finish line.
- Chunky bear/ox quadruped variant (thicker low-slung body, stubby legs, slow heavy lumber) rolls ~1-in-4 on quadruped spawns.
- Livelier idle: gentle head sway at rest; idle tail/ear flicks scale up when a critter stops moving; each archetype throws its own little idle fidget (a foot shuffle, an ear flick, a serpent shiver). Critters puff up happily when petted, greeting, tagging, or waking from a nap.
- In progress: name-to-critter, ambient audio + cloud shadows, more autonomous vignettes.

### Fixed
- Eyes sit on the live union surface (no more buried faces); added saccade micro-movements.
- Legs tuck during airborne state and re-plant with landing juice; no more mid-air stilt locks.
- Anti-embed collision: the soft separation push now ramps with overlap depth past ~40%, so a driven/possessed critter can no longer bury itself inside another and stick there.
- Reroll hitch (CONFIRMED faster by Trent): first frame after reroll cost ~920ms of shader compilation because every critter compiled unique programs (per-critter `PRIM_COUNT` define). Now one shared program (`PRIM_COUNT = 40` + `uCount` uniform): 920ms -> 44ms, 21x.
- Inward face creases at prim overlaps (quad neck): buried vertices now tuck a hair under the skin instead of deep below it.
- "Vertex explosion" shrapnel spikes: Newton projection steps are clamped, bad gradients in blend valleys can no longer launch vertices.
- Dark seam slivers at head/body joins: the outline shell self-folds in concave blend valleys. A valley detector collapses outline width to a hairline there and slides folded verts behind the body.
- Serpent frustum-culling pops: bounding sphere now accounts for the trailing chain.

## [0.2.0] — 2026-07-06

First public release: live at https://tront.xyz/critters/ (public repo + GitHub Pages).

### Added
- Credits + provenance: in-page panel and README section crediting GOOBERS by u/AntiqueFeedback7447 (Reddit r/aigamedev), the published prompt, RujiK the Comatose as visual prior art, and the in-thread disclosure. All code written from scratch; the original was never released.
- On-screen UI row: spawn buttons per archetype, reroll, share, sound, credits. Touch controls verified (tap to call, drag orbit, pinch zoom).
- Discord/social embed: OG + Twitter meta, 1200x630 og-image, theme color.
- GA4, SVG favicon, loading splash with CDN-failure message.
- Scene seed always in the URL; shareable critter links (full recipe base64 in the hash).
- Serpent archetype (key 6): path-following segment chain with slither sway.
- Decoration rolls: horns, head crests, back spikes, blush cheeks. Palette families: pastel, dusty, twotone, contrast.
- Petting (tap a critter: squash, hearts, camera glance), social gaze, procedural WebAudio chirps (spawn/hop/land/pet) with persistent mute.
- CDP verification harness (`tools/verify.mjs`): every feature shipped with headless screenshot + console-error evidence.

### Fixed
- Mobile: hint pill no longer collides with the button row; short hint on touch devices.

## [0.1.0] — 2026-07-03

- Initial build: clean-room replica of the "SDF blend-shell" procedural creature demo from its public technique description and screenshots. Five archetypes (biped, quadruped, multiped, hopper, flyer), procedural gait/IK/squash animation, verlet rope tails and ears, googly eyes, toon outlines via SDF offset surface, curved pastel world, Xbox controller possession. One HTML file, no assets.
