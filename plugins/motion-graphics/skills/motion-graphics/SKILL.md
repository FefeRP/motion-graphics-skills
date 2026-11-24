---
name: motion-graphics
description: Skill MAESTRA de motion graphics con HyperFrames (HTML + CSS + GSAP a vídeo de 60 fps; Remotion de apoyo). Entiende el pedido (lanzamiento, promo de producto, gancho para redes, intro, reel, demo de app, logo animado, mapa), decide la idea y el hilo, combina técnicas (interfaz fiel, movimiento, transiciones, tipografía cinética, luz y shaders, 3D, mapas, ritmo y sonido), escribe el guion por eventos y lo pasa por la checklist anti-aburrimiento, decide qué va por código y qué con IA (Higgsfield, siempre con presupuesto antes), construye con el kit incluido y verifica fotogramas, ritmo, volumen y fidelidad. Úsala SIEMPRE que pidan "MOTION GRAPHICS", "motion graphics", "vídeo animado de mi producto", "vídeo de lanzamiento", "promo animada", "promo de producto", "promo SaaS", "la promo es aburrida", "más impacto", "gancho visual", "intro animada", "animar mi app/web", "launch video", "product promo video", "animated explainer", "mapa animado" o "motion graphics con IA".
model: opus
---

# MOTION GRAPHICS: de un pedido a una pieza que se mueve como un estudio

Esta skill **dirige**: decide qué hacer y en qué orden, y delega el *cómo* en las skills de técnica del plugin:
- `motion-interfaz` — enseñar un producto: recrear su interfaz idéntica (proceso F1–F6), recortes animados, móviles,
  pilas de pantallas, líneas de tiempo.
- `motion-movimiento` — curvas, muelles, PCHIP, cámara 2D/3D, piezas con trayectoria, desenfoque, encuadre.
- `motion-transiciones` — objeto puente, hilo conductor, cortes escondidos, iris, flashes, zoom a través.
- `motion-tipografia` — texto cinético: desenfocado a nítido, palabra a palabra, descifrar, máscaras, logotipos.
- `motion-luz-fondo` — fondos vivos, luz de esquina, halo, humo con shader, cristal, profundidad de campo, grano.
- `motion-3d` — profundidad por capas, mundo con cámara, iconos flotando, órbitas, partículas que cambian de forma.
- `motion-mapas` — mapas 3D en perspectiva: ciudad que crece, cámara que sigue un punto, rutas, pines, tráfico, plegado final.
- `motion-ritmo-sonido` — rejilla de pulso, guion por eventos, música sintetizada, efectos al fotograma.

**Nunca por estilos** ("plantilla oscura"): por técnicas que se combinan según el producto, la historia y el formato.
Las antiguas skills de estilo son ahora **direcciones de partida** (ajustes de paleta, letra y ritmo) en
[references/direcciones.md](references/direcciones.md).

**Kit principal**: carpeta `kit/` junto a este fichero — **HyperFrames** (HTML + CSS + GSAP a vídeo, versión fijada
0.9.34, sin telemetría ni nube), 1920×1080 a 60 fps: motor `kit/comun/mg.js` (`MG.*`: tiempo, curvas, PCHIP, muelles,
cámara 2D/3D con desenfoque, piezas, texto cinético, efectos, luz, 13 direcciones, elementos externos), demos en
`kit/piezas/`, efectos y músicas sintetizados en `kit/comun/` y scripts (`mg.mjs` render/fotogramas/lint, `alfa.mjs`,
`bucle.mjs`, `medir-bucle.mjs`, música, medir ritmo, capturas, tokens, fidelidad, comparar vídeo).
`npm install --ignore-scripts` en `kit/`. Cómo se escribe una pieza: [references/hyperframes.md](references/hyperframes.md).
**Kit secundario** `kit-remotion/` (congelado): lo que aún no está portado (recreaciones de cobre, cristal, punto,
taller, seguimiento, mapas 3D, `DemoEfectos2`, fidelidad). Úsalo solo para eso; las técnicas nuevas van a HyperFrames.

## Reglas de la casa (siempre)
- **Sobrio y profesional**: sin emojis ni pegatinas, rótulos y subtítulos **sin caja** detrás, una o dos familias.
- **Fiel al producto real**: interfaz recreada idéntica (colores, letra, logo, iconos, textos, datos) y comparada con
  capturas reales antes de darla por buena (`motion-interfaz` §3). Solo lo que el producto hace hoy.
- **Recortes animados, no capturas enteras con zoom**: las partes de una interfaz se despegan y se animan como piezas
  2D/3D; una ventana entera con un zoom lento es una diapositiva.
- **Nada quieto, nada de fundidos de diapositiva**: algo nuevo cada 0,2–0,5 s; cada plano nace de un objeto del anterior.
- **No gastes dinero sin permiso**: todo lo del kit es local (música y efectos sintetizados). Lo generado con IA
  (Higgsfield u otro) va SIEMPRE con un **presupuesto máximo** acordado y el **precio estimado antes** de cada
  generación (`estimate_*_cost`); sin presupuesto, saldo o prueba activa, no se genera: se hace por código.
- **Nada que parezca IA**: ni piel de cera, ni texto deformado, ni manos raras, ni brillo plástico, ni cámaras
  imposibles. Lo generado se integra (recorte, alfa, color de la dirección, grano y luz comunes) o no entra. Si un
  plano generado es realista (personas, lugares), avisa de que lleva aviso de contenido generado con IA al publicarlo.
- Trabaja con el modelo más capaz disponible y con esfuerzo alto: el motion graphics se nota muchísimo.

## Promo de producto o lanzamiento: lee esto primero
Si es una promo, un lanzamiento o una alternativa a la competencia, **antes del guion** lee
[references/promo-producto.md](references/promo-producto.md): las 10 leyes con números (producto en el fotograma 0,
un evento cada ≤ 1,8 s, variar escala y molde, UI viva y de cerca, transiciones todas distintas, sonido con firma,
cierre con clímax), plantillas por segundos de 15, 30, 45 y 60 s y recetas de hooks y transiciones. Y antes de
entregar, la [checklist anti-aburrimiento](references/checklist-promo.md) (bloque A automático con
`node scripts/revisar-guion.mjs GUION.md`). Cumplir la rejilla y meter 3D no basta: aburre lo predecible.
**Con voz en off**, además, [references/promo-recetas.md](references/promo-recetas.md) y la plantilla
`kit/piezas/promo.html`: preguntas que plantean el problema, hook palabra a palabra clavado a la voz, fondo a sangre
sin velos, subtítulos en píldora de cristal, un solo material y una sola dimensión, revelado del logo con anticipación
y capas, microdetalles, locución escrita como suena (`scripts/voz.mjs`), música con ducking y drop en el revelado
(`scripts/audio.mjs`, que también la cambia sin re-renderizar) y cómo arrastrar todos los cambios entre versiones.
Iconos, fondos y objetos **de la marca**: [references/recursos.md](references/recursos.md) (Higgsfield + carpeta de
marca con `scripts/marca.mjs`); decoración y shaders: el kit o la librería de NEW ERA, que **se copian tal cual**.

## Paso 1 · Entender el pedido (brief)
Saca del pedido (pregunta **solo** lo que falte y cambie la decisión, en una tanda):
1. **Qué y para qué**: producto o marca, objetivo (lanzar, explicar una función, gancho para redes, intro) y la acción
   que debe hacer quien lo ve.
2. **Formato**: duración (gancho 6–12 s, función 20–30 s, lanzamiento 30–60 s), 16:9 / 9:16 / 1:1, con o sin voz.
3. **Material**: código del producto, web, capturas, logo SVG, fuentes, textos, cifras reales. Sin esto, la interfaz
   no puede ser fiel: pídelo.
4. **Marca**: colores, letra, tono. Si no hay, se toman del producto.
5. **Referencias** que le gusten (vídeos): si hay, apréndelas antes ([references/aprender-referencia.md](references/aprender-referencia.md)).
Escríbelo en `BRIEF.md` del vídeo (8–12 líneas).

## Paso 2 · Dirección: una idea y un hilo conductor
1. **La idea en una frase** ("el pedido viaja de la fábrica a la puerta y la app lo cuenta en tiempo real").
2. **El hilo conductor**: el objeto que atraviesa todo el vídeo y cambia de papel (un punto, una tarjeta, la inicial
   del logo, una línea de tiempo). Sin hilo conductor, el vídeo será una sucesión de diapositivas.
3. **El momento estrella**: UN plano que se recuerde (la pila de pantallas que se abre en profundidad, el logo que
   brota del foco de luz). El resto, contenido y limpio.
4. **Gancho** (si es para redes): imagen + texto + sonido desde el fotograma 0; la promesa o la pregunta antes de 1,5 s.
5. **Dirección de partida** en [references/direcciones.md](references/direcciones.md) (o una mezcla con `mezclar()` y el
   color de la marca). Apunta la decisión y el porqué en `BRIEF.md`.

## Paso 3 · Elegir técnicas
| Quiero… | Técnica | Skill |
|---|---|---|
| Enseñar la app o el panel | Interfaz recreada 1:1 con piezas que se mueven por separado | `motion-interfaz` |
| Enseñar un recorrido o un proceso (pedido, alta, pasos) | Línea de tiempo de estados que la cámara recorre | `motion-interfaz` §4 + `motion-movimiento` |
| Varias pantallas de una app con profundidad | Pila de pantallas de móvil en z con traspaso de foco | `motion-interfaz` §4 + `motion-3d` |
| Que no se note ningún corte | Objeto puente / corte por velocidad / iris de luz | `motion-transiciones` |
| Titulares y ganchos con presencia | Palabra a palabra con desenfoque, frase que cambia solo una palabra | `motion-tipografia` |
| Logotipo final | Remolino + foco de borde suave al color de marca + símbolo solo y palabra que se teclea y se recentra | `motion-transiciones` + `motion-tipografia` |
| "No necesitas otras apps", integraciones | Anillo inclinado de iconos alrededor de una frase cuyo final cambia / órbitas | `motion-3d` + `motion-tipografia` |
| Que se vea caro y no "de IA" | Luz que se mueve, profundidad de campo, grano sutil, cristal | `motion-luz-fondo` |
| Energía de reel | Rejilla de pulso estricta, morph en cada tiempo, color por compás | `motion-ritmo-sonido` + `motion-transiciones` |
| Partículas, formas, 3D | Nube de puntos, formas que se transforman, mundo con cámara | `motion-3d` |
| Un recorrido, una ubicación, reparto, inmobiliaria, "estilo app de mapas" | Ciudad 3D en un canvas, cámara que sigue el punto, ruta que avanza, barridos con desenfoque, pin con onda | `motion-mapas` |
Combina **1 técnica fuerte (el momento estrella) + 2–4 de apoyo**. Todas las piezas leen la dirección elegida
(`MG.montar({ estilo })`; en kit-remotion, `EstiloProvider`), así que se combinan sin rehacerlas.

## Paso 3b · Código, IA o mezcla (y presupuesto)
| Por **código** (siempre) | Con **IA** (Higgsfield), si hay presupuesto | **Mezcla** (lo normal) |
|---|---|---|
| Texto exacto, cifras, interfaz, logos, iconos, gráficos de datos: todo lo que tenga que ser fiel o legible | Lo orgánico o cinematográfico: humo, agua, tela, fuego, luz volumétrica, materiales, un producto físico que gira, un personaje, un fondo fotográfico o pictórico, texturas | Fondo o elemento generado (en bucle, con alfa) + interfaz, texto y logo por código encima, con la misma cámara, color y ritmo |

Modo **motion graph entero con IA** (planos generados montados con transiciones y rótulos por código): solo si el
pedido es atmosférico o de marca y hay presupuesto; nunca para enseñar una interfaz. Antes de generar nada: lista de
elementos con modelo, duración y resolución, **precio estimado de cada uno y total**, y visto bueno con el presupuesto
máximo. Recetas, modelos, prompts, descarga e integración: [references/elementos-ia.md](references/elementos-ia.md).

## Paso 4 · Guion por eventos y sonido
Una fila por pulso: `t · golpe · escala · qué entra · de qué objeto nace · transición · cámara · texto · sonido` (`motion-ritmo-sonido`; plantilla en `references/promo-producto.md`). Comprueba la tabla con `node scripts/revisar-guion.mjs GUION.md` antes de animar. Elige el BPM
y la música (`scripts/musica.mjs`, sintetizada) ANTES de animar. Escribe el guion en `GUION.md` del vídeo.

## Paso 5 · Construir
1. Copia el kit y `npm install --ignore-scripts` (ffmpeg en el PATH o en la variable `FFMPEG`).
2. Si hay interfaz: F1–F4 de `motion-interfaz` (tokens del producto con su origen) antes de dibujar nada.
3. Escribe la pieza en `kit/piezas/<nombre>.html` partiendo de la demo más cercana (`oscuro`, `claro`, `agencia`,
   `mezcla`, `elementos`): una función pura `escena(t)` que devuelve el árbol con `MG.h()` y los componentes `MG.*`,
   y `MG.montar({ id, duracion, fps: 60, estilo, escena })`. Sonido en el bloque JSON `mg-sonido`. Elementos generados
   en `kit/comun/elementos/`. Detalle y reglas del motor: [references/hyperframes.md](references/hyperframes.md).
4. Los tiempos salen de la tabla del guion (una constante por evento; los efectos de sonido usan los mismos tiempos).
5. `node scripts/mg.mjs lint <pieza>`: 0 errores.

## Paso 6 · Verificar (antes de enseñar nada)
1. **Fotogramas**: `node scripts/mg.mjs stills <pieza> 0.5,1.2,3 [--variables JSON]` (≈9 s) y hoja de contacto
   (`ffmpeg -i v.mp4 -vf "fps=4,scale=320:-1,tile=8x5" hoja.jpg`): encuadre, solapes, texto legible, rótulos dentro
   del cuadro (en 9:16 sobre todo), restos de captura.
2. **Interfaz**: F5 (comparación con la captura real, con cifras) y lista F6 de `motion-interfaz`.
3. **Render**: `node scripts/mg.mjs render <pieza> -o salida/x.mp4 [--variables JSON]` (≈6–7 s de render por segundo
   de vídeo a 60 fps con 3 núcleos y sin GPU; con Remotion eran 15–30). Un tramo: `--desde a --hasta b`; borrador:
   `--calidad draft`. Con clips generados: costura de los bucles (`scripts/medir-bucle.mjs`) y el clip pegado a la
   escena fotograma a fotograma.
4. **Medir**: `node scripts/medir-ritmo.cjs v.mp4` (quieto ≤ 10 %, racha ≤ 0,5 s, saltos ≈ 0) y
   `ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` (−14 LUFS para redes, pico < −1 dBFS).
5. **Revisión**: si tienes un revisor de vídeo con IA, pásale el MP4 con lo que debe juzgar; contrasta cada fallo que
   diga con los fotogramas antes de corregir (inventa desfases y erratas).
6. Si hay una referencia: `node scripts/comparar-video.mjs ref.mp4 tuyo.mp4 comp.mp4` (timing ≥ 0,8, color < 8–10).
7. **Promo o lanzamiento**: [checklist anti-aburrimiento](references/checklist-promo.md) entera (guion, fotogramas,
   medidas y revisor con su prompt): no se entrega hasta que todo esté en verde y el revisor dé ≥ 8 en «¿aburre?».

## Paso 7 · Entregar
Resumen corto: idea e hilo conductor, técnicas usadas y por qué, qué se ha comprobado (cifras de F5, ritmo, sonido) y
qué queda (desviaciones de la interfaz, textos por confirmar).

## Referencias
- [references/promo-producto.md](references/promo-producto.md): promos y lanzamientos SaaS de primer nivel: leyes con números, plantillas por segundos, recetas de hooks, transiciones y UI viva, sonido, antipatrones.
- [references/checklist-promo.md](references/checklist-promo.md): la checklist anti-aburrimiento (guion, fotogramas, medidas, prompt del revisor).
- [references/promo-recetas.md](references/promo-recetas.md): promo con voz en off: estructura, hook, fondo, píldora, coherencia, revelado del logo, microdetalles, música y ducking, locución, versiones (con números y scripts).
- [references/recursos.md](references/recursos.md): de dónde sale cada recurso: código del kit o librería de NEW ERA (tal cual), Higgsfield para lo propio de la marca (modelo, prompt, encaje, revisión) y carpeta de marca reutilizable.
- [references/direcciones.md](references/direcciones.md): las direcciones de partida (antes, skills de estilo) y cómo mezclarlas.
- [references/hyperframes.md](references/hyperframes.md): el motor principal: cómo se escribe una pieza, reglas, sonido, render.
- [references/elementos-ia.md](references/elementos-ia.md): elementos generados con Higgsfield: cuándo, modelo, prompt, presupuesto, descarga, alfa, bucle e integración.
- [references/catalogo.md](references/catalogo.md): todos los componentes de los dos kits, por técnica.
- [references/aprender-referencia.md](references/aprender-referencia.md): cómo aprender un vídeo de referencia y meterlo en el kit.
