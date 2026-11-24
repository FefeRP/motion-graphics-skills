# Checklist anti-aburrimiento (promo de producto)

Pásala **antes de dar una promo por buena**: con la tabla del guion (antes de animar), con el animático y con el
MP4 final. Cada punto es medible; si uno falla, se corrige y se vuelve a pasar. Las razones y las recetas están en
[promo-producto.md](promo-producto.md).

## A · Guion (antes de animar): `node scripts/revisar-guion.mjs GUION.md`
- [ ] A1. Hay un evento en t = 0 y el producto (o un componente real) aparece antes de 3,5 s.
- [ ] A2. El hueco máximo entre eventos es ≤ 1,8 s, salvo el logo final.
- [ ] A3. Ninguna escala (G, M, D, macro) se repite en 3 filas seguidas.
- [ ] A4. Ningún tipo de transición se usa más de 2 veces.
- [ ] A5. Los bloques de producto o función usan cada uno un truco distinto: cursor, tecleo, push-in, morph, contador, cascada…
- [ ] A6. Hay riser → silencio (100–200 ms) → golpe en el giro, y lo mismo antes del logo.
- [ ] A7. Texto: ≤ 4 palabras por pantalla (los CTA, ≤ 7) y ≥ 1,2 s de lectura (o ≥ 0,6 s en ráfaga al pulso).
- [ ] A8. La voz, si la hay, va en frases de ≤ 6 palabras y deja ≥ 1 compás de solo música.

## B · Fotogramas (animático o render): hoja de contacto a 4 fps, más los fotogramas 0, 0,5, 1 y 2 s
- [ ] B1. En el fotograma 0 ya se mueve algo con significado: ni logo, ni fondo vacío.
- [ ] B2. Hay palabra legible antes de 0,7 s.
- [ ] B3. Ninguna ventana entera se ve durante más de 1,5 s sin empujar al detalle (≥ 1,8×).
- [ ] B4. El texto de la UI que se quiere leer mide ≥ 2 % de la altura (≥ 22 px a 1080).
- [ ] B5. Los titulares miden entre el 6 % y el 12 % de la altura, y nada los tapa ni los toca.
- [ ] B6. No hay dos bloques seguidos con la misma composición (por ejemplo, titular a la izquierda y ventana a la derecha).
- [ ] B7. No hay cromo inventado, HUD, rejillas o partículas decorativas, cifras inventadas ni emojis.
- [ ] B8. El cierre tiene clímax (ráfaga o colapso) y el logo aguanta quieto 0,6–1,4 s.

## C · Medidas del MP4
- [ ] C1. `node scripts/medir-ritmo.cjs v.mp4` da quieto ≤ 10 % y racha ≤ 0,5 s (sin contar el logo final, ≤ 1,4 s).
- [ ] C2. `ffmpeg -i v.mp4 -af ebur128=peak=true -f null -` da −14 LUFS ± 1 y pico < −1 dBTP.
- [ ] C3. Los efectos van al fotograma: comprueba 3 golpes a 60 fps (whoosh 80–100 ms antes, clic en el contacto).

## D · Revisor de vídeo con IA (a 4–5 fps), con este prompt
```
Eres un director de motion graphics exigente. Compara esta promo con los mejores vídeos de lanzamiento de productos
de software que conozcas. Con marcas mm:ss.d:
1) ¿Qué hay en el fotograma 0? ¿Cuándo sale la primera palabra y cuándo el producto?
2) Intervalo medio y máximo entre eventos.
3) ¿Hay tramos que aburran? ¿Dónde y por qué?
4) ¿Se repiten composiciones, transiciones o sonidos?
5) ¿La UI está viva (cursor, clics, tecleo, zoom al detalle)?
6) ¿Hay textos ilegibles o tapados?
7) ¿Hay algo con pinta de IA o de plantilla?
8) Sincronía de efectos y volúmenes.
Termina con una nota del 1 al 10 en «¿aburre?» (10 = nada) y un veredicto: PUBLICABLE o RETOCAR.
```
- [ ] D1. Veredicto PUBLICABLE y nota de «¿aburre?» ≥ 8.
- [ ] D2. Cada fallo que señale está contrastado con los fotogramas: el revisor inventa desfases de ~250 ms y erratas.

## E · Promo con voz en off ([promo-recetas.md](promo-recetas.md))
- [ ] E1. `node scripts/voz.mjs revisar guion-voz.json` sin avisos (o cada aviso decidido) ANTES de generar la voz.
- [ ] E2. Título del hook y subtítulos salen de `voz-tiempos.json` (nada a ojo) y ningún subtítulo cruza el revelado.
- [ ] E3. `node scripts/franjas.mjs v.mp4` y `--zona arriba`: OK (o cada candidato confirmado con fotogramas).
- [ ] E4. `node scripts/audio.mjs medir …`: mediana ≥ 8 dB y p10 ≥ 3 dB en cada frase (las de < 0,8 s, escuchadas).
- [ ] E5. Silencio antes del golpe: `volumedetect` en [G − 0,13, G] ≤ −60 dB, y el logo llega en G + 0,04.
- [ ] E6. Revelado: anticipación, banda, halo, aro, logo con rebote y sombra, nombre con máscara de degradado y el
  conjunto centrado (fotogramas en G − 0,1, G + 0,12, G + 0,3, G + 0,6 y G + 1,2).
- [ ] E7. Un solo material y una sola dimensión: ningún elemento 3D, brillante o de otro estilo en una pieza plana.
- [ ] E8. Versión nueva: la lista ACUMULADA de cambios pedidos, cada uno comprobado con su mm:ss, y lo no tocado
  idéntico (voz bit a bit, imagen por MD5 o diferencia de fotogramas). Cambiar solo la música: `audio.mjs remezclar`.

Solo cuando A, B, C, D (y E si hay voz) estén en verde se entrega el vídeo.
