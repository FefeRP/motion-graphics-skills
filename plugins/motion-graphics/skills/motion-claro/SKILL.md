---
name: motion-claro
description: Estilo CLARO de motion graphics (intro de app/SaaS): fondo claro, palabras gigantes que pasan de desenfocadas a nítidas una por pulso, cada escena sale de un objeto de la anterior (logo → barra de búsqueda, avión → punto → mapa), zoom que atraviesa el logo, fugas de luz, scroll con estela. Variante claro-lima (manchas líquidas, frases que siguen a la voz). Úsala tras la skill base motion-graphics cuando pidan algo claro, amable, tipo intro de app o SaaS.
---

# Estilo claro (intro SaaS)

Lee antes la base: `la skill base `motion-graphics``. Tokens: `CLARO`, `FondoClaro`, `RUEDA_CLARO` en
`src/motion/capas/index.tsx`. Demo: `src/motion/demos/claro.tsx` (`DemoClaro`, 10 s) → `motion/salida/demo-claro.mp4`.


## Lo que lo define (medido)
- **Todo es muy rápido**: entradas de **0,12–0,17 s**, palabras que viven 0,29 s y salen en 1–2 fotogramas; 0,85
  cambios por segundo. (El estilo "claro" antiguo usaba 0,35 s con muelle: justo lo contrario.)
- **El desenfoque es el material**: cada entrada pasa de desenfocada a nítida; lo rápido lleva estela direccional
  (scroll solo vertical, avión, cifras).
- Fondo `radial-gradient(#EEEEF2 → #E4E5EA → #D9DBDF)`; tarjetas blancas con sombra en 3 capas, radio 28; tinta
  #1D1D1F. Palabras en rueda de color: #2B35E0, #7A2FD0, #D0306E, #E8571C, #5DBB63. Inter 650, tracking que se cierra.
- Curvas con carácter: ease-in para ir HACIA una transformación (estirar el logo, zoom a través, despegue), expo/cubic
  para llegar; sobrepaso grande SIN rebote (mapa 0,15→1,4→1). Nunca ease-in-out simétrico en entradas.
- Deriva perpetua de cámara; contraste de ritmo: 1 s de pausa (gris vacío, música sin agudos) antes de las palabras.

## Efectos firma y su receta (en la demo)
1. **Logo con destello** (R4): escala 2,2→1 en 10 fotogramas expo + velo de color 0,18 s (`Flash` verde claro).
2. **Corte con zoom sobre la acción** (R3): en `Camara2D`, dos claves seguidas (0,59 → 0,60 s) que saltan a ×1,9
   descentrado; la animación sigue; golpe grave en ese fotograma.
3. **Objeto que despega y se transforma** (R6): `Movil` con `estela` (0,35) subiendo 560 px en ease-in 0,33 s y
   frenando; a mitad se convierte en punto azul (#0A84FF con halo, `Forma`).
4. **Estallido con sobrepaso sin rebote** (R5): escala por tramos 0,15→1,4 en 8 f (quad-out) y 1,4→1 en 18 f expo, con
   desenfoque 10→0.
5. **Logo → barra de búsqueda** (R7): `Forma` 92 px → 960×120 en ease-in, giro −4°→0, relleno que se vacía y borde
   2 px; dentro `Teclea` con cursor.
6. **Scroll con impulso** (R8): anticipación de +30 px, acelerón a −700 y cola larga; `filter: blur` solo por
   velocidad (vertical); al parar, recuadro de selección (borde acento).
7. **Fuga de luz** (R13): `FugaLuz` 0,45 s (crema→rojo) + gris vacío 0,1 s antes de las palabras.
8. **Palabras gigantes** (R1): `Palabra` 0,3 s cada una, color de la rueda, una sola en pantalla, en los pulsos.
9. **Zoom a través del logo** (R2): escala 1→9 con curva cúbica en 0,25 s hacia el "mordisco"; el color del logo llena
   el cuadro y es el fondo de la escena siguiente (match cut).
10. **Contador con estela** (R10): easeOutCubic 1,17 s, desenfoque proporcional a la velocidad de las cifras.
11. **Cortinilla suave** (R11): máscara lineal con borde de 7 % en 0,17 s.
12. **Botón que nace de una línea** (R14): ancho 114→980 y alto 18→200 con cubic-out; clic (rojo → grafito, escala
    0,96→1) y vuelve a línea al salir.
Otros en el análisis: rodillo de palabra (`Rodillo`), iris-lente, montaje rápido de capturas, grafo 3D con travelling.

## Plantilla de 10 s (la de la demo)
0 logo+destello · 0,6 corte con zoom · 1,15 widget · 1,9 avión → punto · 2,33 mapa estalla · 3,4 logo → barra · 3,8
teclea · 4,0 scroll · 4,4 selección · 4,5 fuga · 5,0–6,5 cinco palabras · 6,35 zoom a través → azul · 6,75 contador ·
7,85 cortinilla · 8,15 botón · 9,0 clic · 9,6 vuelve a línea. Música: `motion/musica/claro.json`.

## Comprobación
`medir-ritmo` objetivo: dif media 5–9, quieto ≤ 15 % (la referencia tiene pausas buscadas de 1 s), racha ≤ 1 s, 0 saltos.

## Variante `claro-lima` (mezcla de claro, no un estilo aparte) — `ESTILOS["claro-lima"]`
Producto creativo/IA con voz en off. Fondo #FAF9FB, tinta #183527, lima #9CD20A/#C9E800, Sora 600–700.
- **`ManchasLiquidas`**: manchas orgánicas de borde suave (σ ≈ 18 px) que entran en **olas de 0,1–0,2 s** a 1200–2500 px/s
  tapando el corte (cubren el 50–70 % del cuadro), se retiran a los bordes en 0,8–1,2 s y siguen derivando a 90–300 px/s.
- **`FraseVoz`**: cada palabra aparece en el fotograma en que se dice (sube 12 px de gris a tinta en 0,2 s), la línea
  (≈75 px) se recentra sola; sale apretando el tracking (−22 % de ancho) y huyendo a la izquierda acelerando (0,43 s).
- Palabra gigante por corte seco a ×6 con paneo que frena en seco; botón en primer plano (corte ×5) que llega estirado
  como píldora y se redondea a círculo en 6 fotogramas; al pulsar, disco de acento que crece ×3 y se apaga en 0,33 s.
- Transiciones entre un mundo claro y uno oscuro: resplandor lima desde el centro o la interfaz que se "quema" a blanco.
