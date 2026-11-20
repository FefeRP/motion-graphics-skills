# Elementos generados con IA (Higgsfield) dentro de un motion graphics

La IA fabrica **piezas**, no el vídeo: un objeto, un fondo, una textura, un personaje o un producto, en imagen o en
clip (con bucle perfecto si hace falta), que luego se integran en la pieza HTML con la misma cámara, color, luz y
ritmo que lo hecho por código. Texto, cifras, interfaz y logos van **siempre** por código.

## 0. Antes de generar (no se salta)
1. **Presupuesto máximo** acordado con quien paga (en créditos o en dinero). Sin presupuesto, sin saldo o sin la
   prueba activa: no se genera; se hace por código (`MG.Manchas`, `Aurora`, `Halo`, `Grano`, formas y partículas) y se
   dice qué se habría generado y cuánto costaría.
2. **Lista de elementos** con modelo, modo, duración, resolución y relación de aspecto, y el **precio estimado de cada
   uno** con `estimate_image_cost` / `estimate_video_cost` (no cobran). Suma el total y añade un 50 % de margen para
   repeticiones. Si pasa del presupuesto, recorta (menos segundos, 720p, imagen + movimiento por código).
3. `balance` antes de cada generación y después. Si ha bajado más de lo estimado, para y avísalo.
4. Una generación cada vez, nunca en lote. Prueba barata primero (imagen, 480–720p, 5 s); la buena, después.

Precios de referencia (créditos, noviembre de 2026; compruébalos siempre con `estimate_*`):

| Modelo | Uso | Créditos |
|---|---|---|
| GPT Image 2.6 | imagen con texto o composición exacta, objetos limpios | ≈0,25 |
| Nano Banana 2 / Pro | imagen; **editar** una imagen dada (cambiar fondo, iluminar, variantes del mismo objeto) | ≈1,5 / 2 |
| Seedream 5.5 | imagen fotográfica o de material (texturas, superficies, paisajes) | ≈3,5 |
| Seedance 2.0 mini (5 s) | clip barato de prueba | ≈5 |
| Seedance 2.0 (5 s / 10 s) | clip bueno: coherente con referencias, movimiento lento y continuo | ≈22,5 / 45 |
| Seedance 2.5 (5 s) | clip de más calidad | ≈35 |
En Seedance pon siempre `generate_audio: false` (el sonido es el del kit).

## 1. Qué modelo para cada elemento
| Elemento | Cómo | Modelo |
|---|---|---|
| **Objeto o producto** quieto (recortable) | imagen sobre fondo liso (§3) → `alfa.mjs --modo croma` o `diferencia` → `MG.Elemento` | GPT Image o Nano Banana; producto real: Nano Banana **editando su foto** |
| **Producto que gira / se despieza** | imagen clave del producto → Seedance image-to-video, plano fijo, giro lento, fondo liso | Seedance 2.0 |
| **Fondo** (estudio, paisaje, atmósfera) | imagen 16:9 → movimiento por código (deriva, `Camara2D`, paralaje por capas) o clip de 5–10 s en bucle | Seedream / Nano Banana; clip: Seedance |
| **Textura** (papel, metal, tela, cristal, grano de película) | imagen cuadrada repetible ("seamless tileable") → `background-repeat` o máscara | Seedream |
| **Materia viva**: humo, fuego, agua, tinta, polvo con luz | clip **sobre negro puro**, cámara fija → `bucle.mjs` → `alfa.mjs --modo negro` → `<video class="clip">` con `screen` | Seedance 2.0 |
| **Personaje** (mascota, persona) | hoja de referencia (frente y cuerpo entero, mismo vestuario) → Seedance con referencias; fondo liso para recortar | Nano Banana + Seedance |
| **Motion graph entero con IA** | planos generados (mismas palabras, luz y estilo en todos) montados con transiciones y rótulos por código | Seedance + imagen clave por plano |

## 2. Cómo escribir el prompt (en inglés)
Orden: **sujeto → contexto → acción → estilo → cámara → luz**, frases y no etiquetas, menos de ~120 palabras.
- Un solo movimiento de cámara, descrito respecto al sujeto ("the camera slowly orbits the bottle at constant speed").
- Con imagen de inicio: describe **solo el movimiento**, no lo que ya se ve.
- Restricciones en positivo al final (no hay negativos): "clean seamless background, no text, no logos, no watermark".
- Nada de marcas, personas famosas ni nombres de productos ajenos (el filtro devuelve `ip_detected`).
- **Para que no parezca IA**: material y luz concretos ("brushed aluminium, soft key light from top left, subtle
  contact shadow"), lente real ("85mm, f/4"), imperfecciones pequeñas ("faint dust, fine film grain"), movimiento lento
  y físico; evita "hyperrealistic, 8k, ultra detailed, cinematic masterpiece", piel perfecta y simetría total.
- **La luz de la escena manda**: pon la luz del elemento en el mismo lado y color que el halo o la luz de la
  dirección (`est().luz`), o el elemento se verá pegado.

Plantillas:
- Objeto para recortar: `A matte ceramic coffee cup, three-quarter view, centered, on a perfectly flat pure #00B140
  green background, soft key light from top left, gentle shadow under the cup only, product photography, 85mm, sharp
  focus, no text, no logo.`
- Humo en bucle: `Thin white smoke slowly curling upward in the center of the frame, on a pure black background,
  locked-off camera, no camera movement, slow continuous motion, soft rim light from the left, fine detail, no other
  objects.`
- Fondo: `Wide empty photo studio with a dark graphite seamless backdrop and a soft orange glow on the floor, shallow
  depth of field, quiet and minimal, 35mm, gentle haze, no people, no text.`

## 3. Recorte y transparencia (`scripts/alfa.mjs`)
| Fondo pedido | Modo | Para |
|---|---|---|
| verde/azul liso (#00B140) | `--modo croma --color auto` | objetos opacos (productos, personajes) |
| negro puro | `--modo negro` | lo que brilla o es claro: humo, fuego, chispas, polvo con luz |
| blanco puro | `--modo blanco` | tinta, sombras, trazos oscuros |
| la MISMA imagen sobre negro y sobre blanco (edítala con Nano Banana: "same image, background changed to pure black, subject unchanged") | `--modo diferencia --negro n.png --blanco b.png` | cristal, líquido, humo semitransparente (alfa exacto) |
Salidas: PNG/WebP recortado (`--recortar`), `alfa.webm` (VP9 con alfa: lo que usa HyperFrames) y póster. Comprueba el
borde sobre un color chillón antes de darlo por bueno.

## 4. Bucle perfecto (`scripts/bucle.mjs`)
- Pide **plano fijo** y movimiento cíclico o continuo (deriva, humo, agua, luz que respira). Si la cámara viaja, el
  cruce se ve doble.
- `node scripts/bucle.mjs clip.mp4 salida.mp4 --cruce 1 --fps 60` funde el último segundo sobre el primero y mide la
  costura (`medir-bucle.mjs`: salto en la costura ≈ al de cualquier otro fotograma, ≤ 1,5×).
- Para alfa, primero el bucle y después `alfa.mjs`.

## 5. Descargar y registrar
- `generate_image` / `generate_video` → `jobs_wait` → URL del resultado → `curl -L -o kit/comun/elementos/<pieza>-<elemento>-v<N>.<ext> "<url>"`
  **en el momento** (las URLs caducan).
- `kit/comun/elementos/REGISTRO.md`, una entrada por generación: modelo y ajustes, prompt exacto, coste estimado,
  saldo antes y después, resultado (BUENO/REGULAR/MALO y por qué).

## 6. Integrar en la pieza
- **Imagen**: `MG.Elemento(t, { src: "comun/elementos/taza.png", ancho, alto, ajuste: "contain", recorte: [x, y, w, h],
  mascara: "radial-gradient(closest-side, #000 60%, transparent)", color: { color: est().acento, fuerza: 0.3, modo:
  "color" }, mezcla: "screen" })` dentro de un `Movil` (entra, se mueve y sale como cualquier pieza). El tinte se recorta
  con el alfa de la imagen.
- **Clip**: `<video id="humo" class="clip" src="comun/elementos/humo.webm" data-start="2" data-duration="6" muted
  playsinline>` FIJO en el HTML (HyperFrames lo decodifica al fotograma) y en `escena(t)`:
  `MG.colocaMedio("humo", { left, top, transform: "scale(1.2)", opacity, mixBlendMode: "screen" })`.
- **Color**: lleva el elemento a la paleta de la dirección (tinte o `filtro: "saturate(.8) contrast(1.05)"`) y pon
  `MG.Grano` y `MG.Vineta` encima de TODO (código y elementos), para que compartan textura.
- **Sincronía**: los eventos del clip (un golpe de agua, el giro que se cierra) se miden con `medir-ritmo.cjs` y se
  ponen en la tabla del guion; los efectos de sonido y los rótulos caen en esos tiempos.
- **Profundidad**: el elemento se mueve con la cámara de su capa (fondo más lento que el primer plano) y lleva
  desenfoque si está lejos (`b`).
- Demo de integración: `kit/piezas/elementos.html` (clip VP9 con alfa en bucle + imagen con máscara y tinte + texto
  por código). Sus elementos son sustitutos hechos por código; con los generados se cambian los ficheros y nada más.

## 7. Revisión antes de entregar
Fotogramas en 4–6 tiempos + el clip entero a velocidad real: bordes (halo verde, recorte), manos, caras, texto
deformado, objetos que se funden, cambios de luz, la costura del bucle. Si algo delata la IA, se repite (dentro del
presupuesto) o se sustituye por código.
