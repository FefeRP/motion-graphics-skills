# Changelog

## 3.1.1 · 2026-11-22 · The master skill loads again
- The `motion-graphics` master skill description was longer than 1,024 characters, so Claude Code skipped the skill
  (only the 8 technique skills appeared). It is now 980 characters and keeps every trigger.

## 3.1.0 · 2026-11-22 · Product promo guide and anti-boredom checklist
- **New guide `references/promo-producto.md`** for SaaS product promos and launches, learned from 10 real launch videos
  (Linear, Vercel v0, Raycast, Arc, Framer, Notion, Stripe) measured at 5 fps and from large public samples: 10 laws
  with numbers (product in frame 0, one event every ≤ 1.8 s, vary scale and layout, live close-up UI with cursor,
  typing and push-ins, all-different transitions, sound with a signature, a climax before the logo), structure
  templates per second for 15, 30, 45 and 60 s, a rhythm table template, hook and transition recipes, how to show a
  real UI without boring, and the tells of an AI or template promo.
- **New `references/checklist-promo.md`**: the anti-boredom checklist (script, frames, measurements and a reviewer
  prompt with a 1–10 "is it boring?" score) that a promo must pass before delivery.
- **New `kit/scripts/revisar-guion.mjs`**: checks the GUION.md rhythm table automatically (event at 0, product before
  3.5 s, gaps ≤ 1.8 s, no scale three rows in a row, no transition more than twice, short texts).
- The master skill points to the guide before the script and to the checklist before delivery.

## 3.0.0 · 2026-11-20 · HyperFrames engine and AI-generated elements
- **New main engine: HyperFrames** (HTML + CSS + GSAP to video), pinned to 0.9.34, launched with telemetry off and no
  cloud rendering. New kit in `kit/`: the engine as one plain script (`comun/mg.js`, `window.MG`: pure `escena(t)`
  functions reconciled to the DOM, driven by a paused GSAP timeline), local OFL fonts, synthesized sounds and music,
  and `scripts/mg.mjs` (render, stills, lint, preview; sound written as `<audio>` tags from a JSON block; isolated
  work folders so several runs never collide).
- **Demos rebuilt** in HyperFrames (`oscuro`, `claro`, `agencia`, `mezcla` with five directions) and compared side by
  side with the Remotion ones: timing 1.00 with zero offset, same loudness (±0.1 LUFS), same cut frames; motion blur,
  seeded randomness and springs use the same formulas. Render is ~2–4× faster (≈6.5 s per second of 1080p60 video on
  3 CPU cores, no GPU).
- **All 13 directions** are now in `MG.ESTILOS` (adds `agencia-punto`, `oscuro-cobre`, `oscuro-cristal`, `taller`,
  `taller-claro`, `claro-lavanda` with their fonts).
- **AI-generated elements** (`references/elementos-ia.md`): when to use code, AI or both; budget and price estimate
  before every generation; model per element (objects, products, backgrounds, textures, living matter, characters);
  prompt templates that avoid the "AI look"; cut-out and alpha (`scripts/alfa.mjs`), seamless loops
  (`scripts/bucle.mjs` + `medir-bucle.mjs`), download and log; integration with `MG.Elemento` (crop, mask, tint clipped
  to the image alpha, blend) and fixed `<video class="clip">` (VP9 with alpha) placed by `MG.colocaMedio`. Demo piece
  `elementos` with code-made stand-ins.
- **Remotion** moves to `kit-remotion/` as a frozen secondary kit for what is not ported yet (the round 4–6
  recreations, `DemoEfectos2`, the fidelity demo, 3D maps). Skills point to HyperFrames first.

## 2.1.0 · 2026-10-26 · Round 6: 3D perspective maps
- **New technique skill `motion-mapas`**: maps-app style 3D perspective maps (camera that tilts, turns and follows a
  dot; buildings that grow in a wave; routes along the streets; whip zooms with motion blur; ground arrows; pin drop
  with ripple; traffic layer; cards anchored to buildings; the map folding into a card that becomes the logo), with an
  event-by-event recipe, CPU-only gotchas and a guide to choose a generated city, real OpenStreetMap data or a
  generative-video shot.
- **New engine file `kit/src/motion/base/mapa3d.tsx`**: `MapaCanvas`, `dibujaMapa`, `generaCiudad`, `rutaPorCruces`,
  `camaraMapa`, `medirRuta`, `proyectorMapa`, `enMapa`, `olaCrece`, `PALETAS_MAPA` (light and night). One 2D canvas, no
  WebGL/GPU: own perspective projection with near-plane clipping, painter's algorithm with back-face culling, distance
  fog, roof edges that fade with scale, motion blur by sub-frames only where asked.
- **New piece `RecMapaRuta`** (12 s, 60 fps, 100 BPM, fictional brand "ruta") in `kit/src/motion/recreaciones`, with
  its synthesized music (`public/musica/mapa-ruta.wav`) and a demo in `docs/demos/rec-mapa-ruta.{mp4,gif}`.
- Master skill, component catalog and `motion-3d` now point to `motion-mapas`.

## 2.0.0 · 2026-10-25 · Round 5: skills by technique
- The plugin is organised **by technique, not by style**: one master skill (`motion-graphics`, keyword MOTION
  GRAPHICS) plus seven technique skills (`motion-interfaz`, `motion-movimiento`, `motion-transiciones`,
  `motion-tipografia`, `motion-luz-fondo`, `motion-3d`, `motion-ritmo-sonido`). The old style skills became
  mixable *directions* (`references/direcciones.md`).
- Light product techniques: word-by-word focus, sentence that changes its ending, phone depth stacks, status
  timeline, tilted icon ring, radial focus, swirl into light, self-typing logotype (`enfoque.tsx`, `producto.tsx`),
  `claro-lavanda` direction and the `RecSeguimiento` piece.

## 1.0.0 · 2026-10-07 → 2026-10-10 · Rounds 1–4
- Shared engine (PCHIP time, 2D/3D camera with windowed motion blur, `Movil`/`Pieza`, `Forma`, kinetic type, effects,
  scenes, finishes, sound), three styles (dark, light, agency) and demos.
- Mandatory UI fidelity process and its tools (`capturar`, `extraer-tokens`, `comparar-fidelidad`).
- Round 4: four mixable variants (`oscuro-cobre`, `oscuro-cristal`, `agencia-punto`, `taller`) with recreations
  verified against their references (`comparar-video.mjs`), aurora and smoke shader, render by ranges.
