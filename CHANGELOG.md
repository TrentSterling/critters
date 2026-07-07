# Changelog

All notable changes to critters. "Confirmed" means verified live by a human, not just by the headless harness.

## [Unreleased] — v0.3 in progress (2026-07-06)

### Added
- SDF blend-shell meadow: trees (swaying canopies), half-buried rocks, mushrooms with decal spots, flower tufts. Seeded scatter, re-rolls with the scene, ~11 props, zero plain meshes: everything is the same prim + shader pipeline as the creatures.
- `tools/inspect.mjs` multi-angle visual QA harness + `CRITTERS.view(i, theta, dist, h)` camera API.
- In progress: owl archetype (perch + glide, tree perches, head swivel), name-to-critter, ambient audio + cloud shadows, ecology behaviors.

### Fixed
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
