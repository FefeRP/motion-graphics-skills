# Recetas de una promo con voz en off (comprobadas en una promo real)

Reglas y números sacados de una promo de producto de 90 s que pasó por diez versiones con el cliente, y comprobados
de nuevo en la plantilla `kit/piezas/promo.html` (13 s, marca ficticia). Complementa a
[promo-producto.md](promo-producto.md) (leyes de ritmo) y a [checklist-promo.md](checklist-promo.md) (qué comprobar).
Cada receta trae su número: si no lo cumples, se nota.

**Plantilla**: copia `kit/piezas/promo.html`. Ya trae el hook palabra a palabra con la voz, la malla a sangre, la
píldora de cristal que sale de los tiempos de la voz, el revelado del logo con todas sus capas y una tarjeta de interfaz
con microdetalles. Cambia `VOZ`, `SUBS`, `G` y el contenido; deja la mecánica.

**Scripts** (en `kit/scripts`, sin dependencias salvo ffmpeg):
| Script | Para qué |
|---|---|
| `voz.mjs revisar <guion-voz.json>` | Antes de pagar una locución: «y» de sobra, cifras, símbolos, siglas, dominios, frases largas |
| `voz.mjs generar <guion-voz.json> <carpeta>` | Toda la locución en UNA petición → `voz.wav` + `voz-tiempos.json` (tiempo de cada palabra) |
| `audio.mjs ducking` | Música que se aparta de la voz + silencio antes de cada golpe + bajadas a mano |
| `audio.mjs medir` | Voz − música por frase (objetivo: mediana ≥ 8 dB y p10 ≥ 3 dB) |
| `audio.mjs remezclar` | Cambiar música, voz o efectos de un vídeo ya renderizado SIN volver a renderizar |
| `franjas.mjs <video>` | Busca franjas y velos que aparecen y desaparecen en el borde (lo que un revisor con IA no ve) |
| `marca.mjs` | Carpeta de recursos de la marca del usuario (ver [recursos.md](recursos.md)) |

## 1. Estructura: preguntas que plantean el problema, voz que convence
- **Arranca con 2–3 preguntas que el público se hace** (0–16 s en una promo de 90 s; una sola en una de 15 s). La
  primera, conversacional («¿Cuántas pestañas abres para…?»); las siguientes pueden ser afirmaciones del dolor.
  Nada de «¿…? Con X, sí.» en serie: a la tercera suena a teletienda.
- Después, **silencio y golpe con el producto** (el revelado del logo, §6). Cada función contesta a una pregunta del
  principio, con su pantalla. El precio y la llamada a la acción, al final, antes del logo.
- La voz **convence, no describe**: frases de ≤ 12 palabras con el beneficio («Cobra en treinta segundos»), nunca la
  lista de botones que ya se ven.
- Todo se ancla a una rejilla de pulso (BPM de la música) y a los tiempos reales de la voz (`voz-tiempos.json`): ningún
  tiempo se escribe a ojo.

## 2. Hook (los 3 primeros segundos se trabajan más que todo lo demás)
- **Fotograma 0 con movimiento y significado**: un enjambre del problema (p. ej. 12–17 ventanas desenfocadas por
  profundidad que derivan) y la cámara que ya avanza. Sin fondo vacío ni logo.
- **Título palabra a palabra con la voz**: cada palabra entra en `inicio − 0,05 s` de su palabra hablada, sube 40 px,
  desenfoque 10 → 0 px, curva expo en 0,42 s. El título se maqueta entero desde el principio (palabras invisibles)
  para que nada salte de sitio al entrar la siguiente.
- **Empieza grande y se recoge**: título a ×1,25 (o 150 px) y, con la palabra clave («pestañas»), baja a ×1 (o 88 px)
  mientras se abren 5 ventanas escalonadas 0,09 s, cada una con su pop.
- Si la voz nombra algo, la cámara va a ello: expo de −0,32 s a +0,38 s respecto a la palabra, y empuja al salir.
- **Hilo conductor**: lo del hook no desaparece, se transforma (las ventanas colapsan en 0,7 s hacia un punto de
  cristal; el punto es el que luego abre el logo).
- Desenfoque de profundidad: `min(16, |z − zcámara| · 0,016)` px. **Nunca `filter: blur` en un contenedor con
  `preserve-3d`** (aplana el 3D y recorta en rectángulos): con profundidad, proyección propia (posición y escala por z).

## 3. Fondo sin huecos ni franjas
- Un shader o malla **a sangre**: cubre el lienzo entero en todos los fotogramas, determinista por `t` (gradientes
  radiales que orbitan con `sin(t·v + fase)`, o un canvas pequeño de 160×90 repintado desde `t` y escalado).
- **Sin velos**: nada de degradados oscuros detrás de los subtítulos ni de «viñeta» que se enciende y se apaga; el
  contraste lo da la píldora (§4). Sin viñeta sobre fondos claros.
- Si una capa lleva `filter: blur`, hazla **60 px más grande por cada lado** (`left: −60, width: 2040`): el desenfoque
  oscurece los bordes si la capa mide justo el cuadro.
- Antes y después de un revelado, **la misma malla** (apagada con `saturate`/`brightness` antes, viva después): no dos
  fondos distintos.
- Compruébalo: `node scripts/franjas.mjs v.mp4` y `--zona arriba` (código 3 = candidatos; confírmalos con fotogramas cada
  0,1 s). Un revisor con IA a 4 fps no las ve, o se las inventa.

## 4. Subtítulos en píldora de cristal
- Estilo (1080p): `top 952`, `fontSize 42`, `fontWeight 560`, `letterSpacing −0.01em`, `lineHeight 1.25`,
  `padding 12px 34px`, `borderRadius 999`, `background rgba(255,255,255,0.72)`,
  `backdropFilter blur(18px) saturate(1.2)`, sombra
  `0 0 0 1.5px rgba(255,255,255,.75), 0 0 0 2.5px rgba(12,34,25,.05), 0 {4→12}px {12→34}px rgba(12,34,25,0.12·k)`.
- Entrada: opacidad en 0,12 s y se posa en 0,32 s (sube 8 px, escala 0,985 → 1, desenfoque 3 → 0). Salida en 0,25 s
  bajando 4 px. **Entre dos trozos pegados no hay fundido**: cambia el texto.
- Tiempos **de la voz**, no a ojo: tabla `SUBS = [[texto que se lee, frase, nº de palabras habladas]]`; cada trozo va
  de la primera palabra − 0,08 s a la última + 0,3 s; huecos de menos de 0,35 s se cierran; avisa si las palabras no
  cuadran (`console.warn`).
- Se **lee** la forma escrita aunque se **oiga** la hablada: la voz dice «treinta», «nubo punto, i, ó»; el subtítulo
  pone «30», «nubo.io».
- **Ningún subtítulo cruza un revelado** (máscara circular, cortinilla): se cortan en `G − 0,02`.
- `backdrop-filter` funciona en 2D; dentro de una cámara 3D deja de pintar filas sueltas: ahí, copia desenfocada.

## 5. Coherencia de estilo
- **Un solo material** para todo lo que flota: si la píldora es cristal claro, las tarjetas, las ventanas y la placa
  del logo son el mismo cristal (mismo fondo, borde de 1,5 px blanco, mismas sombras).
- **Una sola dimensión**: nada de una escena 3D en un vídeo plano (ni al revés). Si una escena pide profundidad, la
  profundidad va en todo el vídeo o en ninguna parte.
- Iconos del mismo juego (trazo, luz, paleta, caja) y planos si el vídeo es plano; los 3D brillantes «premium» en un
  vídeo plano se retiran. Genéralos en el estilo de la pieza, no en el que traiga el modelo por defecto
  ([recursos.md](recursos.md) §2).
- Si el cliente pide un cambio concreto, **manda su cambio**, aunque la regla general diga otra cosa.

## 6. Revelado del logo (el momento estrella)
En el golpe `G` (el drop de la música, con 150 ms de silencio antes):
1. **Anticipación**: un punto de cristal crece de 4–10 a 17 px entre `G − 0,16` y `G − 0,04`, **toma aire** (−18 % en
   40 ms) y desaparece en `G + 0,03`, mientras la música calla.
2. **Círculo que se abre**: `R = 12 + (1 − (1 − u)^4,2) · 1138` px con `u = (t − G) / 0,92`. Velocidad
   `v = 1138 · 4,2 · (1 − u)^3,2 / 0,92` px/s (la usan el halo y el desenfoque).
3. **Banda esmerilada** por delante del borde: la misma malla con `blur(24px)` y un velo blanco al 10 %, recortada a
   `Rd = R + min(34, R(t + 0,015) − R + 8)`. Más ancha (50 ms por delante) parece un halo enorme.
4. **Halo**: aro de ancho `10 + min(40, v · 0,0085)` px con `feGaussianBlur 6`, opacidad 0,4·(1 − u); **aro nítido** de
   2,5 px blanco.
5. **Eco**: aro de 1,5 px a `R(t − 0,08)`, opacidad 0,32, solo con R > 380 (fuera del logo).
6. **Estelas**: 14 aros de 1,6 px a `R(t − d)` con d de 12 a 112 ms y 0,34–0,54 s de vida, opacidad ≤ 0,09 (a 0,22 se
   leen como un disco de vinilo).
7. **Grano** dentro del círculo (`overlay` a 0,16 que se apaga en 0,7 s) y **malla revelada que se enfoca**: blur
   14 → 0 y saturate 1,22 → 1 en 0,6 s, escala 1,08 → 1 en 1,3 s (si el recorte va en la misma capa que escala, divide
   el radio entre la escala).
8. **Logo**: entra en `G + 0,04`, escala 0,86 → 1 con rebote `1 + (k+1)·y³ + k·y²` (y = x − 1, k = 0,55) en 0,55 s,
   desenfoque 7 → 0 en los primeros 180 ms, `drop-shadow` que se posa (2 → 9 px de caída, 4 → 20 px de radio, 0,16).
9. **Nombre**: con la voz que lo dice, máscara `linear-gradient(90deg, #000 pos−9%, transparent pos+3%)` y
   `translateX(−26 → 0)`; su caja crece de 0 a su ancho para que **el conjunto quede centrado** en todo momento.
   Nunca `clip-path: inset` en logos (corta en seco).
10. Sonido: whoosh suave en `G + 0,02` (bajo: el drop ya es el golpe). Después, flotación de 3–4 px cada 1,8 s.

## 7. Microdetalles (lo que separa «correcto» de «caro»)
- Palabras con huecos decrecientes (`ti = a + 0,38·(1 − 0,84^k)`) cuando no van atadas a la voz.
- Ventanas con semáforos, 4 capas de sombra (1, 6, 18 y 40 px) y contenido verosímil (barras de texto, cifras reales).
- Cifras que cambian en caja de **ancho fijo** (`tabular-nums` + `width`), texto con `nowrap`: nada baila.
- Estados que cambian con su gesto: contador 0 → 30 s, barra que se llena con la palabra, chip «Pendiente» →
  «Cobrada» con un pulso del 8 %, check que se dibuja (`pathLength 1` + `strokeDashoffset`) y una onda.
- **Tecleo letra a letra con la voz**: «nubo» cuando lo dice, el punto con «punto», cada letra con la suya; cursor que
  parpadea y se apaga al acabar.
- Haces en abanico (24°), curvas con longitud de arco, ondas al llegar y destello al nacer; un solo trazo por línea
  (halo de 12 px + color de 3 px).
- Nada quieto: deriva de cámara, flotación de 4 px cada 1,8 s y un asentamiento final (escala 1 → 1,025 en el último
  segundo).

## 8. Música: natural, con ducking y el drop en el revelado
- **Para pruebas o sin presupuesto**: `scripts/musica.mjs --config` (sintetizada, gratis) con una sección «tensión»
  de 0,15 s en silencio justo antes de `G` y el drop en `G` (ejemplo: `kit/motion/musica/promo.json`).
- **Música natural (Eleven Music, de pago; con permiso y presupuesto)**: `composition_plan` con `music_v1`.
  Estilos positivos que funcionaron: `organic deep house with a real groove, round electric bass sidechained to the
  kick, dry tight drums with live shakers and congas, warm electric piano chords, 122 bpm steady tempo, sounds like a
  real professionally produced and mixed track, natural and musical, human feel, premium modern brand film
  soundtrack, instrumental, no vocals`. Negativos: `vocals, singing, vocal chops, cheap stock music, generic
  royalty-free corporate, video game music, chiptune, cheesy, orchestral trailer, epic cinematic, festival edm, big
  room, trap, lo-fi, tempo changes`. No se pueden citar artistas ni marcas.
  - Ignora las duraciones de sección: **alinea tú** (mide el BPM, estira a la rejilla con rubberband, reordena
    compases con fundidos de 6 ms cortando 4 ms antes del golpe) y genera 2 a la vez para elegir.
- **Ducking**: `node scripts/audio.mjs ducking musica.wav voz.wav musica-duck.wav --golpes G --voz-inicio <s>
  --duracion <s> [--bajadas '[[a,b,g]]']`: llave ×3, silencio de 150 ms antes de cada golpe muestra a muestra
  (`volume=enable` se come 60 ms del ataque). Mezcla la música a ×0,6.
- **Mide, no escuches solo**: `audio.mjs medir voz-colocada.wav musica-duck.wav --frases frases.json` → mediana ≥ 8 dB
  y p10 ≥ 3 dB por frase. Si una queda tapada, `--bajadas` en esa frase (0,3–0,6). **Bajo la palabra del logo, en el
  drop, no bajes de ×0,6**: −8 dB apagan el drop (y la medida de una palabra de < 0,8 s no es fiable: escúchala).
- Comprueba el drop con la envolvente: `volumedetect` en `[G − 0,13, G]` ≈ −80 dB y en `[G, G + 0,25]` ≈ −12 dB. Un
  revisor con IA a 1–2 fps no mide décimas.
- **Cambiar la música sin re-renderizar**: `node scripts/audio.mjs remezclar <pieza> v.mp4 v2.mp4 --musica otra.wav
  [--voz voz.wav --voz-inicio s]` (imagen copiada bit a bit, loudnorm −14 LUFS). Compara el MD5 de la imagen antes y
  después (`ffmpeg -i v.mp4 -map 0:v -c copy -f md5 -`).

## 9. Locución: escrita como suena
- **Pocas «y»**: de 12 a 3 en 90 s; ninguna frase empieza por «Y». Enumera con comas o parte la frase.
- **Cifras, siglas, símbolos y dominios en letra**, como se dicen: «veinte gigas» (subtítulo «20 GB»), «cinco con
  noventa y nueve», «trescientos sesenta y cinco» (con «365» el TTS se atasca), «tumarca punto, o, erre, ge». La «ó»
  con tilde se dice como letra; sin tilde suena a conjunción.
- `voz.mjs revisar` lo marca todo antes de generar (cada toma cuesta).
- **Toda la locución en UNA petición** (misma entonación): `eleven_multilingual_v2`, stability 0,45, similarity 0,8,
  style 0,4, speaker boost, speed 0,97; con tiempos por carácter (`with-timestamps`), cortada por el medio de los
  silencios. Edge-TTS (gratis) sirve para probar tiempos y montaje.
- Para rehacer una frase: misma voz y ajustes, `previous_text` / `next_text` y 3–4 variantes; elige a ciegas en dos
  rondas con distinto orden (el oído prefiere la primera que oye). Las colas se cruzan con la frase siguiente 0,12 s.
- Cadena de voz: `bass=g=1.5:f=120:w=0.8,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=1.4,
  equalizer=f=3000:t=q:w=1.2:g=1.5,alimiter=limit=0.9`.

## 10. Versiones: arrastrar TODOS los cambios y comprobarlos antes de entregar
- Lleva una **lista acumulada** de lo pedido desde la primera versión (no solo lo de la última): cada versión la cumple
  entera. Una versión que arregla lo nuevo y deshace algo de antes es peor que no entregar.
- Una **base fija**: toca solo lo pedido y comprueba que el resto sale idéntico (la voz igual bit a bit; la imagen de
  lo no tocado, por MD5 o diferencia de fotogramas).
- Antes del render bueno: fotogramas de cada cambio, hoja `fps=4,tile=4x4` del tramo, cortes con
  `select='gt(scene,0.1)'`, brillo con `signalstats` (YAVG) para fundidos raros, `franjas.mjs`, `medir-ritmo.cjs`
  (quieto < 0,6) y `audio.mjs medir`.
- Revisor con IA (4 fps) con **preguntas cerradas y rango mm:ss** sobre lo cambiado («¿se ve algún subtítulo entre
  00:05,8 y 00:06,8?»). Inventa desfases de ~250 ms, fechas, tirones, franjas y pausas, y tiene sesgo por el orden:
  **cada fallo que diga se mide** antes de tocar nada.
- Para no pisar una entrega: sufijo de versión (`-v2`) y solo la última versión en la carpeta de entregas.

## 11. Trampas técnicas (cada una costó una versión)
- Lanza el render largo en segundo plano con la herramienta del agente, no con `&` en la shell (el render muere con el
  proceso padre: `render_cancelled_parent_exited`).
- Un tramo reutilizado de otra versión que llega a la transición del original cuela un fotograma de la pantalla
  siguiente: recórtalo antes de la transición.
- Índices de palabra en el código (`palabras[7]`) se rompen al cambiar el texto: busca **por palabra**
  (`pal("C", "treinta")`).
- `sidechaincompress` dura lo que la entrada más corta: rellena la llave (`apad`) o la música se acorta. Un `apad` sin
  límite delante de `atrim` puede dejar ffmpeg girando: usa `apad=whole_dur=<s>`.
- Sin GPU, un `box-shadow` grande se recorta en cuadrado: usa `radial-gradient`.
