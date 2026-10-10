---
name: motion-agencia
description: Estilo AGENCIA de motion graphics (reel de estudio): una sección por compás a 128 BPM, cada una con su color plano saturado, display ancha en mayúsculas + serif cursiva + mono, cilindro de texto 3D, navegador que se convierte en móvil con muelle, barrido radial de color, zoom a través con match cut, glitch, texto descifrado, golpes de palabra y HUD con código de tiempo. Variante agencia-punto (un punto rojo que hilvana todo el reel, nube de partículas que cambia de forma, trama de puntos, cinta 3D, anillos de texto). Úsala tras la skill base motion-graphics cuando pidan energía, un reel, colores fuertes o estilo agencia.
---

# Estilo agencia (reel de estudio)

Lee antes la skill base `motion-graphics`. Tokens: `AGENCIA`, `COLORES_AGENCIA`, `SYNE`, `SERIF`,
`MONO`, `useTimecode` en `src/motion/capas/index.tsx`. Demo: `src/motion/demos/agencia.tsx` (`DemoAgencia`, 11,25 s) →
`motion/salida/demo-agencia.mp4`. 

**Interfaz del producto: este estilo no la cambia.** Si el vídeo recrea una pantalla real (vía 1 de la base), sigue el
proceso de fidelidad de la base (§2b): la pantalla lleva los colores, la letra, los radios, los iconos y los textos DEL
PRODUCTO, idénticos a su captura real. El estilo solo pone el fondo, la luz, el ritmo, las transiciones y los rótulos
que van fuera de la interfaz. Nunca recolorees la interfaz con el acento del estilo.

## Lo que lo define (medido)
- **Montado sobre la música**: 128 BPM, **cada sección dura un compás (1,875 s)** y cada transición o morph cae en un
  tiempo (±1 fotograma). Algo nuevo cada 4–6 fotogramas a 30 fps; quieto 0 %; dif media ≈ 14–15.
- Colores planos por sección: azul #2B2BF0, rojo #E8302A, lima #C6FF1A (el hilo que se repite), crema #F2EDE2, negro
  #0F0F13, morado #140A2E con luz #3B1D7A.
- Tipografía en contraste: Syne 800 MAYÚSCULAS 108–300 px (ocupa hasta el 36 % del alto) + Instrument Serif cursiva
  lima para la frase de apoyo + JetBrains Mono 18–24 px (píldora "0n / 05", HUD).
- Curvas: expo-out MUY fuerte en entradas (a cada fotograma a 60 fps le queda el 81 % del camino: 0,37 s), muelle con
  un sobrepaso del 35 % SOLO en el cambio de forma del objeto puente, ease-in exponencial para meterse en algo, lineal
  solo en giros continuos. Ningún fundido cruzado.
- HUD fijo encima de todo (esquinas, código de tiempo que corre, barra de 5 segmentos): une todas las escenas.

## Efectos firma y su receta (en la demo)
1. **Cilindro tipográfico 3D** (R7): 5 anillos (relleno crema con extrusión por `textShadow` apilado, contorno
   `WebkitTextStroke`, serif cursiva lima) a ±40°/s, grupo `rotateX(-18) rotateZ(-5)`, entrada escala 3→1 en 0,6 s.
   Salida: `rotateX` hasta −88° y velocidad ×4 en 0,27 s (ease-in) → **línea láser lima** que nace del centro →
   en el tiempo, `Flash` + elipse cian anamórfica que se estira.
2. **Títulos por máscara** (R2): `Lineas` 0,16 s por línea, escalón 0,05; píldora mono `0n / 05` que crece desde la
   izquierda; salida por máscara 0,14 s antes del cambio de compás.
3. **Navegador que entra** (R1): sube 300 px, escala 0,6→1, `rotateX` 28°→0 en 0,37 s expo, desenfoque solo el primer
   tercio; origen abajo.
4. **Navegador → móvil con muelle** (R3): `spring({mass 1, stiffness 340, damping 12})` en ancho/alto/radio + giro en Y
   que va y vuelve (sin(m·π)·30°). Es el objeto puente: se queda en pantalla en el cambio de sección.
5. **Barrido radial desde el objeto puente** (R4): `BarridoRadial` 0,14 s desde el centro del móvil, con borde rosa; el
   móvil sigue encima y su pantalla cambia (translateY −40 % con desenfoque).
6. **Tarjetas que llegan volando con estela**: `Movil estela={0.4}` desde fuera de cuadro, escalón 0,12 s, `click`.
7. **Zoom a través + match cut** (R5): `ZoomAtraves` 0,25 s antes del compás (escala exponencial a ×14 hacia la
   casilla del móvil, con ecos); en el compás, el punto de la casilla ES el círculo de la escena nueva, que se desliza a su
   sitio (0,2 s expo).
8. **Morph de forma en cada tiempo** (R6): `Forma` círculo → cuadrado girado 45° → píldora → círculo, 0,13 s por cambio.
9. **Glitch de salida + texto descifrado** (R8, R9): `Glitch` 0,2 s sobre la escena que sale; `Descifra` con degradado
   cian-lila mientras se resuelve; luego `Golpe` de la palabra clave (escala 1,4→1).
10. **Golpes "TODO / EN UNO" → silencio de 2 fotogramas → destello + 2 ondas + chispas + nombre letra a letra** (R11,
    R12): `Golpe`, `Flash`, `Onda` ×2 (80 → 2400 px), `Chispas`, `PorLetra` (una letra cada 2 fotogramas) y subrayado lima.
11. **Deriva continua** (R14): cada sección se desplaza ≈18 px/s y crece +2,4 %/s.
Otros en el análisis: nube de partículas que forma letras (R10, canvas), aberración cromática en golpes.

## Plantilla de 11,25 s (6 compases, la de la demo)
S0 negro: cilindro → láser · S1 azul: navegador + "DISEÑO / & desarrollo web" → móvil · S2 rojo: barrido radial,
"RESPONSIVE", tarjetas, zoom a través · S3 negro: punto → formas en cada tiempo, "SISTEMAS" · S4 morado: glitch,
"EXPERTOS EN" descifrado, "IA." · S5 negro: "TODO" "EN UNO", silencio, destello, nombre. Música: `motion/musica/agencia.json`.

## Comprobación
Con interfaz recreada: comparación con la captura real y lista de fidelidad de la base (§2b, F5–F6) pasadas.
`medir-ritmo` objetivo: dif media 10–16, quieto ≤ 3 %, racha ≤ 0,3 s. Cada cambio de sección EXACTAMENTE en
n × 1,875 s.

## Variante `agencia-punto` (mezcla de agencia, no un estilo aparte) — `TODOS_ESTILOS["agencia-punto"]`
Reel de estudio o de motion designer. 128 BPM, 8 compases de 1,875 s, un fondo plano por compás: negro #110E14, rojo
#FA4C2E, azul #2B43F8, amarillo #F5C139 y crema #E9E2DB (sin grano, viñeta 5–7 %). **Montserrat 900** en mayúsculas,
serif recta seminegrita en el logo (Source Serif 4 600) y HUD tipo DIN (Barlow) que cambia de claro a oscuro según el
fondo. Muelles contenidos: sobrepaso 6–26 % (12 % típico) con pico a ~0,17 s.
- **Un punto rojo es el hilo de todo el vídeo** (`PuntosDivide`): aparece (expo de 3 fotogramas, +6 %), se divide en cada
  tiempo 1 → 2 → 4 → 8 (+23 %), abre el primer iris (`IrisAro`), es el punto de la frase, el círculo que cambia de forma
  (`FormaPolar`: círculo ↔ cuadrado ↔ triángulo ↔ flor, 4 fotogramas por cambio, con estela de contornos), el centro de
  los anillos y el punto del logo, que aterriza con `PuntoSalta` (parábola de gravedad constante, aplastado 1,65:1 al
  saltar y 2:1 al aterrizar).
- **Una sola nube de ~600 puntos** (`NubePuntos`) pasa por flor de espiral → rejilla 33×19 → plano 3D → esfera → toro →
  cubo; `TramaOnda` (retícula de 58 px con puntos de 9–24 px que forman un círculo con una onda), `CintaRayas` (tubo de
  87 px y 7 franjas que hace un lazo a velocidad constante), `TextoAnillos` (4 anillos de texto, radios 448/364/281/206 px,
  +34/−41/+54/−75 °/s), `CajaTransformacion` (cuadrado con 8 tiradores que gira 0 → 101 → 90° con etiqueta ROT/SHAPE).
- `HudCompas`: 4 casillas de tiempo, `BAR n/8 · 128 BPM`, contador de fotogramas y código de tiempo HH:MM:SS:FF.
- Transiciones: ningún fundido. Iris de 2–3 fotogramas, zoom al punto que se convierte en disco, cortes con el mismo
  objeto a los dos lados y cortes en el momento de máxima velocidad, siempre en el golpe (la imagen 0–1 fotograma detrás
  del sonido). Sonido: clics en cada división en el compás 1, bombo en cada tiempo desde el 2, redoble antes del golpe final.
Recreación: composición `RecAgenciaReel`.
