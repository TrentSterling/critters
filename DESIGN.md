# critters — DESIGN (2026-07-03)

Procedural creature sandbox in a single static HTML page. Clean-room reimplementation of the
"SDF blend-shell" technique described in a Reddit post (see `reference/` screenshots for the
target look). No assets, no rigs, no animation clips: every creature is a handful of primitive
shapes fused into one seamless toon body, animated 100% procedurally.

## Goal

Match the reference results: cute pastel critters (biped, quadruped, multiped, hopper, flyer)
that walk/scuttle/hop/hover around a soft green field with reactive IK stepping, squash &
stretch, floppy ears/tails/antennae, googly eyes, toon outlines, blob shadows, dust puffs.
Controls exactly as reference: click ground to call a critter, drag to orbit, keys 1-5 spawn
archetypes, R rerolls everyone.

## Core technique: SDF blend-shell

- Every body part is one primitive: a **round cone** (capsule with different end radii).
  Spheres and cones are degenerate cases. A creature is 10-32 of these.
- For each primitive we emit a stretched unit-sphere mesh (an ellipsoid that encloses it),
  all merged into ONE BufferGeometry per creature (one draw call). Vertex attribute `aPrim`
  says which primitive a vertex belongs to.
- The vertex shader reconstructs the vertex from the primitive's current endpoints (uniform
  arrays, updated per frame by the CPU animator), then **projects the vertex onto the
  smooth-min union SDF of all primitives** (2 Newton steps along the field gradient).
  Overlapping shapes converge onto the same blended isosurface: seams cease to exist.
- Normals = SDF gradient (lighting flows continuously across joints).
- Colors + gloss blend by smooth-min proximity (soft gradients at every join, free).
- Per-primitive blend radius `k`: thin parts (antennae, propeller blades) get a small k so
  they don't dissolve into the body.
- Buried vertices (deep inside the union) tuck slightly under the skin instead of projecting
  out — no z-fighting, no stretched shrapnel.
- **Outline pass**: same geometry drawn again with backface culling flipped, projected onto
  the SDF **offset surface** (iso = +w) instead of inflating along normals — clean toon
  outlines even in concave joints. Outline color is a per-vertex darkened body color.
- All cost is per-vertex, not per-pixel. No raymarching, no skinning. Mobile-friendly.
- Rigid transforms only on the mesh (identity here — prims live in world space); squash &
  stretch is applied to the primitive endpoints/radii themselves so the SDF stays valid.

## Animation (all procedural)

- **Locomotion root**: position/velocity/heading springs, banking into turns, lean into accel.
- **Legs**: analytic two-bone IK. Gait engine = phase-driven stepping while moving (trot pairs
  for quads, alternating for bipeds, tripod/wave ripple for 6-8 legs) + reactive stepping when
  idle/turning (foot restep when drifted past threshold, gated so stance stays stable).
  Swing = arc with easing + predictive landing, dust puff + body dip on plant.
- **Hopper**: state machine IDLE → CROUCH (anticipation squash) → LAUNCH (stretch, ballistic)
  → LAND (squash, dust ring) → recover. No legs needed.
- **Flyer**: hover bob + noise drift, banks into motion, spinning propeller (primitives
  rotating around the mast), dangling nub arms/feet.
- **Ropes**: tails/ears/antennae are verlet chains whose segments are SDF primitives —
  physics ropes that stay seamlessly fused while flopping. Stiffness varies (antenna stiff,
  tail floppy).
- **Eyes**: separate tiny meshes placed on the SDF surface (CPU field eval at build), googly
  pupils that track motion, blinks, cyclops chance.
- **Juice**: breathing radii pulse, spawn pop (squash overshoot), head look-lag springs,
  landing dips, click ring marker, blob shadow squash with height.

## Recipes

A creature is ~15 lines of JSON (archetype, size, palette, body/head/leg proportions, deco
picks, gait tempo). A seeded generator rolls recipes per archetype; 5 hand-tuned featured
recipes reproduce the reference screenshots' cast (purple 8-leg bug, crimson quad, orange
biped, blue propeller flyer, pink hopper). `window.CRITTERS.spawnRecipe(json)` accepts raw
recipes; every spawn logs its recipe to console so an AI can generate endless critters.

## World

Pastel field: curved-horizon ground disc (world curvature, fog fade), gradient sky dome,
soft dark ground patches, blob shadows, cream dust sprites, bottom hint pill (exact reference
text). Camera: damped orbit, no pan.

## Files

- `index.html` — everything (CSS + JS + GLSL inline, Three.js 0.160 via CDN importmap)
- `reference/` — target screenshots
- `README.md` — technique + recipe docs + controls + debug API

## Verification

Headless Chrome via CDP-over-Node (per machine notes): screenshot rounds compared against
`reference/`, console error capture, per-archetype close-ups via `window.CRITTERS.frame(i)`,
fps sanity via rAF counter. Deterministic layout via `?seed=`.
