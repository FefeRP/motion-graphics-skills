# Recursos de un vídeo: de dónde salen y dónde se guardan

Tres fuentes, en este orden. **No hay una librería común de recursos generados** (iconos, mascotas, fondos de marca)
dentro de este plugin: si todos los usuarios usaran los mismos, todos los vídeos saldrían iguales.

| Qué | De dónde | Se modifica |
|---|---|---|
| Decoración, shaders y fondos animados, efectos de texto, partículas, rejillas, brillos, transiciones | **Código**: el kit (`MG.*`) o la **librería de NEW ERA** (abajo) | Se copian **tal cual** y se retocan solo si hace falta (color de la marca, tiempos) |
| Iconos, iconos animados, objetos, productos, personajes, fondos y texturas **propios de la marca o del proyecto** | **Higgsfield** (§2), generados por cada usuario para su marca | Se generan a medida desde el principio |
| Lo que ya se generó para esa marca en vídeos anteriores | **Carpeta de recursos de marca** del usuario (§3) | Se reutilizan; si se crean variantes, con el mismo prompt base |

Texto, cifras, interfaz y logos van siempre por código (el logo, el SVG real de la marca).

## 1. Librería de NEW ERA (decoración y shaders listos)
El marketplace hermano **the-new-era-websites** tiene una biblioteca de componentes (fondos animados, shaders,
textos animados, brillos, marquesinas, 3D…) y motores sin dependencias. Es general para todas las skills: el motion
graphics la usa como cantera de **decoración**.
- **Cómo se consulta**: si el plugin está instalado, con su skill `biblioteca-componentes`:
  `node <plugin the-new-era-websites>/skills/biblioteca-componentes/scripts/buscar.mjs "shader de malla"` (y
  `ver <id> --todo` para el código). El catálogo se apunta con `BIBLIOTECA_COMPONENTES` (carpeta o URL; credenciales,
  si las pide, en `BIBLIOTECA_AUTH_FILE`, nunca en ficheros del vídeo). Sin plugin o sin catálogo, el kit basta
  (`MG.Manchas`, `Aurora`, `Halo`, `Grano`, `Vineta`, partículas, formas): no bloquees el vídeo esperando la librería.
- **Copiar tal cual vale**: un shader o una decoración que ya funciona rara vez mejora rehecho. Cópialo y retócalo solo
  si hace falta (colores de la dirección, velocidad). La regla de «cambiar cuatro cosas» de esa skill es para webs, no
  para estos vídeos.
- **Lo único obligatorio es hacerlo determinista** (si no, HyperFrames no lo renderiza igual en cada fotograma):
  1. Todo el tiempo sale de `t` de `escena(t)`: fuera `requestAnimationFrame`, `Date.now`, `performance.now`,
     `setInterval`, `Math.random` (usa `MG.azar(semilla)`) y transiciones CSS (el lint del kit lo comprueba, también en
     comentarios).
  2. Un shader WebGL: crea el contexto una vez y en `escena(t)` pon el uniforme de tiempo (`uTime = t`) y dibuja.
     Canvas 2D: igual, se repinta desde `t`.
  3. React/Tailwind no hacen falta: pasa el JSX a HTML + CSS normal dentro de la pieza (las clases de Tailwind se
     traducen a sus propiedades).
  4. Conserva el aviso de licencia y autor en un comentario del fichero (dentro del `<script>`, nunca antes del doctype).
- **Fondos a pantalla completa**: ver «Fondo sin huecos ni franjas» en [promo-recetas.md](promo-recetas.md) (el shader
  cubre el lienzo entero, sin velos encima).

## 2. Generar recursos de marca con Higgsfield
Antes de nada, §0 de [elementos-ia.md](elementos-ia.md): **presupuesto máximo**, precio estimado de cada recurso con
`estimate_image_cost` / `estimate_video_cost`, `balance` antes y después, una generación cada vez. Sin presupuesto, sin
saldo o sin prueba activa no se genera: se hace por código y se dice qué y cuánto costaría.

### 2a. Qué modelo
| Recurso | Modelo | Ajustes |
|---|---|---|
| **Icono** (juego de 4–12) | GPT Image 2.x (formas limpias, coherencia de trazo) o Nano Banana 2 / Pro (editar a partir de uno bueno) | 1:1, 1024–2K, fondo liso para recortar |
| **Icono animado 1–2 s en bucle** | imagen del icono (arriba) → Seedance 2.0 image-to-video con **la misma imagen de inicio y de fin** | 5 s mínimo de generación → se recorta el ciclo de 1–2 s con `bucle.mjs`; 480–720p; `generate_audio: false` |
| **Elemento / objeto / producto** | GPT Image o Nano Banana (producto real: Nano Banana editando su foto) | ver tabla de [elementos-ia.md](elementos-ia.md) §1 |
| **Fondo** (atmósfera, estudio, textura de marca) | Seedream 5.x (fotográfico/material) o Nano Banana | 16:9 o 9:16 al tamaño final; el movimiento, por código |
| **Fondo vivo** (humo, luz, agua) | Seedance 2.0 sobre negro, cámara fija | bucle + `alfa.mjs --modo negro` |

### 2b. Cómo escribir el prompt (en inglés)
- **Iconos: un sistema, no dibujos sueltos.** Escribe primero el «ADN» del juego y repítelo palabra por palabra en
  cada icono: estilo (p. ej. `soft 3D clay icon` / `flat duotone line icon, 2px rounded stroke`), material, luz (`soft
  key light from top left, gentle contact shadow`), ángulo (`three-quarter view` o `front view`), paleta con los HEX de
  la marca (`palette: #D87457 and #F3E9DF only`), encuadre (`single object centered, 70% of the frame, generous
  padding`) y fondo (`on a perfectly flat pure #00B140 green background`). Solo cambia el objeto.
- **Lo que funcionó en una promo real**: GPT Image 2.x **imagen a imagen**, con una captura o boceto del estilo de la
  pieza como referencia, y **una sola imagen con todo el juego** (p. ej. los 5 iconos en fila sobre gris liso) que
  luego se recorta: salen hermanos. Genera en el estilo de la pieza (plano si el vídeo es plano), no en el «premium 3D»
  que el modelo da por defecto: unos iconos 3D brillantes en un vídeo plano se tuvieron que retirar. El movimiento de
  un icono en el vídeo (flotar, latir, girar) suele quedar mejor **por código** que generado con vídeo.
- Pide **un objeto por icono** que se lea a 64 px: silueta clara, 2–3 colores, sin texto ni letras (salen deformadas).
- Para un juego coherente, genera el primero bueno y haz los demás **editándolo** con Nano Banana («same style,
  lighting, palette and framing; replace the cup with a calendar»): sale más parecido que con prompts separados.
- **Icono animado**: con la imagen del icono como inicio Y fin, describe **solo** un movimiento pequeño y cíclico
  (`the steam gently rises and loops, the cup stays perfectly still, locked-off camera, seamless loop`). Un solo gesto:
  latir, girar 15°, flotar 4 px, una chispa. Nada de cámara.
- **Fondos**: luz y color de la dirección (`est().luz`, `est().acento`), espacio libre donde irá el texto (`empty
  upper two thirds`), sin objetos protagonistas, sin texto.
- Lo que delata la IA y se evita: `hyperrealistic, 8k, masterpiece`, brillos plásticos, simetría perfecta, degradados
  arcoíris, manos y texto. Ver [elementos-ia.md](elementos-ia.md) §2.

### 2c. Encajarlos con la marca
1. **Recorte**: `alfa.mjs --modo croma --color auto --recortar` (iconos opacos) o `--modo negro` (luz, humo).
   Revisa el borde sobre un color chillón: sin halo verde.
2. **Color**: si un tono se desvía, `MG.Elemento(t, { color: { color: est().acento, fuerza: 0.2–0.4, modo: "color" } })`
   (el tinte se recorta con el alfa). Un juego de iconos con tonos dispares se ve barato: iguálalos antes.
3. **Tamaño y caja**: todos los iconos del juego a la misma caja (mismo aire alrededor) y misma sombra; el kit no
   añade sombras propias a un icono que ya trae la suya.
4. **Luz**: la del icono en el mismo lado que la de la escena; si no, invierte en horizontal o regenera.
5. **Textura común**: `MG.Grano` y `MG.Vineta` por encima de todo (código y generados).
6. **Bucles**: `bucle.mjs` y `medir-bucle.mjs` (salto en la costura ≤ 1,5× el de cualquier fotograma); después
   `alfa.mjs` → `alfa.webm` (VP9 con alfa) → `<video class="clip">` fijo en el HTML + `MG.colocaMedio`.

### 2d. Revisarlos (antes de usarlos)
- Hoja de contacto del juego entero a tamaño real (64, 128 y 256 px) sobre el fondo del vídeo: ¿parecen de la misma
  familia (trazo, luz, paleta, caja)? ¿Se reconoce cada uno a 64 px?
- Icono animado: verlo en bucle 5 veces seguidas; la costura no se nota y nada se deforma (bordes que hierven, formas
  que cambian).
- Nada de texto o letras dentro, ni marcas ajenas, ni manos.
- Si falla: una sola cosa cambiada por intento (prompt, o modelo, o imagen de inicio) y apunta qué funcionó.

## 3. Carpeta de recursos de marca (reutilizar en los siguientes vídeos)
Lo que el usuario genere (o traiga) para SU marca se guarda fuera del kit y del vídeo, para que el próximo vídeo de esa
marca lo tenga a mano y sea coherente con el anterior:
```bash
node scripts/marca.mjs crear "Mi Marca" --acento "#D87457" --fondo "#0B080C" --texto "#F3E9DF" --fuente "EB Garamond" --direccion oscuro-cobre
node scripts/marca.mjs guardar "Mi Marca" icono-taza.png --tipo icono --nombre taza --modelo gpt_image_2_6 --prompt "<prompt exacto>" --coste 0.25
node scripts/marca.mjs listar "Mi Marca"              # qué hay (tipo, nombre, modelo)
node scripts/marca.mjs usar "Mi Marca"                # lo copia a comun/marca/mi-marca/ y escribe marca.js
```
- Dónde: `MG_MARCAS` o, por defecto, `~/.motion-graphics/marcas/<marca>/` (`marca.json` con colores, letra y
  dirección; `recursos/<tipo>/`; `recursos.json`; `REGISTRO.md` con modelo, prompt y coste de cada recurso, para hacer
  variantes coherentes). Tipos: `icono`, `icono-animado`, `elemento`, `fondo`, `textura`, `logo`, `musica`, `otro`.
- En la pieza, después de `mg.js`: `<script src="comun/marca/mi-marca/marca.js"></script>` y
  `const EST = MG.mezclar(MG.ESTILOS[MARCA.direccion], MARCA.estilo)`; las rutas en `MARCA.recursos.icono.taza`, etc.
- **Al empezar un vídeo**: `marca.mjs listar` antes de generar nada (lo que ya existe no se paga otra vez). **Al
  acabarlo**: guarda en la marca lo generado que haya quedado BUENO (con su prompt) y nada de lo descartado.
- Las marcas son del usuario: no se publican ni se mezclan entre marcas (un icono de una marca no va en el vídeo de otra).
