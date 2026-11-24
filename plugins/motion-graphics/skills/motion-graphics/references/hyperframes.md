# El motor: HyperFrames (HTML + CSS + GSAP → vídeo)

El kit principal (`kit/`) escribe cada pieza como **una página HTML** que HyperFrames recorre fotograma a fotograma
con Chrome sin cabeza y pasa a MP4. Mismo resultado que una web: el CSS real de un producto se pega casi tal cual.

## Instalar (una vez)
- `cd kit && npm install --ignore-scripts`. **HyperFrames va fijado a 0.9.34** y GSAP a 3.15.0 en `package.json`:
  no subas versiones sin volver a comparar las demos.
- `scripts/mg.mjs` lanza el CLI **sin telemetría** (`HYPERFRAMES_NO_TELEMETRY=1`, `DO_NOT_TRACK=1`), sin instalar
  skills en global y con el Chrome del sistema si lo hay (`HYPERFRAMES_BROWSER_PATH` para otro). Nunca uses la nube ni
  el render remoto del proveedor: todo es local.
- ffmpeg en el PATH o en `FFMPEG`.

## Estructura
```
kit/
  comun/mg.js          motor (window.MG)          comun/fuentes.css + fuentes/   fuentes OFL locales
  comun/vendor/gsap.min.js                        comun/sfx/*.wav, comun/musica/*.wav (sintetizados)
  comun/elementos/     imágenes y clips externos (generados con IA, recortes, capturas)
  piezas/<pieza>.html  una composición por fichero (oscuro, claro, agencia, mezcla, elementos, promo)
  variantes/*.json     variables para una pieza (dirección, textos, sonido)
  scripts/mg.mjs       render · stills · lint · preview      scripts/alfa.mjs, bucle.mjs, medir-bucle.mjs
  scripts/voz.mjs · audio.mjs · franjas.mjs · marca.mjs     voz en off, ducking/remezcla, franjas, recursos de marca
```
`mg.mjs` genera en `.obras/<pieza>-<pid>/` un `index.html` (con el sonido convertido en etiquetas) y un enlace a
`comun/`, así varias órdenes a la vez no se pisan. Se borra solo.

## Anatomía de una pieza
```html
<!doctype html>
<html lang="es"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=1920, height=1080">
  <link rel="stylesheet" href="comun/fuentes.css">
  <script src="comun/vendor/gsap.min.js"></script><script src="comun/mg.js"></script>
</head><body>
  <div id="lanza" data-composition-id="lanza" data-start="0" data-duration="8" data-width="1920" data-height="1080" data-fps="60" style="width:1920px;height:1080px"></div>
  <script type="application/json" id="mg-sonido">
    { "musica": "musica/musica-oscuro.wav", "volumenMusica": 0.55, "volumen": 0.75,
      "sfx": [ { "t": 0.2, "n": "whoosh" }, { "t": 1.5, "n": "impacto", "vol": 0.8 } ] }
  </script>
  <script>
    const { h, capa, FondoEstilo, Movil, PorPalabra, Camara2D, ESTILOS, titular } = MG;
    const T = { titulo: 0.2, tarjeta: 1.5 };               // la tabla del guion: una constante por evento
    const escena = (t) => capa({},
      FondoEstilo(t),
      Camara2D(t, { claves: [{ t: 0, s: 1.04 }, { t: 8, s: 1.1 }] },
        h("div", { style: { position: "absolute", left: 160, top: 380, ...titular(120) } }, PorPalabra(t, { texto: "Todo en un sitio.", t0: T.titulo })),
        Movil(t, { claves: [{ t: T.tarjeta, x: 1300, y: 700, s: 0.8, o: 0, b: 12 }, { t: T.tarjeta + 0.4, x: 1300, y: 560, s: 1, o: 1, b: 0 }], queda: true, ancho: 520, alto: 300 }, /* tarjeta */)));
    MG.montar({ id: "lanza", duracion: 8, fps: 60, estilo: ESTILOS.oscuro, escena });
  </script>
</body></html>
```
- `escena(t)` es **pura**: el mismo `t` da siempre el mismo árbol. `MG.h(tag, props, ...hijos)` crea nodos (estilos en
  objeto, números = px); un reconciliador los aplica al DOM sin rehacerlo.
- `MG.montar` crea la línea de tiempo GSAP en pausa (`window.__timelines[id]`), responde al `hf-seek` y espera a las
  fuentes (`window.__hf.buildReady`) antes de capturar. Vista previa rápida: abre la pieza con `?t=3.2` o
  `node scripts/mg.mjs preview <pieza>`.
- Componentes: `Componente(t, {opciones}, ...hijos)` (el tiempo primero; `Tarjeta({...}, ...hijos)` no lleva `t`).
  `Movil` desaparece pasada su última clave salvo con `queda: true`. Un campo que falta en una clave conserva el valor
  anterior. Lista completa en [catalogo.md](catalogo.md).
- Dirección: `estilo: ESTILOS[nombre]` o `MG.mezclar(ESTILOS.claro, { acento: "#..." })`. Con `MG.variables({ estilo:
  "oscuro" })` la pieza lee `--variables` (render), `window.__MG_VARS` (stills) o `?estilo=` (navegador).

## Reglas del motor (si no, el render no es determinista o el lint falla)
- Nada de `requestAnimationFrame`, `Date.now`, `Math.random` (usa `MG.azar(semilla)`), `repeat: -1`, transiciones o
  animaciones CSS, `vw/vh`, red (fuentes e imágenes locales). El lint busca esas palabras **también en comentarios**.
- Un solo elemento con `data-composition-id` por HTML; nada de `querySelector` con plantillas `${}`; rutas de recursos
  `comun/...` (sin `../`); ningún comentario antes de `<!doctype>`.
- **El audio solo se mezcla si las etiquetas `<audio class="clip">` están escritas en el HTML**: el creado por JS no
  suena. Por eso el sonido va en el bloque JSON `mg-sonido` y `mg.mjs` lo convierte en etiquetas (música en una
  pista, cada efecto en la suya; duración leída del WAV). `variables.sonido` lo sustituye. Valores por defecto:
  `volumenMusica` 0,6, `volumen` 1, efectos `vol` 0,4 y cortados a 1,4 s (`dur` para otro).
- Los **clips de vídeo** (fondos o elementos generados) también van fijos en el HTML: `<video id="humo" class="clip"
  src="comun/elementos/humo.webm" data-start="0" data-duration="8" muted playsinline>`; la escena solo los coloca con
  `MG.colocaMedio("humo", { left, top, transform, opacity, mixBlendMode })`. WebM VP9 con alfa se compone bien.
- Sin GPU: un `box-shadow` grande y difuminado sale recortado en cuadrado → usa un `div` con `radial-gradient`.
  `backdrop-filter` dentro de una cámara 3D deja de pintar media fila en fotogramas sueltos → cristal = copia
  desenfocada recortada. `MG.desenfoque` repinta la escena N veces: solo en sus ventanas.

## Render y verificación
| Orden | Para qué |
|---|---|
| `node scripts/mg.mjs lint <pieza>` | errores del contrato (0 antes de renderizar) |
| `node scripts/mg.mjs stills <pieza> 0.5,2,4 [-o dir] [--variables JSON]` | fotogramas y hoja de contacto (≈9 s) |
| `node scripts/mg.mjs render <pieza> [-o salida/x.mp4] [--variables JSON] [--desde a --hasta b] [--mudo] [--calidad draft\|looks\|delivery] [--crf 16] [-w 3]` | MP4 H.264 + AAC |
| `node scripts/medir-ritmo.cjs v.mp4` · `ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` | ritmo, saltos, volumen |
| `node scripts/comparar-video.mjs ref.mp4 v.mp4 comp.mp4` | contra una referencia o la versión anterior |
| `node scripts/franjas.mjs v.mp4 [--zona arriba]` | franjas o velos que aparecen en el borde (código 3 = candidatos) |
| `node scripts/voz.mjs revisar|generar …` · `node scripts/audio.mjs ducking|medir|remezclar …` | voz en off, ducking medido y cambiar el audio sin re-renderizar ([promo-recetas.md](promo-recetas.md)) |
| `node scripts/marca.mjs crear|guardar|listar|usar …` | recursos de la marca del usuario ([recursos.md](recursos.md)) |

Velocidad medida (1080p, 60 fps, 3 núcleos, sin GPU): ≈6–7 s de render por segundo de vídeo (10 s → 64–75 s).

## De Remotion a HyperFrames (para portar una pieza del kit secundario)
| Remotion | HyperFrames (`MG`) |
|---|---|
| `useCurrentFrame()/fps`, `<Sequence from>` | `t` de `escena(t)`; tiempo local `t - t0` |
| `interpolate`, `Easing.bezier` | `MG.interp`, `MG.tramo`, `MG.bezier`, `MG.CURVAS` |
| `spring()` | `MG.muelle(t, t0, {stiffness, damping, mass, sobrepaso})`, `MG.muelleEstilo` |
| `random(semilla)` | `MG.azar(semilla)` (misma fórmula: mismas semillas, mismo resultado) |
| `<CameraMotionBlur>` / `ConDesenfoque` | `MG.desenfoque(t, { ventanas, muestras, obturador }, fn)` (misma fórmula) |
| `<Audio>`, `Sonido` | bloque JSON `mg-sonido` |
| `staticFile("x")` | `comun/x` |
| `<OffthreadVideo>` | `<video class="clip">` fijo + `MG.colocaMedio` |
| `EstiloProvider`, `useEstilo()` | `MG.montar({ estilo })`, `MG.est()` |
Las demos `oscuro`, `claro`, `agencia` y `mezcla` se portaron así y se compararon con las de Remotion: timing 1,00 con
desfase 0, mismo volumen (±0,1 LUFS) y los mismos saltos de corte.
