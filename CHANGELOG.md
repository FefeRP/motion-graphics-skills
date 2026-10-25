# Changelog

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
