---
name: motion-graphics
description: Base común para hacer motion graphics con ritmo profesional en Remotion (lanzamientos de producto, promos, intros, reels, demos de app). Úsala SIEMPRE antes de cualquier vídeo animado y después ajusta el estilo (oscuro, claro, agencia, sus variantes o una mezcla). Cubre cómo estudiar el material del usuario (web, capturas, logo), las tres vías para enseñar una interfaz (recrearla, captura entera, recortar piezas), el motor fluido (cámara, piezas con trayectoria, objetos que se transforman, transiciones, tipografía cinética, sonido) y cómo comprobar el resultado.
---

# Motion graphics · base común

Kit listo para usar en la carpeta **`kit/`** junto a este fichero: un proyecto Remotion (1920×1080, **60 fps**) con la
base (`kit/src/motion/base`), los estilos (`kit/src/motion/capas`), demos de cada estilo (`kit/src/motion/demos`),
efectos de sonido y músicas sintetizadas (`kit/public`) y scripts (`kit/scripts`). Para empezar un vídeo: copia el kit
(o `src/motion` + `scripts` + `public` dentro de un proyecto Remotion que ya tengas), `npm install`, y escribe tu
composición en `src/motion/videos/<nombre>.tsx` partiendo de la demo del estilo más cercano.
Motor: hoy solo Remotion. La base no depende de nada específico de Remotion salvo en `tiempo.ts` (reloj), `camara.tsx`
(desenfoque) y `sonido.tsx`; si algún día se añade otro motor, esos tres ficheros son el adaptador.

## 1. Antes de animar: estudia el material del usuario a fondo
1. **Recoge lo real**: su web (captura a 1920×1080 a escala 2× con un navegador sin cabeza; espera a que cargue y
   quita banners de cookies, chats y promos flotantes antes de la foto), capturas de su app/panel, su logo (SVG o PNG
   transparente), su paleta y su tipografía (mira el CSS: `font-family`, colores de botones, radios, sombras).
2. **Inventario**: lista las piezas que el vídeo va a enseñar (botones, tarjetas, gráficas, tablas, menús, iconos,
   textos exactos, precios, cifras) y anota de cada una su medida, color, radio, borde, sombra y tipografía. Mira con
   zoom: un 1 px de borde, un degradado sutil o un icono concreto es lo que hace que se reconozca.
3. **Copia fielmente**: mismos textos, mismos números, mismos iconos y colores. Lo "bonito" se añade en el movimiento,
   la luz y la composición, no inventando datos ni rediseñando la interfaz.
4. **Nunca datos privados**: si una captura trae nombres, correos, IPs o facturas de terceros, cámbialos por datos de
   demostración o difumínalos.

## 2. Tres vías para enseñar una interfaz (elige según la situación)
### Vía 1 · Recrear la interfaz como componentes (la preferida para un producto)
Cuándo: el vídeo enseña TU producto y quieres que cada parte se anime (números que cuentan, consola que se escribe,
filas que se reordenan, botones que se pulsan). Con capturas solo puedes mover la imagen entera.
Cómo: componentes React con los tokens del estilo (`Tarjeta`, o tus propias primitivas `Caja`, `Barra`, `Icono`,
`Grafica`) copiando medidas/colores del inventario; cada pieza dentro de un `Movil` con trayectoria propia.
Ejemplos concretos: tarjeta de servidor con barras de CPU/RAM que se llenan (`Barra` + `Contador`); consola que se
escribe línea a línea (`Teclea` con 200–260 letras/s); gráfica SVG que se dibuja (`strokeDasharray` 1→0) y sigue viva
(la línea ondula con `Math.sin(i*0.55 + t*2.2)`); selector de planes donde el elegido pasa al frente (z +220, escala
1,06–1,12, borde de acento) y los demás se desenfocan 3 px; botón «Comprar» que se pulsa (escala 0,93 en 2–3
fotogramas) y se transforma en una píldora y luego en un anillo de progreso (`Forma` → `Progreso` + `Contador`).
Imagen solo para el arte (fotos, portadas, avatares, logo): recórtala "cover" para que nunca asome lo que la rodea.

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
   saltan un fotograma).
6. **Luz y profundidad**: lo importante brilla (halo de su color, borde de acento); lo demás se desenfoca o se
   oscurece. Fondo con luz que se mueve, nunca plano y quieto del todo.
7. **Texto que nunca "aparece"**: se descifra, se teclea, sube por máscara, golpea, se dibuja con luz o entra gigante de
   desenfocado a nítido; con voz, cada palabra en el fotograma en que se dice (`FraseVoz`).
8. **Sonido al fotograma**: cada pop/clic/golpe cuando el objeto aterriza; whoosh centrado en el barrido; silencio de
   2–9 fotogramas antes del golpe grande. Música + efectos suman: deja el pico por debajo de −1 dBFS.
9. **Llena el cuadro**: el objeto principal ocupa ≥ 25 % del ancho; piezas pequeñas en un fondo vacío se leen como
   plantilla. Acerca la cámara (escala 1,2–2,2) y comprueba que los rótulos no se salen por los bordes.

## 4. Universo mezclable: estilos = ajustes, no plantillas cerradas
Un estilo es solo un conjunto de ajustes (`TokensEstilo`): paleta (`fondo`, `texto`, `acento`, `paleta[]`),
tipografía (`fuente`, `peso`, `tracking`, `mayusculas`, `fuente2`), ritmo (`ritmo.bpm`), curvas (`curvas.entrada/
salida/viaje`, `entradaDur`), muelle (`muelle` con `sobrepaso`), luz de fondo (`luz`: foco, halo, liso, degradado,
manchas) y texturas (viñeta, grano, bokeh, HUD). Todos los componentes de la base leen esos ajustes, así que la misma
escena cambia de carácter cambiando solo el estilo (ver `demos/mezcla.tsx`, que es la misma escena con cualquier estilo).
- Estilos (realmente distintos): **oscuro** (keynote de producto: casi negro con luz, objetos que se transforman),
  **claro** (intro SaaS: fondo claro, palabras gigantes de desenfocado a nítido, todo muy rápido) y **agencia** (un
  color saturado por compás, display ancha + serif cursiva + mono, HUD). Skills: `motion-oscuro`, `motion-claro`,
  `motion-agencia`.
- Variantes (son mezclas, no estilos nuevos): `oscuro-halo` (halo de marca que late), `oscuro-brasa` (negro puro y luz
  naranja: líneas de luz, tarjetas con brillo, estroboscopios), `oscuro-turquesa` (luz centrada fría, cortes por
  continuidad de velocidad), `claro-lima` (manchas líquidas y frases que siguen a la voz).
- Mezclar: `mezclar(ESTILOS.oscuro, { acento: "#FF3B5C" })` (otros colores), `mezclar(ESTILOS.claro, { ritmo:
  ESTILOS.agencia.ritmo, muelle: ESTILOS.agencia.muelle })` (claro con la energía de agencia), `mezclar(ESTILOS.oscuro,
  { fuente: "Syne", mayusculas: true })`. Con el color de marca del usuario: cambia `acento` y `luz.colores`.

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
`ParedPaneles`, `TarjetaBrillo`, `PilaTarjetas`, `Orbitas` (iconos en anillos que frenan juntos), `Seleccion`
(cursor que selecciona una palabra), `Tunel` (4 pantallas que se abren hacia la cámara), `Portal` (aro de luz que
se cruza), `Horizonte` (arco de planeta con haz para la marca final). Todos se ven en la composición `DemoEfectos2`
(24 s, una sección por efecto). Ayudantes: `clavesOla()`, `palabrasCada()`, `PATRONES_ESTROBO`, `ANILLOS_ORBITA`.
Límite conocido: `LenteBarril` usa un mapa de desplazamiento SVG de 8 bits (escalones de ~5 px); úsala en planos en
movimiento, no en planos quietos con texto pequeño.
Texto (`texto.tsx`): `Descifra`, `Mascara`, `Lineas`, `PorLetra`, `Golpe`, `Contador`, `Neon`, `Anillo`.
Escenas (`escenas.tsx`): `Escenas` + transiciones (corte, barrido que empuja, zoom, círculo, cortina).
Acabado (`acabado.tsx`): `FondoEstilo` (fondo según el estilo), `Halo`, `Manchas`, `Vineta`, `Grano`, `Bokeh`,
`Destello`, `Sombra`, `Hud`. Sonido (`sonido.tsx`): `Sonido sfx={[{t,f,v}]} musica="musica/x.wav"`.

## 6. Flujo y comprobación
1. Material e inventario (§1) → vía (§2) → estilo o mezcla (§4).
2. **Guion en eventos**: una fila por pulso: "t · qué entra · de qué objeto nace · sonido". Escríbelo antes del código.
3. **Música**: `node scripts/musica.mjs --config musica/<x>.json public/musica/<x>.wav` (sintetizada, sin derechos de
   terceros; duración, BPM y golpes exactos en el JSON). Sin música, deja la prop `musica` como hueco y todo a un BPM.
4. **Código**: copia la demo del estilo a `src/motion/videos/<nombre>.tsx`, regístrala con `fps={60}`.
5. **Fotogramas**: `node scripts/render.mjs stills <Comp> [props.json] 0.5 1.2 …` y hoja de contacto
   (`ffmpeg -i v.mp4 -vf "fps=4,scale=320:-1,tile=8x5" hoja.jpg`). Mira encuadre, solapes, texto legible, restos de
   captura.
6. **Render**: `node scripts/render.mjs render <Comp> [props.json]` (≈15–30 s de render por segundo a 60 fps sin GPU).
7. **Medir**: `node scripts/medir-ritmo.cjs v.mp4` → dif media 4–16, quieto ≤ 10 %, racha ≤ 0,5 s, saltos de 1 fotograma
   ≈ 0 (un pico aislado 3–5× sobre sus vecinos es un salto); `ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` → pico
   < −1 dBFS. Compara lado a lado con la referencia (`hstack`) y, si tienes un revisor de vídeo con IA, pásaselo; no le
   creas sin mirar los fotogramas.
