---
name: motion-3d
description: Técnica de motion graphics de PROFUNDIDAD, 3D Y PARTÍCULAS en Remotion sin GPU ni Three.js — piezas que flotan en un espacio 3D CSS y una cámara que viaja entre ellas, capas con parallax, objetos que llegan volteándose, iconos que flotan u orbitan alrededor de un texto, túneles, portales, horizontes, cintas, nubes de cientos de puntos que cambian de forma (flor, rejilla, esfera, toro, cubo) y formas que se transforman. La usa la skill maestra motion-graphics; úsala también sola para "darle profundidad" o "algo 3D".
---

# Profundidad, 3D y partículas

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`). Es 3D de CSS (`perspective` +
`preserve-3d`) y canvas/SVG: corre en cualquier máquina sin GPU. Para 3D real con modelos (glTF), usa Three.js con
`@remotion/three` aparte; casi nunca hace falta.

## Reglas
1. **Capas antes que 3D**: 3 planos con escala, blur y velocidad distintos ya dan profundidad (parallax 1 : 0,6 : 0,3).
2. **Nunca `filter` en un contenedor `preserve-3d`** ni `backdrop-filter` dentro de la cámara 3D: el desenfoque va en
   cada pieza (`b` en sus claves).
3. Lo que gira en 3D lleva **canto o sombra** (si no, se lee como una hoja de papel).
4. Perspectiva: 1000–1400 px para objetos cercanos dramáticos, 2200 (la de `Camara`) para escenarios.
5. Partículas: cientos, no miles (canvas 2D a 1080p y 60 fps aguanta ~600–1000 puntos sin disparar el render).

## Elegir
| Quiero… | Técnica | Componente |
|---|---|---|
| Un mundo de piezas y una cámara que viaja | Piezas en z distintos + `Camara` por claves PCHIP | `Camara`, `Movil` |
| Profundidad sin 3D | Capas con parallax y desenfoque | `Movil` (z, b) |
| Iconos/logos de integraciones alrededor de un texto | Anillo inclinado (arriba hacia cámara) que estalla desde una pila y gira despacio | `AnilloIconos` (abajo) |
| Integraciones en anillos | Órbitas en sentidos alternos que frenan juntas | `Orbitas` |
| Aparato que llega | Crece ×24 en 0,87 s volteándose (0,2 s) | `Movil` con `ry` |
| Varias pantallas | Túnel que se abre hacia la cámara / pared de paneles con lente | `Tunel`, `ParedPaneles`, `LenteBarril` |
| Marca final épica | Horizonte de planeta con haz / portal de luz | `Horizonte`, `Portal` |
| Partículas que forman figuras | Nube de ~600 puntos que pasa de una forma a otra | `NubePuntos` + `formaFlor`… |
| Formas geométricas vivas | Círculo ↔ cuadrado ↔ triángulo ↔ flor con estela | `FormaPolar`, `CuboAlambre` |
| Texto en el espacio | Anillos y cilindros de texto | `TextoAnillos`, `Anillo` |
| Cinta que hace un lazo | Tubo de rayas a velocidad constante | `CintaRayas` |

## Recetas
- **Mundo con cámara continua**: coloca las piezas en el espacio (x, y, z) como un decorado y anima SOLO la cámara entre
  ellas; las piezas solo se encienden (entran) cuando la cámara llega. Así no hay cortes y todo tiene paralaje real.
- **Tarjeta 3D tumbada que asciende** y gira a frontal en el drop: ver `motion-movimiento`.
- **Órbitas**: 3 anillos en proporción 1 : 1,66 : 2,37, sentidos alternos, frenan de 204°/s a 20°/s en 2 s y colapsan
  al centro; `forma="pastilla"` para nombres de integraciones.
- **Nube de puntos**: `NubePuntos formas={[formaFlor, formaRejilla, formaEsfera, formaToro, formaCubo]}` con un cambio
  por compás; cada punto interpola con su propio retraso (0–80 ms) para que la nube "fluya".
- **Anillo de iconos inclinado** (`AnilloIconos`): elipse 520 × 250 px alrededor de una frase, el borde de arriba hacia
  la cámara (iconos ×1,27 arriba, más pequeños y claros abajo) y SIEMPRE de frente (es 2,5D, sin `preserve-3d`). Entrada:
  salen de una pila en el centro y estallan al anillo en 0,2 s con sobrepaso leve; giro horario 20°/s con un pulso de
  +40° en 0,2 s en el golpe del cambio de frase; `tEtiquetas` = cada icono enseña una `Pastilla` (precio, estado) con
  escalón 0,05 s; `sale` = radio ×1,9 en 0,13 s acelerando con desenfoque. Iconos de demo: `IconoApp glifo fondo`; para
  un producto real, los iconos REALES de cada integración.
- **Inclinar el plano mientras la cámara viaja**: en una línea de tiempo larga, `Camara` con `rx` 0 → 30° y zoom ×1,2 a
  lo largo del paneo (perspectiva ≈ 1350 px) da profundidad sin cambiar el contenido.
- **Ciudad 3D con cámara de mapa** (edificios extruidos, rutas, pines): no es 3D CSS, es la skill `motion-mapas` (canvas por CPU).
