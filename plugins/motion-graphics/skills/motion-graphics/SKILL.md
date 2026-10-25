---
name: motion-graphics
description: Skill MAESTRA de motion graphics en Remotion — palabra clave de activación "MOTION GRAPHICS" o /motion-graphics. Entiende el pedido (lanzamiento de producto, promo, gancho para redes, intro, reel, demo de app, logo animado), decide la idea y el hilo conductor, elige y combina técnicas (interfaz fiel al producto real, movimiento, transiciones por objeto, tipografía cinética, luz y shaders, 3D y partículas, mapas 3D en perspectiva, ritmo y sonido), escribe el guion por eventos, construye la pieza con el kit Remotion incluido (60 fps, sin GPU) y la verifica con fotogramas, medidas y comparación con capturas reales antes de enseñarla. Úsala SIEMPRE que pidan "MOTION GRAPHICS", "motion graphics", "vídeo animado de mi producto", "vídeo de lanzamiento", "promo animada", "gancho visual", "intro animada", "animar mi app/web/panel", "vídeo de keynote", "launch video", "product promo video", "animated explainer", "mapa animado", "ruta animada".
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

**Kit**: carpeta `kit/` junto a este fichero — proyecto Remotion (1920×1080, 60 fps) con el motor
(`kit/src/motion/base`), las direcciones (`kit/src/motion/capas`), demos y recreaciones verificadas, efectos de sonido y
músicas sintetizadas y scripts (render, fotogramas, recortes, música, medir ritmo, capturas, tokens, fidelidad,
comparar vídeo). Copia el kit (o `src/motion` + `scripts` + `public` en tu proyecto Remotion) y `npm install`.

## Reglas de la casa (siempre)
- **Sobrio y profesional**: sin emojis ni pegatinas, rótulos y subtítulos **sin caja** detrás, una o dos familias.
- **Fiel al producto real**: interfaz recreada idéntica (colores, letra, logo, iconos, textos, datos) y comparada con
  capturas reales antes de darla por buena (`motion-interfaz` §3). Solo lo que el producto hace hoy.
- **Recortes animados, no capturas enteras con zoom**: las partes de una interfaz se despegan y se animan como piezas
  2D/3D; una ventana entera con un zoom lento es una diapositiva.
- **Nada quieto, nada de fundidos de diapositiva**: algo nuevo cada 0,2–0,5 s; cada plano nace de un objeto del anterior.
- **No gastes dinero sin permiso**: todo lo del kit es local (música y efectos sintetizados). Si algo necesita una API
  de pago (voz, vídeo o imágenes con IA), estima el precio y pide el visto bueno antes.
- Trabaja con el modelo más capaz disponible y con esfuerzo alto: el motion graphics se nota muchísimo.

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
(`EstiloProvider`), así que se combinan sin rehacerlas.

## Paso 4 · Guion por eventos y sonido
Una fila por pulso: `t · golpe · qué entra · de qué objeto nace · cámara · sonido` (`motion-ritmo-sonido`). Elige el BPM
y la música (`scripts/musica.mjs`, sintetizada) ANTES de animar. Escribe el guion en `GUION.md` del vídeo.

## Paso 5 · Construir
1. Copia el kit (o úsalo dentro de tu proyecto Remotion) y `npm install`.
2. Si hay interfaz: F1–F4 de `motion-interfaz` (tokens del producto con su origen) antes de dibujar nada.
3. Escribe la composición en `src/motion/videos/<nombre>.tsx` partiendo de la demo o la recreación más cercana a la
   dirección (`kit/src/motion/demos`, `kit/src/motion/recreaciones`). Regístrala en `src/Root.tsx` a `fps={60}`
   (1920×1080, o 1080×1920 en vertical).
4. Una escena = un componente con su tiempo local (`Sequence`); los tiempos salen de la tabla del guion.
5. `npx tsc --noEmit` sin errores.

## Paso 6 · Verificar (antes de enseñar nada)
1. **Fotogramas**: `node scripts/render.mjs stills <Comp> [props.json] 0.5 1.2 …` y hoja de contacto
   (`ffmpeg -i v.mp4 -vf "fps=4,scale=320:-1,tile=8x5" hoja.jpg`): encuadre, solapes, texto legible, rótulos dentro
   del cuadro (en 9:16 sobre todo), restos de captura.
2. **Interfaz**: F5 (comparación con la captura real, con cifras) y lista F6 de `motion-interfaz`.
3. **Render**: `node scripts/render.mjs render <Comp> [props.json]` (≈15–30 s de render por segundo de vídeo a 60 fps
   en 3 núcleos). Para corregir un tramo: `--desde a --hasta b --mudo` + `node scripts/empalmar.mjs`.
4. **Medir**: `node scripts/medir-ritmo.cjs v.mp4` (quieto ≤ 10 %, racha ≤ 0,5 s, saltos ≈ 0) y
   `ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` (−14 LUFS para redes, pico < −1 dBFS).
5. **Revisión**: si tienes un revisor de vídeo con IA, pásale el MP4 con lo que debe juzgar; contrasta cada fallo que
   diga con los fotogramas antes de corregir (inventa desfases y erratas).
6. Si hay una referencia: `node scripts/comparar-video.mjs ref.mp4 tuyo.mp4 comp.mp4` (timing ≥ 0,8, color < 8–10).

## Paso 7 · Entregar
Resumen corto: idea e hilo conductor, técnicas usadas y por qué, qué se ha comprobado (cifras de F5, ritmo, sonido) y
qué queda (desviaciones de la interfaz, textos por confirmar).

## Referencias
- [references/direcciones.md](references/direcciones.md): las direcciones de partida (antes, skills de estilo) y cómo mezclarlas.
- [references/catalogo.md](references/catalogo.md): todos los componentes del kit, por técnica y por fichero.
- [references/aprender-referencia.md](references/aprender-referencia.md): cómo aprender un vídeo de referencia y meterlo en el kit.
