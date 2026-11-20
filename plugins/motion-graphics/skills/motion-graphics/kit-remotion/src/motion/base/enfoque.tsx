// Base común · técnicas de ENFOQUE (análisis a fondo de tres motion de producto claros, 2026-10-25:
// referencias/motion-graphics/analisis/a-fondo-tres-motion-panel{1,2,3}.md). Todo entra desenfocado y se enfoca al
// llegar; todo sale desenfocándose. Cifras medidas a 30 fps y pasadas a segundos.
//  · PorPalabra    titular palabra a palabra que sube desde la cámara (y 210 px, ×1,25, blur 12 → 0, 0,4 s, escalón 0,15 s)
//  · FraseCambia   frase en la que solo cambia el final (palabra nueva por máscara) y la frase se recentra sola
//  · Relevo        cruce de dos contenidos con desenfoque (texto → logo, 0,23 s)
//  · enOrbita      posición en una elipse con espiral de entrada y frenada (chispas alrededor de un titular)
//  · FocoRadial    iris de BORDE SUAVE que se abre hasta cubrir el cuadro (0,4 s, difuminado 25 % del radio)
//  · Remolino      giro + ondas concéntricas de la imagen (feDisplacementMap), 0,2 s antes del foco
//  · InundaLuz     luz que sube desde las esquinas y SE QUEDA cubriendo (salida de un cierre)
//  · MarcaTeclea   símbolo solo → la palabra se teclea a su derecha (1 letra/fotograma, borrosas) y el conjunto se
//                  recentra y encoge; lema revelado de izquierda a derecha
//  · AroCarga      indicador de carga (objeto puente hacia el símbolo de la marca)
// Reglas: nada de `filter` dentro de contenedores `preserve-3d`; colores por props (con el estilo por defecto).
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, tramo, useSeg } from "./tiempo";
import { anchoTexto } from "./efectos-2";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const useIdSvg = (p: string) => p + React.useId().replace(/[^a-zA-Z0-9]/g, "");

/** Curvas medidas en estas piezas (además de `CURVAS`). */
export const CURVAS_ENFOQUE = {
  /** palabra que sube y se enfoca: arranque suave, frenada algo más larga */
  palabra: Easing.bezier(0.45, 0, 0.2, 1),
  /** entrada larga de objetos grandes (móviles): la mitad del recorrido al 14 % del tiempo */
  quint: Easing.bezier(0.22, 1, 0.36, 1),
  /** apertura del foco radial */
  foco: Easing.bezier(0.2, 0.7, 0.3, 1),
  /** paneo largo entre nodos (pico de velocidad al centro, llegada suave) */
  paneo: Easing.bezier(0.7, 0, 0.2, 1),
};

// ═════════ PALABRA QUE ENFOCA ═════════
/**
 * Titular palabra a palabra: cada palabra sube `desde.y` px desde abajo, más grande (`desde.s`), desenfocada
 * (`desde.blur` px) y transparente, y se asienta en la línea; con el escalonado la frase se lee un instante en escalera.
 * `relleno` = fondo CSS para el texto (p. ej. degradado horizontal oscuro en el centro y claro en los extremos, ver
 * `rellenoCentro`): se aplica a cada palabra con `background-clip: text`.
 * Medido: escalón 0,15 s, dur 0,40 s, curva `CURVAS_ENFOQUE.palabra`, y 210 px, ×1,25, blur 12 → 0, opacidad adelantada.
 * Para el gesto completo, envuélvelo en `Camara2D` con claves s 1,9 → 1 en 0,55 s (inOut) y luego deriva −1 %/s.
 */
export const PorPalabra: React.FC<{ texto: string; t0: number; escalon?: number | number[]; dur?: number; desde?: { y?: number; s?: number; blur?: number };
  curva?: (x: number) => number; relleno?: string; sale?: { t: number; dur?: number; blur?: number }; style?: React.CSSProperties }> = ({
  texto, t0, escalon = 0.15, dur = 0.4, desde = {}, curva = CURVAS_ENFOQUE.palabra, relleno, sale, style }) => {
  const t = useSeg();
  const { y = 210, s = 1.25, blur = 12 } = desde;
  const palabras = texto.split(" ");
  const inicio = (i: number) => Array.isArray(escalon) ? t0 + (escalon[i] ?? escalon[escalon.length - 1] * i) : t0 + i * escalon;
  const fuera = sale ? tramo(t, sale.t, sale.t + (sale.dur ?? 0.25), CURVAS.acelera) : 0;
  return (
    <span style={{ display: "inline-flex", gap: "0.26em", whiteSpace: "pre", alignItems: "baseline", opacity: 1 - fuera,
      filter: fuera > 0.01 ? `blur(${fuera * (sale?.blur ?? 14)}px)` : undefined, ...style }}>
      {palabras.map((p, i) => {
        const a = inicio(i);
        const k = tramo(t, a, a + dur, curva);
        const o = tramo(t, a, a + dur * 0.8, curva);
        const b = (1 - k) * blur;
        return (
          <span key={i} style={{ display: "inline-block", opacity: o, transform: `translateY(${(1 - k) * y}px) scale(${1 + (s - 1) * (1 - k)})`, transformOrigin: "50% 60%",
            filter: b > 0.1 ? `blur(${b.toFixed(2)}px)` : undefined,
            ...(relleno ? { backgroundImage: relleno, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}) }}>{p}</span>
        );
      })}
    </span>
  );
};
/** Degradado horizontal para texto: `centro` en el medio y `borde` en los extremos (brillo/viñeta tipográfica). */
export const rellenoCentro = (centro = "#1F1535", medio = "#3A2F55", borde = "#8A8599") =>
  `linear-gradient(90deg, ${borde} 0%, ${medio} 25%, ${centro} 50%, ${medio} 75%, ${borde} 100%)`;

// ═════════ FRASE EN LA QUE SOLO CAMBIA EL FINAL ═════════
export type CambioFrase = { t: number; texto: string };
/**
 * Frase con una parte fija (`fijo`, p. ej. "Sin") y un final que cambia en cada `cambios[i].t`. El final viejo sale
 * hacia arriba desenfocándose y el nuevo entra desde abajo palabra a palabra dentro de una máscara; la frase entera se
 * RECENTRA sola (el ancho se interpola con la misma curva). El primer cambio es la entrada (también entra `fijo`).
 * Centro en (`x`, `y`). `sale` = t en que toda la frase se desenfoca y se va.
 */
export const FraseCambia: React.FC<{ fijo: string; cambios: CambioFrase[]; x?: number; y?: number; tam?: number; fuente?: string; peso?: number; color?: string;
  colorCambio?: string; relleno?: string; dur?: number; escalon?: number; sale?: number }> = ({
  fijo, cambios, x = 960, y = 540, tam = 64, fuente, peso, color, colorCambio, relleno, dur = 0.45, escalon = 0.12, sale }) => {
  const t = useSeg();
  const est = useEstilo();
  const fam = fuente ?? est.fuente, pes = peso ?? 500, tinta = color ?? est.texto;
  if (!cambios.length || t < cambios[0].t) return null;
  let i = 0;
  while (i < cambios.length - 1 && t >= cambios[i + 1].t) i++;
  const hueco = tam * 0.26;
  const wFijo = anchoTexto(fijo, fam, pes, tam);
  const ancho = (s: string) => anchoTexto(s, fam, pes, tam);
  const cur = cambios[i], prev = cambios[i - 1];
  const nPal = cur.texto.split(" ").length;
  const kAncho = tramo(t, cur.t, cur.t + dur + escalon * (nPal - 1), CURVAS.inOut);
  const wFinal = prev ? ancho(prev.texto) + (ancho(cur.texto) - ancho(prev.texto)) * kAncho : ancho(cur.texto);
  const W = wFijo + hueco + wFinal;
  const left = x - W / 2;
  const kFijo = tramo(t, cambios[0].t, cambios[0].t + dur, CURVAS_ENFOQUE.palabra);
  const fuera = sale !== undefined ? tramo(t, sale, sale + 0.3, CURVAS.acelera) : 0;
  const base: React.CSSProperties = { position: "absolute", top: 0, fontFamily: fam, fontWeight: pes, fontSize: tam, lineHeight: 1.2, whiteSpace: "pre" };
  // relleno = degradado del texto (p. ej. vertical, morado arriba → lila transparente abajo)
  const pinta = (c: string): React.CSSProperties => relleno ? { backgroundImage: relleno, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : { color: c };
  const palabrasEntran = (texto: string, a: number) => texto.split(" ").map((p, j) => {
    const k = tramo(t, a + j * escalon, a + j * escalon + dur, CURVAS_ENFOQUE.palabra);
    const dx = anchoTexto(texto.split(" ").slice(0, j).join(" ") + (j ? " " : ""), fam, pes, tam);
    return <span key={j} style={{ ...base, left: dx, ...pinta(colorCambio ?? tinta), opacity: k, transform: `translateY(${(1 - k) * 0.9}em)`, filter: k < 0.97 ? `blur(${(1 - k) * 8}px)` : undefined }}>{p}</span>;
  });
  const kSale = prev ? tramo(t, cur.t, cur.t + dur * 0.7, CURVAS.acelera) : 1;
  return (
    <div style={{ position: "absolute", left, top: y - tam * 0.6, height: tam * 1.2, width: W, opacity: 1 - fuera, filter: fuera > 0.01 ? `blur(${fuera * 14}px)` : undefined }}>
      <span style={{ ...base, left: 0, ...pinta(tinta), opacity: kFijo, transform: `translateY(${(1 - kFijo) * 0.9}em)`, filter: kFijo < 0.97 ? `blur(${(1 - kFijo) * 8}px)` : undefined }}>{fijo}</span>
      <div style={{ position: "absolute", left: wFijo + hueco, top: -tam * 0.2, height: tam * 1.6, width: Math.max(wFinal, prev ? ancho(prev.texto) : 0) + tam, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: tam * 0.2 }}>
          {prev && kSale < 1 && <span style={{ ...base, left: 0, ...pinta(colorCambio ?? tinta), opacity: 1 - kSale, transform: `translateY(${-kSale * 0.9}em)`, filter: `blur(${kSale * 8}px)` }}>{prev.texto}</span>}
          {palabrasEntran(cur.texto, prev ? cur.t + dur * 0.25 : cur.t + escalon)}
        </div>
      </div>
    </div>
  );
};

// ═════════ RELEVO ═════════
/**
 * Cruce de dos contenidos en el mismo sitio con desenfoque (medido: texto → logotipo en 7 fotogramas a 30 fps = 0,23 s).
 * `a` sale (opacidad 1 → 0, blur 0 → `blur`), `b` entra (al revés) con `tracking` em de más que se cierra.
 */
export const Relevo: React.FC<{ t0: number; dur?: number; blur?: number; tracking?: number; a: React.ReactNode; b: React.ReactNode; style?: React.CSSProperties }> = ({
  t0, dur = 0.23, blur = 10, tracking = 0, a, b, style }) => {
  const t = useSeg();
  const k = tramo(t, t0, t0 + dur, CURVAS.inOut);
  const capa: React.CSSProperties = { position: "absolute", left: "50%", top: "50%", whiteSpace: "pre" };
  return (
    <div style={{ position: "relative", ...style }}>
      {k < 1 && <div style={{ ...capa, transform: "translate(-50%, -50%)", opacity: 1 - k, filter: k > 0.01 ? `blur(${k * blur}px)` : undefined }}>{a}</div>}
      {k > 0 && <div style={{ ...capa, transform: "translate(-50%, -50%)", opacity: k, letterSpacing: tracking ? `${(1 - k) * tracking}em` : undefined, filter: k < 0.99 ? `blur(${(1 - k) * blur}px)` : undefined }}>{b}</div>}
    </div>
  );
};

// ═════════ EN ÓRBITA ═════════
/**
 * Posición en una elipse (centro `c`, semiejes `rx`, `ry`) que gira `grados` en `dur` s con frenada expo-out (las
 * chispas entran rapidísimo y frenan); `espiral` = radio inicial relativo (1,6) que converge a 1 en el primer 35 %.
 * `fase` en grados (0 = derecha; dos chispas en fases opuestas: 0 y 180). Sentido antihorario en pantalla con `grados` > 0.
 * Devuelve x, y, `delante` (está en la mitad de abajo de la elipse: delante del texto) y `k` (progreso 0–1).
 * Medido: elipse 545 × 340 px alrededor de un titular, 540° en 0,8 s, tamaño 34 → 12 px al apagarse.
 */
export const enOrbita = (t: number, o: { t0: number; dur?: number; c?: [number, number]; rx?: number; ry?: number; grados?: number; fase?: number; espiral?: number; curva?: (x: number) => number }) => {
  const { t0, dur = 0.8, c = [960, 540], rx = 545, ry = 340, grados = 540, fase = 180, espiral = 1.6, curva = CURVAS.expo } = o;
  const k = c01((t - t0) / dur);
  const ang = ((fase + grados * (curva(k) - 1)) * Math.PI) / 180; // llega a `fase` al final
  const r = 1 + (espiral - 1) * (1 - tramo(k, 0, 0.35));
  const x = c[0] + Math.cos(ang) * rx * r, y = c[1] - Math.sin(ang) * ry * r;
  return { x, y, delante: Math.sin(ang) < 0, k };
};

// ═════════ FOCO RADIAL ═════════
/**
 * Iris de BORDE SUAVE (no hay aro): un círculo centrado en (`x`, `y`) cuyo radio crece de 0 a cubrir las esquinas en
 * `dur` s (ease-out medido, 0,4 s) con un difuminado de `suave` × radio (0,25). Dentro se ve `children` (la escena
 * siguiente: fondo de marca, logo…) o, sin hijos, el `color`. Colócalo para que CUBRA el cuadro justo en el golpe
 * (t0 = golpe − dur). `hasta` = deja de pintarse (cuando la escena siguiente ya está debajo).
 */
export const FocoRadial: React.FC<{ t0: number; dur?: number; x?: number; y?: number; color?: string; suave?: number; curva?: (x: number) => number; hasta?: number; children?: React.ReactNode }> = ({
  t0, dur = 0.4, x = 960, y = 560, color, suave = 0.25, curva = CURVAS_ENFOQUE.foco, hasta, children }) => {
  const t = useSeg();
  const est = useEstilo();
  const { width: W, height: H } = useVideoConfig();
  if (t < t0 || (hasta !== undefined && t >= hasta)) return null;
  const Rmax = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)) / (1 - suave * 0.5);
  const R = Math.max(1, Rmax * curva(c01((t - t0) / dur)));
  const mascara = `radial-gradient(circle ${R.toFixed(1)}px at ${x}px ${y}px, #000 ${((1 - suave) * 100).toFixed(1)}%, transparent 100%)`;
  return (
    <AbsoluteFill style={{ WebkitMaskImage: mascara, maskImage: mascara, background: children ? undefined : (color ?? est.acento) }}>{children}</AbsoluteFill>
  );
};

// ═════════ REMOLINO ═════════
const mapasRemolino = new Map<string, { href: string; escala: number }>();
const mapaRemolino = (giro: number, anillos: number, ondas: number, W: number, H: number, cx: number, cy: number) => {
  const clave = `${giro}|${anillos}|${ondas}|${W}|${H}|${cx}|${cy}`;
  const hecho = mapasRemolino.get(clave);
  if (hecho) return hecho;
  const w = Math.round(W / 4), h = Math.round(H / 4), R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
  const dxs = new Float32Array(w * h), dys = new Float32Array(w * h);
  let max = 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const px = (i + 0.5) * (W / w) - cx, py = (j + 0.5) * (H / h) - cy, r = Math.hypot(px, py), u = r / R;
    const a = ((giro * Math.PI) / 180) * (1 - u) ** 2; // giro máximo en el centro
    const onda = ondas * Math.sin(u * anillos * Math.PI * 2) * (1 - u); // ondas concéntricas (empuje radial)
    const ca = Math.cos(a), sa = Math.sin(a);
    const sx = px * ca - py * sa, sy = px * sa + py * ca; // de dónde se lee
    const rr = r > 0.5 ? (r + onda) / r : 1;
    const d1 = sx * rr - px, d2 = sy * rr - py;
    dxs[j * w + i] = d1; dys[j * w + i] = d2;
    max = Math.max(max, Math.abs(d1), Math.abs(d2));
  }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const im = g.createImageData(w, h);
  for (let n = 0; n < w * h; n++) {
    im.data[n * 4] = Math.round(255 * (0.5 + dxs[n] / (2 * max)));
    im.data[n * 4 + 1] = Math.round(255 * (0.5 + dys[n] / (2 * max)));
    im.data[n * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const r = { href: c.toDataURL(), escala: 2 * max };
  mapasRemolino.set(clave, r);
  return r;
};
/**
 * Remolino: la capa se retuerce alrededor de (`x`, `y`) (giro máximo `giro`° en el centro, cae con (1 − r/R)²) con
 * `anillos` ondas concéntricas de `ondas` px. Intensidad 0 → 1 → 0 en [`t0`, `t0 + dur`] (medido: 0,2 s, justo antes de
 * que el `FocoRadial` cubra). Fuera de su ventana no aplica filtro (coste cero).
 */
export const Remolino: React.FC<{ t0: number; dur?: number; x?: number; y?: number; giro?: number; anillos?: number; ondas?: number; children: React.ReactNode }> = ({
  t0, dur = 0.2, x = 960, y = 560, giro = 20, anillos = 3.5, ondas = 14, children }) => {
  const t = useSeg();
  const { width: W, height: H } = useVideoConfig();
  const id = useIdSvg("remolino");
  const mapa = useMemo(() => mapaRemolino(giro, anillos, ondas, W, H, x, y), [giro, anillos, ondas, W, H, x, y]);
  const [h] = useState(() => delayRender("mapa del remolino"));
  useEffect(() => {
    const img = new Image();
    img.onload = () => continueRender(h);
    img.onerror = () => continueRender(h);
    img.src = mapa.href;
  }, [mapa, h]);
  const u = c01((t - t0) / dur);
  const f = u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) ** 1.5;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x={0} y={0} width={W} height={H} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={mapa.href} x={0} y={0} width={W} height={H} preserveAspectRatio="none" result="mapa" />
          <feDisplacementMap in="SourceGraphic" in2="mapa" scale={mapa.escala * f} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: f > 0.002 ? `url(#${id})` : undefined }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═════════ INUNDACIÓN DE LUZ ═════════
/**
 * Luz que sube desde `origenes` (en %, por defecto las dos esquinas de abajo, la izquierda más fuerte) y en `dur` s
 * (0,2 medido, ease-in) cubre el cuadro y SE QUEDA (a diferencia de `FugaLuz`, que se enciende y se apaga). Si hay
 * `children` (la escena siguiente, desenfocada), se ve a través de la luz: `velo` = opacidad final de la luz sobre ella.
 */
export const InundaLuz: React.FC<{ t0: number; dur?: number; color?: string; origenes?: [number, number, number][]; velo?: number; desenfoque?: number; children?: React.ReactNode }> = ({
  t0, dur = 0.2, color = "#F1EEF6", origenes = [[-10, 110, 1], [110, 110, 0.8]], velo = 0.55, desenfoque = 12, children }) => {
  const t = useSeg();
  if (t < t0) return null;
  const k = tramo(t, t0, t0 + dur, CURVAS.acelera);
  const despues = tramo(t, t0 + dur, t0 + dur + 0.5, CURVAS.expo); // la escena de debajo se enfoca y la luz baja a `velo`
  const capas = origenes.map(([ox, oy, f]) => `radial-gradient(circle at ${ox}% ${oy}%, ${color} 0%, ${color} ${(k * 120 * f).toFixed(1)}%, transparent ${(k * 165 * f + 1).toFixed(1)}%)`);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {children && k > 0.5 && <AbsoluteFill style={{ filter: despues < 0.99 ? `blur(${(1 - despues) * desenfoque}px)` : undefined }}>{children}</AbsoluteFill>}
      <AbsoluteFill style={{ backgroundImage: capas.join(", "), opacity: children ? 1 - (1 - velo) * despues : 1 }} />
    </AbsoluteFill>
  );
};

// ═════════ MARCA QUE SE TECLEA ═════════
/**
 * Cierre de marca: el símbolo (`logo`, de `logoTam` px) solo en (`x`, `y`) un instante (`solo` s); luego la palabra
 * se teclea a su derecha (1 letra cada `escalon` s; cada letra entra desde +40 % de su ancho, desenfocada, y se desliza a
 * su hueco) mientras TODO el conjunto se desplaza hasta quedar centrado en `x` y encoge a `escala` (inOut, `mueve` s).
 * Después, `lema` se revela de izquierda a derecha con máscara y desenfoque. `sale` = t de salida (desenfoque 0 → 15 px).
 * Medido: solo 0,2 s, escalón 0,033 s, letra 0,25 s, conjunto 0,87 s ×0,63, hueco 35 → 9 px, lema 0,6 s a 40 px debajo.
 */
export const MarcaTeclea: React.FC<{ t0: number; x?: number; y?: number; logo: React.ReactNode; logoTam: number; texto: string; tam: number; hueco?: number;
  fuente?: string; peso?: number; color?: string; tracking?: number; solo?: number; escalon?: number; durLetra?: number; mueve?: number; escala?: number;
  lema?: { texto: string; tam?: number; color?: string; peso?: number; dy?: number }; sale?: number }> = ({
  t0, x = 960, y = 540, logo, logoTam, texto, tam, hueco = 9, fuente, peso = 800, color = "#FFFFFF", tracking = -0.02, solo = 0.2, escalon = 0.033, durLetra = 0.25,
  mueve = 0.87, escala = 0.63, lema, sale }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0) return null;
  const fam = fuente ?? est.fuente;
  const letras = Array.from(texto);
  const izq = letras.map((_, i) => anchoTexto(texto.slice(0, i), fam, peso, tam, tracking));
  const anchoL = letras.map((l) => anchoTexto(l, fam, peso, tam, tracking));
  const Wtxt = anchoTexto(texto, fam, peso, tam, tracking);
  // lockup final centrado en 0 (coordenadas locales): símbolo en Lx, letras a su derecha
  const Wtot = logoTam + hueco + Wtxt;
  const Lx = -Wtot / 2 + logoTam / 2;
  const tL = t0 + solo;
  const p = tramo(t, t0 + solo * 0.5, t0 + solo * 0.5 + mueve, CURVAS.inOut);
  // pantalla = pos + s·local: al principio el símbolo está en x a tamaño logoTam; al final el lockup centrado a ×escala
  const s = 1 + (escala - 1) * p;
  const pos = x - Lx * (1 - p);
  const abre = (35 - hueco) * (1 - tramo(t, tL, tL + mueve, CURVAS.inOut)); // el hueco símbolo–palabra se cierra
  const fuera = sale !== undefined ? tramo(t, sale, sale + 0.1, CURVAS.acelera) : 0;
  const lemaK = lema ? tramo(t, tL + escalon * letras.length + 0.1, tL + escalon * letras.length + 0.7, CURVAS.suave) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, filter: fuera > 0.01 ? `blur(${fuera * 15}px)` : undefined,
      opacity: sale !== undefined ? 1 - tramo(t, sale + 0.08, sale + 0.2, CURVAS.lineal) : 1 }}>
      <div style={{ position: "absolute", left: pos, top: y, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: Lx - logoTam / 2, top: -logoTam / 2, width: logoTam, height: logoTam, display: "flex", alignItems: "center", justifyContent: "center" }}>{logo}</div>
        {letras.map((l, i) => {
          const a = tL + i * escalon;
          const k = tramo(t, a, a + durLetra, CURVAS.expo);
          if (k <= 0) return null;
          const lx = -Wtot / 2 + logoTam + hueco + abre + izq[i] + (1 - k) * anchoL[i] * 0.4;
          return <span key={i} style={{ position: "absolute", left: lx, top: 0, transform: "translateY(-50%)", fontFamily: fam, fontWeight: peso, fontSize: tam, lineHeight: 1,
            letterSpacing: `${tracking}em`, color, opacity: k, filter: k < 0.97 ? `blur(${(1 - k) * 8}px)` : undefined, whiteSpace: "pre" }}>{l}</span>;
        })}
      </div>
      {lema && lemaK > 0 && (
        <div style={{ position: "absolute", left: x, top: y + (logoTam * escala) / 2 + (lema.dy ?? 40), transform: "translateX(-50%)", whiteSpace: "pre",
          fontFamily: fam, fontWeight: lema.peso ?? 400, fontSize: lema.tam ?? 30, lineHeight: 1.2, color: lema.color ?? "#CFB4F3",
          WebkitMaskImage: `linear-gradient(90deg, #000 ${lemaK * 100 - 10}%, transparent ${lemaK * 100 + 10}%)`, maskImage: `linear-gradient(90deg, #000 ${lemaK * 100 - 10}%, transparent ${lemaK * 100 + 10}%)`,
          filter: lemaK < 0.97 ? `blur(${(1 - lemaK) * 6}px)` : undefined }}>{lema.texto}</div>
      )}
    </div>
  );
};

// ═════════ ARO DE CARGA ═════════
/** Indicador de carga (aro con hueco que gira, `vel` vueltas/s). Objeto puente típico hacia el símbolo de la marca. */
export const AroCarga: React.FC<{ tam: number; color?: string; grosor?: number; vel?: number; style?: React.CSSProperties }> = ({ tam, color = "#6B5A8E", grosor, vel = 1.4, style }) => {
  const t = useSeg();
  const g = grosor ?? Math.max(2, tam * 0.12), r = tam / 2 - g / 2, L = 2 * Math.PI * r;
  return (
    <svg width={tam} height={tam} style={{ transform: `rotate(${t * vel * 360}deg)`, ...style }}>
      <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color} strokeWidth={g} strokeLinecap="round" strokeDasharray={`${L * 0.7} ${L * 0.3}`} />
    </svg>
  );
};
