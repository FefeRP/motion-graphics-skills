# Direcciones de partida (ajustes, no plantillas)

Antes había una skill por estilo (oscuro, claro, agencia). Medidos, los tres comparten el mismo motor y las mismas
técnicas: lo que cambia es **un puñado de ajustes** (fondo, luz, letra, BPM, curvas, muelle) y **qué técnicas pesan
más**. Por eso ahora son direcciones de partida dentro de la skill maestra: eliges una (o una mezcla) en el paso 2 y
las técnicas salen de las skills de técnica.

Todas son `TokensEstilo` en `kit/src/motion/capas` (`ESTILOS` y `TODOS_ESTILOS` en `capas/todos.ts`) y se mezclan con
`mezclar()`. Cada una tiene su demo o su recreación verificada contra el original.

**La interfaz del producto NO cambia con la dirección.** Si el vídeo recrea una pantalla real, lleva los colores, la
letra, los radios, los iconos y los textos del producto (skill `motion-interfaz`, proceso F1–F6). La dirección solo
pone el fondo, la luz, el ritmo, las transiciones y los rótulos que van fuera de la interfaz.

## Cómo elegir
| El pedido suena a… | Dirección | Técnicas que más pesan |
|---|---|---|
| lanzamiento de producto, keynote, elegante, premium | `oscuro` (+ `oscuro-halo` si hay color de marca fuerte) | objeto puente, luz que late, texto que se descifra, cámara 3D |
| intro de app/SaaS, amable, rápido, claro | `claro` | palabras gigantes de desenfocado a nítido, zoom a través del logo, fugas de luz |
| app de consumo, logística, fintech en claro con un color de marca (lavanda, morado…) | `claro-lavanda` | cristal lechoso, pilas de pantallas con profundidad, línea de tiempo que la cámara recorre, iconos flotando |
| reel de estudio, energía, colores fuertes, a compás | `agencia` / `agencia-punto` | un color plano por compás, display ancha, morph en cada tiempo, HUD |
| asistente de IA, tecnológico sereno | `oscuro-cristal` | cristal, texto que se escribe con luz, manchas de color por escena |
| producto premium cálido, editorial | `oscuro-cobre` | serif editorial, todo llega con luz y se enfría |
| portfolio nocturno, impacto | `oscuro-brasa` | líneas de luz, estroboscopio de negativo, tarjetas con brillo |
| productividad, cortes invisibles | `oscuro-turquesa` | corte por continuidad de velocidad, órbitas, horizonte |
| producto creativo con voz en off | `claro-lima` | manchas líquidas, frases que siguen a la voz |
| tutorial, «así está hecho» | `taller` / `taller-claro` | el editor de curvas en pantalla, rejilla de pulso estricta |
| marca del usuario | cualquiera + `mezclar(base, { acento, luz: { colores } })` | — |

Mezclas típicas: `mezclar(ESTILOS.claro, { ritmo: ESTILOS.agencia.ritmo, muelle: ESTILOS.agencia.muelle })` (claro
con la energía de agencia); `mezclar(ESTILOS.oscuro, { fuente: "Syne", mayusculas: true })`; lanzamiento SaaS con la
marca del cliente: `mezclar(ESTILOS.oscuro, { fondo: "#031C26", acento: "#37B5FE", entradaDur: 0.24, luz: { tipo:
"aurora", colores: [...] } })`.

## oscuro (keynote de producto) — `DemoOscuro`
- Ritmo: un evento cada 0,5 s, ≈1 cambio de plano por segundo, 0–2 cortes duros tapados por un flash de 1–2
  fotogramas. Quieto 0–6 %. 120–132 BPM con drop en el primer movimiento grande (≈1,2 s).
- Fondo #080808 con luz: `foco` (elipse violácea arriba #332C3B → #1A1720) o `halo` (halo de marca que cambia de sitio
  en cada plano y late ×2–4 con los eventos). Viñeta 0,6.
- Un solo acento con halo (cian #14E3E2, rojo #E11428, lima #CBF249). Blanco roto #F5F5F7, gris #8E8E93. Inter
  600–650, tracking −0,02 em; titulares a la izquierda (x≈115 px).
- Curvas: entra expo-out (10–15 fotogramas a 60 fps, hasta 0,4 s), sale acelerando (5–10 f). Rebote solo en el clímax
  (~10 %).
- Firma: tarjeta 3D tumbada que asciende y gira a frontal con el drop; barra → sobreexposición → punto → cápsula con
  progreso; punch ×1,5 + flash y titular que se descifra; neón que se dibuja; paneo vertical largo con desenfoque;
  frase → píldora → 0,15 s de silencio → notificación que estalla; morph inverso hasta la marca (blur 28 → 0, escala
  0,43 → 1 en 0,37 s). Plantilla de 10 s y música en `motion/musica/oscuro.json` del kit.
- Comprobación: dif media 4–7, quieto ≤ 10 %, racha ≤ 0,5 s.

Variantes de oscuro:
- **`oscuro-halo`**: halo de marca que late; hueco negro detrás del logo si es del color del halo; aparato que llega
  volteándose (×24 en 0,87 s); la app se abre desde su icono con `FlashCromatico`; `PildoraElastica` entre pestañas.
- **`oscuro-brasa`**: negro #000 y luz naranja #DD5E27; `LineaLuz` en la que se mete la cámara; `LenteBarril` sobre una
  pared de paneles; `PilaTarjetas`/`TarjetaBrillo`; `Estrobo` de negativo (6 fotogramas a 30 fps) en cada cambio.
- **`oscuro-turquesa`**: #000306 con luz turquesa #18D9C9; corte por continuidad de velocidad; `Orbitas` (anillos
  1 : 1,66 : 2,37, sentidos alternos, frenan juntos), `Seleccion`, `Tunel`, `Portal`, `Horizonte`.
- **`oscuro-cobre`** (`RecSerifCalido`): #0B080C con halos cobre, acento #D87457, EB Garamond 500 + Inter, 124 BPM;
  todo llega con luz y se enfría. `cobre.tsx`.
- **`oscuro-cristal`** (`RecPromptCristal`): #06070C con manchas distintas por escena, Urbanist 400–600, ~100 BPM, sin
  rebotes; `TecleaLuz`, `BarraPrompt`, `Estallido`, `Mosaico`, `RedNodos`. `cristal.tsx`.
- **`taller`** (`RecReelPantalla`): grafito con cúpula de luz naranja abajo que pasa a `taller-claro`; acento #FF4F2D,
  Inter 800–900 + mono; rejilla estricta de 28 fotogramas a 60 fps; muelle 180/12. `taller.tsx`.

## claro (intro de app/SaaS) — `DemoClaro`
- Todo muy rápido: entradas de 0,12–0,17 s, palabras que viven 0,29 s y salen en 1–2 fotogramas.
- El desenfoque es el material: cada entrada pasa de desenfocada a nítida; lo rápido lleva estela direccional.
- Fondo radial #EEEEF2 → #E4E5EA → #D9DBDF; tarjetas blancas con sombra en 3 capas, radio 28; tinta #1D1D1F. Palabras
  en rueda de color: #2B35E0, #7A2FD0, #D0306E, #E8571C, #5DBB63. Inter 650, tracking que se cierra.
- Curvas: ease-in para ir HACIA una transformación, expo/cubic para llegar; sobrepaso grande sin rebote (0,15 → 1,4 → 1).
- Firma: logo con destello; corte con zoom sobre la acción (dos claves seguidas a ×1,9); objeto que despega y se
  convierte en punto; logo → barra de búsqueda que teclea; scroll con impulso; fuga de luz; palabras gigantes; zoom a
  través del logo (×9 en 0,25 s, match cut con su color); contador con estela; botón que nace de una línea.
- Comprobación: dif media 5–9, quieto ≤ 15 % (pausas buscadas de 1 s), racha ≤ 1 s.

Variantes de claro:
- **`claro-lima`**: #FAF9FB, tinta #183527, lima #9CD20A, Sora 600–700; `ManchasLiquidas` que tapan cortes y
  `FraseVoz` (cada palabra en el fotograma en que se dice).
- **`claro-lavanda`** (`RecSeguimiento`, aprendida de tres piezas de producto de una app de seguimiento de pedidos):
  papel cálido #F3F3EE con un velo morado #614D8A en una esquina (`VeloEsquina`, multiply, por encima de todo), tarjetas
  #FBFBFB con sombra difusa, Inter 500–600, morado profundo #3B1A6F de marca y malla #5A33A6/#40207B/#280D60 para el cierre.
  90 BPM; TODO entra desenfocado y se enfoca al llegar (0,2–0,4 s, quint/expo-out, sin rebotes) y sale desenfocándose;
  la cámara nunca se para. Técnicas: `PorPalabra`, `PilaMoviles`, `LineaTiempo`, `AnilloIconos` + `FraseCambia`,
  `Remolino` + `FocoRadial`, `MarcaTeclea`, `InundaLuz` (recetas en las skills de técnica).
- **`taller-claro`**: la mitad clara de `taller`.

## agencia (reel de estudio) — `DemoAgencia`
- Montado sobre la música: 128 BPM, cada sección dura un compás (1,875 s) y cada transición cae en un tiempo
  (±1 fotograma). Quieto 0 %; dif media ≈ 14–15.
- Colores planos por sección: azul #2B2BF0, rojo #E8302A, lima #C6FF1A (el hilo), crema #F2EDE2, negro #0F0F13,
  morado #140A2E.
- Tipografía en contraste: Syne 800 MAYÚSCULAS 108–300 px + Instrument Serif cursiva + JetBrains Mono (HUD).
- Curvas: expo-out muy fuerte (0,37 s), muelle con sobrepaso del 35 % solo en el cambio de forma del objeto puente.
- Firma: cilindro tipográfico 3D; títulos por máscara; navegador que entra y se convierte en móvil con muelle; barrido
  radial desde el objeto puente; zoom a través + match cut; morph de forma en cada tiempo; glitch + texto descifrado;
  golpes de palabra → silencio de 2 fotogramas → destello, ondas y nombre letra a letra; HUD fijo.
- Comprobación: dif media 10–16, quieto ≤ 3 %, racha ≤ 0,3 s; cada cambio de sección en n × 1,875 s.

Variante **`agencia-punto`** (`RecAgenciaReel`): un punto rojo hilvana todo el reel (`PuntosDivide`, `IrisAro`,
`FormaPolar`, `PuntoSalta`); una nube de ~600 puntos cambia de forma (`NubePuntos`); `TramaOnda`, `CintaRayas`,
`TextoAnillos`, `HudCompas`. Montserrat 900 + Source Serif 4 + Barlow. `puntos.tsx`.
