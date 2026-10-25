---
name: motion-transiciones
description: Técnica de motion graphics para PASAR DE UN PLANO A OTRO SIN CORTES DE DIAPOSITIVA en Remotion — objeto puente que se transforma (punto → píldora → tarjeta → logo), hilo conductor, corte por continuidad de velocidad, zoom a través con match cut, iris y foco de luz que se abre, destellos y flashes cromáticos, estroboscopio, manchas líquidas, barrido radial, eco de zoom, glitch, desenfoque de profundidad que traspasa el foco. La usa la skill maestra motion-graphics; úsala también sola cuando un vídeo "parezca un PowerPoint" o tenga fundidos.
---

# Transiciones: cada plano nace del anterior

Parte del plugin de motion graphics (kit en `../motion-graphics/kit`).

## Reglas
1. **Ni cortes ni fundidos de diapositiva**: las referencias tienen 0–9 cortes secos en 10–30 s y casi todos
   escondidos. Cada plano nace de un objeto del anterior.
2. **Un hilo conductor**: un mismo objeto atraviesa el vídeo y cambia de papel (un punto que se divide, abre el iris,
   es el centro de una figura y termina siendo el punto del logo; una cifra que se convierte en la letra de la marca).
3. Si hay corte, va **en el fotograma de máxima velocidad**, en un golpe de la música, o **tapado por luz**.
4. Antes de un golpe grande, **2–9 fotogramas de silencio** (y quietud) hacen que pegue más.

## Elegir la transición
| Situación | Transición | Componente |
|---|---|---|
| Un elemento del plano A es protagonista del B | Objeto puente: se transforma (forma, tamaño, color) | `Forma`, `GlifoPuente`, `MarcaBrota` |
| Movimiento rápido de cámara | Corte por continuidad de velocidad: acelera hasta el corte y sigue frenando al otro lado | `Camara`/`Camara2D` con claves |
| Entrar "dentro" de algo | Zoom a través (×9–14 en 0,25 s, ease-in) + match cut con su color | `ZoomAtraves` |
| Del producto a la marca | Remolino + foco radial de borde suave que se abre y llena el cuadro con el color de marca | `Remolino` + `FocoRadial` (abajo), `IrisAro`, `Portal` |
| Entre planos claros, sin objeto común | Salida y entrada por enfoque: sale blur 0 → 22 px (0,13–0,15 s, acelera), entra 32 → 0 (0,33 s, expo) | `Escenas` `{tipo: "enfoque"}`, `Camara2D` `b` |
| De una frase a un objeto | Empuje a profundidad: la frase se va al fondo (×0,35 acelerando + blur) y el objeto sube desde abajo enfocándose | `Camara2D` (s, b) + `PilaMoviles`/`Movil` |
| Cierre que vuelve al principio | Luz que sube desde las esquinas y se queda, dejando ver el primer plano desenfocado (bucle) | `InundaLuz` |
| Cambio de mundo o de sección | Flash o flash cromático de 0,2–0,25 s en el golpe | `Flash`, `FlashCromatico`, `FugaLuz` |
| Reel a compás | Barrido radial desde el objeto puente (0,14 s) / morph en cada tiempo | `BarridoRadial`, `Forma` |
| Impacto, nocturno | Estroboscopio de negativo (6 f a 30 fps) | `Estrobo` |
| Cortes con voz en off | Ola de manchas líquidas que tapa el corte | `ManchasLiquidas` |
| Salto de zoom brusco | Un fotograma de doble exposición | `EcoZoom` |
| Salida con energía | Glitch 0,2 s | `Glitch` |
| Mismo espacio, otro foco | Traspaso de foco: lo que estaba nítido se desenfoca (0 → 8–14 px) mientras lo nuevo se enfoca | `Movil` con `b` en claves |
| Varias escenas encadenadas sin objeto común | `Escenas` con barrido que empuja, círculo o cortina (último recurso) | `Escenas` |

## Recetas
- **Objeto puente** (`Forma` con claves `{t,x,y,w,h,r,rz,luz}`): barra → sobreexposición (`luz` 1) → punto de 24 px en
  4 fotogramas → cápsula 300×120 con `Progreso` + `Contador` dentro con la MISMA curva. Morph inverso hasta la marca:
  tarjeta → píldora → punto (ease-in) y en el golpe la marca se enfoca (blur 28 → 0, escala 0,43 → 1 en 0,37 s).
- **Frase → píldora → silencio → estallido** (clímax): la frase se comprime (scaleX 1 → 0,46, tracking −0,12 em, 0,38 s
  ease-in) → píldora con halo → 0,15 s de silencio → estalla a tarjeta (un sobrepaso) con `Flash` y `Onda`.
- **Zoom a través + match cut**: `ZoomAtraves t0 t1 ox oy hasta={14} ecos` 0,25 s antes del compás; en el compás, el
  punto de la casilla ES el círculo de la escena nueva, que se desliza a su sitio (0,2 s expo).
- **Flash cromático** (`FlashCromatico t0 colores={[acento, blanco, oscuro]}`): solo limpia el corte si la escena
  saliente termina en su pico (t0 + 0,23 s); si se solapan más, se ve doble exposición.
- **Corte con zoom sobre la acción**: dos claves de cámara seguidas (Δt = 1 fotograma) que saltan a ×1,9 descentrado.
- **Barrido**: en `Escenas`, la dirección del barrido se usa en los dos planos; si no, aparece un hueco. Las escenas
  se solapan T fotogramas (Sequence de dur + T).
- **Del producto a la marca** (medido): `Remolino` (giro 20°, 3–4 anillos de onda, intensidad 0 → 1 → 0 en 0,2–0,3 s)
  sobre todo lo claro y, a la vez, `FocoRadial` (0,4 s, `CURVAS_ENFOQUE.foco`, borde difuminado 25 % del radio, SIN aro)
  con la malla de marca dentro. Pon `t0 = golpe − 0,4`: cubre el cuadro justo en el golpe. Un objeto de la interfaz
  (aro de carga, icono) crece en el centro mientras se abre y llega con el tamaño del símbolo del lockup.
- **Enfoque** (`Escenas` con `{tipo: "enfoque", dur: 0.47}`, o `b` en las claves de `Camara2D`): el plano saliente se
  desenfoca acelerando en el primer 30 % y desaparece; el entrante aparece al 30 % muy desenfocado y se enfoca con expo.
  Sin escala: es un corte "de lente", muy limpio en fondos claros.
- **Empuje a profundidad + relevo desde abajo**: saliente `s` 1 → 0,35 en 0,37 s acelerando con blur 0 → 10 px; el
  entrante sube 620–660 px en 1,1 s con `CURVAS_ENFOQUE.quint` (la mitad del recorrido al 14 % del tiempo) y se enfoca en
  0,2 s; arranca 1–2 fotogramas antes de que el saliente desaparezca.
- **Inundación de luz** (`InundaLuz t0 dur={0.2}`): manchas desde las esquinas de abajo que crecen ease-in y SE QUEDAN; con
  hijos (el primer plano congelado con `Freeze`) el vídeo enlaza en bucle en vez de acabar en negro o congelado.
- Ejemplo completo: `RecSeguimiento` (`src/motion/recreaciones/seguimiento.tsx`, producto ficticio «ruta», 12 s, 90 BPM).
