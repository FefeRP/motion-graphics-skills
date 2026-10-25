---
name: motion-luz-fondo
description: Técnica de motion graphics de LUZ, FONDOS, MATERIALES Y SHADERS en Remotion — fondos que nunca están planos ni quietos (foco, halo que late, luz de esquina, auroras, humo y gas con shader WebGL propio, manchas de color por escena), cristal lechoso y cristal esmerilado sin backdrop-filter en 3D, profundidad de campo, sombras de contacto, temperatura de la luz (todo llega con luz y se enfría), grano, viñeta, bokeh y destellos. La usa la skill maestra motion-graphics; úsala también sola cuando un vídeo se vea plano, barato o "de plantilla".
---

# Luz, fondos, materiales y shaders

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`). Componentes en `acabado.tsx`, `humo.tsx`,
`cristal.tsx`, `cobre.tsx` y `efectos-2.tsx`.

## Reglas
1. **Lo importante brilla, lo demás se apaga**: halo del color del objeto, borde de acento; el resto se desenfoca o se
   oscurece. Una sola fuente de luz principal por plano.
2. **Fondo con luz que se mueve, nunca plano y quieto del todo**; si el usuario pide "fondo liso", la luz vive en una
   zona (arriba o en una esquina) y el resto queda liso.
3. **Temperatura de la luz**: lo que entra llega sobreexpuesto o con un halo del acento y se «enfría» a su color en
   0,2–0,5 s. Da energía sin mover más cosas.
4. **La luz late con la música**: brillo + 0,3 × exp(−(t − golpe)/0,45) en cada golpe.
5. **Imperfección intencional** contra el aspecto "de IA": grano sutil (0,03–0,05), viñeta suave, bordes de luz no
   simétricos. Nada de degradados perfectos de dos colores en diagonal.
6. Prohibido `backdrop-filter` dentro de una cámara 3D y `filter` en contenedores `preserve-3d` (ver `motion-movimiento`).

## Elegir el fondo
| Dirección / necesidad | Fondo | Componente |
|---|---|---|
| Keynote oscuro | #080808 + elipse de luz arriba + viñeta 0,6 | `FondoEstilo` (`luz: foco`) |
| Marca con color fuerte | Halo de marca que cambia de sitio por plano y late | `Halo`, `luz: halo` |
| Claro amable / app de consumo | Papel cálido (#F3F3EE) + velo de color en UNA esquina que respira (multiply) | `VeloEsquina` (abajo) |
| Pantalla de marca tras un foco | Malla de 4–5 manchas del color de marca (claro arriba-izquierda, oscuro en esquinas) casi quieta | radial-gradients (ver `RecSeguimiento`) |
| SaaS con marca, "fondo liso" | Liso + aurora o humo solo arriba | `Aurora`, `Humo zona` |
| Gas, humo, materia | Shader de ruido con domain warping, sin bandas | `Humo` |
| Asistente de IA | Manchas de color distintas por escena que derivan | `FondoCristal`, `Manchas` |
| Reel de agencia | Color plano por compás, sin grano | — |
| Transición entre mundos | Manchas líquidas, fuga de luz | `ManchasLiquidas`, `FugaLuz` |

## Materiales
- **Cristal lechoso (claro)**: superficie blanca al 55–75 % de opacidad, borde interior blanco 1 px al 70 %, sombra en
  3 capas muy difusa (0 2px 6px /4 %, 0 12px 32px /6 %, 0 40px 80px del color de la luz /10 %), radio 20–32. Sobre
  fondo claro se lee como vidrio sin usar `backdrop-filter`.
- **Cristal esmerilado (oscuro)**: en 2D, `backdrop-filter: blur(24px)`; en 3D, una copia desenfocada de lo de detrás
  recortada por la forma del cristal (`CajaCristal`, `BarraPrompt`). Contorno blanco 1–2 px al 8–12 %.
- **Profundidad de campo**: 3 planos — primer plano nítido, medio 4–8 px, fondo 10–16 px de blur y 85–92 % de escala.
  El blur se anima en las claves (`b`) de `Movil`, nunca con `filter` sobre un contenedor 3D: cada pieza el suyo.
- **Sombra de contacto**: elipse muy desenfocada bajo el objeto que se encoge cuando el objeto sube.
- **Tarjeta con brillo**: filo de luz #FFFFE8 y halo del acento (`TarjetaBrillo`).

## Humo / gas con shader (`Humo`)
Shader WebGL propio (ruido de gradiente, fbm con domain warping doble y dithering ±1/255). Props: `colores` (2–4),
`zona`, `brillo`, `vel`, `escala` (más = volutas más pequeñas), `densidad`, `torsion` (1–1,6 gas; 3+ mármol: no detrás
de texto), `estira` (>1 velos de aurora), `semilla`, `calidad`, `mezcla`. Determinista; necesita
`chromiumOptions.gl = "swangle"` (ya en `scripts/render.mjs`). Coste: +0,15 s por fotograma con dos capas (+20 %). Dos
capas con distinta `escala` y `semilla` dan profundidad. `Aurora` (cortinas de degradados) es más barata pero se ve
en bloques: para materia, `Humo`.

## Acabado
`Vineta` (0,35–0,6), `Grano` (0,03–0,05), `Bokeh`, `Destello` (barrido de luz de 0,45 s), `Sombra` (para rótulos sobre
imagen), `Hud`. `Resplandor`, `Chispa`, `Asterisco` y `Meteoro` para acentos de luz puntuales.
- **Velo de esquina** (`VeloEsquina color esquina alcance fuerza mezcla`): degradado radial del color (morado apagado
  #614D8A medido) a transparente al 65 % de la diagonal, en `multiply` y POR ENCIMA de todo (también de las tarjetas): da
  unidad de color a toda la pieza clara. Respira ±4 %. Combínalo con dos neblinas lilas suaves en las esquinas de abajo.
- **Todo entra desenfocado y se enfoca al llegar**: en la dirección clara de producto el desenfoque está ligado a la
  profundidad, no al tiempo suelto: palabras, móviles, tarjetas y letras del logo entran con blur 10–16 px que se quita en
  0,2–0,37 s, y salen desenfocándose. Sin grano, sin viñeta: la limpieza es el estilo.
- **Cambio de tema en caliente**: los acentos de la interfaz pasan de gris a color de marca en 2–3 fotogramas, en cascada
  de arriba abajo (la app "se enciende").
- Ejemplo: `RecSeguimiento` (dirección `claro-lavanda`).
