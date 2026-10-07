// Base común · efectos nuevos medidos en cuatro referencias más (análisis a fondo en
// referencias/motion-graphics/analisis/a-fondo-*.md):
//  · anuncio-ia → ManchasLiquidas (fondo de metabolas con olas que tapan cortes) y FraseVoz (frase que sigue a la voz)
//  · app-musica    → FlashCromatico (destello que cambia de color) y PildoraElastica (selector con bordes desfasados)
//  · agencia-3d      → Estrobo (negativo de 6 fotogramas), LenteBarril + ParedPaneles, LineaLuz, TarjetaBrillo + PilaTarjetas
//  · app-tareas    → Orbitas, Seleccion, Tunel, Portal y Horizonte
// Reglas: 60 fps, colores del estilo (`useEstilo()`) con props para sobrescribir, nada de `filter` en contenedores
// `preserve-3d`, ruido suave (no senos) en lo que ondula.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, random, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pchip, pista, tramo, useSeg, type Clave } from "./tiempo";
import type { ClaveCamara2D } from "./camara";

// ───────── utilidades ─────────
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** Cualquier color CSS con transparencia `a` (0–1). */
export const alfa = (c: string, a: number) => `color-mix(in srgb, ${c} ${(clamp01(a) * 100).toFixed(1)}%, transparent)`;
/** Mezcla dos colores CSS: k = 0 → a, k = 1 → b. */
export const mezclaColor = (a: string, b: string, k: number) => `color-mix(in srgb, ${b} ${(clamp01(k) * 100).toFixed(1)}%, ${a})`;
/** id único y válido para filtros/degradados SVG. */
const useIdSvg = (p: string) => p + React.useId().replace(/[^a-zA-Z0-9]/g, "");

const liso = (f: number) => f * f * (3 - 2 * f);
/** Ruido suave 1D (−1…1): valores al azar en los enteros unidos con curva suave. No se repite como un seno. */
export const ruido = (sem: string, x: number) => {
  const i = Math.floor(x);
  const a = random(`${sem}:${i}`), b = random(`${sem}:${i + 1}`);
  return (a + (b - a) * liso(x - i)) * 2 - 1;
};
/** Ruido suave 2D (x = espacio, y = tiempo): la forma cambia sin desplazarse en bloque. */
export const ruido2 = (sem: string, x: number, y: number) => {
  const j = Math.floor(y), k = liso(y - j);
  return ruido(`${sem}/${j}`, x) * (1 - k) + ruido(`${sem}/${j + 1}`, x) * k;
};

// Medida de texto con canvas (para recolocar líneas sin saltos). Solo se guarda en caché con la fuente ya cargada.
const anchos = new Map<string, number>();
let lienzo: CanvasRenderingContext2D | null = null;
export const anchoTexto = (texto: string, fuente: string, peso: number, tam: number, trackingEm = 0) => {
  const font = `${peso} ${tam}px ${/["',]/.test(fuente) ? fuente : `"${fuente}"`}`;
  const clave = `${font}|${texto}`;
  let w = anchos.get(clave);
  if (w === undefined) {
    lienzo = lienzo ?? document.createElement("canvas").getContext("2d");
    if (!lienzo) return texto.length * tam * (0.58 + trackingEm);
    lienzo.font = font;
    w = lienzo.measureText(texto).width;
    if (document.fonts.check(font)) anchos.set(clave, w);
  }
  return w + trackingEm * tam * texto.length;
};
/** Espera a que las fuentes estén cargadas antes de medir (detiene el render hasta entonces). */
const useFuentesListas = () => {
  const [listo, setListo] = useState(() => typeof document !== "undefined" && document.fonts.status === "loaded");
  const [h] = useState(() => (listo ? null : delayRender("fuentes para medir texto")));
  useEffect(() => {
    if (h === null) return;
    let vivo = true;
    document.fonts.ready.then(() => { if (vivo) setListo(true); continueRender(h); });
    return () => { vivo = false; };
  }, [h]);
  return listo;
};

// ═════════ MANCHAS LÍQUIDAS (anuncio-ia E1/R1) ═════════
/**
 * Mancha = grupo de lóbulos (círculos) que se mueve por claves PCHIP {t, x, y, s} (px de 1920×1080 y escala). Cada lóbulo
 * crece y se recoge con ruido suave (≈ 1 ciclo/s), así la forma tiene entrantes y cuellos que cambian sin parar.
 */
export type Mancha = { claves: Clave[]; lobulos: [number, number, number][] /* dx, dy, r (px) */; semilla?: string };

/**
 * Fondo de metabolas de borde suave: filtro "goo" (desenfoque + umbral alfa) y un segundo desenfoque para el borde.
 * Pinta a media resolución (el borde blando lo disimula). Dos regímenes medidos: OLA (0,1–0,2 s, 1200–2500 px/s, cubre
 * 50–70 % del cuadro y tapa un corte) y RETIRADA expo-out de 0,8–1,2 s a un borde + DERIVA de 90–300 px/s.
 * Usa `clavesOla()` para generar las claves. Va por debajo del texto (en reposo, nunca detrás de él).
 */
export const ManchasLiquidas: React.FC<{ manchas: Mancha[]; color?: string; cresta?: string; sombra?: string; fondo?: string; borde?: number; bamboleo?: number }> = ({
  manchas, color, cresta, sombra, fondo, borde = 9, bamboleo = 0.2,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const id = useIdSvg("goo");
  const c = color ?? est.acento;
  const cr = cresta ?? mezclaColor(c, "#FFFFFF", 0.35);
  const so = sombra ?? mezclaColor(c, "#000000", 0.2);
  return (
    <AbsoluteFill style={{ background: fondo, pointerEvents: "none" }}>
      <svg viewBox="0 0 960 540" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="g" />
            <feGaussianBlur in="g" stdDeviation={borde} />
          </filter>
          {manchas.map((m, i) => {
            const p = pista(m.claves, t, ["x", "y", "s"] as const, { s: 1 });
            const R = Math.max(...m.lobulos.map(([dx, dy, r]) => Math.hypot(dx, dy) + r)) * p.s;
            return (
              <radialGradient key={i} id={`${id}-${i}`} gradientUnits="userSpaceOnUse" cx={(p.x - R * 0.3) / 2} cy={(p.y - R * 0.35) / 2} r={R / 1.4}>
                <stop offset="0%" style={{ stopColor: cr }} /><stop offset="55%" style={{ stopColor: c }} /><stop offset="100%" style={{ stopColor: so }} />
              </radialGradient>
            );
          })}
        </defs>
        <g filter={`url(#${id})`}>
          {manchas.map((m, i) => {
            const p = pista(m.claves, t, ["x", "y", "s"] as const, { s: 1 });
            if (p.s <= 0.01) return null;
            const sem = m.semilla ?? `m${i}`;
            return m.lobulos.map(([dx, dy, r], j) => {
              const u = t * (1 + 0.13 * j);
              const ox = dx + bamboleo * r * ruido(`${sem}x${j}`, u), oy = dy + bamboleo * r * ruido(`${sem}y${j}`, u + 7);
              const rr = r * (1 + 0.75 * bamboleo * ruido(`${sem}r${j}`, u * 1.2 + 3));
              return <circle key={`${i}-${j}`} cx={(p.x + ox * p.s) / 2} cy={(p.y + oy * p.s) / 2} r={Math.max(0, (rr * p.s) / 2)} fill={`url(#${id}-${i})`} />;
            });
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Claves de una mancha con la receta medida: nace en `desde` (escala `s0`), en `ola` s llega a `cubre` (escala `sOla`),
 * se retira expo-out en `retirada` s hasta `queda` y luego deriva (`deriva` px cada 1,2 s, sin pararse nunca).
 */
export const clavesOla = (o: { t0: number; desde: [number, number]; cubre: [number, number]; queda: [number, number]; s0?: number; sOla?: number; sQueda?: number; ola?: number; retirada?: number; deriva?: [number, number]; hasta?: number }): Clave[] => {
  const ola = o.ola ?? 0.18, ret = o.retirada ?? 1.0, s0 = o.s0 ?? 0.5, sOla = o.sOla ?? 1.5, sQ = o.sQueda ?? 0.8;
  const [ddx, ddy] = o.deriva ?? [-160, 90];
  const t1 = o.t0 + ola, t2 = t1 + ret, fin = o.hasta ?? t2 + 2.4;
  const cl: Clave[] = [
    { t: o.t0, x: o.desde[0], y: o.desde[1], s: s0 },
    { t: t1, x: o.cubre[0], y: o.cubre[1], s: sOla },
    // retirada expo-out: casi todo el camino en el primer tercio
    { t: t1 + ret * 0.3, x: o.cubre[0] + (o.queda[0] - o.cubre[0]) * 0.75, y: o.cubre[1] + (o.queda[1] - o.cubre[1]) * 0.75, s: sOla + (sQ - sOla) * 0.75 },
    { t: t2, x: o.queda[0], y: o.queda[1], s: sQ },
  ];
  // deriva: claves cada 1,2 s (PCHIP no frena en las intermedias)
  for (let k = 1, tt = t2 + 1.2; tt <= fin + 0.01; k++, tt += 1.2) cl.push({ t: tt, x: o.queda[0] + ddx * k * (k % 2 ? 1 : 0.8), y: o.queda[1] + ddy * k * (k % 2 ? 0.7 : 1), s: sQ * (1 + 0.04 * (k % 2)) });
  return cl;
};

// ═════════ FRASE QUE SIGUE A LA VOZ (anuncio-ia E2–E3/R2) ═════════
/** Palabra con su tiempo de voz (inicio de la palabra hablada, p. ej. de la transcripción). */
export type PalabraVoz = { texto: string; t: number; acento?: boolean };

/**
 * Frase pequeña que se construye palabra a palabra con la voz: cada palabra nace en su fotograma gris y 0,16 em más
 * baja y en 0,2 s (expo) sube a la línea y pasa a tinta; la línea se recentra sola (sin saltos: mide cada palabra) y
 * empuja ≈ +28 %/s. Salida en `sale`: el espaciado se aprieta (las letras se montan, −22 % de ancho) y huye a la
 * izquierda acelerando ×1,25 por fotograma de 30 fps durante 0,43 s.
 */
export const FraseVoz: React.FC<{ palabras: PalabraVoz[]; sale?: number; x?: number; y?: number; tam?: number; peso?: number; fuente?: string; tinta?: string; gris?: string; acento?: string; empuje?: number; maxEmpuje?: number; huida?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  useFuentesListas();
  const { palabras, sale, x = 960, y = 540, tam = 80, empuje = 0.28, maxEmpuje = 1.3, huida = 1500 } = p;
  if (!palabras.length || t < palabras[0].t) return null;
  const peso = p.peso ?? est.peso, fuente = p.fuente ?? est.fuente;
  const tinta = p.tinta ?? est.texto, acento = p.acento ?? est.acento, gris = p.gris ?? mezclaColor(est.texto, est.fondo, 0.7);
  const k = sale === undefined ? 0 : clamp01((t - sale) / 0.43);
  if (k >= 1) return null;
  const A = 13 * Math.log(1.25); // 13 fotogramas de 30 fps, cada uno ×1,25 más rápido
  const huye = (-huida * (Math.exp(A * k) - 1)) / (Math.exp(A) - 1);
  const aprieta = tramo(k, 0, 0.6, CURVAS.inOut);
  const hueco = (0.28 - 0.36 * aprieta) * tam;
  const track = (parseFloat(est.tracking) || 0) - 0.05 * aprieta;
  const s = Math.min(maxEmpuje, 1 + empuje * Math.max(0, Math.min(t, sale ?? t) - palabras[0].t));
  const vis = palabras.filter((w) => t >= w.t);
  const ws = vis.map((w) => anchoTexto(w.texto, fuente, peso, tam, track));
  const es = vis.map((w) => tramo(t, w.t, w.t + 0.3, CURVAS.suave)); // hueco que ocupa cada palabra en la línea
  const total = ws.reduce((a, w, i) => a + es[i] * w + (i > 0 ? hueco * es[i] : 0), 0);
  let cur = -total / 2;
  const desen = k > 0.7 ? ((k - 0.7) / 0.3) * 10 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${huye}px) scale(${s})`, transformOrigin: "0 0", opacity: 1 - tramo(k, 0.8, 1, CURVAS.lineal),
      fontFamily: fuente, fontWeight: peso, fontSize: tam, letterSpacing: `${track}em`, whiteSpace: "nowrap", lineHeight: 1, filter: desen > 0.2 ? `blur(${desen}px)` : undefined }}>
      {vis.map((w, i) => {
        if (i > 0) cur += hueco * es[i];
        const left = cur;
        cur += es[i] * ws[i];
        const a = tramo(t, w.t, w.t + 0.2);
        return (
          <span key={i} style={{ position: "absolute", left, top: -tam * 0.55, color: mezclaColor(gris, w.acento ? acento : tinta, a), opacity: 0.4 + 0.6 * a,
            transform: `translateY(${(1 - a) * 0.16 * tam}px)`, filter: a < 0.97 ? `blur(${(1 - a) * 3}px)` : undefined }}>{w.texto}</span>
        );
      })}
    </div>
  );
};

/** Reparte una frase en palabras a `cada` s desde `t0` (cuando no hay tiempos de voz). `*palabra*` = acento. */
export const palabrasCada = (frase: string, t0: number, cada = 0.2): PalabraVoz[] =>
  frase.split(/\s+/).filter(Boolean).map((w, i) => ({ texto: w.replace(/\*/g, ""), t: t0 + i * cada, acento: /^\*.*\*$/.test(w) }));

// ═════════ DESTELLO CROMÁTICO (app-musica E10/R6) ═════════
/**
 * Destello que cruza una transición pasando por una lista de colores (del mundo que sale al que entra): sube en `sube` s
 * (ease-in) y baja en `baja` s (expo). Medido: 7 + 5 fotogramas de 30 fps. Debajo, en su pico, se cambia de escena.
 */
export const FlashCromatico: React.FC<{ t0: number; sube?: number; baja?: number; colores?: string[]; fuerza?: number }> = ({ t0, sube = 0.23, baja = 0.17, colores, fuerza = 0.97 }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0 || t > t0 + sube + baja) return null;
  const cs = colores ?? [mezclaColor("#FFFFFF", est.texto, 0.5), "#FFFFFF", mezclaColor("#FFFFFF", est.acento, 0.4), est.acento, est.fondo];
  const k = t < t0 + sube ? tramo(t, t0, t0 + sube, CURVAS.acelera) : 1 - tramo(t, t0 + sube, t0 + sube + baja);
  const p = tramo(t, t0, t0 + sube + baja, CURVAS.lineal) * (cs.length - 1);
  const i = Math.min(cs.length - 2, Math.floor(p));
  return <AbsoluteFill style={{ background: mezclaColor(cs[i], cs[i + 1], p - i), opacity: fuerza * k, pointerEvents: "none" }} />;
};

// ═════════ PÍLDORA ELÁSTICA (app-musica E12/R7) ═════════
export type ChipPildora = { texto: string; x: number /* centro */ };
type Tramo = [number, number];
/**
 * Indicador de selección (pestañas, chips) que viaja entre posiciones con el borde DELANTERO adelantado `retraso` s al
 * trasero: se estira ≈ +80 % a mitad de camino y se recoge al llegar (medido: 126 → 225–243 → 180 px en 6 f de 30 fps).
 * `de` y cada `a` son un rango [izq, der] en px o el índice de un chip de `chips` (que se dibujan con su texto; el de
 * dentro de la píldora cambia de color recortado por ella).
 */
export const PildoraElastica: React.FC<{ y: number; de: number | Tramo; pasos: { t: number; a: number | Tramo }[]; alto?: number; dur?: number; retraso?: number; color?: string;
  chips?: ChipPildora[]; tam?: number; colorChip?: string; colorTexto?: string; colorTextoActivo?: string }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const { width: W, height: H } = useVideoConfig();
  useFuentesListas();
  const { y, alto = 64, dur = 0.2, retraso = 0.033, tam = 30 } = p;
  const color = p.color ?? est.acento, colorChip = p.colorChip ?? alfa(est.texto, 0.09), colorTexto = p.colorTexto ?? est.texto, colorActivo = p.colorTextoActivo ?? est.fondo;
  const ancho = (c: ChipPildora) => anchoTexto(c.texto, est.fuenteTexto, 600, tam) + tam * 1.6;
  const rango = (r: number | Tramo): Tramo => {
    if (typeof r !== "number") return r;
    const c = p.chips?.[r];
    if (!c) return [0, 0];
    const w = ancho(c);
    return [c.x - w / 2, c.x + w / 2];
  };
  const curva = Easing.out(Easing.cubic);
  let prev = rango(p.de), [izq, der] = prev;
  for (const paso of p.pasos) {
    if (t < paso.t) break;
    const b = rango(paso.a);
    const kA = tramo(t, paso.t, paso.t + dur, curva), kB = tramo(t, paso.t + retraso, paso.t + retraso + dur, curva);
    const derecha = b[0] + b[1] > prev[0] + prev[1];
    izq = interpolate(derecha ? kB : kA, [0, 1], [prev[0], b[0]]);
    der = interpolate(derecha ? kA : kB, [0, 1], [prev[1], b[1]]);
    prev = b;
  }
  const texto = (c: ChipPildora, col: string) => (
    <div style={{ position: "absolute", left: c.x, top: y, transform: "translate(-50%, -50%)", color: col, fontFamily: est.fuenteTexto, fontWeight: 600, fontSize: tam, whiteSpace: "nowrap" }}>{c.texto}</div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {p.chips?.map((c, i) => { const w = ancho(c); return <div key={i} style={{ position: "absolute", left: c.x - w / 2, top: y - alto / 2, width: w, height: alto, borderRadius: alto / 2, background: colorChip }} />; })}
      {p.chips?.map((c, i) => <React.Fragment key={i}>{texto(c, colorTexto)}</React.Fragment>)}
      <div style={{ position: "absolute", left: izq, top: y - alto / 2, width: Math.max(alto * 0.5, der - izq), height: alto, borderRadius: alto / 2, background: color }} />
      {p.chips && (
        <AbsoluteFill style={{ clipPath: `inset(${y - alto / 2}px ${W - der}px ${H - y - alto / 2}px ${izq}px round ${alto / 2}px)` }}>
          {p.chips.map((c, i) => <React.Fragment key={i}>{texto(c, colorActivo)}</React.Fragment>)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ═════════ ESTROBOSCOPIO DE NEGATIVO (agencia-3d E2) ═════════
/** Patrones medidos (un carácter por fotograma de 30 fps): n normal · i negativo · k negro · w blanco · g gris · r color en
 *  diferencia (la luz sale en el complementario) · c color plano. */
export const PATRONES_ESTROBO = { entrada: "gkikrk", inversion: "ininin", blancoNegro: "kwgkwk" } as const;
/**
 * Estroboscopio de 0,2 s (6 fotogramas a 30 fps = 12 a 60) que alterna imagen normal y negativo con `mix-blend-mode:
 * difference` (nunca `filter: invert` sobre un 3D). Va ENCIMA de todo; el cambio de escena se hace debajo, en el
 * fotograma 2 del patrón. `previo` = s antes en que la imagen se apaga a gris (aviso del golpe, 5 f medidos).
 */
export const Estrobo: React.FC<{ t0: number; patron?: string; fps?: number; color?: string; previo?: number }> = ({ t0, patron = "ininin", fps = 30, color, previo = 0 }) => {
  const t = useSeg();
  const est = useEstilo();
  if (previo > 0 && t >= t0 - previo && t < t0) {
    return <AbsoluteFill style={{ background: "#000", opacity: 0.4 * tramo(t, t0 - previo, t0, CURVAS.acelera), pointerEvents: "none" }} />;
  }
  const f = Math.floor((t - t0) * fps + 1e-6);
  if (t < t0 || f >= patron.length) return null;
  const c = patron[f];
  const col = color ?? est.acento;
  const capas: Record<string, React.CSSProperties> = {
    i: { background: "#FFFFFF", mixBlendMode: "difference" },
    r: { background: col, mixBlendMode: "difference" },
    c: { background: col },
    k: { background: "#000000" },
    w: { background: "#FFFFFF" },
    g: { background: "#7E7E7E" },
  };
  if (!capas[c]) return null;
  return <AbsoluteFill style={{ ...capas[c], pointerEvents: "none" }} />;
};

// ═════════ LENTE DE BARRIL (agencia-3d E5) ═════════
/**
 * Punto plano (antes de la lente, px de pantalla) → dónde se ve con la lente de barril k. Modelo medido:
 * fuente = c + d·(1 + k·|d|²), d normalizado por el semiancho. Se resuelve el radio con Newton (exacto en todo el cuadro).
 */
export const aPantalla = (sx: number, sy: number, k = 0.5, W = 1920, H = 1080): [number, number] => {
  const HW = W / 2, dx = (sx - W / 2) / HW, dy = (sy - H / 2) / HW, R = Math.hypot(dx, dy);
  if (R < 1e-9 || k <= 0) return [sx, sy];
  let r = R;
  for (let n = 0; n < 10; n++) r -= (r + k * r * r * r - R) / (1 + 3 * k * r * r);
  return [W / 2 + (dx / R) * r * HW, H / 2 + (dy / R) * r * HW];
};

const mapas = new Map<string, { href: string; escala: number }>();
const mapaBarril = (k: number, W: number, H: number) => {
  const clave = `${k}|${W}|${H}`;
  const hecho = mapas.get(clave);
  if (hecho) return hecho;
  const HW = W / 2;
  const escala = 2 * (HW * k * (1 + (H / W) ** 2) + 20); // desplazamiento máximo (esquinas) × 2
  const c = document.createElement("canvas");
  c.width = W / 2; c.height = H / 2; // feImage lo amplía
  const g = c.getContext("2d")!;
  const im = g.createImageData(c.width, c.height);
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
    const dx = ((i + 0.5) * 2 - W / 2) / HW, dy = ((j + 0.5) * 2 - H / 2) / HW, r2 = dx * dx + dy * dy;
    const o = (j * c.width + i) * 4;
    im.data[o] = Math.round(255 * (0.5 + (dx * HW * k * r2) / escala));
    im.data[o + 1] = Math.round(255 * (0.5 + (dy * HW * k * r2) / escala));
    im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const r = { href: c.toDataURL(), escala };
  mapas.set(clave, r);
  return r;
};

/** Guía discontinua (vertical u horizontal, en px planos) curvada con la lente. */
const guiaCurva = (eje: "x" | "y", v: number, k: number, W: number, H: number) => {
  const pts: string[] = [];
  const L = eje === "x" ? H : W;
  for (let s = -L * 1.4; s <= L * 2.4; s += 24) {
    const [px, py] = eje === "x" ? aPantalla(v, s, k, W, H) : aPantalla(s, v, k, W, H);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `M ${pts.join(" L ")}`;
};

/**
 * Lente de barril de pantalla completa (k ≈ 0,5 medido) aplicada a una capa 2D con `feDisplacementMap` (mapa generado
 * una vez con canvas). Lo de dentro se ve curvado y comprimido hacia los bordes; las esquinas quedan vacías. Las guías
 * (`guias`, en px planos ya con la cámara aplicada) se dibujan FUERA del filtro, curvadas con la función exacta.
 * `fuerza` 0–1 anima la lente. Pon la cámara (paneos, zooms) DENTRO: la lente se queda fija.
 */
export const LenteBarril: React.FC<{ k?: number; fuerza?: number; guias?: { x?: number[]; y?: number[] }; colorGuias?: string; grosorGuias?: number; children: React.ReactNode }> = ({
  k = 0.5, fuerza = 1, guias, colorGuias = "rgba(255,255,255,0.85)", grosorGuias = 2, children,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const id = useIdSvg("barril");
  const mapa = useMemo(() => mapaBarril(k, W, H), [k, W, H]);
  const [h] = useState(() => delayRender("mapa de la lente"));
  useEffect(() => {
    const img = new Image();
    img.onload = () => continueRender(h);
    img.onerror = () => continueRender(h);
    img.src = mapa.href;
  }, [mapa, h]);
  const ke = k * fuerza;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x={0} y={0} width={W} height={H} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={mapa.href} x={0} y={0} width={W} height={H} preserveAspectRatio="none" result="mapa" />
          <feDisplacementMap in="SourceGraphic" in2="mapa" scale={mapa.escala * fuerza} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: fuerza > 0.001 ? `url(#${id})` : undefined }}>{children}</AbsoluteFill>
      {guias && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {(guias.x ?? []).map((v, i) => <path key={`x${i}`} d={guiaCurva("x", v, ke, W, H)} fill="none" stroke={colorGuias} strokeWidth={grosorGuias} strokeDasharray="22 15" />)}
          {(guias.y ?? []).map((v, i) => <path key={`y${i}`} d={guiaCurva("y", v, ke, W, H)} fill="none" stroke={colorGuias} strokeWidth={grosorGuias} strokeDasharray="22 15" />)}
        </svg>
      )}
    </AbsoluteFill>
  );
};

/**
 * Pared infinita de paneles (≈ 1200×740 px medidos) vista a través de la `LenteBarril`, con guías discontinuas en los
 * huecos que cruzan toda la pantalla. `camara`: claves {t, x, y, s} en coordenadas de la pared (0,0 = panel central).
 * Medido: paneo de un panel inOut 1,1 s; zoom atrás ×0,66 (1→2×2) en 1,2 s con el pico al principio; empuje ease-in.
 */
export const ParedPaneles: React.FC<{ columnas?: number; filas?: number; ancho?: number; alto?: number; hueco?: number; camara?: ClaveCamara2D[]; k?: number; fuerza?: number;
  radio?: number; colorGuias?: string; panel: (col: number, fila: number) => React.ReactNode }> = ({
  columnas = 3, filas = 3, ancho = 1200, alto = 740, hueco = 70, camara = [{ t: 0 }], k = 0.5, fuerza = 1, radio = 10, colorGuias, panel,
}) => {
  const t = useSeg();
  const { width: W, height: H } = useVideoConfig();
  const c = pista(camara as Clave[], t, ["x", "y", "s"] as const, { x: 0, y: 0, s: 1 });
  const PX = ancho + hueco, PY = alto + hueco;
  const cx0 = (columnas - 1) / 2, cy0 = (filas - 1) / 2;
  const aX = (wx: number) => W / 2 + (wx - c.x) * c.s, aY = (wy: number) => H / 2 + (wy - c.y) * c.s;
  const gx = Array.from({ length: columnas + 1 }, (_, i) => aX((i - 0.5 - cx0) * PX));
  const gy = Array.from({ length: filas + 1 }, (_, j) => aY((j - 0.5 - cy0) * PY));
  return (
    <LenteBarril k={k} fuerza={fuerza} guias={{ x: gx, y: gy }} colorGuias={colorGuias}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${c.s}) translate(${-c.x}px, ${-c.y}px)` }}>
        {Array.from({ length: filas }).flatMap((_, j) => Array.from({ length: columnas }).map((__, i) => (
          <div key={`${i}-${j}`} style={{ position: "absolute", left: (i - cx0) * PX - ancho / 2, top: (j - cy0) * PY - alto / 2, width: ancho, height: alto, borderRadius: radio, overflow: "hidden" }}>
            {panel(i, j)}
          </div>
        )))}
      </div>
    </LenteBarril>
  );
};

// ═════════ LÍNEA DE LUZ (agencia-3d E3) ═════════
/**
 * Línea de luz que cruza la pantalla con ondas irregulares (ruido suave, no un seno: ±`amp` px, ondas de 250–700 px) que
 * se deforman despacio (1–3 px por fotograma) y un halo gaussiano ancho (σ ≈ 50 px). Color del acento por defecto.
 * Haz ancho de "dentro de la línea": `amp` 300, `grosor` 4, `angulo` −35, `escala` 3, color gris.
 */
export const LineaLuz: React.FC<{ y?: number; amp?: number; color?: string; nucleo?: string; grosor?: number; vel?: number; longitud?: number; semilla?: string; angulo?: number; escala?: number; opacidad?: number }> = ({
  y = 570, amp = 45, color, nucleo, grosor = 1, vel = 0.55, longitud = 420, semilla = "linea", angulo = 0, escala = 1, opacidad = 1,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const id = useIdSvg("luz");
  const c = color ?? est.acento;
  const nu = nucleo ?? mezclaColor(c, "#FFFFFF", 0.3);
  const pts: string[] = [];
  for (let x = -200; x <= 2120; x += 14) {
    const v = 0.68 * ruido2(semilla, x / longitud, t * vel) + 0.32 * ruido2(`${semilla}b`, x / (longitud * 0.45), t * vel * 1.5 + 11);
    pts.push(`${x},${(y + amp * v).toFixed(1)}`);
  }
  const d = `M ${pts.join(" L ")}`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: opacidad, transform: angulo || escala !== 1 ? `rotate(${angulo}deg) scale(${escala})` : undefined }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}a`} x={-400} y={-600} width={2720} height={2280} filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation={50 * grosor} /></filter>
          <filter id={`${id}b`} x={-400} y={-600} width={2720} height={2280} filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation={12 * grosor} /></filter>
          <filter id={`${id}c`} x={-400} y={-600} width={2720} height={2280} filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation={1.5 * grosor} /></filter>
        </defs>
        <path d={d} stroke={c} strokeWidth={130 * grosor} fill="none" opacity={0.45} filter={`url(#${id}a)`} />
        <path d={d} stroke={c} strokeWidth={34 * grosor} fill="none" opacity={0.85} filter={`url(#${id}b)`} />
        <path d={d} stroke={nu} strokeWidth={8 * grosor} fill="none" filter={`url(#${id}c)`} />
      </svg>
    </AbsoluteFill>
  );
};

// ═════════ TARJETAS CON BRILLO (agencia-3d E7–E8) ═════════
/**
 * Tarjeta clara retroiluminada: filo claro cálido de 2,5 px, halo de color en dos sombras (núcleo ≈ 30 px y cola ≈ 200 px)
 * y un brillo interior en el borde. Sin `filter`: vale dentro de un 3D.
 */
export const TarjetaBrillo: React.FC<{ ancho: number; alto: number; luz?: number; color?: string; filo?: string; fondo?: string; radio?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  ancho, alto, luz = 1, color, filo, fondo = "#FFFFFF", radio = 18, children, style,
}) => {
  const est = useEstilo();
  const c = color ?? est.acento;
  const f = filo ?? mezclaColor("#FFFFFF", c, 0.08);
  return (
    <div style={{ width: ancho, height: alto, borderRadius: radio, background: fondo, position: "relative", overflow: "hidden",
      boxShadow: [
        `0 0 0 2.5px ${alfa(f, luz)}`,
        `0 0 26px 6px ${alfa(c, 0.95 * luz)}`,
        `0 0 90px 20px ${alfa(mezclaColor(c, "#000000", 0.28), 0.6 * luz)}`,
        `0 0 210px 50px ${alfa(mezclaColor(c, "#000000", 0.5), 0.35 * luz)}`,
      ].join(", "), ...style }}>
      {children}
      <div style={{ position: "absolute", inset: 0, borderRadius: radio, boxShadow: `inset 0 0 24px 3px ${alfa(mezclaColor(c, "#FFFFFF", 0.25), 0.5 * luz)}`, pointerEvents: "none" }} />
    </div>
  );
};

export type TarjetaPila = { t0: number; fondo?: string; contenido?: React.ReactNode };
/**
 * Pila de `TarjetaBrillo` en diagonal: cada tarjeta nueva SUBE 665 px en 0,2 s (expo-out, medido) y se coloca arriba a la
 * derecha y detrás de la anterior (`paso`), con giro leve; la anterior se hunde 24 px al llegar la siguiente. Las de
 * detrás, más apagadas. `camara`: claves {t, s, x, y} (alejamiento ×0,45 en 1,3 s medido). Banda de luz diagonal detrás.
 */
export const PilaTarjetas: React.FC<{ tarjetas: TarjetaPila[]; ancho?: number; alto?: number; paso?: { x: number; y: number; z: number }; centro?: [number, number]; sube?: number; dur?: number;
  rx?: number; ry?: number; perspectiva?: number; color?: string; empujon?: number; camara?: Clave[]; banda?: boolean }> = ({
  tarjetas, ancho = 930, alto = 600, paso = { x: 380, y: -200, z: -160 }, centro = [960, 540], sube = 665, dur = 0.2, rx = 10, ry = 15, perspectiva = 1800, color, empujon = 24, camara, banda = true,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const c = color ?? est.acento;
  const n = tarjetas.length;
  const cam = camara ? pista(camara, t, ["s", "x", "y"] as const, { s: 1, x: 0, y: 0 }) : { s: 1, x: 0, y: 0 };
  const ox = centro[0] - ((n - 1) * paso.x) / 2, oy = centro[1] - ((n - 1) * paso.y) / 2;
  const enciende = n ? tramo(t, tarjetas[0].t0, tarjetas[0].t0 + 2, CURVAS.inOut) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {banda && (
        <AbsoluteFill style={{ opacity: enciende, backgroundImage: `linear-gradient(120deg, transparent 22%, ${mezclaColor("#000000", c, 0.22)} 40%, ${mezclaColor("#000000", c, 0.38)} 52%, ${mezclaColor("#000000", c, 0.15)} 64%, transparent 82%)`,
          backgroundSize: "140% 140%", backgroundPosition: `${50 + t * 1.2}% 50%` }} />
      )}
      <AbsoluteFill style={{ perspective: perspectiva }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transformStyle: "preserve-3d", transformOrigin: "960px 540px",
          transform: `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.s})` }}>
          {tarjetas.map((tj, i) => {
            if (t < tj.t0) return null;
            const k = tramo(t, tj.t0, tj.t0 + dur);
            // la siguiente la empuja hacia abajo y vuelve
            let hunde = 0;
            const sig = tarjetas[i + 1];
            if (sig) hunde = empujon * (tramo(t, sig.t0 + dur * 0.5, sig.t0 + dur * 1.1) - tramo(t, sig.t0 + dur * 1.1, sig.t0 + dur * 2.3, CURVAS.inOut));
            const lejos = Math.min(0.35, i * 0.06); // las nuevas van detrás: más apagadas
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d",
                transform: `translate3d(${ox + i * paso.x}px, ${oy + i * paso.y + sube * (1 - k) + hunde}px, ${i * paso.z}px) rotateX(${rx}deg) rotateY(${ry}deg) translate(-50%, -50%)` }}>
                <TarjetaBrillo ancho={ancho} alto={alto} color={c} fondo={tj.fondo} luz={1 - lejos * 0.8}>
                  {tj.contenido}
                  {lejos > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: lejos }} />}
                </TarjetaBrillo>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═════════ ÓRBITAS (app-tareas E5/R4) ═════════
// Progreso común (giro) y zoom medidos, en s desde la entrada: frenan con la misma curva.
const ORB_T = [0, 0.1, 0.24, 0.37, 0.5, 0.67, 0.84, 1.17, 1.5, 1.84, 2.1];
const ORB_P = [0, 0.16, 0.34, 0.47, 0.56, 0.66, 0.73, 0.84, 0.92, 0.97, 1.0];
const ORB_ZT = [0, 0.1, 0.24, 0.37, 0.5, 0.67, 0.84, 1.17, 1.5];
const ORB_Z = [1.85, 1.69, 1.5, 1.37, 1.29, 1.19, 1.13, 1.046, 1.0];
/** Anillo: radio relativo, grados totales de giro en la entrada (+ = horario) y ángulos iniciales de sus iconos. */
export type AnilloOrbita = { r: number; giro: number; iconos: number[] };
/** Medido: radios 1 : 1,66 : 2,37 y giros 1 : −1,23 : 0,60 (sentidos alternos). */
export const ANILLOS_ORBITA: AnilloOrbita[] = [{ r: 1, giro: 132, iconos: [-104, 105] }, { r: 1.66, giro: -163, iconos: [50, -100] }, { r: 2.37, giro: 79, iconos: [-182, -2] }];

/**
 * Anillos concéntricos de luz con iconos en discos que giran en sentidos alternos y FRENAN juntos mientras la cámara se
 * aleja (entra a ×1,85, llega a ×1 en 1,5 s, desenfocada los primeros 0,17 s). En `sale`, colapso acelerado al centro
 * (×0,40 en 0,47 s) con los iconos apagándose antes. `children` va en el centro (texto).
 */
export const Orbitas: React.FC<{ t0?: number; sale?: number; R?: number; iconos?: React.ReactNode[]; anillos?: AnilloOrbita[]; color?: string; disco?: string; tamIcono?: number; grosor?: number; children?: React.ReactNode }> = ({
  t0 = 0, sale, R = 246, iconos = [], anillos = ANILLOS_ORBITA, color, disco = "#F4F7F7", tamIcono = 84, grosor = 7.5, children,
}) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0) return null;
  const u = t - t0;
  const c = color ?? est.acento;
  const p = pchip(ORB_T, ORB_P, u) + 0.05 * Math.max(0, u - 2.1); // después sigue girando muy despacio
  let z = pchip(ORB_ZT, ORB_Z, u) * (1 - 0.012 * Math.max(0, u - 1.5));
  const col = sale !== undefined ? tramo(t, sale, sale + 0.47, CURVAS.acelera) : 0;
  z *= 1 - 0.6 * col;
  const apaga = sale !== undefined ? 1 - tramo(t, sale + 0.25, sale + 0.4, CURVAS.acelera) : 1;
  const fin = sale !== undefined && t > sale + 0.47 ? 0 : 1;
  if (!fin) return null;
  const desen = (1 - tramo(u, 0, 0.17)) * 10 + col * 6;
  let n = 0;
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, filter: desen > 0.3 ? `blur(${desen}px)` : undefined }}>
      <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible", filter: `drop-shadow(0 0 10px ${c}) drop-shadow(0 0 40px ${alfa(c, 0.6)})` }}>
        {anillos.map((a, i) => <circle key={i} cx={960} cy={540} r={R * a.r} fill="none" stroke={c} strokeWidth={grosor} />)}
      </svg>
      {anillos.flatMap((a, i) => a.iconos.map((a0, j) => {
        const ang = ((a0 + a.giro * p) * Math.PI) / 180, rr = R * a.r * (1 + 0.05 * (j % 2 ? 1 : -1));
        const ic = iconos[n++];
        return (
          <div key={`${i}-${j}`} style={{ position: "absolute", left: 960 + rr * Math.cos(ang) - tamIcono / 2, top: 540 + rr * Math.sin(ang) - tamIcono / 2, width: tamIcono, height: tamIcono,
            borderRadius: "50%", background: disco, opacity: apaga, display: "grid", placeItems: "center", boxShadow: "0 6px 24px rgba(0,0,0,0.35), inset 0 -4px 10px rgba(0,0,0,0.08)" }}>{ic}</div>
        );
      }))}
      <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═════════ SELECCIÓN DE TEXTO (app-tareas E3/R3) ═════════
/**
 * Palabra resaltada como una selección: un cursor aparece en mitad de la palabra (`cursor` = fracción) y la caja crece
 * hacia los DOS lados a la vez (expo-out 0,3 s); el texto de dentro cambia de color recortado por la caja; al llegar
 * salen los tiradores redondos en dos esquinas. Va en línea con el resto del texto (hereda tamaño y fuente).
 */
export const Seleccion: React.FC<{ texto: string; t0: number; cursor?: number; dur?: number; color?: string; tinta?: string; tintaSel?: string; tirador?: string }> = ({
  texto, t0, cursor = 0.51, dur = 0.3, color, tinta, tintaSel, tirador,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const c = color ?? est.acento;
  const tir = tirador ?? mezclaColor(c, "#0000AA", 0.45);
  const borde = mezclaColor(c, "#000000", 0.3);
  const k = tramo(t, t0 + 1 / 30, t0 + 1 / 30 + dur); // 1 fotograma de 30 fps con el cursor solo
  const izq = cursor * (1 - k), der = (1 - cursor) * (1 - k);
  const kt = tramo(t, t0 + dur * 0.8, t0 + dur * 0.8 + 0.1);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ color: tinta ?? est.texto }}>{texto}</span>
      {t >= t0 && (
        <>
          <span style={{ position: "absolute", top: "-0.06em", bottom: "-0.12em", left: `calc(${izq * 100}% - 0.05em)`, right: `calc(${der * 100}% - 0.05em)`,
            background: c, borderLeft: `4px solid ${borde}`, borderRight: `4px solid ${borde}` }} />
          <span style={{ position: "absolute", left: 0, top: 0, color: tintaSel ?? est.fondo, clipPath: `inset(0 ${der * 100}% 0 ${izq * 100}%)` }}>{texto}</span>
          {([["right", "top"], ["left", "bottom"]] as const).map(([hz, vt]) => (
            <span key={hz} style={{ position: "absolute", [hz]: "-0.16em", [vt]: "-0.2em", width: "0.22em", height: "0.22em", borderRadius: "50%", background: tir, transform: `scale(${kt})` }} />
          ))}
        </>
      )}
    </span>
  );
};

// ═════════ TÚNEL DE MÓVILES (app-tareas E6/R5) ═════════
const TUN_T = [0, 0.1, 0.27, 0.43, 0.6, 0.77, 0.93, 1.1, 1.27, 1.43, 1.6, 1.77, 1.83];
const TUN_S = [2.6, 2.38, 1.72, 1.36, 1.18, 1.085, 1.026, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
const TUN_R = [8, 0, -18, -30.8, -39.5, -46, -51, -54.8, -58.8, -65.5, -76.8, -97.8, -110];
/**
 * Cuatro móviles como paredes de un túnel cuadrado (pantallas hacia dentro): entra girando y encogiendo (×2,4 → 1 y −55° en
 * 1 s, expo-out), reposa girando despacio y sale girando cada vez más rápido (hasta 200°/s): el corte va en el pico.
 * `dur` estira o encoge la coreografía medida (1,83 s). El texto (`children`) queda fijo en el centro, sin girar.
 * Escena clara por defecto (en la referencia es la invertida del vídeo).
 */
export const Tunel: React.FC<{ t0?: number; dur?: number; pantallas: React.ReactNode[]; fondo?: string; bisel?: string; children?: React.ReactNode }> = ({
  t0 = 0, dur = 1.83, pantallas, fondo = "radial-gradient(ellipse at 50% 50%, #FBFCFA 40%, #E8E8E9 100%)", bisel = "#1A1A1A", children,
}) => {
  const t = useSeg();
  if (t < t0) return null;
  const u = ((t - t0) * 1.83) / dur;
  const s = pchip(TUN_T, TUN_S, u), rz = pchip(TUN_T, TUN_R, u);
  return (
    <AbsoluteFill style={{ background: fondo, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", left: 960, top: 540, transformStyle: "preserve-3d", transform: `scale(${s}) rotateZ(${rz}deg)` }}>
          {[0, 1, 2, 3].map((k) => (
            // cada móvil es una pared: tumbado a lo largo de la profundidad (del borde del cuadro hacia el fondo) con la
            // pantalla hacia dentro; boca del túnel ≈ 700×540 px (medido)
            <div key={k} style={{ position: "absolute", width: 620, height: 1240, left: -310, top: -620,
              transform: `rotateZ(${k * 90}deg) translateY(${k % 2 ? 640 : 490}px) translateZ(-120px) rotateX(90deg)`, borderRadius: 70, background: bisel, padding: 14, boxSizing: "border-box" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 58, overflow: "hidden", background: "#FFFFFF", position: "relative" }}>{pantallas[k % Math.max(1, pantallas.length)]}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      {/* profundidad de campo: lo más cercano (los bordes) desenfocado; capa 2D encima, sin tocar el 3D */}
      <AbsoluteFill style={{ backdropFilter: "blur(7px)", WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 55%, black 85%)" }} />
      <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═════════ PORTAL DE LUZ (app-tareas E7/R6) ═════════
/** Claves medidas (s desde la entrada): casi frontal y grande → de canto → frontal enorme → se tumba hacia atrás y deriva. */
export const CLAVES_PORTAL: Clave[] = [
  { t: 0, ry: 30, s: 1.4 }, { t: 0.4, ry: 75, s: 1.0 }, { t: 0.74, ry: 0, s: 1.35 }, { t: 0.97, rx: 0, rz: 0 },
  { t: 1.47, rx: 53, rz: -25, s: 1.1 }, { t: 2.04, rx: 58, rz: -30, s: 1.05 },
];
/**
 * Toro de luz muy desenfocado que gira en 3D, con dos zonas brillantes que recorren el aro y arcos de un segundo color.
 * El desenfoque va en el HIJO plano (nunca en el contenedor 3D). `claves` {t, rx, ry, rz, s} relativas a `t0`.
 */
export const Portal: React.FC<{ t0?: number; d?: number; claves?: Clave[]; color?: string; color2?: string; vel?: number; desenfoque?: number }> = ({
  t0 = 0, d = 1300, claves = CLAVES_PORTAL, color, color2 = "#1060E0", vel = 140, desenfoque = 22,
}) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0) return null;
  const u = t - t0;
  const c = color ?? est.acento;
  const os = mezclaColor(c, "#000000", 0.55);
  const e = pista(claves, u, ["rx", "ry", "rz", "s"] as const, { s: 1 });
  const g = u * vel;
  return (
    <AbsoluteFill style={{ perspective: 1400, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 960, top: 540, transformStyle: "preserve-3d", transform: `scale(${e.s}) rotateZ(${e.rz}deg) rotateX(${e.rx}deg) rotateY(${e.ry}deg)` }}>
        <div style={{ position: "absolute", left: -d / 2, top: -d / 2, width: d, height: d, borderRadius: "50%",
          background: `conic-gradient(from ${g}deg, ${c} 0deg, ${os} 70deg, ${color2} 120deg, ${os} 160deg, ${c} 180deg, ${os} 250deg, ${color2} 300deg, ${c} 360deg)`,
          WebkitMaskImage: "radial-gradient(circle, transparent 41%, black 44%, black 48%, transparent 51%)", filter: `blur(${desenfoque}px)` }} />
      </div>
    </AbsoluteFill>
  );
};

// ═════════ HORIZONTE DE PLANETA (app-tareas E9/R8) ═════════
/**
 * Cierre de marca: el borde de un planeta enorme (R ≈ 1850 px) sube desde abajo (expo-out 0,93 s, mitad del camino en
 * 0,2 s) hasta el 77 % del alto, un haz de luz vertical en cono se enciende encima y la marca (`children`) pasa de gris
 * desenfocado a nítido subiendo 50 px. Luego deriva +1 %/s (nunca quieto del todo).
 */
export const Horizonte: React.FC<{ t0?: number; color?: string; aro?: string; tam?: number; fondo?: string; children?: React.ReactNode }> = ({ t0 = 0, color, aro, tam = 180, fondo, children }) => {
  const t = useSeg() - t0;
  const est = useEstilo();
  if (t < 0) return null;
  const c = color ?? est.acento;
  const ar = aro ?? mezclaColor("#FFFFFF", c, 0.1);
  const R = 1850, y = 1074 + (833 - 1074) * tramo(t, 0.07, 1.0);
  const haz = tramo(t, 0.1, 0.87, CURVAS.suave);
  const k = tramo(t, 0.13, 0.9);
  return (
    <AbsoluteFill style={{ background: fondo, overflow: "hidden" }}>
      {/* haz en cono: el desenfoque va en el contenedor y el recorte en el hijo (si no, el recorte deja el borde duro) */}
      <div style={{ position: "absolute", left: 960 - 520, width: 1040, top: 0, height: y + 40, opacity: haz, filter: "blur(38px)" }}>
        <div style={{ position: "absolute", inset: 0, clipPath: "polygon(34% 0, 66% 0, 90% 100%, 10% 100%)",
          background: `linear-gradient(${alfa(c, 0.08)}, ${alfa(mezclaColor(c, "#000000", 0.25), 0.45)} 55%, ${alfa(mezclaColor(c, "#FFFFFF", 0.1), 0.85)})` }} />
      </div>
      {/* planeta: aro claro fino con resplandor fuera y luz pegada al borde por dentro */}
      <div style={{ position: "absolute", left: 960 - R, top: y, width: 2 * R, height: 2 * R, borderRadius: "50%", background: "#000",
        borderTop: `3px solid ${ar}`, boxShadow: `0 -6px 30px ${alfa(mezclaColor(c, "#FFFFFF", 0.3), 0.9)}, 0 -2px 110px ${alfa(c, 0.5)}, inset 0 26px 60px -14px ${alfa(mezclaColor(c, "#000000", 0.2), 0.85)}` }} />
      <AbsoluteFill style={{ display: "grid", placeItems: "center", paddingBottom: 30 }}>
        <span style={{ fontFamily: est.fuente, fontWeight: 700, fontSize: tam, letterSpacing: "-0.02em", whiteSpace: "nowrap",
          transform: `translateY(${(1 - k) * 50}px) scale(${1 + 0.01 * Math.max(0, t - 1)})`, filter: k < 0.98 ? `blur(${(1 - k) * 12}px)` : undefined,
          color: mezclaColor(mezclaColor(est.texto, "#000000", 0.42), est.texto, k) }}>{children}</span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
