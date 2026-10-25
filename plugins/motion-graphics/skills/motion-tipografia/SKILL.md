---
name: motion-tipografia
description: Técnica de motion graphics de TIPOGRAFÍA CINÉTICA en Remotion — texto que nunca "aparece" sino que se descifra, se teclea con luz, sube por máscara, golpea, entra gigante de desenfocado a nítido, se escribe palabra a palabra cambiando solo lo que cambia, sigue a la voz, se dibuja con neón, gira en cilindros y anillos 3D o se despliega desde una letra del logo; jerarquía, pesos, tracking que respira y rótulos sobrios sin cajas. La usa la skill maestra motion-graphics; úsala también sola para titulares, rótulos, frases de gancho y logotipos animados.
---

# Tipografía cinética

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`). Componentes en `texto.tsx`, `efectos.tsx`,
`efectos-2.tsx`, `cristal.tsx`, `cobre.tsx`, `taller.tsx` y `puntos.tsx`.

## Reglas
1. **El texto nunca "aparece"**: entra con una técnica (tabla de abajo). Con voz, cada palabra en el fotograma en que se
   dice (`FraseVoz`).
2. **Pocas palabras y grandes**: una idea por pantalla, ≥ 6 % del alto del cuadro en titulares (≥ 9 % en vertical).
3. **Sobrio**: sin emojis ni pegatinas; rótulos y subtítulos **sin caja** detrás (texto con sombra suave o halo difuso
   del color del fondo si hace falta contraste). Una familia (dos como mucho: display + texto o mono para el HUD).
4. **Jerarquía por peso y tamaño, no por color**: el acento solo para la palabra clave.
5. **Tracking**: titulares grandes con tracking negativo (−0,02 a −0,04 em); el tracking que se cierra al entrar
   (+0,08 → −0,02 em en 0,4 s) da sensación de precisión.

## Elegir la entrada
| Quiero… | Técnica | Componente |
|---|---|---|
| Titular elegante (oscuro, claro) | Gigante de desenfocado a nítido (blur 18–30 → 0, escala 1,08 → 1, 0,3–0,45 s) | `Palabra`, `PorLetra desde={{blur}}` |
| Pregunta o frase de gancho que se construye | Palabra a palabra que sube desde la cámara y se enfoca | `PorPalabra` (abajo) |
| Cambiar una parte de la frase y dejar el resto | Solo el final cambia (sale arriba, entra por máscara); la frase se recentra sola | `FraseCambia` (abajo) |
| Tecnológico | Se descifra (caracteres aleatorios que se resuelven) / se teclea con luz | `Descifra`, `Teclea`, `TecleaLuz` |
| Listas, títulos de sección | Sube por máscara línea a línea (0,16 s, escalón 0,05) | `Mascara`, `Lineas` |
| Golpe, palabra clave | Golpe de escala 1,4–1,6 → 1 con estela | `Golpe` |
| Logo o marca | Se dibuja con neón y se rellena; brota desde una letra; letra a letra | `Neon`, `MarcaBrota`, `PorLetra` |
| Cierre de marca con símbolo + palabra | El símbolo solo; la palabra se teclea a su derecha y el conjunto se recentra y encoge; lema | `MarcaTeclea` (abajo) |
| Energía de agencia | Cilindro 3D, anillos de texto, coreografía de letras | `Anillo`, `TextoAnillos`, `LetrasCoreografia` |
| Palabra que se va | Se comprime (tracking −0,12 em, scaleX 0,46) / estalla menos una letra | `EstallidoLetras`, `TrackingRespira` |
| Cifras | Contador con separador de miles (easeOutCubic 1,17 s) / rodillo | `Contador`, `ContadorRodillo`, `Rodillo` |
| Seleccionar una palabra | Cursor en medio, la caja crece a los dos lados en 0,3 s | `Seleccion` |
| Calor y energía | Llega sobreexpuesta y se enfría a su color en 0,2–0,5 s | `TextoBrasa`, `TecleaLuz` |

## Recetas
- **Gigante de desenfocado a nítido** (claro): `Palabra texto t0 dur={0.3}` — una sola palabra en pantalla, color de la
  rueda, sale en 1–2 fotogramas.
- **Teclear**: 1 letra por fotograma para titulares, 200–260 letras/s para consola; cursor que parpadea a 1 Hz.
- **Descifra**: 0,2–0,6 s; con degradado mientras se resuelve; luego `Golpe` de la palabra clave.
- **Neón**: trazo SVG 0,9 s inOut y relleno al 80 % del trazo.
- **Cilindro tipográfico**: 5 anillos (relleno con extrusión por `textShadow` apilado, contorno `WebkitTextStroke`,
  serif cursiva) a ±40°/s, grupo `rotateX(-18) rotateZ(-5)`, entrada escala 3 → 1 en 0,6 s.
- **Tipografía de interfaz**: los textos DENTRO de una pantalla recreada son los del producto, con su letra
  (`motion-interfaz`), aunque los rótulos del vídeo usen otra.
- **Palabra que enfoca** (`PorPalabra`): cada palabra sube 210 px desde abajo, ×1,25 → 1, blur 12 → 0 y opacidad
  0 → 1 en 0,40 s con `CURVAS_ENFOQUE.palabra` (bezier 0.45,0,0.2,1); escalón 0,13–0,15 s (la frase se lee un instante en
  escalera). Envuélvela en `Camara2D` con claves `s` 1,9 → 1 en 0,6 s (inOut) y luego deriva −5 %/s: la cámara se aleja
  mientras las palabras llegan. Relleno con degradado horizontal (`relleno={rellenoCentro()}`: oscuro en el centro,
  gris claro en los extremos) = viñeta tipográfica elegante sin sombra.
- **Frase en la que solo cambia el final** (`FraseCambia fijo="Sin" cambios={[{t, texto: "apps de más"}, {t, texto:
  "cuotas al mes"}]}`): la parte fija se queda, el final viejo sale hacia arriba desenfocándose y el nuevo entra palabra a
  palabra (35 px, 6 f de fundido, 13 f de enfoque, escalón 0,12 s) dentro de una máscara; el ancho se interpola, así la
  frase se recentra sin saltos. Degradado vertical (`relleno`: morado arriba → lila transparente abajo). El cambio, en
  un golpe; acompáñalo de un pulso de giro del anillo de iconos (`motion-3d`).
- **Marca que se teclea** (`MarcaTeclea`): símbolo solo 0,2 s; letras a 1 por fotograma (33 ms), cada una desde +40 % de
  su ancho, blur 8 → 0 en 0,25 s; a la vez el conjunto viaja hasta quedar centrado y encoge ×0,63 en 0,87 s (inOut);
  hueco símbolo–palabra 35 → 9 px; lema (30 px, color claro del acento) revelado de izquierda a derecha con máscara y
  blur 6 → 0 en 0,6 s. Llega al símbolo con un objeto puente (el aro de carga de la app que crece hasta ser el símbolo).
- **Relevo texto → logo** (`Relevo a b`): cruce con desenfoque en 0,23 s (7 f a 30 fps) en el mismo sitio, opcional
  `tracking` que se cierra. Para cambiar un título de interfaz por la marca sin corte.
- Ejemplo completo: `RecSeguimiento` (`src/motion/recreaciones/seguimiento.tsx`, producto ficticio «ruta», 12 s, 90 BPM).
