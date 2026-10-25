---
name: motion-ritmo-sonido
description: Técnica de motion graphics de RITMO, GUION POR EVENTOS, MÚSICA Y EFECTOS DE SONIDO en Remotion — rejilla de pulso estricta (cada evento en un tiempo o medio tiempo), guion escrito como tabla de eventos antes del código, música sintetizada sin derechos de terceros con golpes en los cortes, efectos de sonido clavados al fotograma en que aterriza cada objeto, silencios antes del golpe grande, mezcla sin saturar y volumen final a −14 LUFS. La usa la skill maestra motion-graphics; úsala también sola para sincronizar un vídeo con su música o ponerle sonido.
---

# Ritmo, guion, música y sonido

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`).

## Rejilla de pulso
- Elige el BPM antes de animar: 100 (sereno), 120 (producto), 124–128 (energía), 128,6 = 28 fotogramas a 60 fps.
  `golpe(n, bpm)` y `useGolpe()` dan el segundo del golpe n.
- **Cada evento en un pulso o medio pulso** (entradas, clics, cambios de cámara, cortes), con el sonido en el mismo
  fotograma o 1–2 antes. Secciones de un compás (4 tiempos) en reels de agencia; de 2 compases en producto.
- **Un evento cada 0,2–0,5 s**. Si un tramo tiene menos, falta algo (deriva, un detalle que se enciende, la luz que late).
- **Contraste**: 1 s de pausa (o 2–9 fotogramas de silencio) antes del golpe grande lo hace pegar más.

## Guion por eventos (escríbelo ANTES del código)
Una fila por pulso:
```
t (s) | golpe | qué entra / cambia | de qué objeto nace | cámara | sonido
0.00  | 0     | punto de luz       | —                  | z 1.0  | tic
0.50  | 1     | punto → píldora    | punto              | z 1.1  | whoosh-suave
```
Los tiempos de animación y los del sonido salen de la MISMA tabla (`momentos()` en el código): así nunca se
desincronizan.

## Música
`node scripts/musica.mjs public/musica/<x>.wav --config musica/<x>.json`: electrónica sintetizada en local, sin
derechos de terceros. En el JSON: duración, BPM, progresión, secciones (`SECCIONES`), golpes (`EVENTOS`: impacto,
subida, silencio) y mezcla; se normaliza a −14 LUFS / −1 dBTP. Ejemplos en `musica/*.json` (oscuro, claro, agencia).
Sin música, deja la prop `musica` como hueco y monta todo igualmente a un BPM.

## Efectos (`Sonido sfx={[{t, f, v}]}`)
Sonidos sintetizados en `public/sfx` (`node scripts/sfx.mjs`): `tic`, `click`, `pop`, `whoosh`, `whoosh-suave`,
`whoosh-rapido`, `impacto`, `subida`, `glitch`…
- pop/clic/tic cuando el objeto **aterriza** (no cuando empieza a moverse); whoosh **centrado** en el barrido;
  impacto en el golpe; subida que termina en el golpe.
- Cascadas: un `tic` por pieza con su escalón (0,075 s), a volumen 0,15–0,2.
- Volúmenes: música 0,55 y efectos 0,7–0,75 dejan el pico en −2 dBFS (0,7/1 satura). Pico final < −1 dBFS.

## Piezas de producto a ~90 BPM (medido)
- Los cambios de estado (nodo, tarjeta, tema, palabra) caen en el golpe ±1 fotograma; los objetos grandes ARRANCAN en el
  golpe (o medio golpe) y los iris/focos TERMINAN en el golpe (empiezan 0,4 s antes).
- Sin música con derechos: la referencia solo tenía una canción comercial; la crítica fue la falta de efectos. Pon un
  `tic` por nodo/estado, `whoosh-suave` en los empujes a profundidad, `whoosh` en el foco e `impacto` cuando cubre.
- Música propia a 90 BPM: `node scripts/musica.mjs public/musica/x.wav --config musica/seguimiento.json`
  (en el kit; con la subida y el silencio de 80 ms antes del golpe de marca).

## Comprobar
`ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` → integrado −14 LUFS (redes) y pico < −1 dBFS. Un revisor de vídeo
con IA a 4 fps da desfases falsos de ~250 ms: compruébalo a 60 fps con los fotogramas antes de mover nada.
