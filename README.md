# Motion Graphics Skills for Claude Code

**Professional, fluid motion graphics in [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + CSS + GSAP → video) — made by Claude.**
Say *"MOTION GRAPHICS: a 30-second launch video for my app"* and get a 60 fps video that moves like a keynote: pieces
that fly in and rearrange, objects that morph into the next scene, kinetic typography, light, motion blur and
sound effects locked to every landing. No slideshows.

**v3.0 · new engine.** Pieces are now plain HTML pages animated with GSAP and rendered by HyperFrames (pinned
0.9.34, telemetry off, local only). The demos below were rebuilt in HyperFrames and checked against the Remotion
versions; Remotion stays as a frozen secondary kit (`kit-remotion/`) for the pieces not ported yet. The skills also
know when to bring **AI-generated elements** (objects, backgrounds, textures, characters, products, seamless loops)
into a piece and how to integrate them — always with a budget and a price estimate first.

| Dark (keynote) | Light (SaaS intro) | Agency (reel) |
|---|---|---|
| ![dark](docs/demos/oscuro.gif) | ![light](docs/demos/claro.gif) | ![agency](docs/demos/agencia.gif) |

**One scene, any direction — directions are mixable settings, not templates:**

| dark | light | agency | light-lime | dark + agency type & rhythm |
|---|---|---|---|---|
| ![](docs/demos/mezcla-oscuro.gif) | ![](docs/demos/mezcla-claro.gif) | ![](docs/demos/mezcla-agencia.gif) | ![](docs/demos/mezcla-claro-lima.gif) | ![](docs/demos/mezcla-oscuro-agencia.gif) |

**Effects catalog** (secondary Remotion kit, `DemoEfectos2`, 24 s — liquid blobs, voice-synced phrase, chromatic flash, elastic pill tabs,
negative strobe, barrel-lens panel wall, light line, glowing card stack, orbits, word selection, tunnel, portal,
horizon logo reveal):

![effects](docs/demos/efectos.gif)

Full-quality MP4s are in [`docs/demos/`](docs/demos).

## HyperFrames vs Remotion (same demos, measured)
Each demo was ported line by line (same keyframes, curves, springs, seeded randomness and motion-blur formula) and
compared with `scripts/comparar-video.mjs` (timing = correlation of the motion curves; 1 = events on the same frames),
`medir-ritmo.cjs` and EBU R128 loudness:

| Demo | Timing (offset) | Loudness HF / Remotion | Render, 1080p60, 3 CPU cores, no GPU |
|---|---|---|---|
| `oscuro` (10 s) | 1.00 (0 s) | −17.9 / −17.9 LUFS | 68 s (Remotion ≈ 150–300 s) |
| `claro` (10 s) | 1.00 (0 s) | −16.9 / −16.9 LUFS | 72 s |
| `agencia` (11.25 s) | 1.00 (0 s) | −18.1 / −18.2 LUFS | 75 s |
| `mezcla` × 5 directions | 1.00 (0 s) in all five | same | 63–133 s |

The only visible difference: the counter now always groups thousands ("4.663 €"). Where Chrome without a GPU clips a
large blurred `box-shadow` into a square, the HyperFrames demo uses a radial gradient instead.

## AI-generated elements (optional, with a budget)
Text, numbers, UI and logos are always code. Organic or cinematic things — smoke, water, fabric, a product that turns,
a character, a photographic background, a texture — can be generated (the skill documents Higgsfield models) and
integrated as pieces: `scripts/alfa.mjs` cuts them out (chroma, black, white or exact black/white difference),
`scripts/bucle.mjs` closes a clip into a seamless loop and measures the seam, `MG.Elemento` places images with crop,
mask and a palette tint clipped to the image alpha, and `<video class="clip">` + `MG.colocaMedio` places VP9-alpha clips
frame-accurately. Before anything is generated the skill lists every element with its estimated price and asks for a
maximum budget; without budget it builds the same idea in code. The `elementos` demo piece shows the integration with
code-made stand-ins:

![elementos](docs/demos/elementos.gif)

## Product promos that are not boring
A promo can follow the beat grid, use 3D and real screens, and still bore. `references/promo-producto.md` gathers what
10 real SaaS launch videos (Linear, Vercel v0, Raycast, Arc, Framer, Notion, Stripe) do, measured at 5 fps: the product
moving in frame 0, one event every ≤ 1.8 s, a different trick for every feature, live close-up UI (cursor, typing,
push-ins), all-different transitions, sound with a signature and a climax before the logo, with structure templates per
second and hook and transition recipes. `references/checklist-promo.md` is the checklist a promo must pass before
delivery, and `kit/scripts/revisar-guion.mjs` checks the rhythm table of the script automatically.

## Learned from references, frame by frame
Every style and variant comes from studying real motion graphics frame by frame (timing, easing measured per frame,
sampled palettes, type, layers, sound) and then **recreating them in this engine and checking the recreation against
the original** with `scripts/comparar-video.mjs` (image, color and timing per second). Round 4 added four variants,
each with its recreation as a composition in the kit:

| `oscuro-cobre` · warm dark, editorial serif, light that cools | `oscuro-cristal` · glass UI, typing with light, color per scene |
|---|---|
| ![](docs/demos/rec-oscuro-cobre.gif) | ![](docs/demos/rec-oscuro-cristal.gif) |
| **`agencia-punto`** · one red dot drives the whole reel, morphing particle cloud | **`taller`** · the video shows the tool it was made with, strict beat grid |
| ![](docs/demos/rec-agencia-punto.gif) | ![](docs/demos/rec-taller.gif) |

Verification against the originals (`comparar-video.mjs`, whole clip; timing = correlation of the motion curves, 1 = events
land on the same frames; color = mean chroma difference, < 8 = same palette):

| Variant | Timing | Color | Notes |
|---|---|---|---|
| `oscuro-cobre` | 0.87 | 1.5 | glass box slightly less saturated |
| `oscuro-cristal` | 0.95 | 2.9 | brand logos replaced by generic glyphs |
| `agencia-punto` | 0.92 | 5.6 | particle torus a bit streakier |
| `taller` | 0.81 | 5.4 | original was filmed from a monitor (washed-out colors) |

The original reference videos are not included (they belong to their authors); only our recreations are.

**Round 5 · light product motion.** Three light product videos (an app intro, a tracking flow, an integrations
page) were measured frame by frame and turned into reusable techniques: words that land one by one from blur and
scale, a sentence where only the ending changes, phones rising in a depth stack, a status timeline the camera travels,
a tilted ring of app icons around a sentence, a radial focus pull, a swirl into a light flood and a logotype that
types itself and re-centers. `RecSeguimiento` (12 s, 90 BPM, `claro-lavanda`, fictional brand "ruta") puts them together
in one piece. It is a **technique piece**, not a 1:1 recreation of one of the references, so it has no
`comparar-video.mjs` score; it was checked with stills, `medir-ritmo` (no frame jumps) and loudness (−14 LUFS).

![RecSeguimiento](docs/demos/rec-seguimiento.gif)

**Round 6 · 3D perspective maps.** A maps-app concept ad was measured frame by frame (camera pitch and bearing per shot,
palette, building growth, route trim path, whip zooms, pin drop, the map folding into a card) and turned into a new
technique skill, `motion-mapas`, with its own CPU engine (`base/mapa3d.tsx`): a whole city drawn in ONE 2D canvas
(no WebGL, no GPU, no thousands of 3D DOM nodes) with a camera that tilts, turns and follows a dot, extruded buildings
that grow in a wave, parks, trees, water, roundabouts, a traffic layer, a route that draws itself along the streets,
ground arrows, ripples, distance fog, motion blur by sub-frames only during whip zooms, and `enMapa()` to pin HTML
cards and labels to any building. `RecMapaRuta` (12 s, 100 BPM, fictional brand "ruta") puts it together: dot → map,
tilt while the city grows, whip up, a card anchored to a warehouse, whip down, arrows, the destination rises and a pin
drops with a ripple, whip up to top view, the map folds into a card and becomes the logo. Checked with stills,
`medir-ritmo` (0 one-frame jumps; the only still stretch is the final logo hold, 0.7 s) and loudness (−13.9 LUFS, peak −1.4 dBFS); render 282 s for 12 s at 60 fps on 3 CPU cores, no GPU. The skill also explains when to use a generated city, real
OpenStreetMap data (converted to meters, with attribution) or a generative-video shot.

![RecMapaRuta](docs/demos/rec-mapa-ruta.gif)

## Rebuilt UI = the real UI (mandatory fidelity process)
When the video rebuilds your product's interface as animatable components, it has to look **identical** to the real
one, not "something similar". The base skill makes Claude follow a mandatory process before drawing anything:
find the source of truth (your code, CSS variables, Tailwind config, real SVG logos, fonts, icon library, real
texts), copy colors, type, radii, shadows, spacing, icons and states as they are, rebuild each screen 1:1 with the
same structure, and then **compare rendered frames with real screenshots** side by side and pass a fidelity
checklist (logo, type, palette, icons, spacing, texts, states). The kit includes the tools:

```bash
node scripts/capturar.mjs https://your-app.example/dashboard refs/dashboard.png --ancho 1440 --alto 900   # reference screenshot
node scripts/extraer-tokens.mjs ../your-app --salida fidelidad/tokens.md   # colors, radii, shadows, fonts, icons… with file:line
node scripts/comparar-fidelidad.mjs refs/dashboard.png out/Video-3.5.png out/check.jpg --recorte 240,150,1440,900
```

Before / after on the fictional product in `kit/ejemplos/fidelidad` (`DemoFidelidad`): rebuilt "by eye" differs from
the real screenshot in 24 % of the pixels; following the process, 0 %.

| Rebuilt by eye (24 % of pixels differ) | Following the process (0 %) |
|---|---|
| ![before](docs/fidelidad/antes.jpg) | ![after](docs/fidelidad/despues.jpg) |

![fidelity demo](docs/demos/fidelidad.gif)

## What's inside: one master skill + combinable techniques (not styles)
Say **`MOTION GRAPHICS`** (or `/motion-graphics`) and describe what you want. The master skill works like a motion
director: it writes a short brief, decides the idea, the **thread** (the object that crosses the whole video and
changes role) and the hero moment, picks 1 strong technique + 2–4 supporting ones, writes the event-by-event script on
a beat grid, builds the piece with the kit and checks it before showing it to you.

| Skill | What it knows |
|---|---|
| **`motion-graphics`** (master) | brief → idea and thread → techniques → script → build → verify → deliver; starting *directions* (dark keynote, light SaaS, agency and their variants) as mixable settings, not templates |
| `motion-interfaz` | showing a product: rebuild its UI as components with a **mandatory fidelity process** (source of truth, copied tokens, comparison with real screenshots, checklist), animated cut-outs instead of full screenshots, phone screens, depth stacks of screens, status timelines the camera travels |
| `motion-movimiento` | asymmetric curves, PCHIP paths with no stop-and-go, capped springs, squash & stretch, 2D/3D camera that never stops, motion blur only where it's fast, framing |
| `motion-transiciones` | bridge objects that morph, the thread, cuts hidden by speed or light, zoom-through with match cut, light iris to the brand, focus pulls |
| `motion-tipografia` | kinetic type: blur-to-sharp, word by word, sentences where only one word changes, decode, mask, neon, logotypes that unfold from their initial; no boxes, no emojis |
| `motion-luz-fondo` | living backgrounds (corner light, halos, auroras, WebGL smoke shader), milky and frosted glass without `backdrop-filter` in 3D, depth of field, light that cools, grain |
| `motion-mapas` | 3D perspective maps drawn on the CPU: a city that grows, a camera that tilts, turns and follows a dot, routes along the streets, whip zooms with motion blur, pins with ripples, traffic, cards anchored to buildings, the map folding into the logo; generated city vs real map data vs generative video |
| `motion-3d` | CSS 3D worlds with a travelling camera, parallax layers, icons floating around a sentence, orbits, tunnels, particle clouds that morph |
| `motion-ritmo-sonido` | strict beat grid, event-by-event script, synthesized music, sound effects locked to the landing frame, −14 LUFS |

- **A HyperFrames kit** (`plugins/motion-graphics/skills/motion-graphics/kit`): the engine (`comun/mg.js`), 13 mixable
  directions with local fonts, the demos (`piezas/`), synthesized sound effects and music (no third-party rights) and
  scripts to render, take stills, lint, cut out and loop AI elements, generate music, measure rhythm, capture reference
  screenshots, extract design tokens from code and compare renders with the real UI.
- **A frozen Remotion kit** (`kit-remotion/`) with the recreations, the effects catalog, the fidelity demo and the 3D
  maps that are not ported yet.

### The engine in one paragraph
Everything runs at 60 fps on smooth PCHIP trajectories (no stop-and-go at keyframes, no overshoot unless asked),
controlled springs (overshoot is capped per style), real motion blur only on fast moves, a 2D/3D camera that never
stands still, `Forma` (an object that morphs: dot → pill → card → logo) to bridge scenes instead of cuts, light
transitions (flash, light leak, chromatic flash, negative strobe), liquid color blobs, kinetic typography (decode,
mask, punch, per-letter, neon, voice-synced phrases) and sound effects placed on the exact landing frame.

## Install
Requirements: [Claude Code](https://code.claude.com), Node.js 22+, ffmpeg in the PATH (or `FFMPEG`) and Chrome (or
the headless shell HyperFrames downloads).

```bash
# 1. Add the marketplace
claude plugin marketplace add FefeRP/motion-graphics-skills

# 2. Install the plugin
claude plugin install motion-graphics@motion-graphics-skills

# 3. Check it loaded: motion-graphics (master) and the eight motion-* technique skills should be listed
claude plugin details motion-graphics
```

Inside a session you can do the same with `/plugin marketplace add FefeRP/motion-graphics-skills` and `/plugin install
motion-graphics@motion-graphics-skills`.

### Try the kit
```bash
cp -r ~/.claude/plugins/…/motion-graphics/skills/motion-graphics/kit my-video   # or copy it from this repo
cd my-video
npm install --ignore-scripts
node scripts/mg.mjs stills oscuro 1,3,6          # frames + contact sheet in salida/
node scripts/mg.mjs render oscuro                # salida/oscuro.mp4
node scripts/mg.mjs render mezcla -o salida/lima.mp4 --variables '{"estilo":"claro-lima"}'
```

## Use it
Start with the keyword in an empty folder or next to your product's code, for example:
- *"MOTION GRAPHICS: a 25 s launch video for my app. The code is in ../app, here is the logo."*
- *"MOTION GRAPHICS: a 10 s vertical hook for Instagram that shows how an order travels to the customer's door."*
- *"MOTION GRAPHICS: same video, light direction, with my brand color #FF3B5C and the energy of the agency rhythm."*
- *"Cut the pricing card and the CPU chart from this screenshot and animate them as separate pieces."* (technique skill on its own)

Claude will study your material, decide the idea and the thread, choose and mix techniques, write the event-by-event
script (one event per beat), build it with the kit, compare rebuilt screens with real screenshots, render stills to
check framing, render the video and measure it (rhythm, stillness, frame jumps, loudness) before showing it to you.

## Repository layout
```
.claude-plugin/marketplace.json          # this marketplace
plugins/motion-graphics/
  .claude-plugin/plugin.json             # the plugin
  skills/
    motion-graphics/SKILL.md             # master skill (keyword MOTION GRAPHICS)
    motion-graphics/references/          # engine guide, product promo guide + anti-boredom checklist, AI elements, directions, component catalog, learning a reference
    motion-graphics/kit/                 # HyperFrames kit (engine, directions, demos, scripts, sounds)
    motion-graphics/kit-remotion/        # frozen Remotion kit (recreations, effects catalog, fidelity demo, maps)
    motion-interfaz/  motion-movimiento/  motion-transiciones/  motion-tipografia/
    motion-luz-fondo/  motion-3d/  motion-mapas/  motion-ritmo-sonido/   # technique skills
docs/demos/                              # demo videos and GIFs
docs/fidelidad/                          # before/after fidelity comparison sheets
CHANGELOG.md                             # versions
LICENSE                                  # MIT
```
HyperFrames is the main engine; the Remotion kit is kept frozen and documented with a Remotion → HyperFrames
equivalence table (`references/hyperframes.md`) for porting the remaining pieces.

---

## En español
Skills para Claude Code que hacen motion graphics con ritmo profesional con HyperFrames (HTML + CSS + GSAP a vídeo; Remotion queda como kit secundario congelado), organizadas por técnicas y no
por estilos: una skill maestra (palabra clave `MOTION GRAPHICS`) que entiende el pedido, decide la idea y el hilo
conductor, elige y mezcla técnicas y construye la pieza, y ocho skills de técnica combinables (interfaz fiel,
movimiento, transiciones, tipografía, luz y fondos, 3D y partículas, mapas 3D en perspectiva, ritmo y sonido), más un kit de HyperFrames listo
para renderizar (y un kit de Remotion secundario). Saben cuándo usar elementos generados con IA (objetos, fondos,
texturas, personajes, productos, bucles) y cómo integrarlos, siempre con presupuesto máximo y precio estimado antes.
Las direcciones visuales (oscuro, claro, agencia y sus variantes) son ajustes mezclables. Cuando recrean la interfaz de tu producto, siguen un proceso obligatorio de fidelidad (fuente de
verdad, tokens copiados, comparación con capturas reales y lista de comprobación) para que sea idéntica a la real.
Instalación: `claude plugin marketplace add FefeRP/motion-graphics-skills` y
`claude plugin install motion-graphics@motion-graphics-skills`. Las skills están escritas en español.

## License
MIT. The demo brands ("foco", "ruta", "norte", "pulso") are fictional. Sounds and music in the kit are synthesized by
the included scripts.
