---
name: motion-mapas
description: Técnica de motion graphics de MAPAS 3D EN PERSPECTIVA en Remotion sin GPU — estilo navegador de mapas: ciudad con edificios extruidos que crecen desde el suelo, cámara que se inclina, gira y sigue un punto, ruta que se dibuja por las calles con su cabeza, barridos con desenfoque de movimiento, capa de tráfico, flechas en el suelo, pin que cae con onda, tarjetas ancladas a un edificio y cierre con el mapa plegado en una tarjeta. Para logística y reparto, movilidad, inmobiliarias, turismo, locales, "dónde estamos" y cualquier recorrido. La usa la skill maestra motion-graphics; úsala también sola para "un mapa animado", "una ruta en 3D", "estilo Google Maps / mapa de navegación".
---

# Mapas 3D en perspectiva

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`). Motor: `kit/src/motion/base/mapa3d.tsx`, un solo
`<canvas>` 2D dibujado por CPU (proyección propia, sin WebGL ni Three.js). Pieza de ejemplo verificada:
`kit/src/motion/recreaciones/mapa-ruta.tsx` (`RecMapaRuta`, 12 s, 60 fps): **cópiala y cambia la ruta y los textos**.

## Lo que hace que parezca un anuncio de mapas (medido en la referencia)
- **La cámara sigue a un punto** (el usuario, el repartidor): el punto queda casi fijo en pantalla y el mundo se mueve.
- **Tres alturas de cámara**: cenital (inclinación 0°) para "dónde", navegación (55–65°) para "por dónde" y casi a ras
  de suelo (75–80°) para "aquí". Giros grandes (hasta 180°) con ease-in-out y frenada suave; cada movimiento 0,5–1,2 s.
- **Un cambio cada ~1 s** a ~100 BPM; los saltos grandes de cámara son **barridos con desenfoque** de 0,5–0,7 s
  (subir a vista alta, bajar a otro barrio), con un *whoosh* en cada uno.
- **Paleta casi blanca**: suelo `#F1F3F4`/`#E8EAED`, calles `#DADCE0`, parques `#CEEAD6`, edificios blancos con paredes
  apenas grises, ruta azul `#2F6BFF`–`#1A73E8`, pin rojo/naranja. El color lo ponen la ruta, el pin y las tarjetas.
- **Edificios que crecen** desde el suelo con un pequeño rebote, en ola desde el punto (no todos a la vez).
- **Ruta con trazo que avanza** (trim path) y la cabeza con aro blanco; las tarjetas entran desde escala 0 con
  sobrepaso y quedan ancladas a su edificio; el pin cae y deja un aro en el suelo.
- **Hilo conductor**: el pin del logo gira y se convierte en el punto azul; al final, la ruta (o un trazo sobre el mapa)
  dibuja el símbolo y el mapa se pliega en una tarjeta que gira y se convierte en el logo.

## Receta (12 s; tiempos de `RecMapaRuta`)
| t (s) | Qué pasa | Cámara | Sonido |
|---|---|---|---|
| 0–1,1 | Símbolo de la marca; su aro se cierra y queda el punto | — | whoosh suave |
| 1,1–1,4 | Aparece el mapa bajo el punto + tarjeta de giro | cenital, muy cerca (dist 170) | pop |
| 1,25–2,5 | Los edificios crecen en ola desde el punto; la cámara se inclina | inclina 6 → 58° | golpe |
| 2,55–3,25 | **Barrido arriba** con desenfoque; tráfico en las avenidas | dist 260 → 1000 | whoosh rápido |
| 3,0–6,0 | La ruta avanza por las calles; ficha anclada a un edificio (pin + tarjeta con datos) | vista alta, giro lento | pop, tic |
| 5,85–6,6 | **Barrido abajo** al punto | dist 1080 → 330 | whoosh |
| 6,2–8,6 | Flechas en el suelo, el destino se tiñe y sube, el pin cae con onda, etiqueta "llega en…" | 60°, giro | impacto, pop |
| 8,3–9,0 | **Barrido arriba** a cenital centrado en la ruta | dist → 1250, inclina → 0 | whoosh rápido |
| 9,0–10,2 | El mapa se pliega en tarjeta (rotateX/rotateZ/escala) sobre fondo noche; un trazo dibuja el símbolo | — | subida |
| 10,4–12 | Marca que se teclea + lema | — | impacto |

## Construir
```tsx
import { MapaCanvas, generaCiudad, rutaPorCruces, camaraMapa, olaCrece, enMapa, medirRuta, PALETAS_MAPA } from "../base";
const CIUDAD = generaCiudad({ semilla: 11, cols: 24, filas: 24, parques: [[13, 9]], rotondas: [[12, 12]] }); // UNA vez, fuera del componente
const RUTA = rutaPorCruces(CIUDAD, [[9, 8], [12, 8], [12, 12]]);        // por cruces de la rejilla: siempre va por calle
const cam = camaraMapa(CLAVES, t);                                       // claves {t, dist, inclina, giro} con PCHIP
<MapaCanvas t={t} ciudad={CIUDAD} cam={{ ...cam, x, y }} paleta={PALETAS_MAPA.claro}
  crece={olaCrece(t, 1.25, RUTA[0][0], RUTA[0][1])}
  rutas={[{ pts: RUTA, progreso, ancho: 10, halo: 1, cabeza: true }]}
  niebla={[dist * 1.2, dist * 2.6]} submuestras={barrido ? 5 : 1} obturador={1 / 45} opcionesEn={opciones} />
```
- **Coordenadas en metros** (x este, y norte, z arriba). `giro` 0 = mirar al norte, −90 = mirar al este.
- `enMapa(cam, x, y, z)` da la posición en pantalla de un punto del mundo: úsala para **anclar HTML** (pines, tarjetas,
  etiquetas). Las etiquetas miran siempre a cámara (no se deforman con la perspectiva), como en las apps de mapas.
- `resalta=[{ id, color, k, sube }]` tiñe y levanta un edificio (destino, almacén). `flechas`, `ondas` y `trafico`
  completan el lenguaje del navegador. `PALETAS_MAPA.noche` para la versión oscura.
- **Datos reales**: `Ciudad` es solo polígonos en metros; puedes llenarla con tus propios datos (abajo).

## Reglas y gotchas (sin GPU)
1. **Todo en UN canvas 2D** con `getContext("2d", { willReadFrequently: true })` (sin GPU, Chrome usa SwiftShader y el
   canvas acelerado va 3–4× más lento). Nada de un `div` por edificio ni de 3D CSS: miles de nodos con `preserve-3d`
   hunden el render y se ordenan mal.
2. **Nada de `filter: blur` ni `backdrop-filter` a pantalla completa**: el desenfoque de movimiento se hace dibujando el
   mapa en N instantes del obturador y promediando (`submuestras`), **solo en las ventanas de barrido**
   (5 submuestras ≈ 5× el coste de ese tramo). Fuera de ellas, `submuestras={1}`. Cada instante se pinta OPACO en un
   canvas aparte y se suman las imágenes con alfa 1/(k+1) (`MapaCanvas` ya lo hace): pintar los polígonos directamente
   con alfa transparenta las paredes tapadas y el plano "salta" al encender el desenfoque. El obturador se abre y se
   cierra con el barrido (seno de 0 a 1/45 s), nunca de golpe: `medir-ritmo` lo marca como salto de un fotograma.
3. **Pintor + caras de espaldas**: edificios y árboles de lejos a cerca; las paredes que no miran al ojo no se pintan
   (la mitad del trabajo). Recorte por plano cercano (Sutherland–Hodgman) para que nada "explote" cerca de la cámara.
4. **Giro alineado con la calle** de la ruta: si la cámara mira en diagonal a la calle, los edificios tapan la ruta.
   Pon una clave de giro por tramo (−90 este, 0 norte, 90 oeste, 180 sur) y deja que PCHIP gire en las esquinas.
5. **Niebla para esconder el borde** de la ciudad: `niebla=[dist·1,2, dist·2,3–4]`, más corta cuanto más inclinada esté
   la cámara y cambiándola de forma gradual (un salto de niebla se ve como un parpadeo). La ciudad debe llenar el cuadro
   en la vista cenital: ancho visible ≈ `1920·dist / (1080·1,15)` m.
6. **Aristas que se desvanecen con la escala**: de lejos, el trazo de 1 px de cada techo convierte el mapa en una malla;
   el motor lo atenúa por debajo de ~1,5 px/m.
7. **La ciudad se genera una vez** (fuera del componente, con `semilla` fija): si la generas por fotograma, cambia.
8. **Recorta lo que no se ve** antes de proyectar (el motor descarta lo que queda fuera de pantalla o más allá de la
   niebla): sin esto, una ciudad de 24×24 manzanas tarda varias veces más.
9. Las tarjetas y el pin van en HTML encima del canvas (nítidos, con su sombra); el plegado final es un `transform` 3D
   del contenedor del canvas, **sin** `filter` en él.

## Rendimiento medido (3 núcleos, sin GPU)
`RecMapaRuta`, 1920×1080, 60 fps, 720 fotogramas: **282 s** de render (≈ 23 s por segundo de vídeo; los barridos con 5
submuestras son lo más caro). Medido: 0 saltos de un fotograma, −14 LUFS. Para iterar, stills a escala 0,5
(`render.mjs stills … --escala 0.5`): 9 fotogramas en ~25 s.

## ¿Mapa generado, mapa real o vídeo generativo?
| Necesito… | Usa |
|---|---|
| Una ciudad "genérica" que se mueva como una app de mapas (anuncios, explicar un producto, reparto, movilidad) | **Ciudad generada** (`generaCiudad`): sin licencias, control total, se ve limpia y "de marca" |
| Un sitio concreto reconocible (tu tienda, una ruta real, una promoción inmobiliaria en su calle) | **Datos reales**: exporta calles, manzanas y huellas de edificios con altura de OpenStreetMap (Overpass o un extracto GeoJSON), pásalos a metros (proyección local: `x = (lon−lon0)·111320·cos(lat0)`, `y = (lat−lat0)·110540`) y rellena `Ciudad`. Atribución obligatoria de OSM ("© OpenStreetMap contributors", ODbL). Los teselados de servicios comerciales de mapas tienen licencias que suelen prohibir usarlos en vídeo publicitario sin permiso: revísalas |
| Un mapa interactivo en una web | Una librería de mapas vectoriales con edificios 3D (p. ej. MapLibre GL); no este motor (esto es para vídeo) |
| Planos fotorrealistas (dron sobre una ciudad, una torre concreta "de verdad") | **Vídeo o imagen generativa** con IA para ese plano y este motor para los gráficos encima. No da datos exactos (calles inventadas), cada plano cuesta dinero y tiempo, y en la UE el contenido sintético realista debe ir marcado (Reglamento de IA, art. 50). Pide el visto bueno antes de gastar |
Regla: si el mapa **cuenta** algo (por dónde, cuánto, dónde está), dibújalo; si solo **ambienta**, la imagen generada puede
valer, pero nunca para un sitio real que el cliente conoce (se nota al instante).

## Ideas de la referencia aún no implementadas (para la próxima)
- **Pozo subterráneo**: una máscara circular que abre el suelo y enseña el metro debajo (útil para infraestructuras).
- **Recalculando**: la ruta se equivoca de calle, se borra hacia atrás y vuelve a trazarse con un icono de carga.
- **Vista a pie de calle** (inclinación 80°) con un personaje: necesita fachadas con ventanas y cielo.
