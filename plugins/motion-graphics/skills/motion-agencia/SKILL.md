---
name: motion-agencia
description: Estilo AGENCIA de motion graphics (reel de estudio): una sección por compás a 128 BPM, cada una con su color plano saturado, display ancha en mayúsculas + serif cursiva + mono, cilindro de texto 3D, navegador que se convierte en móvil con muelle, barrido radial de color, zoom a través con match cut, glitch, texto descifrado, golpes de palabra y HUD con código de tiempo. Úsala tras la skill base motion-graphics cuando pidan energía, un reel, colores fuertes o estilo agencia.
---

# Estilo agencia (reel de estudio)

Lee antes la base: `la skill base `motion-graphics``. Tokens: `AGENCIA`, `COLORES_AGENCIA`, `SYNE`, `SERIF`,
`MONO`, `useTimecode` en `src/motion/capas/index.tsx`. Demo: `src/motion/demos/agencia.tsx` (`DemoAgencia`, 11,25 s) →
`motion/salida/demo-agencia.mp4`. 

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
`medir-ritmo` objetivo: dif media 10–16, quieto ≤ 3 %, racha ≤ 0,3 s. Cada cambio de sección EXACTAMENTE en
n × 1,875 s.
