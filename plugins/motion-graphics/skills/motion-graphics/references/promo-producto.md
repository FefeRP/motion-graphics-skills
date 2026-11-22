# Promo de producto (lanzamiento SaaS) de primer nivel

Guía para promos de software de 15–60 s: lanzamientos, «presentamos X» y alternativas a la competencia. Sale de medir 10
lanzamientos reales (Linear Releases, Agent y Loops; Vercel v0; Raycast; Arc 1.0; Framer; Notion Calendar y Mail;
Stripe Sessions) a 5 fps con un revisor de vídeo, con los cortes contados con ffmpeg, y de las muestras grandes
publicadas (Refs.video, 1.952 lanzamientos; shipscenes, 720; motionmaxxing). Los números son medianas; las fuentes
están en `investigacion/` del proyecto de origen.

**Úsala SIEMPRE antes del guion de una promo o lanzamiento**, y pasa la
[checklist anti-aburrimiento](checklist-promo.md) antes de dar el vídeo por bueno.

## Por qué aburre una promo que «cumple las reglas»
Caso real: una promo de 43 s con voz, música al pulso, 3D, shaders y pantallas reales, que el cliente encontró «muy
aburrida». El revisor midió:
- 11 s hasta ver el producto;
- un evento cada 2,2 s;
- cada producto en el mismo molde: icono a la izquierda, ventana entera inclinada a la derecha y 3,5 s de plano;
- el mismo whoosh en cada cambio y una interfaz «muerta», sin cursor, sin clics y sin zoom al detalle;
- un destello blanco genérico, 9 s de precio quieto y un cierre plano.

Cumplir la rejilla y meter 3D no basta: **aburre lo predecible**. Mismo molde, misma escala, misma transición, la voz
narrándolo todo y la UI a distancia.

## Las 10 leyes (con números)
1. **El producto en el fotograma 0, moviéndose.** Un componente real a escala macro o el objeto de la marca, ya en
   movimiento, con un transitorio de sonido (clic, tecla o subgrave) en el fotograma 0. Primera palabra legible antes
   de **0,7 s** y producto antes de **3,5 s**. Nunca abras con el logo, con un «Introducing…» ni con una pregunta
   larga sobre un fondo vacío.
2. **Densidad.** Mediana de **un evento cada ≤ 1,8 s** (en la demo, ≤ 1,2 s) y **algo nuevo cada 0,2–0,5 s** dentro de
   cada plano: deriva de cámara, cascada, contador o luz. Ninguna racha quieta de más de 3 fotogramas salvo el logo
   final, que aguanta 0,6–1,4 s.
3. **Varía la escala y el molde.** Alterna general, medio y detalle macro (≥ 2,5×). Dos bloques seguidos **nunca** con
   la misma composición ni la misma transición. Cada producto o función se enseña con un truco distinto.
4. **La UI viva y de cerca.** Recorta el componente (≥ 55 % del ancho del cuadro, o cortado por el borde), no la
   ventana entera a lo lejos. Mete cursor con trayectoria Bézier y clic, tecleo, confirmaciones y push-in al detalle.
   El texto de la UI debe medir **≥ 2 % de la altura** del cuadro (≥ 22 px a 1080) o no se enseña.
5. **Texto corto y grande.** De 1 a 4 palabras por pantalla. Titulares al **6–12 % de la altura** (65–130 px a 1080) y
   ráfagas al 25–40 %. La entrada dura **150–400 ms** (máscara o desenfoque a nítido). Lectura de ≥ 1,2–2 s, o
   ≥ 0,6 s en ráfaga al pulso. El texto se adelanta **5–6 fotogramas** a la palabra de la voz.
6. **Transiciones con continuidad y todas distintas.** Cada escena nace de un objeto de la anterior: morph de
   componente, zoom a través, match cut por forma, objeto que viaja o whip-pan. **Máximo 2 usos** de cada tipo por
   vídeo. Nada de fundidos de diapositiva ni destellos blancos de stock.
7. **Curvas.**
   - Entradas con `expo.out` / `cubic-bezier(0.16,1,0.3,1)`: 300–600 ms en la UI, 600–1000 ms en la escena.
   - Salidas con `power3.in` en 200 ms.
   - Overshoot **≤ 5 %**, y solo en confirmaciones (`0,95 → 1,02 → 1` en 250 ms).
   - Nunca lineal, nunca muelle con rebote visible.
8. **Sonido con firma, no un whoosh repetido.**
   - Cada acción tiene su sonido: tecla, clic, confirmación, envío, impacto.
   - El whoosh empieza **80–100 ms antes** del movimiento y tiene el pico en el corte.
   - Antes del golpe grande va riser → **silencio de 100–200 ms** → impacto en el downbeat.
   - Un solo sonido dominante por pulso.
9. **La música manda; la voz, poca.** Solo 3 de 10 lanzamientos llevan voz. Si la hay:
   - frases de ≤ 6 palabras que **no** describan lo que se ve;
   - huecos de solo música de ≥ 1 compás;
   - la voz con energía en el giro.
   La pieza tiene que funcionar sin sonido.
10. **Cierre con clímax.** En los últimos 3–6 s llega una ráfaga de lo visto al pulso o un colapso de todo hacia el
    logo. Después, el logo y la CTA, quietos 0,6–1,4 s. El precio o la cifra se resuelve en una **ráfaga de ≤ 4 s**,
    no en una tabla quieta.

## Plantillas de estructura (por segundos)
Pulso P = 60/BPM; a 120–128 BPM, 1 compás ≈ 1,9–2 s. Las secciones caen en compases enteros.

**15 s (gancho para redes):**
- 0–2: hook (producto macro y frase de 2–3 palabras);
- 2–11: tres beats de demo de 3 s;
- 11–13: ráfaga;
- 13–15: logo y CTA.

**30 s:**
- 0–2: hook;
- 2–5: fricción, en 2–3 cortes rápidos;
- 5–6: giro;
- 6–22: demo en 4 bloques de ~4 s, cada uno con otro truco;
- 22–26: prueba o ráfaga (cifra, precio, comparativa);
- 26–30: colapso al logo y CTA.

**45 s:**
- 0–3: hook;
- 3–8: fricción;
- 8–9,5: giro con silencio y golpe;
- 9,5–32: demo en 5–6 bloques de 3–4 s (la UI a 2–3× su velocidad real);
- 32–38: prueba o ráfaga;
- 38–45: clímax, logo y CTA.

**60 s:**
- 0–4: hook;
- 4–14: fricción;
- 14–48: demo con un respiro de 1 compás a mitad;
- 48–54: ráfaga;
- 54–60: logo y CTA.

## Plantilla de ritmo (rellénala en `GUION.md` antes de animar)
```
t     | compás.pulso | escala (G/M/D/macro) | qué entra / cambia | nace de | transición | cámara | texto (palabras) | sonido
0.00  | 1.1          | macro                | barra de envío      | —       | —          | push 1→1.15 | —           | tecla
0.47  | 1.2          | macro                | «tu dominio»         | barra   | máscara    | deriva      | 2           | clic
```
Antes de seguir, comprueba en la tabla:
- ninguna escala se repite tres filas seguidas;
- ninguna transición sale más de 2 veces;
- no hay más de 1,8 s entre filas.

## Recetas de hooks (0–2 s)
1. **Macro de un componente real.** La barra de búsqueda o el campo de envío a 3–5×, con profundidad de campo. Se
   teclea a 12–15 car./s, con un clic por carácter. A 1,2–1,8 s se aleja hasta ver la pieza entera (Raycast 00:01–00:05).
2. **Guías que forman el objeto.** Unas líneas finas dibujan el contorno del componente o del logo en 0,6 s y se
   rellenan en el pulso (v0 00:00–00:04).
3. **El objeto de la marca cruzando.** Un objeto con significado cruza la pantalla en 1,2 s y su posición X revela el
   titular con `clip-path` (Notion Mail 00:00–00:02). Úsalo una vez, no siete.
4. **Pregunta-golpe.** 2–3 palabras al 12–25 % de la altura, en corte seco sobre un golpe de bajo. A los 0,6 s la
   palabra clave cambia (por ejemplo «8,23 €» que se tacha) y a los 1,2 s ya hay producto.
5. **Contraste de escala.** Un objeto pequeño que llena el cuadro de un salto de cámara (zoom a través) en el
   segundo pulso.

## Recetas de transición (máximo 2 usos de cada una por vídeo)
| Receta | Cómo (HyperFrames / Three.js) | Duración |
|---|---|---|
| Morph de componente | El elemento A interpola tamaño, radio y posición hasta ser B (Flip a mano: `interp` de `left/top/w/h/radius`); el contenido de A sale con opacidad en los primeros 120 ms y el de B entra en los últimos 150 ms | 300 ms (icono) – 800 ms (barra → ventana) |
| Zoom a través | `MG.ZoomAtraves` o escala de un texto o botón por encima de 3× hasta cubrir el cuadro; la escena siguiente cambia debajo cuando está cubierta | 500–700 ms, `expo.in` → `expo.out` |
| Match cut por forma | La forma A (círculo, tarjeta) en el mismo sitio y tamaño que la forma B; corte en la máxima velocidad de un push-in | corte seco + whoosh |
| Objeto que viaja | El icono, la tarjeta o el punto sale de la escena A y aterriza con un papel nuevo en B (como etiqueta, botón o nodo) | 500–900 ms |
| Whip-pan | La cámara barre 1–1,5 anchos de cuadro con desenfoque horizontal de 20–40 px en el pico | 300–400 ms |
| Flip 3D | `rotateY` 180° con `backface-visibility:hidden` y un brillo a 90° | 400 ms |
| Ráfaga al pulso | 1–3 palabras o cifras por pulso, en corte seco, al 25–40 % de la altura | 600 ms cada una (≥ 0,6 s) |
| Colapso al logo | Las piezas vistas vuelven en cámara a su sitio y se aplanan en el logo (rotación a 0° y ortográfica) | 1,5–2,4 s |

## Enseñar la UI real sin aburrir
- **Nunca la ventana entera más de 1,5 s.** Entra entera (contexto) y en ≤ 1 pulso empuja al detalle a **1,8–3×** con
  `expo.out` en 600–800 ms, con el `transform-origin` en el elemento.
- **Desmonta en capas.** Los paneles en Z separados 40–120 px, con entradas desfasadas 40–50 ms y la cámara en
  paralaje (rotateX 15–25°, rotateY ±15–30°, deriva de 2–5° durante el plano).
- **Cursor.** Grande (28–36 px a 1080), con trayectoria Bézier y frenado `expo.out`, que se pasa ~5 px y vuelve. Al
  clic, el botón baja a 0,96 y vuelve en 120 ms, y suena un clic en el mismo fotograma. El primer clic va a velocidad
  real; los siguientes, más rápidos. La cámara **no** persigue al cursor.
- **Tecleo.** 12–15 car./s con ±20 % de variación, un clic por carácter (±3 % de tono) y el texto con datos verosímiles.
- **Confirmaciones.** Toast o check con `0,95 → 1,02 → 1` en 250 ms y un sonido de 80–120 ms.
- **Contadores y cifras** que se mueven (12 → 212; 8,23 → 5,99), siempre reales.
- **La UI a 2–3× su velocidad real**, una acción por plano.

## Diseño de sonido (además de `motion-ritmo-sonido`)
- Un catálogo por pieza:
  - tecla (por carácter);
  - clic (cursor);
  - confirmación (dos notas);
  - envío (whoosh corto ascendente);
  - impacto grave (giro y logo);
  - riser (antes del giro);
  - tic (cascadas, volumen 0,12–0,2).
- **No repitas el mismo whoosh más de 3 veces**: alterna el normal, el suave y el rápido, y desplaza el tono.
- **Silencio de 100–200 ms** antes del golpe grande y del logo. El riser se corta en seco justo antes.
- Música:
  - ducking de 6–10 dB bajo la voz (ataque de 10–30 ms, release de 300–600 ms);
  - la música 15–25 dB por debajo de la voz;
  - máster a −14 LUFS y pico < −1 dBTP.

## Lo que delata una promo de IA o de plantilla (evítalo)
- Composición de diapositiva repetida: titular a la izquierda y dispositivo o ventana a la derecha, una y otra vez.
- Fundido + escala en todo, todo entrando a la vez, curvas lineales o rebotes visibles.
- Cromo inventado: contadores «02/05», timecodes, corchetes de esquina, HUD.
- Partículas, rejillas de puntos o «datos» decorativos sin significado.
- Gráficas o cifras inventadas; iconos dibujados por la IA; la fuente por defecto en todo.
- Fondos de librería en bucle durante más de 10 s.
- La voz narrando cada plano con frases largas y sin modulación.
- La misma transición o el mismo whoosh 5 o más veces.
- La UI muerta: estados que cambian solos, sin cursor ni sonido.
- Tecleo de cadencia mecánica; zooms grandes de una captura rasterizada (en HTML, escala vectores y texto vivo).

## Proceso recomendado
1. Mide 2–3 referencias del mismo tipo (descárgalas a 480p y pásalas por el revisor con el prompt de
   [checklist-promo.md](checklist-promo.md)) y apunta sus números en `BRIEF.md`.
2. Escribe el guion con la plantilla de ritmo y pasa las 3 comprobaciones de la tabla.
3. Haz un **animático** antes del render completo: fotogramas cada 0,5 s en una hoja de contacto, revisable en 1 min.
4. Renderiza, pasa la checklist y el revisor, corrige y repite hasta aprobar.
