---
name: motion-interfaz
description: Técnica de motion graphics para ENSEÑAR UNA INTERFAZ O UN PRODUCTO en vídeo con Remotion — estudiar el producto real, elegir entre recrear la interfaz como componentes, la captura entera o recortar piezas, y el proceso OBLIGATORIO de fidelidad (fuente de verdad, tokens copiados, comparación con capturas, lista de comprobación) para que la interfaz recreada sea idéntica a la real. Incluye pantallas de móvil y pilas de pantallas con profundidad, líneas de tiempo de estados que la cámara recorre, tarjetas, consolas, gráficas y botones vivos. La usa la skill maestra motion-graphics; úsala también sola cuando pidan animar un panel, una app, una web o un dashboard.
---

# Enseñar una interfaz o un producto

Parte del plugin de motion graphics: la skill maestra `motion-graphics` decide cuándo entra esta técnica. El kit
Remotion está en `../motion-graphics/kit` (aquí, rutas relativas a esa carpeta).

## 1. Antes de animar: estudia el producto real a fondo
1. **Recoge lo real**: su web y su app (capturas de referencia con `node scripts/capturar.mjs`, ver §3), su logo (SVG o
   PNG transparente), su código si lo tienes (CSS, tokens, configuración de Tailwind, componentes), sus fuentes y sus
   iconos. Antes de capturar, quita banners de cookies, chats y promos flotantes.
2. **Inventario**: lista las piezas que el vídeo va a enseñar (botones, tarjetas, gráficas, tablas, menús, iconos,
   textos exactos, precios, cifras) y de cada una anota su medida, color, radio, borde, sombra, tipografía y estados.
   Mira con zoom: un 1 px de borde, un degradado sutil o un icono concreto es lo que hace que se reconozca.
3. **Copia fielmente**: mismos textos, mismos números, mismos iconos y colores. Lo "bonito" se añade en el movimiento,
   la luz y la composición, no inventando datos ni rediseñando la interfaz.
4. **Nunca datos privados**: si una captura trae nombres, correos, IPs o facturas de terceros, cámbialos por datos de
   demostración del propio producto (sus semillas, fixtures o la maqueta de su web) o difumínalos.
5. **Solo lo que el producto hace hoy**: no enseñes funciones que no existen (notificaciones, integraciones, pantallas
   futuras) sin que el usuario lo pida expresamente; compruébalo en su código o en su web.

## 2. Tres vías para enseñar una interfaz (elige según la situación)
**Regla de la casa: nunca una captura entera en una ventana con un zoom lento** (se lee como diapositiva). O se recrea
(vía 1), o se recortan sus partes y se animan como piezas sueltas 2D/3D (vía 3); la vía 2 solo cuando reconocer la
pantalla tal cual es el mensaje, y siempre combinada con piezas que salen de ella.

### Vía 1 · Recrear la interfaz como componentes (la preferida para un producto)
Cuándo: el vídeo enseña el producto y quieres que cada parte se anime (números que cuentan, consola que se escribe,
filas que se reordenan, botones que se pulsan).
**Obligatorio: el proceso de fidelidad del §3.** Una recreación "parecida" se nota al instante. Se construye con los
tokens DEL PRODUCTO, no con los de la dirección del vídeo: la dirección solo decide fondo, luz, ritmo, transiciones y
rótulos que van FUERA de la interfaz.
Cómo: componentes React con la MISMA estructura que el original (grid/flex igual: Remotion pinta con Chrome, el mismo
CSS da el mismo resultado), cada pieza dentro de un `Movil` con trayectoria propia. Recetas:
- tarjeta con barras que se llenan (un `div` cuyo ancho anima `tramo` + `Contador`); consola que se escribe línea a línea (`Teclea`, 200–260
  letras/s); gráfica SVG que se dibuja (`strokeDasharray` 1→0) y sigue viva (`Math.sin(i*0.55 + t*2.2)`);
- selector de planes donde el elegido pasa al frente (z +220, escala 1,06–1,12, borde de acento) y los demás se
  desenfocan 3 px; botón que se pulsa (escala 0,93 en 2–3 fotogramas) y se transforma en píldora y luego en anillo de
  progreso (`Forma` → `Progreso` + `Contador`).
- **Pantalla de móvil y pila de pantallas** y **línea de tiempo de estados**: §4.
Imagen solo para el arte (fotos, portadas, avatares, logo), recortada "cover".
Ejemplo de antes/después: `DemoFidelidad` (`src/motion/demos/fidelidad.tsx`) con el producto de ejemplo de
`ejemplos/fidelidad/pulso`: «a ojo» difiere un 24 % de los píxeles de la captura real; con el proceso, un 0 %.

### Vía 2 · La captura entera (`Captura`)
Cuándo: lo importante es reconocer la pantalla tal cual (una web conocida, un tutorial, "así se ve hoy").
Cómo: `<Captura imagen="web.png" marco="navegador" url="…" claves={[{t:0,x:.5,y:.3,z:1},{t:2,x:.7,y:.6,z:1.6}]}
resaltes={[{x,y,w,h,t}]} />` dentro de un `Movil` que la incline y la mueva; recorrido PCHIP. Combínala con piezas de
la vía 3 que salen de ella hacia cámara.

### Vía 3 · Recortar PARTES de la captura como piezas sueltas
Cuándo: no hay tiempo de recrear todo, pero un botón, una tarjeta o una gráfica real tiene que despegarse y animarse.
Cómo recortar: `<Pieza imagen="captura.png" rect={[x, y, w, h]} ancho={420} claves={…} />` (rect en fracciones 0–1;
mídelo sobre la captura con rejilla: `ffmpeg -i c.png -vf "drawgrid=w=iw/20:h=ih/20:c=red@0.5" rejilla.png`), o a PNG
con `node scripts/recortar.mjs captura.png x y w h pieza.png [--quitar-fondo #rrggbb] [--ajustar] [--margen 24] [--escala 2]`.
Limpieza: 4–8 px de aire (o `mascara="difuminada"`); fondo plano fuera con `--quitar-fondo` (tolerancia 0,05–0,12) y
compruébalo sobre un color chillón; recorta SIN la sombra y ponla en Remotion; redondea con `radio`; captura a 2×.

## 3. Fidelidad de la interfaz recreada: proceso OBLIGATORIO (vía 1)
No dibujes ni un componente hasta tener F1–F4. No des una escena por buena sin F5–F6. Si algo no se puede copiar
(falta el código, la fuente es de pago…), dilo al usuario y apúntalo como desviación: nunca lo rellenes "a ojo".

**F1 · Fuente de verdad** (por prioridad):
1. El código del producto: CSS globales y de componentes, variables CSS, `tailwind.config.*`, ficheros de tema, los
   componentes de la pantalla (estructura y estados) y los textos. `node scripts/extraer-tokens.mjs <carpeta> --salida
   fidelidad/tokens.md` lista variables, colores, radios, sombras, familias, tamaños, pesos, librería de iconos y SVG de
   logo con `fichero:línea`, ordenados por frecuencia. Después LEE los ficheros que señala.
2. Recursos de marca: logos en SVG (tal cual, nunca redibujados ni recoloreados), fuentes (`@remotion/google-fonts/<F>`
   o sus .woff2 con `useFuenteLocal`) e iconos.
3. Capturas de referencia de cada pantalla al tamaño real: `node scripts/capturar.mjs <url | fichero.html>
   referencias/<pantalla>.png --ancho 1440 --alto 900` (o 390×844 para móvil). Solo para medir y comparar.
4. Sin código ni capturas: pídelos; si no los hay, avisa de que la recreación será aproximada.

**F2 · Copia tal cual** a un fichero de tokens del vídeo (`src/motion/videos/<x>/producto.ts`), cada valor con su
origen (`// --color-primary, app/globals.css:12`): colores (fondo, superficies, bordes, texto, primario, estados),
tipografía de cada nivel, radios, bordes, sombras completas, espaciados y tamaños fijos, iconos (la MISMA librería y los
mismos nombres, o sus SVG con `IconoMascara`) y los estados que salen en el vídeo.

**F3 · Misma disposición**: cada pantalla a escala 1:1 (`Lienzo` de 1440×900 o 390×844) con la misma estructura; la
cámara la mueve y la acerca. No reescales piezas a ojo. Mientras construyes: `<Calco imagen="referencias/x.png"
modo="encima" opacidad={0.5} />`.

**F4 · Textos y datos reales**: mismos textos, idioma y mayúsculas; datos de ejemplo del propio producto con su formato
real de números, monedas y fechas. Prohibido "Lorem ipsum", "John Doe" o cifras redondas inventadas.

**F5 · Compara con la captura real** (escena quieta, cámara a escala 1):
`node scripts/render.mjs stills <Comp> [props.json] <t> --escala 1` y `node scripts/comparar-fidelidad.mjs
referencias/x.png out/<Comp>-<t>.png out/fidelidad.jpg --recorte x,y,ancho,alto` → hoja con referencia | render, mapa
de diferencias y calco, más dos cifras. Objetivo: diferencia media < 6 y < 4 % de píxeles distintos (el ejemplo «a ojo»
da 46 y 24 %). Corrige en el origen y repite.

**F6 · Lista de comprobación** (apúntala en las notas del vídeo): logo original · misma tipografía · cada color de un
token · misma librería de iconos y trazo · espaciados, radios, bordes y sombras · textos idénticos · estados reales ·
F5 hecha con su cifra y desviaciones listadas.

**Desviaciones**: si la historia pide cambiar algo de la interfaz real, proponlo al usuario y apúntalo; el resto sigue
idéntico. La dirección del vídeo NO es motivo para recolorear la interfaz.

## 4. Recetas de interfaz en movimiento (aprendidas de referencias)
- **Pantalla de móvil** (`MarcoMovil`): sin marco físico (solo la pantalla, radio ≈ 10 % del ancho), barra de estado con
  isla, hora y cobertura, filo fino o iridiscente y la BASE DISUELTA en el fondo (máscara 55 → 92 %): nunca se ve el borde
  de abajo, el móvil "flota". Dentro, la UI REAL del producto (§3).
- **Pila de pantallas** (`PilaMoviles`): cada pantalla sube 560–660 px en 1,1–1,3 s (`CURVAS_ENFOQUE.quint`) y se enfoca
  en 0,2 s (blur 10 → 0); al llegar la siguiente (medio golpe o un golpe después), la anterior retrocede a ×0,82 y −82 px
  (asoma por arriba) y se aclara; toda la pila se aleja −6 %/s; el contenido sube 25–40 px DENTRO de la pantalla mientras
  llega (paralaje). Para enseñar 2–4 pasos de un flujo en 2–3 s.
- **Línea de tiempo de estados** (`LineaTiempo` dentro de `Camara2D`): eje que se dibuja entre nodos (0,27 s), nodos que
  brotan con sobrepaso ≈ 12 %, tarjetas que suben enfocándose (vertical: +140 px, blur 16 → 0 en 0,37 s, alternas a los
  dos lados, nodos de 130 px cada 310 px; horizontal: +110 px, blur 10 → 0 en 0,27 s, nodos cada 540 px), título un
  instante después de la fecha y nodo final relleno del color de marca. La cámara la recorre sin pararse (primer tramo
  expo-out, luego un tramo largo con pico de velocidad EN un golpe y deriva de 60–120 px/s al final); cada estado aparece
  cuando su nodo entra en cuadro: `t = entraEnCuadro(clavesCamara, [x, y], { borde: 860 })`, nunca a mano.
- **Paneo de cámara por nodos horizontales**: 2500 px en 2,4 s con `CURVAS_ENFOQUE.paneo` (pico 2650 px/s); las tarjetas
  suben cuando su nodo llega a x ≈ 1700 de pantalla (`entraEnCuadro` con `eje: "x"`).
- **Alejar hasta ver el móvil entero**: `Camara2D` con `ancla` en la cabecera ([960, 224]) y `s` 1 → 0,63 en 1,7 s
  (inOut): la pantalla "encoge hacia su cabecera" sin que el título se mueva.
- Ejemplo completo: `RecSeguimiento` (`src/motion/recreaciones/seguimiento.tsx`, producto ficticio «ruta», 12 s, 90 BPM).
