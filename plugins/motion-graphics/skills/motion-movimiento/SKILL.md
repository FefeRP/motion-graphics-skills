---
name: motion-movimiento
description: Técnica de motion graphics para que TODO SE MUEVA COMO UN PROFESIONAL en Remotion — curvas asimétricas (expo-out, ease-in), trayectorias PCHIP sin frenazos en las claves, muelles con el sobrepaso limitado, squash & stretch, cámara 2D/3D que nunca se queda quieta, piezas con trayectoria y estela, desenfoque de movimiento solo en lo rápido, deriva continua y encuadre que llena el cuadro. La usa la skill maestra motion-graphics; úsala también sola cuando una animación se vea lenta, robótica, a tirones o "de diapositiva".
---

# Movimiento: curvas, muelles, cámara y piezas

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`). Todo a **60 fps**.

## Reglas (medidas en 13 referencias profesionales; no negociables)
1. **Nunca quieto**: algo nuevo cada 0,2–0,5 s; la cámara deriva siempre (+1,5–2,5 %/s de zoom o ≈30 px/s). Objetivo
   medido: quieto ≤ 10 %, racha quieta ≤ 0,5 s (salvo el logo final).
2. **Curvas asimétricas y cortas**: entradas expo-out de 0,13–0,4 s; salidas ease-in de 0,08–0,17 s; ease-in para
   meterse en algo (zoom a través, despegue). Nunca ease-in-out simétrico de 0,5 s en una entrada.
3. **Trayectorias PCHIP**: varias claves seguidas NO frenan en cada una (`pista`, `piezaEn`, `camaraEn` ya lo hacen).
   Una clave con `para: true` sí frena. Un campo que falta en una clave conserva el anterior: tras `o: 0` pon `o: 1`.
4. **Muelles controlados**: rebote solo donde aporta (clímax, cambio de forma) y con sobrepaso limitado (`useMuelle`,
   `sobrepaso: 0.1` = 10 %). Nada de vaivenes senoidales en piezas grandes.
5. **Desenfoque como material**: lo rápido lleva estela direccional (`Movil estela`, `ConDesenfoque` en las ventanas de
   barrido); lo que entra pasa de desenfocado a nítido. **Nunca `filter` en un contenedor `preserve-3d`** (aplana el 3D
   y las piezas saltan un fotograma) **ni `backdrop-filter` dentro de una cámara 3D** (Chrome deja de pintar media fila
   en fotogramas sueltos: usa una copia desenfocada recortada).
6. **Llena el cuadro**: el objeto principal ocupa ≥ 25 % del ancho; acerca la cámara (escala 1,2–2,2) y comprueba con
   fotogramas que los rótulos no se salen.
7. **Rejilla de pulso**: cada evento en un pulso o medio pulso (ver `motion-ritmo-sonido`).

## Curvas de referencia (`CURVAS` en `tiempo.ts`, `useCurva()` del estilo)
| Uso | Curva | Duración |
|---|---|---|
| Entrada normal | `CURVAS.expo` = `bezier(0.16, 1, 0.3, 1)` | 0,25–0,4 s |
| Entrada seca (agencia) | expo-out fuerte: queda el 81 % por fotograma a 60 fps | 0,37 s |
| Entrada suave y larga (interfaces en claro, cristal) | `CURVAS.suave` = `bezier(0.25, 1, 0.5, 1)` | 0,45–0,7 s |
| Salida | `CURVAS.acelera` = `bezier(0.55, 0, 1, 0.45)` | 0,08–0,17 s |
| Meterse en algo | ease-in exponencial (`CURVAS.acelera` o `t => t ** 3`) | 0,2–0,33 s |
| Cambio de estado simétrico (morph, contador corto) | `CURVAS.inOut` / `inOutFuerte` | 0,3–0,8 s |
| Viaje de cámara entre planos | PCHIP por claves | — |
| Giro continuo | lineal | — |
| Contador | easeOutCubic / quint-out | 0,8–1,2 s |
Sobrepaso sin rebote (estallido): escala por tramos 0,15 → 1,4 (8 f, quad-out) → 1 (18 f, expo).

## Muelles (`useMuelle`)
- Clímax de notificación: masa 0,5, rigidez 760, amortiguación 23 (~10 %).
- Objeto que cambia de forma (agencia): masa 1, rigidez 340, amortiguación 12 (hasta 35 %, solo ahí).
- Rebote de rejilla (taller): 180/12, sobrepaso 20 %, medio periodo 0,27 s.
- Logo final cálido: 170/12 (ζ ≈ 0,45). Interfaces sobrias: sin muelle.
Squash & stretch: +30 % de alto al caer, 1,65:1 al saltar y 2:1 al aterrizar (`BolaRebote`, `PuntoSalta`).

## Cámara
- `Camara` (3D por claves `{t,x,y,z,rx,ry,rz}`, perspectiva 2200): viaja entre piezas que flotan en el espacio; nunca
  se para del todo. `Camara2D` para paneos y zooms sobre una escena plana (`{t,x,y,s,rz}`).
- **Corte con zoom sobre la acción**: dos claves seguidas (0,59 → 0,60 s) que saltan a ×1,9 descentrado; la animación
  sigue; golpe grave en ese fotograma.
- **Paneo largo con desenfoque**: `Camara2D` 1650 px en vertical + `ConDesenfoque` solo en la ventana del paneo.
- **Recorrido de una estructura** (línea de tiempo, mosaico, mapa): la cámara baja o avanza a velocidad casi constante
  mientras cada elemento se enciende al cruzar una línea fija del cuadro (ver `motion-interfaz` §4).
- `ConDesenfoque` (`@remotion/motion-blur`) solo en sus ventanas: encarece el render (36 s: 22 → 35 min).

## Piezas con trayectoria
- `Movil claves={…} estela={0.35}`: cualquier contenido con trayectoria propia (x, y, z, giros, escala, opacidad, blur).
- `entraSale({t0, x, y, desde, dur, sale, hacia})`: claves de entrada y salida estándar.
- `Pieza` (recorte de captura con sombra y radio), `Tarjeta`.
- Tarjeta 3D tumbada que asciende y gira a frontal en el drop: `Movil` en `perspective: 1000`, `rx 70 → 60` subiendo
  1500 → 700 px en 0,95 s, luego `rx 0` y `s 1,35` en 0,5 s, `ConDesenfoque` en el giro.
- Escalonado: 33–120 ms entre piezas hermanas; más de 150 ms se lee como lento.
- `Deriva` (≈18 px/s y +2,4 %/s) envuelve cada sección para que nada se congele.

## Cámara que viaja por un producto (medido en piezas claras de producto)
- **Curvas** (`CURVAS_ENFOQUE`): `quint` (0.22,1,0.36,1) para objetos grandes que llegan (la mitad del recorrido al 14 %
  del tiempo, cola larga); `palabra` (0.45,0,0.2,1) para texto que sube; `paneo` (0.7,0,0.2,1) para barridos largos entre
  nodos; `foco` (0.2,0.7,0.3,1) para iris que se abren.
- **La cámara nunca se para**: entre tramos deja deriva (60–120 px/s o −5 %/s de escala); el pico de velocidad de cada
  paneo cae EN un golpe. Con PCHIP, pon la clave intermedia del tramo largo a 1/3 y la de llegada con deriva, no `para`.
- **Zoom con ancla** (`Camara2D ancla={[960, 224]}`): el zoom se hace alrededor de un punto fijo de pantalla (la cabecera
  de un móvil), así el título no se mueve mientras el resto encoge.
- **Foco de cámara** (`b` en las claves de `Camara2D`): entrada σ 24 → 0 lineal en 0,3 s con subida de 165–220 px
  expo-out en 0,45 s; es la forma más limpia de empezar un plano claro.

## Comprobar
`node scripts/medir-ritmo.cjs v.mp4` → dif media 4–16 según la dirección, quieto ≤ 10 %, racha ≤ 0,5 s, saltos de un
fotograma ≈ 0 (un pico aislado 3–5× sobre sus vecinos es un salto: busca un `filter` en 3D o una clave mal puesta).
