---
name: motion-graphics
description: Base común para hacer motion graphics con ritmo profesional en Remotion (lanzamientos de producto, promos, intros, reels, demos de app). Úsala SIEMPRE antes de cualquier vídeo animado y después ajusta el estilo (oscuro, claro, agencia, sus variantes o una mezcla). Cubre cómo estudiar el material del usuario (web, capturas, logo, código), las tres vías para enseñar una interfaz (recrearla, captura entera, recortar piezas) con un proceso OBLIGATORIO de fidelidad para que la interfaz recreada sea idéntica a la real (fuente de verdad, tokens copiados, comparación con capturas y lista de comprobación), el motor fluido (cámara, piezas con trayectoria, objetos que se transforman, transiciones, tipografía cinética, sonido) y cómo comprobar el resultado.
---

# Motion graphics · base común

Kit listo para usar en la carpeta **`kit/`** junto a este fichero: un proyecto Remotion (1920×1080, **60 fps**) con la
base (`kit/src/motion/base`), los estilos (`kit/src/motion/capas`), demos de cada estilo (`kit/src/motion/demos`),
efectos de sonido y músicas sintetizadas (`kit/public`) y scripts (`kit/scripts`). Para empezar un vídeo: copia el kit
(o `src/motion` + `scripts` + `public` dentro de un proyecto Remotion que ya tengas), `npm install`, y escribe tu
composición en `src/motion/videos/<nombre>.tsx` partiendo de la demo del estilo más cercano.
Motor: hoy solo Remotion. La base no depende de nada específico de Remotion salvo en `tiempo.ts` (reloj), `camara.tsx`
(desenfoque) y `sonido.tsx`; si algún día se añade otro motor, esos tres ficheros son el adaptador.

## 1. Antes de animar: estudia el producto real a fondo
1. **Recoge lo real**: su web y su app (capturas de referencia con `node scripts/capturar.mjs`, ver §2b), su logo (SVG o
   PNG transparente), su código si lo tienes (CSS, tokens, configuración de Tailwind, componentes), sus fuentes y sus
   iconos. Antes de capturar, quita banners de cookies, chats y promos flotantes.
2. **Inventario**: lista las piezas que el vídeo va a enseñar (botones, tarjetas, gráficas, tablas, menús, iconos,
   textos exactos, precios, cifras) y de cada una anota su medida, color, radio, borde, sombra, tipografía y estados.
   Mira con zoom: un 1 px de borde, un degradado sutil o un icono concreto es lo que hace que se reconozca.
3. **Copia fielmente**: mismos textos, mismos números, mismos iconos y colores. Lo "bonito" se añade en el movimiento,
   la luz y la composición, no inventando datos ni rediseñando la interfaz.
4. **Nunca datos privados**: si una captura trae nombres, correos, IPs o facturas de terceros, cámbialos por datos de
   demostración del propio producto (sus semillas, fixtures o la maqueta de su web) o difumínalos.

## 2. Tres vías para enseñar una interfaz (elige según la situación)
### Vía 1 · Recrear la interfaz como componentes (la preferida para un producto)
Cuándo: el vídeo enseña TU producto y quieres que cada parte se anime (números que cuentan, consola que se escribe,
filas que se reordenan, botones que se pulsan). Con capturas solo puedes mover la imagen entera.
**Obligatorio: sigue el proceso de fidelidad del §2b.** Una recreación "parecida" se nota al instante y hace que el
producto parezca otro. La recreación se construye con los tokens DEL PRODUCTO (sus colores, su letra, sus radios), no
con los del estilo del vídeo: el estilo (§4) solo decide el fondo, la luz, el ritmo, las transiciones y los rótulos que
van FUERA de la interfaz.
Cómo: componentes React con la MISMA estructura que el original (si el producto usa grid/flex, tú también: Remotion
pinta con Chrome, así que el mismo CSS da el mismo resultado), cada pieza dentro de un `Movil` con trayectoria propia.
Ejemplos concretos: tarjeta de servidor con barras de CPU/RAM que se llenan (`Barra` + `Contador`); consola que se
escribe línea a línea (`Teclea` con 200–260 letras/s); gráfica SVG que se dibuja (`strokeDasharray` 1→0) y sigue viva
(la línea ondula con `Math.sin(i*0.55 + t*2.2)`); selector de planes donde el elegido pasa al frente (z +220, escala
1,06–1,12, borde de acento) y los demás se desenfocan 3 px; botón «Comprar» que se pulsa (escala 0,93 en 2–3
fotogramas) y se transforma en una píldora y luego en un anillo de progreso (`Forma` → `Progreso` + `Contador`).
Imagen solo para el arte (fotos, portadas, avatares, logo): recórtala "cover" para que nunca asome lo que la rodea.
Ejemplo completo de antes/después: composición `DemoFidelidad` (`src/motion/demos/fidelidad.tsx`) con el producto de
ejemplo de `ejemplos/fidelidad/pulso` (su «código real» y su captura): la versión «a ojo» difiere un 24 % de los
píxeles de la captura real; la que sigue el proceso, un 0 %.

### Vía 2 · La captura entera (`Captura`)
Cuándo: lo importante es reconocer la pantalla tal cual (una web conocida, un tutorial, "así se ve hoy").
Cómo: `<Captura imagen="web.png" marco="navegador" url="…" claves={[{t:0,x:.5,y:.3,z:1},{t:2,x:.7,y:.6,z:1.6}]}
resaltes={[{x,y,w,h,t}]} />` dentro de un `Movil` que la incline y la mueva; el recorrido por claves es PCHIP (sin
frenar en cada clave). Nunca dejes una ventana quieta con un único movimiento lento: eso se lee como diapositiva.
Combínala con piezas de la vía 3 que salen de ella hacia cámara.

### Vía 3 · Recortar PARTES de la captura como piezas sueltas
Cuándo: no hay tiempo de recrear todo, pero quieres que un botón, una tarjeta o una gráfica real se despeguen y se
animen solos.
Cómo recortar: en Remotion directamente con `<Pieza imagen="captura.png" rect={[x, y, w, h]} ancho={420} claves={…} />`
(rect en fracciones 0–1 de la imagen; mídelo sobre una versión de la captura con rejilla cada 5 %: `ffmpeg -i c.png
-vf "drawgrid=w=iw/20:h=ih/20:c=red@0.5" rejilla.png`), o a PNG con `node scripts/recortar.mjs captura.png x y w h
pieza.png [--quitar-fondo #rrggbb] [--ajustar] [--margen 24] [--escala 2]`.
Cómo limpiarla:
- **Bordes**: deja 4–8 px de aire al medir; si el borde de la pieza no es limpio, `mascara="difuminada"` en `Pieza`.
- **Fondo transparente**: si la pieza está sobre un color plano, `--quitar-fondo` con ese color (tolerancia 0,05–0,12)
  y `--ajustar` para recortar al contenido. Comprueba el PNG sobre un fondo de color chillón: no deben quedar halos.
- **Sombras**: recorta SIN la sombra de la captura y pon la sombra en Remotion (`Pieza` ya lleva la del estilo); así
  la pieza puede flotar en 3D sin una sombra pegada que delate el recorte.
- **Esquinas**: redondea con `radio` en `Pieza`, no en el PNG. **Nitidez**: captura a 2× para que el zoom no emborrone.

## 2b. Fidelidad de la interfaz recreada: proceso OBLIGATORIO (vía 1)
No dibujes ni un componente hasta tener los pasos F1–F4. No des una escena por buena sin pasar F5–F6. Si algo no se
puede copiar (falta el código, la fuente es de pago…), dilo al usuario y apúntalo como desviación: nunca lo rellenes
"a ojo" en silencio.

**F1 · Localiza la fuente de verdad** (por este orden de prioridad):
1. El código del producto: CSS globales y de componentes, variables CSS, `tailwind.config.*`, ficheros de tema/tokens,
   los componentes de la pantalla que vas a enseñar (para la estructura y los estados) y los textos (plantillas,
   ficheros de traducción). `node scripts/extraer-tokens.mjs <carpeta-del-producto> --salida fidelidad/tokens.md` lista
   variables CSS, colores, radios, sombras, familias y tamaños de letra, pesos, la librería de iconos y los SVG de logo,
   con su `fichero:línea` y ordenados por frecuencia (los repetidos son los tokens de verdad). Después LEE los ficheros
   que señala: el informe dice dónde mirar, no sustituye a leerlos.
2. Los recursos de marca: logos e isotipos en SVG (úsalos tal cual, nunca redibujados ni recoloreados), las fuentes
   (Google Fonts con `@remotion/google-fonts/<Familia>`; si son propias, sus .woff2 con `useFuenteLocal`) y los iconos.
3. Capturas de referencia de cada pantalla que vas a recrear, al tamaño real de la interfaz:
   `node scripts/capturar.mjs <url | fichero.html> referencias/<pantalla>.png --ancho 1440 --alto 900` (si hace falta
   sesión iniciada, captúrala tú desde el navegador a ese mismo tamaño). Las capturas son SOLO referencia para medir y
   comparar: en la vía 1 no se incrustan nunca en el vídeo.
4. Sin código ni capturas (solo una idea): pide al usuario capturas o acceso. Si no los hay, avisa de que la
   recreación será aproximada.

**F2 · Extrae y copia tal cual** a un fichero de tokens del vídeo (p. ej. `src/motion/videos/<x>/producto.ts`),
cada valor con un comentario de dónde sale (`// --color-primary, app/globals.css:12`):
- colores (fondo, superficies, bordes, texto principal y apagado, primario, éxito/aviso/peligro y sus fondos);
- tipografía: familia, pesos, tamaños, interlineado y tracking de cada nivel (títulos, cuerpo, etiquetas, cifras);
- radios, grosores de borde, sombras (la cadena entera), espaciados (paddings, gaps, márgenes) y tamaños fijos
  (alto de barra, ancho del menú lateral, alto de fila, alto de botón);
- iconos: la MISMA librería y los mismos nombres (instala la librería de React que use el producto, p. ej.
  `lucide-react`, e importa los mismos iconos; o copia sus SVG y usa `IconoMascara`). Nunca "uno parecido";
- estados que aparecen en el vídeo: normal, hover, activo/seleccionado, foco, deshabilitado, vacío, cargando, éxito y
  error, con su aspecto real (mira las clases o los estilos de cada estado en el código).

**F3 · Misma disposición y proporciones**: construye cada pantalla a escala 1:1, al mismo ancho que la captura de
referencia (`Lienzo` de 1440×900, por ejemplo), con la misma estructura (columnas del grid, orden de los elementos,
alineaciones) y luego deja que la cámara la mueva y la acerque. No reescales a ojo las piezas para que "quepan": si no
caben, encuadra con la cámara. Mientras construyes, pon `<Calco imagen="referencias/<pantalla>.png" modo="encima"
opacidad={0.5} />` encima para cuadrar al píxel, y quítalo al terminar.

**F4 · Textos y datos reales**: los mismos textos de la interfaz (menús, botones, títulos, etiquetas, avisos), en el
mismo idioma y con las mismas mayúsculas, y datos de ejemplo realistas sacados del propio producto (su catálogo de
demo, sus fixtures, la maqueta de su web), con su formato real de números, monedas y fechas (`Contador` usa
separador de miles). Prohibido "Lorem ipsum", "John Doe", "Campaign A" o cifras redondas inventadas.

**F5 · Compara con la captura real**, pantalla por pantalla, con la escena quieta y la cámara a escala 1:
1. Saca el fotograma: `node scripts/render.mjs stills <Comp> [props.json] <t> --escala 1`.
2. Compara: `node scripts/comparar-fidelidad.mjs referencias/<pantalla>.png out/<Comp>-<t>.png out/fidelidad.jpg
   --recorte x,y,ancho,alto` (zona del fotograma donde está la pantalla). Sale una hoja con referencia | render,
   un mapa de diferencias (lo blanco es lo que no coincide) y un calco al 50 %, más dos cifras. Orientativo para
   una recreación fiel: diferencia media < 6 y menos del 4 % de píxeles distintos. El ejemplo «a ojo» da 46 y 24 %.
3. Corrige cada diferencia en su origen (el token o la medida) y repite hasta que el mapa quede casi negro. En el
   vídeo puedes enseñar el calco con `<Calco modo="diferencia" />`: lo que coincide queda negro.

**F6 · Lista de comprobación** (pásala y apúntala en las notas del vídeo antes de dar la escena por buena):
- [ ] Logo: el SVG original, sin redibujar, recolorear, deformar ni cambiar su tipografía.
- [ ] Tipografía: la misma familia y los mismos pesos, tamaños, interlineado y tracking.
- [ ] Paleta: cada color sale de un token del producto; ninguno inventado ni "parecido".
- [ ] Iconos: misma librería, mismos iconos y mismo grosor de trazo.
- [ ] Espaciado y medidas: paddings, gaps, radios, bordes y sombras como el original; la estructura cuadra con el calco.
- [ ] Textos: idénticos a la interfaz (idioma, mayúsculas, puntuación); datos de ejemplo del propio producto.
- [ ] Estados: cada estado que se ve (activo, hover, cargando, vacío, éxito/error) es el real.
- [ ] Comparación F5 hecha con la cifra apuntada; las desviaciones que queden están listadas y justificadas.

**Desviaciones**: si por la historia del vídeo hay que cambiar algo de la interfaz real (otro color, otro texto, una
pantalla que aún no existe), no lo decidas tú: proponlo al usuario, apúntalo en las notas del vídeo como desviación y
haz que el resto siga siendo idéntico. El estilo del vídeo NO es un motivo para recolorear la interfaz.

## 3. Las reglas medidas en 9 referencias profesionales (no negociables)
1. **Nunca quieto**: algo nuevo cada 0,2–0,5 s (un evento por pulso); la cámara deriva siempre (+1,5–2,5 %/s de zoom o
   ≈30 px/s). Objetivo: quieto ≤ 10 %, racha quieta ≤ 0,5 s (salvo el logo final).
2. **Ni cortes ni fundidos de diapositiva**: cada plano nace de un objeto del anterior (`Forma`: punto → píldora →
   tarjeta → logo). Si hay corte, va en el fotograma de máxima velocidad (zoom o giro que continúa al otro lado: "corte
   por continuidad de velocidad"), tapado por luz (`Flash`, `FugaLuz`, `FlashCromatico`, `Estrobo`) o por una ola de
   color (`ManchasLiquidas`). Las referencias tienen 0–9 cortes secos en 10–30 s y casi todos escondidos.
3. **Curvas asimétricas y cortas**: entradas expo-out de 0,13–0,4 s; salidas ease-in de 0,08–0,17 s; ease-in para
   meterse en algo. Nunca ease-in-out simétrico de 0,5 s en una entrada.
4. **Muelles controlados**: rebote solo donde aporta (un clímax, un objeto que cambia de forma) y con el sobrepaso
   limitado (`useMuelle`, campo `sobrepaso`: 0,1 = 10 %). Nada de vaivenes senoidales en piezas grandes.
5. **Desenfoque como material**: lo rápido lleva estela direccional (`Movil estela`, `ConDesenfoque` en barridos); lo
   que entra pasa de desenfocado a nítido. **Nunca `filter` en un contenedor `preserve-3d`** (aplana el 3D y las piezas
   saltan un fotograma), **ni `backdrop-filter` dentro de una cámara 3D** (Chrome deja de pintar media fila en algunos
   fotogramas: para un cristal esmerilado en 3D usa una copia desenfocada de lo de detrás, recortada por el cristal).
6. **Luz y profundidad**: lo importante brilla (halo de su color, borde de acento); lo demás se desenfoca o se
   oscurece. Fondo con luz que se mueve, nunca plano y quieto del todo.
7. **Texto que nunca "aparece"**: se descifra, se teclea, sube por máscara, golpea, se dibuja con luz o entra gigante de
   desenfocado a nítido; con voz, cada palabra en el fotograma en que se dice (`FraseVoz`).
8. **Sonido al fotograma**: cada pop/clic/golpe cuando el objeto aterriza; whoosh centrado en el barrido; silencio de
   2–9 fotogramas antes del golpe grande. Música + efectos suman: deja el pico por debajo de −1 dBFS.
9. **Llena el cuadro**: el objeto principal ocupa ≥ 25 % del ancho; piezas pequeñas en un fondo vacío se leen como
   plantilla. Acerca la cámara (escala 1,2–2,2) y comprueba que los rótulos no se salen por los bordes.
10. **Un hilo conductor**: un mismo objeto atraviesa el vídeo y cambia de papel (un punto que se divide, abre el iris, es
   el centro de una figura y termina siendo el punto del logo; una cifra que se convierte en la letra de la marca).
   En las 4 referencias de la cuarta ronda no hay ni un fundido: cada plano nace de un objeto del anterior.
11. **Rejilla de pulso estricta**: elige el pulso (p. ej. 28 fotogramas a 60 fps ≈ 128,6 BPM) y pon CADA evento en un
   pulso o medio pulso (botes, cambios de cámara, clics, cortes), con el sonido en el mismo fotograma o 1–2 antes.
12. **Temperatura de la luz**: lo que entra llega sobreexpuesto o con un halo del acento y se «enfría» a su color en
   0,2–0,5 s (texto, código, logos); da sensación de energía sin mover más cosas.

## 4. Universo mezclable: estilos = ajustes, no plantillas cerradas
Un estilo es solo un conjunto de ajustes (`TokensEstilo`): paleta (`fondo`, `texto`, `acento`, `paleta[]`),
tipografía (`fuente`, `peso`, `tracking`, `mayusculas`, `fuente2`), ritmo (`ritmo.bpm`), curvas (`curvas.entrada/
salida/viaje`, `entradaDur`), muelle (`muelle` con `sobrepaso`), luz de fondo (`luz`: foco, halo, liso, degradado,
manchas, aurora) y texturas (viñeta, grano, bokeh, HUD). Todos los componentes de la base leen esos ajustes, así que la misma
escena cambia de carácter cambiando solo el estilo (ver `demos/mezcla.tsx`, que es la misma escena con cualquier estilo).
- Estilos (realmente distintos): **oscuro** (keynote de producto: casi negro con luz, objetos que se transforman),
  **claro** (intro SaaS: fondo claro, palabras gigantes de desenfocado a nítido, todo muy rápido) y **agencia** (un
  color saturado por compás, display ancha + serif cursiva + mono, HUD). Skills: `motion-oscuro`, `motion-claro`,
  `motion-agencia`.
- Variantes (son mezclas, no estilos nuevos): `oscuro-halo` (halo de marca que late), `oscuro-brasa` (negro puro y luz
  naranja: líneas de luz, tarjetas con brillo, estroboscopios), `oscuro-turquesa` (luz centrada fría, cortes por
  continuidad de velocidad), `claro-lima` (manchas líquidas y frases que siguen a la voz).
- Variantes de la cuarta ronda (cada una con su recreación de prueba, composición `Rec…`, comparada con su original):
  - `oscuro-cobre` (`RecSerifCalido`): negro cálido con halos cobre y serif editorial (EB Garamond + Inter), 124 BPM;
    la regla es que **todo llega con luz y se enfría** (sobreexpuesto → su color en 0,2–0,5 s). Componentes en `cobre.tsx`.
  - `oscuro-cristal` (`RecPromptCristal`): casi negro con manchas de color distintas en cada escena, interfaz de cristal
    con contornos blancos de 1–2 px, texto que se escribe con luz, un bloque de color plano (coral) y canales blancos
    entre paneles; ~100 BPM, sin rebotes. Componentes en `cristal.tsx`.
  - `agencia-punto` (`RecAgenciaReel`): agencia con UN punto rojo que lo es todo (se divide, abre iris, es el centro y
    el punto del logo) y una nube de ~600 puntos que cambia de forma; Montserrat 900 + serif recta + HUD tipo DIN,
    128 BPM, muelles con sobrepaso del 12 %. Componentes en `puntos.tsx`.
  - `taller` / `taller-claro` (`RecReelPantalla`): «el vídeo enseña la herramienta con la que está hecho» (la escena se
    mete en su editor de curvas y la curva que se dibuja es la que mueve la pieza); grafito con luz naranja de suelo que
    pasa a blanco roto, un solo acento, rejilla de pulso estricta (28 fotogramas a 60 fps) y muelle 180/12. Componentes
    en `taller.tsx`.
  Todas están en `TODOS_ESTILOS` (`src/motion/capas/todos.ts`) y se mezclan igual que las demás.
- Mezclar: `mezclar(ESTILOS.oscuro, { acento: "#FF3B5C" })` (otros colores), `mezclar(ESTILOS.claro, { ritmo:
  ESTILOS.agencia.ritmo, muelle: ESTILOS.agencia.muelle })` (claro con la energía de agencia), `mezclar(ESTILOS.oscuro,
  { fuente: "Syne", mayusculas: true })`. Con el color de marca del usuario: cambia `acento` y `luz.colores`.
- Ejemplo real (lanzamiento SaaS con la marca del cliente: fondo liso con auroras, entradas cortas de intro SaaS):
  `mezclar(ESTILOS.oscuro, { fondo: "#031C26", acento: "#37B5FE", paleta: ["#37B5FE", "#004AAC", "#7FCBFF"], entradaDur: 0.24,
  curvas: { ...ESTILOS.oscuro.curvas, salida: ESTILOS.claro.curvas.salida }, luz: { tipo: "aurora", colores: ["#37B5FE", "#004AAC", "#7FCBFF"] } })`.
  Si el usuario pide «fondo liso» con auroras: la aurora vive solo en su `zona` (arriba), el resto del fondo queda liso.

## 5. Catálogo de la base (`src/motion/base`)
Tiempo (`tiempo.ts`): `useSeg()`, `tramo(t,a,b,curva)`, `ventana()`, `CURVAS`, `pchip()`, `pista(claves,t,campos)` (un
campo que falta en una clave conserva el valor anterior: tras `o: 0` pon `o: 1`), `golpe(n,bpm)`.
Estilo (`estilo.tsx`): `TokensEstilo`, `mezclar()`, `EstiloProvider`, `useEstilo()`, `useCurva()`, `useMuelle()`,
`useGolpe()`, `useTitular()`.
Cámara (`camara.tsx`): `Camara` (3D por claves), `Camara2D` (paneos/zooms sobre escena plana), `ConDesenfoque`.
Piezas (`piezas.tsx`): `Movil` (cualquier contenido con trayectoria y estela), `Pieza` (recorte de captura), `Tarjeta`,
`entraSale()`. Captura (`captura.tsx`): `Captura` (vía 2).
Efectos (`efectos.tsx`): `Forma` (objeto puente), `Onda`, `Progreso`, `Flash`, `Deriva`, `ZoomAtraves`, `FugaLuz`,
`BarridoRadial`, `Glitch`, `Palabra`, `Rodillo`, `Teclea`, `Escaneo`, `Chispas`. Más efectos (`efectos-2.tsx`):
`ManchasLiquidas`, `FraseVoz`, `FlashCromatico`, `PildoraElastica`, `Estrobo`, `LenteBarril`, `LineaLuz`,
`ParedPaneles`, `TarjetaBrillo`, `PilaTarjetas`, `Orbitas` (iconos en anillos que frenan juntos; `forma="pastilla"` para nombres de integraciones o etiquetas), `Seleccion`
(cursor que selecciona una palabra), `Tunel` (4 pantallas que se abren hacia la cámara), `Portal` (aro de luz que
se cruza), `Horizonte` (arco de planeta con haz para la marca final). Todos se ven en la composición `DemoEfectos2`
(24 s, una sección por efecto). Ayudantes: `clavesOla()`, `palabrasCada()`, `PATRONES_ESTROBO`, `ANILLOS_ORBITA`.
Límite conocido: `LenteBarril` usa un mapa de desplazamiento SVG de 8 bits (escalones de ~5 px); úsala en planos en
movimiento, no en planos quietos con texto pequeño.
Texto (`texto.tsx`): `Descifra`, `Mascara`, `Lineas`, `PorLetra`, `Golpe`, `Contador`, `Neon`, `Anillo`.
Escenas (`escenas.tsx`): `Escenas` + transiciones (corte, barrido que empuja, zoom, círculo, cortina).
Acabado (`acabado.tsx`): `FondoEstilo` (fondo según el estilo), `Aurora` (cortinas de luz que titilan en una `zona`
sobre fondo liso; `brillo` anímalo con los golpes), `Halo`, `Manchas`, `Vineta`, `Grano`, `Bokeh`,
`Destello`, `Sombra`, `Hud`. Sonido (`sonido.tsx`): `Sonido sfx={[{t,f,v}]} musica="musica/x.wav"`.
Humo (`humo.tsx`): `Humo` — humo, gas o aurora fina con un shader WebGL propio (ruido de gradiente, fbm con *domain
warping* doble y *dithering*). Es la opción cuando la luz tiene que parecer materia y no bloques: `Aurora` se ve en
cortinas de degradados, `Humo` se ve como gas, sin bandas ni píxeles. Props: `colores` (2–4), `zona`, `brillo`, `vel`,
`escala` (más = volutas más pequeñas), `densidad`, `torsion` (1–1,6 = gas suave; 3+ = mármol), `estira` (>1 = velos
horizontales de aurora), `semilla`, `calidad` (1 = píxel a píxel; 0,5 = la mitad, ampliado suave) y `mezcla`. Es
determinista y necesita WebGL en el render (`chromiumOptions.gl = "swangle"`, ya puesto en `scripts/render.mjs`). Coste
medido a 1080p y 60 fps en 3 núcleos: unos 0,15 s más por fotograma con dos capas (+20 %). Dos capas con distinta
`escala` y `semilla` dan profundidad; no subas `torsion` si hay texto encima.
Fidelidad (`fidelidad.tsx`, §2b): `Calco` (la captura real encima: `encima`, `cortina` o `diferencia`), `IconoMascara`
(el SVG real del producto, recoloreable), `useFuenteLocal` (su fuente propia desde public/), `Lienzo` (pantalla 1:1).
Scripts de fidelidad: `capturar.mjs` (capturas de referencia con el Chrome de Remotion), `extraer-tokens.mjs` (fuente
de verdad del código), `comparar-fidelidad.mjs` (render contra captura, con cifras) y `comparar-video.mjs`
(recreación contra el vídeo original a lo largo del tiempo: imagen, color y TIMING por segundo, con el desfase que
mejor encaja; úsalo para aprender una referencia y verificar que la has reproducido).
Cuarta ronda (técnicas medidas en 4 referencias; props en el JSDoc de cada componente):
- `puntos.tsx`: `HudCompas` (HUD con casillas de tiempo, compás n/8 y contador de fotogramas), `PuntosDivide` (un
  punto que se divide en cada tiempo), `IrisAro`, `Corchetes`, `FormaPolar` (círculo ↔ cuadrado ↔ triángulo ↔ flor con
  estela de contornos), `CajaTransformacion` (caja con 8 tiradores y etiqueta, como en un editor), `NubePuntos` (una
  nube que pasa por flor, rejilla, plano, esfera, toro y cubo: `formaFlor`, `formaRejilla`, `formaEsfera`…),
  `TramaOnda` (retícula de medios tonos con onda), `CintaRayas` (tubo de rayas que hace un lazo), `TextoAnillos`
  (anillos de texto que giran en sentidos alternos), `PuntoSalta` (salto parabólico con squash & stretch).
- `taller.tsx`: `LetrasCoreografia`, `TrackingRespira`, `EstallidoLetras` (se van todas menos una, que pasa al plano
  siguiente), `BolaRebote` (bote al pulso con squash & stretch), `VentanaEditor` + `EditorCurvas` (la curva dibujada es
  la que mueve la pieza), `Interruptor`, `DiscoObturador`, `MosaicoVivo` (con `PesoVariable`, `CuboAlambre`,
  `RayasCristal`, `BarrasVivas`, `TrazoVivo`, `PuntosMuelle`), `ContadorRodillo`, `GlifoPuente` (una cifra se
  convierte en la letra de la marca).
- `cobre.tsx`: `Asterisco` (estrella de brazos irregulares), `Meteoro` (aguja de luz que se apaga en un punto),
  `MarcaEstalla`, `MarcaBrota` (la palabra se despliega desde una letra y empuja al logo), `Resplandor`, `ArcoChispa` +
  `TextoDeChispas` (cada palabra nace donde cae un arco de luz), `CajaCristal`, `EcoZoom` (salto de zoom tapado con un
  fotograma de doble exposición), `BotonPulsa` + `CursorMano`, `OndaChoque`, `CodigoCae` (código que cae caliente y se
  enfría), `Salida3D`, `GlifoCambia`, `TextoBrasa`.
- `cristal.tsx`: `TecleaLuz` (una letra por fotograma que nace descifrada con un halo y se enfría; borra igual),
  `BarraPrompt` (barra de cristal con chips, chispa que pasa a «+», clic que la ilumina), `Cursor`, `Estallido` (bloque
  plano de rayos irregulares), `Mosaico` (paneles con canales blancos que recorre la cámara), `RedNodos` (conectores en
  codo que se dibujan hacia iconos), `Chispa` (estrella de 4 puntas como objeto puente), `Roseton`, `FondoCristal`.

## 6. Flujo y comprobación
1. Material e inventario (§1) → vía (§2) → si es la vía 1, proceso de fidelidad F1–F4 (§2b) → estilo o mezcla (§4).
2. **Guion en eventos**: una fila por pulso: "t · qué entra · de qué objeto nace · sonido". Escríbelo antes del código.
3. **Música**: `node scripts/musica.mjs --config musica/<x>.json public/musica/<x>.wav` (sintetizada, sin derechos de
   terceros; duración, BPM y golpes exactos en el JSON). Sin música, deja la prop `musica` como hueco y todo a un BPM.
4. **Código**: copia la demo del estilo a `src/motion/videos/<nombre>.tsx`, regístrala con `fps={60}`.
5. **Fotogramas**: `node scripts/render.mjs stills <Comp> [props.json] 0.5 1.2 …` y hoja de contacto
   (`ffmpeg -i v.mp4 -vf "fps=4,scale=320:-1,tile=8x5" hoja.jpg`). Mira encuadre, solapes, texto legible, restos de
   captura. Con interfaz recreada: comparación F5 con la captura real y lista F6 (§2b) ANTES de renderizar entero.
6. **Render**: `node scripts/render.mjs render <Comp> [props.json]` (≈15–30 s de render por segundo a 60 fps sin GPU;
   un lanzamiento de 45 s con auroras y desenfoques ≈ 1 h en 3 núcleos). Para corregir un detalle sin rehacerlo todo:
   `render … --desde 11.5 --hasta 13 --mudo` (solo ese tramo, inicios en múltiplos del fotograma) y
   `node scripts/empalmar.mjs v.mp4 v2.mp4 tramo.mp4@11.5 [otro.mp4@20.8]` (cambia la imagen de esos tramos y copia el
   audio de la base).
7. **Medir**: `node scripts/medir-ritmo.cjs v.mp4` → dif media 4–16, quieto ≤ 10 %, racha ≤ 0,5 s, saltos de 1 fotograma
   ≈ 0 (un pico aislado 3–5× sobre sus vecinos es un salto); `ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` → pico
   < −1 dBFS. Compara lado a lado con la referencia (`hstack`) y, si tienes un revisor de vídeo con IA, pásaselo; no le
   creas sin mirar los fotogramas.
