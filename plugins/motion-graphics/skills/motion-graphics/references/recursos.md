# Recursos de un vídeo: de dónde salen y dónde se guardan

Tres fuentes, en este orden. **No hay una librería común de recursos generados** (iconos, mascotas, fondos de marca)
dentro de este plugin: si todos los usuarios usaran los mismos, todos los vídeos saldrían iguales.

| Qué | De dónde | Se modifica |
|---|---|---|
| Decoración, shaders y fondos animados, efectos de texto, partículas, rejillas, brillos, transiciones | **Código**: el kit (`MG.*`) o la **librería de componentes** (§1, solo las categorías de vídeo) | Se copian **tal cual** y se retocan solo si hace falta (color de la marca, tiempos) |
| Iconos, iconos animados, objetos, productos, personajes, fondos y texturas **propios de la marca o del proyecto** | **Higgsfield** (§2), generados por cada usuario para su marca | Se generan a medida desde el principio |
| Lo que ya se generó para esa marca en vídeos anteriores | **Carpeta de recursos de marca** del usuario (§3) | Se reutilizan; si se crean variantes, con el mismo prompt base |

Texto, cifras, interfaz y logos van siempre por código (el logo, el SVG real de la marca).

## 1. Librería de componentes (decoración y shaders listos)
La librería de componentes del marketplace hermano **the-new-era-websites** (skill `biblioteca-componentes`) es la
librería común de recursos de todas las skills: fondos y shaders, texto animado, efectos, 3D… con el código, la
licencia y el autor de cada pieza. El motion graphics la usa como cantera de **decoración**, solo en las categorías que
sirven en vídeo.

### 1a. Acceso (lo pone cada persona en SU entorno, nunca en ficheros del vídeo ni del repo)
```bash
# a) carpeta local con indice.json y c/<fuente>/<slug>.json (quien mantiene el catálogo)
export BIBLIOTECA_COMPONENTES=/ruta/al/catalogo/datos
# b) la API del catálogo con un token personal (lo normal): se recibe con una invitación de tipo «skills»
export BIBLIOTECA_COMPONENTES=https://catalogo.ejemplo.com/api
export BIBLIOTECA_TOKEN_FILE=/ruta/fuera/del/proyecto/token.txt    # o BIBLIOTECA_TOKEN=ne_… en la sesión
```
- **Invitación «skills»**: la pide cada persona a quien administra la librería. Es un enlace de un solo uso (caduca a
  las 72 h) que da un **token personal** para la API; no abre la web del catálogo. El token no se comparte, no se pega
  en el chat y no va en ningún fichero del vídeo, del kit ni de un repo (si se filtra, se pide que lo revoquen).
- La API da el índice entero y un **número limitado de fichas con código al día** por persona: busca en el índice y
  pide solo las que vayas a usar. Las de licencia «no redistribuir» llegan sin código (solo el enlace a su web).
- Errores: 401 = falta el token o no vale (revocado, mal copiado); 429 = límite del día.
- Sin acceso, el kit basta (`MG.Manchas`, `Aurora`, `Halo`, `Grano`, `Vineta`, partículas, formas): no bloquees el vídeo.

### 1b. Buscar y traer (desde la carpeta del kit)
```bash
node scripts/biblioteca.mjs categorias                         # las que entran en vídeo y las que no
node scripts/biblioteca.mjs buscar "agua ondas" [--categoria fondos] [--sin three,ogl]
node scripts/biblioteca.mjs ver kokonut/caustics-background     # licencia, autor, técnica, dependencias
node scripts/biblioteca.mjs traer kokonut/caustics-background   # → comun/biblioteca/kokonut-caustics-background/ + LICENCIA.md
```
Con el plugin the-new-era-websites instalado vale igual su `buscar.mjs` (mismas variables), pero solo se usan las
categorías de esta tabla. Busca por lo que HACE el efecto (glow, ripple, noise, beam, grid), mejor en inglés.

| Entran en vídeo | Para qué |
|---|---|
| `fondos` | shaders, auroras, rejillas, partículas |
| `texto` | texto animado |
| `3d` | objetos y escenas 3D |
| `hero` | efectos de cabecera: focos, haces, bandas |
| `tarjetas` | solo sus **efectos** (meteoros, haces, brillos, revelados), no la tarjeta como interfaz |
| `iconos` | solo elementos animados (brillos, bordes, confeti, números); los iconos de marca se generan (§2) |
| `cursor` | estelas y halos, movidos por `t` |
| `carga` | loaders y brillos de carga: una app viva |
| `scroll` | revelados, progresos y números que ruedan, pasados a `t` |
| `dispositivos` | marcos de móvil y navegador |

**Fuera** (interfaz web pura, la usan las skills de webs): botones, navegación, formularios, carruseles, testimonios,
precios, modales y overlays, listas y tablas, otros (widgets). La interfaz de un producto en un vídeo se recrea fiel a
ese producto (`motion-interfaz`), no con piezas genéricas.

### 1c. Copiarlo tal cual (y retocar solo si hace falta)
Un shader o una decoración que ya funciona rara vez mejora rehecho: el efecto, las curvas y el material van **tal
cual** (mismo GLSL, mismos valores). Se toca solo lo que el vídeo pida: color (los tokens de la dirección o de la
marca), escala o velocidad si no encaja, y el contenido (textos reales). Lo único **obligatorio** es hacerlo
determinista, porque HyperFrames pide cada fotograma por su tiempo:
1. Todo el tiempo sale de `t` de `escena(t)`: fuera `requestAnimationFrame`, `Date.now`, el reloj de `performance`,
   `setInterval`/`setTimeout`, `Math.random` (usa `MG.azar(semilla)`) y transiciones CSS (el lint lo comprueba).
2. **Shader WebGL → `MG.shader`**: crea el canvas y el contexto una vez, debajo de la escena, y en cada fotograma pone
   las uniformes (tipos leídos del programa; un `sampler2D` recibe un canvas o una imagen):
   ```js
   const fondo = MG.shader({ id: "pieza", fragmento: FRAGMENT, vertice: VERTEX });   // los del componente, tal cual
   const escena = (t) => { fondo({ uTime: t, uRes: [1920, 1080], uMask: mascara2d }); return h(...); };
   ```
   Si el original hace `uTime = (ahora − inicio) / 1000`, aquí es `uTime = t` (o `t × velocidad` si su reloj iba escalado).
3. **Lo interactivo → tabla de tiempos**: lo que en la web hace el ratón (clics, estelas, hover) pasa a una lista
   `[x, y, nace, fuerza]` que se elige por `t` (las N más recientes ya nacidas). Así el efecto vive igual sin ratón.
4. **React/Tailwind no hacen falta**: el JSX pasa a `h(...)` y las clases de Tailwind a sus propiedades CSS. Lo que
   el componente mide del DOM (texto para una máscara, cajas) se calcula con la misma geometría con la que pintas el
   texto (canvas 2D con la fuente ya cargada), no leyendo el DOM del fotograma anterior.
5. **Licencia**: el aviso de autor y licencia en un comentario dentro del `<script>` (nunca antes del doctype). Las de
   «no redistribuir» / Commons Clause sirven para tus vídeos, pero no se publican sueltas (ni en un repo ni en un kit).
6. **Render sin GPU**: un shader a pantalla completa por CPU cuesta (las cáusticas: ≈ 43 s de render por segundo a
   1080p60). Si el fondo es suave, `MG.shader({ escala: 0.5–0.75 })` lo dibuja a menos resolución y lo estira.
Ejemplo completo: `piezas/biblioteca.html` del kit (cáusticas de Kokonut UI, MIT: shader copiado tal cual, gotas
por tabla con cada palabra, sombra del titular desde la misma geometría que el texto).

### 1d. Qué NO se sube a la librería
Nada generado por nosotros o por el usuario (shaders hechos para un vídeo, iconos, fondos de Higgsfield) ni nada con
marca: lo propio de cada marca vive en su carpeta de marca (§3). La librería solo recoge piezas de fuentes abiertas.
- **Fondos a pantalla completa**: ver «Fondo sin huecos ni franjas» en [promo-recetas.md](promo-recetas.md).

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
