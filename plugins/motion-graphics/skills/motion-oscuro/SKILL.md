---
name: motion-oscuro
description: Estilo OSCURO de motion graphics (keynote de producto): casi negro con un foco de luz o un halo de marca, objetos que se transforman unos en otros, texto que se descifra o se dibuja con neón, cortes tapados por destellos o por continuidad de velocidad. Variantes oscuro-halo, oscuro-brasa, oscuro-turquesa, oscuro-cobre (serif editorial cálida, luz que se enfría), oscuro-cristal (interfaz de cristal, texto que se escribe con luz, manchas de color por escena) y taller (el vídeo enseña la herramienta con la que está hecho, rejilla de pulso estricta). Úsala tras la skill base motion-graphics cuando pidan un lanzamiento de producto o de app, un estilo keynote, algo oscuro y elegante.
---

# Estilo oscuro (keynote de móvil keynote + app de concentración + tienda online)

Lee antes la skill base `motion-graphics`. Tokens: `OSCURO` y `FondoOscuro` en
`src/motion/capas/index.tsx`. Demo de referencia: `src/motion/demos/oscuro.tsx` (`DemoOscuro`, 10 s) →
`motion/salida/demo-oscuro.mp4`. 

**Interfaz del producto: este estilo no la cambia.** Si el vídeo recrea una pantalla real (vía 1 de la base), sigue el
proceso de fidelidad de la base (§2b): la pantalla lleva los colores, la letra, los radios, los iconos y los textos DEL
PRODUCTO, idénticos a su captura real. El estilo solo pone el fondo, la luz, el ritmo, las transiciones y los rótulos
que van fuera de la interfaz. Nunca recolorees la interfaz con el acento del estilo.

## Lo que lo define (medido)
- Ritmo: **un evento cada 0,5 s** (keynote de móvil 47 eventos en 23 s), ≈1 cambio de plano por segundo (app de concentración), **0–2 cortes
  duros** en todo el vídeo y siempre tapados por un flash de 1–2 fotogramas. Quieto 0–6 %. 120–132 BPM con drop en el
  primer movimiento grande (app de concentración 1,20 s).
- Fondo **#080808** con luz: variante `foco` (app de concentración/keynote de móvil: elipse violácea arriba `#332C3B → #1A1720`) o `halo`
  (tienda online: halo de marca que cambia de sitio en cada plano y LATE ×2–4 con los eventos). Viñeta 0,6.
- **Un solo acento** con halo (cian #14E3E2 de app de concentración, rojo #E11428 del candado/keynote de móvil, lima #CBF249 de tienda online).
  Blanco roto #F5F5F7, gris #8E8E93. Inter 600–650, tracking −0,02 em; titulares alineados a la izquierda (x≈115 px).
- Curvas: entra expo-out (10–15 fotogramas a 60 fps… hasta 0,4 s), sale acelerando (5–10 f). Rebote solo en el
  clímax (notificación, ~10 %, `spring({mass 0.5, stiffness 760, damping 23})` o claves 1→1,08→1).

## Efectos firma y su receta (todos en la demo)
1. **Tarjeta 3D tumbada que asciende y gira a frontal con el drop** (app de concentración E1–E2): `Movil` dentro de
   `<AbsoluteFill style={{perspective:1000}}>` con claves `rx 70→60` subiendo 1500→700 px en 0,95 s y `rx 0`, `s 1,35`
   en 0,5 s más, con `ConDesenfoque` en el giro. Barras que se encienden a blanco en cascada (33 ms).
2. **Barra → sobreexposición → punto → cápsula** (app de concentración E3–E4): `Forma` con fondo por función (gris → cian que se llena
   → blanco) y claves w/h que caen a 24 px en **4 fotogramas**; el punto se abre a cápsula 300×120 y dentro
   `Progreso` + `Contador` con la MISMA curva (inOut 0,8 s) + `PorLetra` de la etiqueta (20 ms por letra).
3. **Salida acelerada y nacimiento por gota de luz** (app de concentración E5): el grupo se va con claves PCHIP (acelera y frena
   largo, `estela`); cada cápsula nueva nace de una gota blanca con halo que se ensancha en 0,12 s; escalón 0,2 s;
   `pop` en el fotograma del nacimiento.
4. **Punch + flash y titular que se descifra** (keynote de móvil E3/E4): zoom de cámara ×1,5 en 0,15 s + `Flash` 0,25 s; tras él,
   `Descifra` (0,2 s) a la izquierda y `Teclea` debajo (1 letra/fotograma).
5. **Neón que se dibuja y se rellena** (keynote de móvil E5): `Neon` (trazo SVG 0,9 s inOut, relleno al 80 %).
6. **Paneo vertical de 1650 px con desenfoque** (app de concentración E7): `Camara2D` con claves y `ConDesenfoque` en la ventana.
7. **Trazo de neón que rodea el icono → gota → candado con halo rojo** (app de concentración E8–E10): rect SVG con
   `strokeDasharray "0.33 0.67"` y offset animado; la gota sube, se para 0,1 s y cae acelerando; el candado cierra en
   4 fotogramas con `click` y halo rojo `0 0 180px 40px` en 0,13 s.
8. **Texto → píldora → (silencio) → notificación** (tienda online E13, el clímax): la frase se comprime (scaleX 1→0,46,
   tracking −0,12 em, 0,38 s ease-in) → `Forma` píldora lima con halo → **0,15 s de silencio** → estalla a tarjeta
   1290→1200 px (un sobrepaso) con `Flash` lima, `Onda` rectangular y contenido que entra 0,07 s después.
9. **Morph inverso hasta la marca** (tienda online E14 + app de concentración E13): tarjeta → píldora → punto (ease-in) y en el golpe la marca
   se enfoca desde blur 28 px y escala 0,43 → 1 en 0,37 s; deriva final ×1,05.
Otros medidos (en los análisis, sin demo aún): foco por filas con profundidad de campo (tienda online E10: fila activa ×1,08,
resto desenfocadas 3–12 px, cambio cada 1 s), icono que sale hacia cámara ×5,4 y se transforma en panel (tienda online E8),
láser que revela rayos X (keynote de móvil E13), zoom a través de una lente con match cut (keynote de móvil E10), móvil dentro del móvil.

## Plantilla de 10 s (la de la demo)
0–1,0 tarjeta asciende · 1,0 drop: gira a frontal · 1,2–2,1 barra → punto · 2,1–3,0 cápsula y contador · 3,0–3,5 salen,
nacen dos más · 4,0 punch+flash: titular + neón · 5,1–5,6 paneo · 5,6–7,0 icono → candado · 7,1–7,75 frase →
píldora · 8,0 estallido · 8,6–9,0 vuelve a punto · 9,0 marca.
Música: `motion/musica/oscuro.json` (120 BPM, drop 1,0, golpes 4,0/8,0/9,0, silencio 7,85–8,0).

## Comprobación
Con interfaz recreada: comparación con la captura real y lista de fidelidad de la base (§2b, F5–F6) pasadas.
`medir-ritmo` objetivo: dif media 4–7, quieto ≤ 10 %, racha ≤ 0,5 s (sin contar el logo final), 0 saltos. Encuadre:
el objeto principal ocupa ≥ 25 % del ancho (zoom de cámara 1,4–2,2 en escenas de un objeto).

## Variantes (mezclas de oscuro, no estilos aparte) — `ESTILOS["oscuro-…"]` en `src/motion/capas`
- **`oscuro-halo`** (lanzamiento de app de streaming o tienda): halo de marca que cambia de sitio en cada plano y late
  ×2–4 con los eventos; **hueco negro detrás del logo** para que un logo del mismo color que el halo se lea; aparato que
  llega desde el fondo volteándose (crece ×24 en 0,87 s, volteo de 0,2 s); la app se abre desde su icono (4–5
  fotogramas) con `FlashCromatico` (morado → blanco → acento → oscuro); `PildoraElastica` entre pestañas (el borde
  delantero va 2 fotogramas por delante, se estira un 80 %); la frase se comprime a barra → bola → icono → logo.
- **`oscuro-brasa`** (portfolio): negro puro #000 y luz naranja (#DD5E27). `LineaLuz` ondulada (±45 px, halo amplio) en
  la que la cámara se mete; pared de paneles vista por una `LenteBarril` (k ≈ 0,5); `PilaTarjetas`/`TarjetaBrillo` claras
  con halo naranja y filo #FFFFE8 que suben 665 px en 0,2 s mientras la cámara se aleja ×0,45; **`Estrobo`** de
  negativo (6 fotogramas a 30 fps) para tapar cada cambio de escena; actos blancos con texto pequeño (48 px) que sube con
  estela. Sonido de diseño (golpes por evento), no a compás.
- **`oscuro-turquesa`** (app de productividad): casi negro #000306 con luz turquesa centrada (#18D9C9). **Corte por
  continuidad de velocidad**: el zoom/giro acelera hasta el corte y sigue al otro lado frenando (sin flash). Órbitas
  de iconos (3 anillos en proporción 1 : 1,66 : 2,37, sentidos alternos, frenan de 204°/s a 20°/s en 2 s y colapsan al
  centro), palabra **seleccionada** (cursor en medio, la caja crece a los dos lados en 0,3 s, tiradores), túnel de
  móviles girando, portal de luz que se estira en barra de búsqueda (escritura rápida que frena) y horizonte de planeta
  que sube con haz de luz para el logo.
- **`oscuro-cobre`** (asistente o producto premium, cálido): negro cálido-violáceo #0B080C, halos cobre (#6B3E2D,
  #482820), acento #D87457, **EB Garamond 500** en titulares + Inter en la interfaz y el código, 124 BPM, muelle 170/12
  (ζ ≈ 0,45) solo en la marca final. Regla: **todo llega con luz y se enfría** (el código cae naranja #E5AC91 y pasa a
  blanco #F7E5E0 mientras se escribe; las palabras llegan con un bloom que se apaga). Recetas (`cobre.tsx`): `Meteoro`
  (aguja de luz núcleo #FDF994 que se apaga en un punto) → `MarcaEstalla` (estrella de 12 brazos 0 → 1,2 → 1 en 0,5 s,
  de melocotón al acento) → `MarcaBrota` (la palabra se despliega desde una letra y empuja la estrella 130 px en 0,73 s,
  bezier 0,85/0/0,15/1) → `ArcoChispa` + `TextoDeChispas` (cada palabra del saludo nace donde cae un arco) →
  `CajaCristal` (#261F1E con borde blanco 6 %, halo que se abre y se apaga dentro) → `CursorMano` + `BotonPulsa` (×0,45
  con ease-in en 7 fotogramas y vuelta expo-out) → `OndaChoque` → `CodigoCae` → `TextoBrasa` («más rápido» con la
  cámara alejándose) → estrella final con muelle. Saltos de zoom tapados con `EcoZoom` (un fotograma de doble
  exposición). Recreación: composición `RecSerifCalido`.
- **`oscuro-cristal`** (asistente de IA, tono tecnológico sereno): casi negro #06070C con **manchas de color distintas
  en cada escena** que derivan siempre (pizarra #455876, violeta #33284D, cálida #8A5649, marino #25334F; `FondoCristal`),
  Urbanist 400–600 (también para el código: sin monoespaciada), ~100 BPM, expo-out largos y **ningún rebote**. Recetas
  (`cristal.tsx`): `TecleaLuz` (una letra por fotograma, nace descifrada con halo azul #6E8EFF que se enfría en 0,33 s;
  borra igual), `BarraPrompt` (cristal #262542→#54577A, contorno blanco de 1–2 px dibujado desde líneas guía, chips que
  caen en cascada inclinados −4°, la `Chispa` de 4 puntas se convierte en «+», tras el clic el extremo ondula como una
  gota y el cristal se enciende de izquierda a derecha), `Estallido` coral #DB7B61 plano de 12 rayos que respira,
  `Mosaico` con canales blancos de 46 px que la cámara recorre subiendo y paneando, `RedNodos` con conectores en codo.
  Cortes escondidos en movimiento (la caída sigue al otro lado o zoom con estela), sin fundidos ni flashes.
  Recreación: composición `RecPromptCristal`.
- **`taller`** (vídeo que enseña cómo está hecho; tutoriales de producto o de motion): escenario grafito
  #55524F→#2A2A2C→#141415 con cúpula de luz naranja #FF5A1F pegada abajo, que pasa a `taller-claro` (blanco roto
  #F5F3EF, tarjetas blancas) con un círculo naranja que llena la pantalla (ease-in de 4 fotogramas) y se recoge en una
  tarjeta (ease-out de 7). Un solo acento #FF4F2D, Inter 800–900 + mono. **Rejilla de pulso estricta**: 28 fotogramas a
  60 fps (128,6 BPM) para TODO (botes, cámara, clics, contador). Muelle 180/12 (sobrepaso 20 %, medio periodo 0,27 s).
  Recetas (`taller.tsx`): `LetrasCoreografia`, `TrackingRespira`, `EstallidoLetras` (se van todas menos una), `BolaRebote`
  (parábola de 14 fotogramas a 30 fps, +30 % de alto al caer), `VentanaEditor` + `EditorCurvas` (la escena retrocede
  dentro de su editor y la curva dibujada es la que mueve la bola), `Interruptor`, `DiscoObturador`, `MosaicoVivo`,
  `ContadorRodillo` (quint-out ~1 s + rodillo final de 4 fotogramas) y `GlifoPuente` (el «0» de la cifra se convierte
  en la letra del logo, quad-out de 0,53 s). Sonido solo efectos en la rejilla. Recreación: composición `RecReelPantalla`.
