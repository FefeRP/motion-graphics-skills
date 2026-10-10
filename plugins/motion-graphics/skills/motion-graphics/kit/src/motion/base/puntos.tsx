// Base común · PUNTOS, SILUETAS Y CINTAS (medidos en un reel de estudio: un punto que se divide, una nube de puntos que
// cambia de forma, una caja de transformación de editor, una cinta de rayas y filas de texto que se curvan en anillos).
// Análisis: referencias/motion-graphics/analisis/a-fondo-agencia-reel.md (§4 curvas, §6 técnicas).
// Reglas: todo por tiempo absoluto (t de `useSeg()`), determinista, sin `filter` en contenedores 3D; los muelles se
// definen por lo que se mide en la referencia (tiempo hasta el pico y sobrepaso), no por rigidez/amortiguación.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pchip, tramo, useSeg } from "./tiempo";
import { anchoTexto } from "./efectos-2";

// ───────── utilidades ─────────
const cl01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const RAD = Math.PI / 180;

/**
 * Muelle medido: 0 → 1 desde dt = 0 con el pico (1 + sobrepaso) a los `pico` s y amortiguado de forma crítica a
 * partir de ahí (oscilador subamortiguado con ζ calculado del sobrepaso). Ej. punto que se divide: pico 0,17 s, 23 %.
 */
export const rebote = (dt: number, pico = 0.17, sobrepaso = 0.12) => {
  if (dt <= 0) return 0;
  if (sobrepaso <= 0.001) return 1 - Math.exp((-dt * 4.6) / pico) * (1 + (dt * 4.6) / pico);
  const L = Math.log(Math.min(0.9, sobrepaso));
  const z = -L / Math.sqrt(Math.PI * Math.PI + L * L);
  const wd = Math.PI / pico, wn = wd / Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * wn * dt) * (Math.cos(wd * dt) + ((z * wn) / wd) * Math.sin(wd * dt));
};

const rgbCache = new Map<string, [number, number, number]>();
/** "#RRGGBB" → [r, g, b]. */
export const hexRgb = (h: string): [number, number, number] => {
  let v = rgbCache.get(h);
  if (!v) { const s = h.replace("#", ""); v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; rgbCache.set(h, v); }
  return v;
};
/** Mezcla numérica de dos colores hex (k = 0 → a, 1 → b); devuelve `rgb()`. Más barata que color-mix para cientos de puntos. */
export const mezclaHex = (a: string, b: string, k: number) => {
  const A = hexRgb(a), B = hexRgb(b), q = cl01(k);
  return `rgb(${Math.round(lerp(A[0], B[0], q))},${Math.round(lerp(A[1], B[1], q))},${Math.round(lerp(A[2], B[2], q))})`;
};
/** Color a lo largo de claves [{t, c}] (cambio seco en cada t, o fundido de `fundido` s). */
const colorEn = (c: string | ((t: number) => string), t: number) => (typeof c === "function" ? c(t) : c);

// ═════════ HUD DE COMPÁS ═════════
/**
 * HUD de reel montado a un BPM: marcas en L en las esquinas, arriba a la izquierda `marca` + `subtitulo`, arriba a la
 * derecha 4 casillas de tiempo (la del tiempo actual, rellena) + `BAR n/N` + `BPM`, abajo a la derecha el contador de
 * fotogramas `F0000` (a `fpsTC`, +1) y el código de tiempo HH:MM:SS:FF. Une todas las secciones.
 * Props: `marca`, `subtitulo`, `bpm` (128), `compases` (8), `color` (texto o función de t: cambia con el fondo),
 * `fpsTC` (60), `desde` (s en que aparece), `ocultarArribaDesde` (s: quedan esquinas y código de tiempo),
 * `fuente`, `tam` (19 px), `margen` (56 px al vértice de las L).
 */
export const HudCompas: React.FC<{ marca: string; subtitulo?: string; bpm?: number; compases?: number; color?: string | ((t: number) => string); fpsTC?: number; desde?: number; ocultarArribaDesde?: number; fuente?: string; tam?: number; margen?: number }> = ({
  marca, subtitulo, bpm = 128, compases = 8, color, fpsTC = 60, desde = 0, ocultarArribaDesde = Infinity, fuente, tam = 19, margen = 56,
}) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < desde) return null;
  const c = colorEn(color ?? est.texto, t);
  const T = 60 / bpm, C = 4 * T;
  const bar = Math.min(compases, Math.floor(t / C + 1e-6) + 1), tiempo = Math.floor((t % C) / T + 1e-6) % 4;
  const f = Math.floor(t * fpsTC + 1e-6);
  const ss = Math.floor(f / fpsTC), ff = f % fpsTC;
  const tc = `00:00:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
  const arriba = t < ocultarArribaDesde;
  const L = 30, g = 2;
  const esq = (s: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, borderColor: c, borderStyle: "solid", borderWidth: 0, ...s }} />;
  const txt: React.CSSProperties = { position: "absolute", fontFamily: fuente ?? est.fuenteTexto, fontSize: tam, lineHeight: 1, letterSpacing: "0.22em", color: c, whiteSpace: "nowrap", display: "flex", alignItems: "center", fontVariantNumeric: "tabular-nums" };
  const yTop = margen + 25 - tam / 2, yBot = 1080 - margen - 43 - tam / 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {esq({ left: margen, top: margen, borderLeftWidth: g, borderTopWidth: g })}{esq({ right: margen, top: margen, borderRightWidth: g, borderTopWidth: g })}
      {esq({ left: margen, bottom: margen, borderLeftWidth: g, borderBottomWidth: g })}{esq({ right: margen, bottom: margen, borderRightWidth: g, borderBottomWidth: g })}
      {arriba && <div style={{ ...txt, left: margen + 30, top: yTop }}><b style={{ fontWeight: 700 }}>{marca}</b>{subtitulo && <span style={{ fontWeight: 500, opacity: 0.55, marginLeft: tam * 0.9 }}>{subtitulo}</span>}</div>}
      {arriba && (
        <div style={{ ...txt, right: 1920 - (1920 - margen - 31), top: yTop }}>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: tam * 0.52, height: tam * 0.52, marginRight: i < 3 ? 5 : tam * 1.1, boxSizing: "border-box", border: `1.5px solid ${c}`, background: i === tiempo ? c : "transparent", opacity: i === tiempo ? 1 : 0.6 }} />)}
          <span style={{ fontWeight: 500, opacity: 0.6 }}>BAR {bar}/{compases}</span>
          <b style={{ fontWeight: 700, marginLeft: tam * 0.9 }}>{bpm} BPM</b>
        </div>
      )}
      <div style={{ ...txt, right: 1920 - (1920 - margen - 31), top: yBot }}>
        {arriba && <span style={{ fontWeight: 500, opacity: 0.5, marginRight: tam * 0.9 }}>F{String(f + 1).padStart(4, "0")}</span>}
        <b style={{ fontWeight: 700 }}>{tc}</b>
      </div>
    </AbsoluteFill>
  );
};

// ═════════ PUNTO QUE SE DIVIDE ═════════
export type PasoDivide = { t: number; n: number; r: number; angulo?: number; pico?: number; sobrepaso?: number };
/**
 * Un punto que nace (pop con sobrepaso), "respira" y en cada tiempo se divide (1 → 2 → 4 → 8…): cada hijo sale de su
 * padre con muelle y estela en la dirección del viaje; al final todos se juntan en el centro y se funden como metabolas.
 * Props: `pasos` [{t, n, r, angulo, pico, sobrepaso}] (el primero es el nacimiento, n 1 r 0), `x`,`y` (centro),
 * `tamPop` (Ø del pop), `tam` (Ø tras respirar), `giro` (°/s desde la 1.ª división), `color`, `guias` [{t, r,
 * punteado}] (círculos finos) + `cruz` (t de la cruz central), `fusion` {t, dur, tam} (se juntan con ease-in y quedan
 * en un círculo de Ø `tam`), `hasta` (s en que desaparece), `colorGuias`.
 */
export const PuntosDivide: React.FC<{ pasos: PasoDivide[]; x?: number; y?: number; tamPop?: number; tam?: number; giro?: number; color?: string; guias?: { t: number; r: number; punteado?: boolean }[]; cruz?: number; colorGuias?: string; fusion?: { t: number; dur: number; tam: number }; hasta?: number }> = ({
  pasos, x = 960, y = 540, tamPop = 51, tam = 33, giro = 20, color, guias = [], cruz, colorGuias = "rgba(255,255,255,0.22)", fusion, hasta = Infinity,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const col = color ?? est.acento;
  const t0 = pasos[0].t;
  const id = "goo" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  if (t < t0 || t >= hasta) return null;
  // ángulo base de cada nivel: los hijos quedan a ambos lados de su padre
  const angs: number[] = [pasos[0].angulo ?? 0];
  for (let k = 1; k < pasos.length; k++) angs.push(pasos[k].angulo ?? angs[k - 1] - 180 / pasos[k].n);
  const tGiro = pasos[1]?.t ?? t0;
  const posNivel = (k: number, i: number, tt: number): [number, number] => {
    const p = pasos[k];
    const a = (angs[k] + (i * 360) / p.n + giro * Math.max(0, tt - tGiro)) * RAD;
    return [p.r * Math.cos(a), p.r * Math.sin(a)];
  };
  const pos = (i: number, tt: number, k: number): [number, number] => {
    if (k === 0) return [0, 0];
    const p = pasos[k];
    const padre = Math.floor((i * pasos[k - 1].n) / p.n);
    const a = posNivel(k - 1, padre, tt), b = posNivel(k, i, tt);
    const m = rebote(tt - p.t, p.pico ?? 0.17, p.sobrepaso ?? 0.15);
    let px = lerp(a[0], b[0], m), py = lerp(a[1], b[1], m);
    if (fusion) { const q = tramo(tt, fusion.t, fusion.t + fusion.dur, CURVAS.acelera); px *= 1 - q; py *= 1 - q; }
    return [px, py];
  };
  let nivel = 0;
  for (let k = 0; k < pasos.length; k++) if (t >= pasos[k].t) nivel = k;
  const n = pasos[nivel].n;
  // tamaño: pop expo con sobrepaso 6 % y respiración (anticipación) hasta `tam`
  const pop = rebote(t - t0, 0.06, 0.06);
  const resp = tramo(t, t0 + 0.1, t0 + 0.3, CURVAS.inOut);
  let d = lerp(tamPop * pop, tam, resp);
  const fq = fusion ? tramo(t, fusion.t, fusion.t + fusion.dur, CURVAS.acelera) : 0;
  if (fusion) d = lerp(d, fusion.tam * 0.55, fq);
  const enFusion = !!fusion && t >= fusion.t - 0.02;
  const fin = !!fusion && t >= fusion.t + fusion.dur;
  const dt = 1 / 60;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      {cruz !== undefined && t >= cruz && !fin && <g stroke={colorGuias} strokeWidth={1.5}><line x1={x - 18} y1={y} x2={x + 18} y2={y} /><line x1={x} y1={y - 18} x2={x} y2={y + 18} /></g>}
      {!fin && guias.filter((g) => t >= g.t).map((g, j) => <circle key={j} cx={x} cy={y} r={g.r * (0.85 + 0.15 * tramo(t, g.t, g.t + 0.2)) * (1 - fq)} fill="none" stroke={colorGuias} strokeWidth={1.5} strokeDasharray={g.punteado ? "3 7" : undefined} opacity={tramo(t, g.t, g.t + 0.15) * (1 - fq)} />)}
      <g filter={enFusion ? `url(#${id})` : undefined}>
        {fin
          ? <circle cx={x} cy={y} r={fusion!.tam / 2} fill={col} />
          : Array.from({ length: n }, (_, i) => {
            const [ax, ay] = pos(i, t, nivel), [bx, by] = pos(i, t - dt, nivel);
            return <line key={i} x1={x + bx} y1={y + by} x2={x + ax + 0.01} y2={y + ay} stroke={col} strokeWidth={d} strokeLinecap="round" />;
          })}
        {enFusion && !fin && <circle cx={x} cy={y} r={(fusion!.tam / 2) * fq} fill={col} />}
      </g>
    </svg>
  );
};

// ═════════ IRIS CON ARO ═════════
/**
 * Iris circular que revela la escena siguiente (`children`) desde un objeto, con un aro fino por fuera. Es un golpe,
 * no una transición: 0,05–0,1 s. Antes de `t0` no pinta nada; después, la escena entera.
 * Props: `t0`, `dur` (0,05), `x`,`y` (centro), `desde` (radio inicial, px), `aro` {color, grosor, separacion} o null,
 * `curva` (del radio; ease-in por defecto).
 */
export const IrisAro: React.FC<{ t0: number; dur?: number; x?: number; y?: number; desde?: number; aro?: { color: string; grosor: number; separacion: number } | null; curva?: (q: number) => number; children: React.ReactNode }> = ({
  t0, dur = 0.05, x = 960, y = 540, desde = 55, aro = { color: "#B5B5B8", grosor: 6, separacion: 68 }, curva = CURVAS.acelera, children,
}) => {
  const t = useSeg();
  if (t < t0) return null;
  const max = Math.hypot(Math.max(x, 1920 - x), Math.max(y, 1080 - y)) + (aro ? aro.separacion + aro.grosor : 0) + 4;
  const k = tramo(t, t0, t0 + dur, curva);
  const r = lerp(desde, max, k);
  if (k >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)` }}>{children}</AbsoluteFill>
      {aro && <div style={{ position: "absolute", left: x - r - aro.separacion, top: y - r - aro.separacion, width: 2 * (r + aro.separacion), height: 2 * (r + aro.separacion), borderRadius: "50%", border: `${aro.grosor}px solid ${aro.color}`, boxSizing: "border-box" }} />}
    </AbsoluteFill>
  );
};

// ═════════ CORCHETES DE ESQUINA ═════════
/**
 * Cuatro corchetes de esquina que se cierran con muelle alrededor de una caja (una palabra, un objeto).
 * Props: `t0`, `x`,`y` (centro), `ancho`,`alto`, `grosor` (4,5), `largo` (52, brazo), `color`, `desde` (escala inicial
 * 1,5), `pico` (0,17 s), `sobrepaso` (0,08).
 */
export const Corchetes: React.FC<{ t0: number; x: number; y: number; ancho: number; alto: number; grosor?: number; largo?: number; color?: string; desde?: number; pico?: number; sobrepaso?: number }> = ({
  t0, x, y, ancho, alto, grosor = 4.5, largo = 52, color, desde = 1.5, pico = 0.17, sobrepaso = 0.08,
}) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0) return null;
  const s = lerp(desde, 1, rebote(t - t0, pico, sobrepaso));
  const o = tramo(t, t0, t0 + 0.06);
  const w = (ancho / 2) * s, h = (alto / 2) * s;
  const c = color ?? est.texto;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: o, overflow: "visible" }}>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => {
        const cx = x + sx * w, cy = y + sy * h;
        return <path key={i} d={`M ${cx - sx * largo} ${cy} L ${cx} ${cy} L ${cx} ${cy - sy * largo}`} fill="none" stroke={c} strokeWidth={grosor} strokeLinecap="butt" strokeLinejoin="miter" />;
      })}
    </svg>
  );
};

// ═════════ SILUETAS POLARES Y MORPH ═════════
export type FormaSilueta = "circulo" | "cuadrado" | "triangulo" | "hexagono" | "flor";
const SIL: Record<FormaSilueta, ((x: number, y: number) => number) | null> = {
  circulo: (x, y) => Math.hypot(x, y) - 1,
  cuadrado: (x, y) => sdPoligono(x, y, 4, 0.72, 45) - 0.28,
  triangulo: (x, y) => sdPoligono(x, y, 3, 0.5, -90) - 0.2,
  hexagono: (x, y) => sdPoligono(x, y, 6, 0.86, 0) - 0.14,
  flor: null,
};
/** Distancia con signo a un polígono regular de `n` lados con apotema `ap` (vértice a `rot`°). */
const sdPoligono = (x: number, y: number, n: number, ap: number, rot: number) => {
  const R = ap / Math.cos(Math.PI / n);
  const v = Array.from({ length: n }, (_, j) => { const a = (rot + (j * 360) / n) * RAD; return [R * Math.cos(a), R * Math.sin(a)]; });
  let dentro = true, dmin = Infinity;
  for (let j = 0; j < n; j++) {
    const [ax, ay] = v[j], [bx, by] = v[(j + 1) % n];
    const ex = bx - ax, ey = by - ay;
    // normal hacia fuera (vértices en sentido horario en pantalla = antihorario matemático)
    const nx = ey, ny = -ex, nl = Math.hypot(nx, ny);
    if (((x - ax) * nx + (y - ay) * ny) / nl > 0) dentro = false;
    const u = cl01(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey));
    dmin = Math.min(dmin, Math.hypot(x - ax - u * ex, y - ay - u * ey));
  }
  return dentro ? -dmin : dmin;
};
const tablas = new Map<FormaSilueta, Float32Array>();
/**
 * Radio de la silueta (unidades: 1 = radio del círculo) en el ángulo θ (rad, 0 = derecha, sentido horario en
 * pantalla). Cuadrado y triángulo redondeados, hexágono, flor de 6 pétalos. Tabla de 720 muestras en caché.
 */
export const radioSilueta = (forma: FormaSilueta, th: number) => {
  let tab = tablas.get(forma);
  if (!tab) {
    tab = new Float32Array(720);
    for (let k = 0; k < 720; k++) {
      const a = (k / 720) * 2 * Math.PI;
      if (forma === "flor") { tab[k] = 0.88 + 0.12 * Math.cos(6 * a); continue; }
      const f = SIL[forma]!;
      let lo = 0, hi = 2.5;
      for (let it = 0; it < 32; it++) { const m = (lo + hi) / 2; if (f(m * Math.cos(a), m * Math.sin(a)) < 0) lo = m; else hi = m; }
      tab[k] = lo;
    }
    tablas.set(forma, tab);
  }
  const u = ((th / (2 * Math.PI)) % 1 + 1) % 1 * 720;
  const i0 = Math.floor(u) % 720, i1 = (i0 + 1) % 720, q = u - Math.floor(u);
  return tab[i0] * (1 - q) + tab[i1] * q;
};
const caminoPolar = (radio: (th: number) => number, x: number, y: number, R: number, rot: number, m = 144) => {
  let d = "";
  for (let k = 0; k < m; k++) {
    const a = (k / m) * 2 * Math.PI;
    const r = radio(a) * R;
    const aa = a + rot * RAD;
    d += `${k ? "L" : "M"}${(x + r * Math.cos(aa)).toFixed(1)} ${(y + r * Math.sin(aa)).toFixed(1)}`;
  }
  return d + "Z";
};

export type ClaveSilueta = { t: number; forma: FormaSilueta; color: string };
/**
 * Silueta que se transforma (morph polar) en cada clave: círculo ↔ cuadrado ↔ triángulo ↔ flor, con el color
 * interpolado (pasa por los tonos intermedios), golpe de escala y una estela de contornos finos del color anterior.
 * Props: `claves` [{t, forma, color}] (la primera es el estado inicial), `x`,`y`, `tam` (Ø del círculo, px; o función
 * de t para el muelle de entrada), `rot` (°, la gira la escena: p. ej. la misma que la caja), `dur` (0,13 s por
 * morph), `golpe` (+0,11 = +11 % de escala), `estela` (nº de contornos, 4), `opacidad`.
 */
export const FormaPolar: React.FC<{ claves: ClaveSilueta[]; x?: number; y?: number; tam: number; rot?: number; dur?: number; golpe?: number; estela?: number; opacidad?: number }> = ({
  claves, x = 960, y = 540, tam, rot = 0, dur = 0.13, golpe = 0.11, estela = 4, opacidad = 1,
}) => {
  const t = useSeg();
  let k = 0;
  for (let j = 1; j < claves.length; j++) if (t >= claves[j].t) k = j;
  const A = claves[Math.max(0, k - 1)], B = claves[k];
  const m = k === 0 ? 1 : tramo(t, B.t, B.t + dur, CURVAS.inOut);
  const radio = (th: number) => lerp(radioSilueta(A.forma, th), radioSilueta(B.forma, th), m);
  const s = 1 + (k === 0 ? 0 : golpe * Math.sin(Math.PI * cl01((t - B.t) / (2.4 * dur))));
  const col = mezclaHex(A.color, B.color, m);
  const R = (tam / 2) * s;
  const vida = k === 0 ? 0 : 1 - cl01((t - B.t) / 0.45);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: opacidad }}>
      {vida > 0 && Array.from({ length: estela }, (_, j) => (
        <path key={j} d={caminoPolar(j % 2 ? (th) => radioSilueta(A.forma, th) : radio, x, y, R * (1.02 + 0.035 * (j + 1)), rot - (j + 1) * 9 * vida)} fill="none" stroke={j % 2 ? A.color : B.color} strokeWidth={1.5} opacity={0.5 * vida * (1 - j / (estela + 1))} />
      ))}
      <path d={caminoPolar(radio, x, y, R, rot)} fill={col} />
    </svg>
  );
};

// ═════════ CAJA DE TRANSFORMACIÓN ═════════
/**
 * Caja de transformación de un editor alrededor de un objeto: rectángulo fino que se dibuja, 8 tiradores cuadrados que
 * saltan, cruz central con circulito y una etiqueta (p. ej. `ROT 101.2°` / `SHAPE SQUARE`) junto al vértice superior
 * derecho, sin girar. La caja gira con `rot` (dáselo con muelle desde la escena).
 * Props: `t0`, `x`,`y`, `lado` (px), `rot` (°), `etiqueta` [línea fuerte, línea suave], `color`, `fondo` (relleno de
 * los tiradores), `dibuja` (0,13 s), `sale` (s en que se va; 0,1 s), `fuente`.
 */
export const CajaTransformacion: React.FC<{ t0: number; x?: number; y?: number; lado: number; rot?: number; etiqueta?: [string, string]; color?: string; fondo?: string; dibuja?: number; sale?: number; fuente?: string }> = ({
  t0, x = 960, y = 540, lado, rot = 0, etiqueta, color = "rgba(255,255,255,0.7)", fondo, dibuja = 0.13, sale = Infinity, fuente,
}) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0 || t > sale + 0.1) return null;
  const fuera = tramo(t, sale, sale + 0.1, CURVAS.acelera);
  const p = tramo(t, t0, t0 + dibuja, CURVAS.expo);
  const h = lado / 2;
  const per = 8 * h;
  const pt = (sx: number, sy: number) => { const a = rot * RAD; return [x + sx * h * Math.cos(a) - sy * h * Math.sin(a), y + sx * h * Math.sin(a) + sy * h * Math.cos(a)]; };
  const esq = [pt(-1, -1), pt(1, -1), pt(1, 1), pt(-1, 1)];
  const tir = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const st = cl01(rebote(t - t0 - dibuja * 0.6, 0.08, 0.15));
  return (
    <AbsoluteFill style={{ opacity: 1 - fuera }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${esq.map((e) => e.join(" ")).join(" L")} Z`} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={`${per * p} ${per}`} />
        {tir.map(([sx, sy], i) => { const [cx, cy] = pt(sx, sy); const s = 15 * st; return <rect key={i} x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={fondo ?? est.fondo} stroke={color} strokeWidth={1.5} transform={`rotate(${rot} ${cx} ${cy})`} />; })}
        <g stroke={color} strokeWidth={1.2} opacity={p}><line x1={x - 12} y1={y} x2={x + 12} y2={y} /><line x1={x} y1={y - 12} x2={x} y2={y + 12} /><circle cx={x} cy={y} r={8} fill="none" /></g>
      </svg>
      {etiqueta && (
        <div style={{ position: "absolute", left: x + h + 30, top: y - h - 40, fontFamily: fuente ?? est.fuenteTexto, fontSize: 20, lineHeight: 1.25, letterSpacing: "0.06em", color: "#FFFFFF", opacity: p, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          <div style={{ fontWeight: 700 }}>{etiqueta[0]}</div>
          <div style={{ fontWeight: 500, opacity: 0.6 }}>{etiqueta[1]}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ═════════ NUBE DE PUNTOS QUE CAMBIA DE FORMA ═════════
export type Vec3 = [number, number, number];
const ORO = Math.PI * (3 - Math.sqrt(5));
/** Rejilla `cols` × `filas` con `paso` px, por filas (índice = fila·cols + columna), centrada en 0. */
export const formaRejilla = (cols = 33, filas = 19, paso = 58): Vec3[] =>
  Array.from({ length: cols * filas }, (_, i) => [((i % cols) - (cols - 1) / 2) * paso, (Math.floor(i / cols) - (filas - 1) / 2) * paso, 0]);
/** Rango de cada punto ordenado del centro hacia fuera (0 = el más cercano al centro). */
export const rangosDesdeCentro = (pts: Vec3[]) => {
  const orden = pts.map((p, i) => [Math.hypot(p[0], p[1], p[2]), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const r = new Array<number>(pts.length);
  orden.forEach(([, i], k) => { r[i] = k; });
  return r;
};
/**
 * Espiral de filotaxis (ángulo de oro) recortada por una silueta: el punto i usa el lugar `rangos[i]` de la espiral
 * (pasa `rangosDesdeCentro(rejilla)` para que el centro de la flor vaya al centro de la rejilla).
 */
export const formaFlor = (n: number, radio: number, silueta: FormaSilueta = "flor", rangos?: number[], rot = 0): Vec3[] =>
  Array.from({ length: n }, (_, i) => {
    const k = rangos ? rangos[i] : i;
    const a = k * ORO, rr = Math.sqrt((k + 0.5) / n) * radio * radioSilueta(silueta, a - rot * RAD);
    return [rr * Math.cos(a), rr * Math.sin(a), 0];
  });
/** Esfera de Fibonacci (el índice baja de polo a polo: una rejilla por filas "se enrolla" en ella). */
export const formaEsfera = (n: number, radio: number): Vec3[] =>
  Array.from({ length: n }, (_, j) => { const y = 1 - (2 * (j + 0.5)) / n, r = Math.sqrt(1 - y * y), a = j * ORO; return [radio * r * Math.cos(a), radio * y, radio * r * Math.sin(a)]; });
/** Toro de eje Y (radio mayor R, menor r); la columna da la vuelta grande y la fila la pequeña. */
export const formaToro = (n: number, cols: number, R: number, r: number): Vec3[] =>
  Array.from({ length: n }, (_, i) => {
    const filas = Math.ceil(n / cols), u = ((i % cols) / cols) * 2 * Math.PI + (Math.floor(i / cols) % 2) * (Math.PI / cols), v = (Math.floor(i / cols) / filas) * 2 * Math.PI;
    return [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)];
  });
/** Puntos repartidos por las 12 aristas de un cubo (aristas "de cuentas"). */
export const formaCubo = (n: number, arista: number): Vec3[] => {
  const h = arista / 2;
  const V: Vec3[] = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return Array.from({ length: n }, (_, i) => {
    const q = (i * 12) / n, e = E[Math.floor(q)], s = q - Math.floor(q);
    const a = V[e[0]], b = V[e[1]];
    return [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)];
  });
};

export type ClaveNube = { t: number; forma: Vec3[]; dur?: number; escalon?: number; orden?: "centro" | "indice" | "azar"; curva?: (x: number) => number };
/** Onda de la trama: el frente está a R = desde + vel·(t − t0), o sigue `claves` [[t, R], …] (PCHIP) si se dan; `aspecto` estira el cuadrado en x (1,78 = rectángulo del cuadro). */
export type OndaTrama = { t: number; tipo: "cuadrado" | "circulo" | "banda" | "diagonal"; vel: number; claves?: [number, number][]; aspecto?: number; ancho?: number; desplaza?: number; desde?: number; dur?: number; relleno?: number; cx?: number; cy?: number };
export type VistaNube = { rx?: number; ry?: number; rz?: number; s?: number; x?: number; y?: number; z?: number };
/**
 * UNA nube de puntos (cientos) que pasa de una forma a otra: cada punto i viaja de su lugar en la forma anterior al de
 * la siguiente con escalonamiento (los del centro primero), estela (segmento desde donde estaba hace `estela` s),
 * proyección 3D con perspectiva propia y alfa por profundidad. Formas: `formaFlor`, `formaRejilla`, `formaEsfera`,
 * `formaToro`, `formaCubo` (o cualquier Vec3[] del mismo largo). Con `ondas` es una trama de medios tonos: el frente
 * agranda, colorea y desplaza los puntos (cuadrado, círculo, banda, diagonal).
 * Props: `claves` [{t, forma, dur (0,3), escalon (0,15), orden, curva}], `vista` (t → {rx, ry, rz (°), s, x, y, z}),
 * `tam` (Ø px o función de t), `color` (o función de t), `colorAcento`+`pctAcento`+`acentoDesde` (algunos puntos de
 * otro color), `ondas`, `tamCresta`, `colorCresta`, `estela` (s, 0,025), `profundidadAlfa` (0–1), `rangoProfundidad`
 * (px, 400), `perspectiva` (1600), `aparece` {t, dur} (los puntos nacen del centro afuera), `desde`/`hasta` (visible).
 */
export const NubePuntos: React.FC<{ claves: ClaveNube[]; vista?: (t: number) => VistaNube; tam?: number | ((t: number) => number); color?: string | ((t: number) => string); colorAcento?: string; pctAcento?: number; acentoDesde?: number; ondas?: OndaTrama[]; tamCresta?: number; colorCresta?: string; estela?: number; profundidadAlfa?: number; rangoProfundidad?: number; perspectiva?: number; aparece?: { t: number; dur: number }; desde?: number; hasta?: number; cx?: number; cy?: number }> = ({
  claves, vista, tam = 9, color, colorAcento, pctAcento = 0, acentoDesde = -Infinity, ondas = [], tamCresta = 24, colorCresta, estela = 0.025, profundidadAlfa = 0, rangoProfundidad = 400, perspectiva = 1600, aparece, desde = -Infinity, hasta = Infinity, cx = 960, cy = 540,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const n = claves[0].forma.length;
  const ordenes = React.useMemo(() => claves.map((c) => {
    const o = c.orden ?? "centro";
    if (o === "indice") return c.forma.map((_, i) => i / n);
    if (o === "azar") return c.forma.map((_, i) => random(`nube-${i}`));
    const mx = Math.max(1, ...c.forma.map((p) => Math.hypot(p[0], p[1], p[2])));
    return c.forma.map((p) => Math.hypot(p[0], p[1], p[2]) / mx);
  }), [claves, n]);
  const aparOrden = React.useMemo(() => rangosDesdeCentro(claves[0].forma).map((r) => r / n), [claves, n]);
  if (t < desde || t >= hasta) return null;

  const base = (i: number, tt: number): Vec3 => {
    let k = 0;
    for (let j = 1; j < claves.length; j++) if (tt >= claves[j].t) k = j;
    if (k === 0) return claves[0].forma[i];
    const c = claves[k], A = claves[k - 1].forma[i], B = c.forma[i];
    const d = c.dur ?? 0.3, e = c.escalon ?? 0.15;
    const q = (c.curva ?? CURVAS.expo)(cl01((tt - c.t - e * ordenes[k][i]) / d));
    return [lerp(A[0], B[0], q), lerp(A[1], B[1], q), lerp(A[2], B[2], q)];
  };
  const onda = (p: Vec3, tt: number) => {
    let a = 0, dx = 0, dy = 0;
    for (const o of ondas) {
      if (tt < o.t) continue;
      const vida = 1 - tramo(tt, o.t + (o.dur ?? 0.5) - 0.12, o.t + (o.dur ?? 0.5));
      if (vida <= 0) continue;
      const x = p[0] - (o.cx ?? 0), y = p[1] - (o.cy ?? 0), w = o.ancho ?? 80;
      const R = o.claves ? pchip(o.claves.map((c) => c[0]), o.claves.map((c) => c[1]), tt) : (o.desde ?? 0) + o.vel * (tt - o.t);
      let d = 0, ux = 0, uy = 0, extra = 0;
      if (o.tipo === "cuadrado") { const as = o.aspecto ?? 1; d = Math.max(Math.abs(x) / as, Math.abs(y)) - R; if (Math.abs(x) / as > Math.abs(y)) ux = Math.sign(x); else uy = Math.sign(y); }
      else if (o.tipo === "circulo") { const r = Math.hypot(x, y) || 1; d = r - R; ux = x / r; uy = y / r; extra = r < R ? (o.relleno ?? 0.35) * (1 - r / Math.max(1, R)) : 0; }
      else if (o.tipo === "banda") { d = x - R; ux = 1; }
      else { d = (x + y) / Math.SQRT2 - R; ux = uy = Math.SQRT1_2; }
      const g = Math.max(Math.exp(-((d / w) ** 2)), extra) * vida;
      a = Math.max(a, g); dx += ux * (o.desplaza ?? 14) * g; dy += uy * (o.desplaza ?? 14) * g;
    }
    return { a, dx, dy };
  };
  const proyecta = (p: Vec3, tt: number) => {
    const v = vista ? vista(tt) : {};
    const s = v.s ?? 1;
    let [x, y, z] = [p[0] * s, p[1] * s, p[2] * s];
    const ry = (v.ry ?? 0) * RAD, rx = (v.rx ?? 0) * RAD, rz = (v.rz ?? 0) * RAD;
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    z += v.z ?? 0;
    const f = perspectiva / Math.max(1, perspectiva - z);
    return { X: cx + (v.x ?? 0) + x * f, Y: cy + (v.y ?? 0) + y * f, Z: z, f, ok: z < perspectiva - 40 };
  };
  const dtE = Math.max(1 / 240, estela);
  const tamT = typeof tam === "function" ? tam(t) : tam;
  const colT = colorEn(color ?? est.texto, t);
  const crest = colorCresta ?? est.acento;
  const pts: { X: number; Y: number; X0: number; Y0: number; Z: number; d: number; c: string; o: number }[] = [];
  for (let i = 0; i < n; i++) {
    let sAp = 1;
    if (aparece) { sAp = cl01(rebote(t - aparece.t - aparece.dur * aparOrden[i], 0.06, 0.1)); if (sAp <= 0) continue; }
    const b = base(i, t), b0 = base(i, t - dtE);
    const w = onda(b, t), w0 = onda(b0, t - dtE);
    const P = proyecta([b[0] + w.dx, b[1] + w.dy, b[2]], t), P0 = proyecta([b0[0] + w0.dx, b0[1] + w0.dy, b0[2]], t - dtE);
    if (!P.ok) continue;
    const acento = colorAcento && t >= acentoDesde && random(`acento-${i}`) < pctAcento;
    const c0 = acento ? colorAcento! : colT;
    const c = w.a > 0.02 ? mezclaHex(c0.startsWith("#") ? c0 : "#000000", crest, Math.pow(w.a, 0.7)) : c0;
    // alfa por profundidad: lo que está en el plano o delante, pleno; lo de atrás se apaga hasta 1 − profundidadAlfa
    const o = profundidadAlfa ? Math.max(0.12, 1 - (profundidadAlfa * Math.max(0, -P.Z)) / rangoProfundidad) : 1;
    pts.push({ X: P.X, Y: P.Y, X0: P0.ok ? P0.X : P.X, Y0: P0.ok ? P0.Y : P.Y, Z: P.Z, d: lerp(tamT, tamCresta, w.a) * P.f * sAp, c, o });
  }
  pts.sort((a, b) => a.Z - b.Z);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {pts.map((p, i) => <line key={i} x1={p.X0} y1={p.Y0} x2={p.X + 0.01} y2={p.Y} stroke={p.c} strokeOpacity={p.o} strokeWidth={p.d} strokeLinecap="round" />)}
    </svg>
  );
};

/**
 * Trama de medios tonos (rejilla de puntos) con ondas que la recorren y, si se pide, se inclina en 3D como un suelo.
 * Es `NubePuntos` con una sola forma (rejilla). Props: `cols` (33), `filas` (19), `paso` (58), `tamMin` (9),
 * `tamMax` (24), `colorBase`, `colorCresta`, `ondas`, `inclinar` {t, rotX, dur}, `desde`, `hasta`.
 */
export const TramaOnda: React.FC<{ cols?: number; filas?: number; paso?: number; tamMin?: number; tamMax?: number; colorBase?: string; colorCresta?: string; ondas: OndaTrama[]; inclinar?: { t: number; rotX: number; dur: number }; desde?: number; hasta?: number }> = ({
  cols = 33, filas = 19, paso = 58, tamMin = 9, tamMax = 24, colorBase, colorCresta, ondas, inclinar, desde, hasta,
}) => {
  const forma = React.useMemo(() => formaRejilla(cols, filas, paso), [cols, filas, paso]);
  const claves = React.useMemo(() => [{ t: 0, forma }], [forma]);
  return <NubePuntos claves={claves} tam={tamMin} tamCresta={tamMax} color={colorBase} colorCresta={colorCresta} ondas={ondas} desde={desde} hasta={hasta}
    vista={inclinar ? (tt) => ({ rx: inclinar.rotX * tramo(tt, inclinar.t, inclinar.t + inclinar.dur, CURVAS.acelera) }) : undefined} />;
};

// ═════════ CINTA DE RAYAS ═════════
type Camino = { largo: number; punto: (s: number) => [number, number] };
const caminos = new Map<string, Camino>();
/** Mide un path SVG (con un <path> del propio navegador; el render de Remotion es Chrome). */
const midePath = (d: string): Camino => {
  let c = caminos.get(d);
  if (!c) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", d);
    const L = el.getTotalLength();
    const N = 1200, tab: [number, number][] = [];
    for (let k = 0; k <= N; k++) { const p = el.getPointAtLength((k / N) * L); tab.push([p.x, p.y]); }
    c = { largo: L, punto: (s) => { const u = cl01(s / L) * N, i = Math.min(N - 1, Math.floor(u)), q = u - i; return [lerp(tab[i][0], tab[i + 1][0], q), lerp(tab[i][1], tab[i + 1][1], q)]; } };
    caminos.set(d, c);
  }
  return c;
};
/** Largo (px) de un path SVG: para calcular la cabeza de `CintaRayas`. */
export const largoCamino = (d: string) => midePath(d).largo;
/**
 * Cinta de rayas paralelas (trazos concéntricos apilados: de fuera a dentro) que avanza por un camino como una
 * serpiente de largo fijo, con extremos redondos; si el camino se cruza consigo mismo, el tramo posterior a `corte`
 * pasa por encima. Opcional: rayitas de impacto en el cruce.
 * Props: `camino` (path SVG en px de 1920×1080), `rayas` (colores de fuera a dentro; la última es la central),
 * `ancho` (87), `largo` (px visibles), `cabeza` (t → px recorridos por la cabeza), `corte` (px), `sombra`,
 * `impacto` {t, x, y, n (6), largo (24), color, dur (0,2)}, `desde`/`hasta`.
 */
export const CintaRayas: React.FC<{ camino: string; rayas: string[]; ancho?: number; largo: number; cabeza: (t: number) => number; corte?: number; sombra?: string; impacto?: { t: number; x: number; y: number; n?: number; largo?: number; color?: string; dur?: number }; desde?: number; hasta?: number }> = ({
  camino, rayas, ancho = 87, largo, cabeza, corte, sombra = "rgba(90,50,10,0.22)", impacto, desde = -Infinity, hasta = Infinity,
}) => {
  const t = useSeg();
  if (t < desde || t >= hasta) return null;
  const C = midePath(camino);
  const h = cabeza(t);
  const a = Math.max(0, h - largo), b = Math.min(C.largo, h);
  const banda = ancho / (2 * rayas.length - 1);
  const anchos = rayas.map((_, j) => ancho - 2 * j * banda);
  const piezas: [number, number][] = corte !== undefined && a < corte && b > corte ? [[a, corte], [corte, b]] : [[a, b]];
  const tapa = (s: number, k: string) => { const [x, y] = C.punto(s); return <g key={k}>{anchos.map((w, j) => <circle key={j} cx={x} cy={y} r={w / 2} fill={rayas[j]} />)}</g>; };
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {b > a && (
        <path d={camino} fill="none" stroke={sombra} strokeWidth={ancho + 5} strokeLinecap="round" strokeDasharray={`${b - a} ${C.largo * 3}`} strokeDashoffset={-a} />
      )}
      {b > a && piezas.map(([p, q], k) => (
        <g key={k}>
          {p === a && tapa(a, "ta")}
          {q === b && tapa(b, "tb")}
          {anchos.map((w, j) => <path key={j} d={camino} fill="none" stroke={rayas[j]} strokeWidth={w} strokeLinecap="butt" strokeDasharray={`${q - p + (k < piezas.length - 1 ? 0.6 : 0)} ${C.largo * 3}`} strokeDashoffset={-p} />)}
        </g>
      ))}
      {impacto && t >= impacto.t && t < impacto.t + (impacto.dur ?? 0.2) && (() => {
        const q = cl01((t - impacto.t) / (impacto.dur ?? 0.2)), nn = impacto.n ?? 6, L = impacto.largo ?? 24;
        return Array.from({ length: nn }, (_, j) => {
          const ang = (j / nn) * 2 * Math.PI + 0.3, r0 = ancho * 0.62 + q * 40;
          return <line key={j} x1={impacto.x + r0 * Math.cos(ang)} y1={impacto.y + r0 * Math.sin(ang)} x2={impacto.x + (r0 + L * (1 - q)) * Math.cos(ang)} y2={impacto.y + (r0 + L * (1 - q)) * Math.sin(ang)} stroke={impacto.color ?? "#110E14"} strokeWidth={4} strokeLinecap="round" />;
        });
      })()}
    </svg>
  );
};

// ═════════ FILAS DE TEXTO → ANILLOS ═════════
export type FilaAnillo = { texto: string; tam: number; relleno?: boolean; color?: string; peso?: number; tracking?: number };
/**
 * Filas de marquesina (sentidos alternos) que entran de golpe con estela horizontal, se curvan hasta cerrarse en
 * anillos concéntricos alrededor de un punto (deformación polar: la curvatura crece de 0 a 1/R, así empiezan por el
 * centro de cada fila), giran (los de dentro más rápido) y al final aceleran hasta ser anillos de ruido (estela de
 * rotación) y se encogen hacia el centro. El texto de cada fila se repite hasta llenar su anillo exacto.
 * Props: `filas` [{texto ("•" = viñeta de color), tam, relleno (false = contorno), color, peso, tracking (em)}],
 * `radios`, `filasY` (y de cada fila), `vel` (px/s de cada fila; + = derecha = horario), `fases` (px de desfase de
 * cada fila: qué palabra queda arriba), `centro` [x, y], `tEntra` (0,15 s de entrada desde ±2000 px; cada fila
 * `escalonEntra` s después de la anterior), `tCurva` + `durCurva`, `tAcelera` + `durAcelera` + `factor` (×10), `tColapso` +
 * `durColapso`, `colorVineta`, `tamVineta`, `fuente`, `punto` {t, tam, color} (punto central que nace con muelle).
 */
export const TextoAnillos: React.FC<{ filas: FilaAnillo[]; radios: number[]; filasY: number[]; vel: number[]; fases?: number[]; escalonEntra?: number; centro?: [number, number]; tEntra: number; tCurva: number; durCurva?: number; tAcelera: number; durAcelera?: number; factor?: number; tColapso: number; durColapso?: number; colorVineta?: string; tamVineta?: number; fuente?: string; punto?: { t: number; tam: number; color?: string }; hasta?: number }> = ({
  filas, radios, filasY, vel, fases, escalonEntra = 0.05, centro = [960, 540], tEntra, tCurva, durCurva = 0.36, tAcelera, durAcelera = 0.25, factor = 10, tColapso, durColapso = 0.2, colorVineta, tamVineta = 15, fuente, punto, hasta = Infinity,
}) => {
  const t = useSeg();
  const est = useEstilo();
  const fam = fuente ?? est.fuente;
  // disposición de cada fila: letras y su posición u (px) dentro de un periodo = circunferencia del anillo
  const lay = filas.map((f, j) => {
    const peso = f.peso ?? 800, tr = f.tracking ?? 0.1;
    const chars = Array.from(f.texto);
    const w = chars.map((ch) => (ch === "•" ? tamVineta * 2.2 : anchoTexto(ch, fam, peso, f.tam, tr)));
    const unidad = w.reduce((s, x) => s + x, 0);
    const C = 2 * Math.PI * radios[j];
    const reps = Math.max(1, Math.round(C / unidad));
    const extra = (C - reps * unidad) / (reps * chars.length);
    const u: number[] = [], cs: string[] = [];
    let acc = 0;
    for (let r = 0; r < reps; r++) chars.forEach((ch, k) => { const ww = w[k] + extra; u.push(acc + ww / 2); cs.push(ch); acc += ww; });
    return { C, u, cs, peso };
  });
  if (t < tEntra || t >= hasta) return null;
  const [X0, Y0] = centro;
  // desplazamiento de cada fila en px (continuo entre fila y anillo: v = ω·R)
  const fase = (j: number, tt: number) => {
    const te = tEntra + j * escalonEntra;
    const ent = (1 - tramo(tt, te, te + 0.15, CURVAS.expo)) * 2000 * (j % 2 ? 1 : -1) + (fases?.[j] ?? 0);
    const ac = tramo(tt, tAcelera, tAcelera + durAcelera, CURVAS.acelera);
    const extraT = ac * durAcelera * (factor - 1) * 0.5; // integral aproximada del acelerón (ease-in)
    return vel[j] * (tt - tEntra + extraT) + ent;
  };
  const kCurva = tramo(t, tCurva, tCurva + durCurva, CURVAS.inOut);
  const col = tramo(t, tColapso, tColapso + durColapso, CURVAS.acelera);
  const vineta = colorVineta ?? est.acento;
  const dtG = 1 / 60;
  const ent = 1 - tramo(t, tEntra, tEntra + 0.2 + (filas.length - 1) * escalonEntra);
  const acel = tramo(t, tAcelera, tAcelera + durAcelera, CURVAS.acelera);
  const fantasmas = ent > 0.05 ? 6 : acel > 0.05 ? Math.round(6 + 6 * acel) : 0;
  const nodos: React.ReactNode[] = [];
  filas.forEach((f, j) => {
    const L = lay[j], R = radios[j] * (1 - 0.8 * col);
    const yTop = lerp(filasY[j], Y0 - R, kCurva);
    const rho = kCurva > 0.001 ? R / kCurva : Infinity;
    const copias = (g: number) => {
      const tt = t - g * dtG * (ent > 0.05 ? 0.6 : 1.2 + 1.8 * acel);
      const ph = fase(j, tt);
      for (const [k, u0] of L.u.entries()) {
        for (let m = -2; m <= 2; m++) {
          const u = ((((u0 + ph + L.C / 2) % L.C) + L.C) % L.C) - L.C / 2 + m * L.C;
          const primario = m === 0;
          const op = primario ? 1 : 1 - kCurva;
          if (op <= 0.01 || Math.abs(u) > 1150) continue;
          let x: number, y: number, rot: number;
          if (rho === Infinity) { x = X0 + u; y = yTop; rot = 0; }
          else { const a = u / rho; x = X0 + rho * Math.sin(a); y = yTop + rho * (1 - Math.cos(a)); rot = a / RAD; }
          const ch = L.cs[k];
          const alfa = (g ? 0.45 / Math.sqrt(g + 1) : 1) * op * (1 - tramo(t, tColapso + durColapso * 0.6, tColapso + durColapso));
          const base: React.CSSProperties = { position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg)`, opacity: alfa, whiteSpace: "pre" };
          nodos.push(ch === "•"
            ? <div key={`${j}-${g}-${k}-${m}`} style={{ ...base, width: tamVineta, height: tamVineta, borderRadius: "50%", background: vineta }} />
            : <div key={`${j}-${g}-${k}-${m}`} style={{ ...base, fontFamily: fam, fontWeight: L.peso, fontSize: f.tam, lineHeight: 1, color: f.relleno === false ? "transparent" : f.color ?? est.texto, WebkitTextStroke: f.relleno === false ? `1.6px ${f.color ?? est.texto}` : undefined }}>{ch}</div>);
        }
      }
    };
    copias(0);
    for (let g = 1; g <= fantasmas; g++) copias(g);
  });
  const pt = punto && t >= punto.t ? punto.tam * rebote(t - punto.t, 0.17, 0.12) : 0;
  return (
    <AbsoluteFill>
      {nodos}
      {pt > 0 && <div style={{ position: "absolute", left: X0 - pt / 2, top: Y0 - pt / 2, width: pt, height: pt, borderRadius: "50%", background: punto!.color ?? est.acento }} />}
    </AbsoluteFill>
  );
};

// ═════════ PUNTO QUE SALTA ═════════
/**
 * Gota que se aplasta, salta en parábola (gravedad constante) encogiendo y aterriza con un aplastamiento de un
 * fotograma: p. ej. el punto final de un logotipo. Antes de `t0` está quieta en `desde`; después de `t1`, en `hasta`.
 * Props: `t0`, `t1`, `desde` [x, y], `hasta` [x, y], `altura` (px sobre el punto de salida), `tamIni`, `tamFin` (Ø),
 * `aplasta` (0,6 = alto/ancho en los golpes), `color`, `visibleDesde`.
 */
export const PuntoSalta: React.FC<{ t0: number; t1: number; desde: [number, number]; hasta: [number, number]; altura: number; tamIni: number; tamFin: number; aplasta?: number; color?: string; visibleDesde?: number }> = ({
  t0, t1, desde, hasta, altura, tamIni, tamFin, aplasta = 0.6, color, visibleDesde = -Infinity,
}) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < visibleDesde) return null;
  const T = t1 - t0;
  let x: number, y: number, d: number, sx = 1, sy = 1;
  if (t < t0) {
    x = desde[0]; y = desde[1]; d = tamIni;
    const q = cl01((t - (t0 - 0.05)) / 0.05);
    sx = 1 + (1 / aplasta - 1) * 0.5 * q; sy = 1 - (1 - aplasta) * q;
  } else if (t < t1) {
    const u = (t - t0) / T;
    // parábola por (0, y0), (1, y1) con vértice `altura` sobre y0
    const y0 = desde[1], y1 = hasta[1], H = altura;
    // y(u) = y0 + b u + c u²; vértice: y0 - b²/(4c) = y0 - H; y(1) = y0 + b + c = y1
    const dy = y1 - y0;
    const sq = Math.sqrt(H * (H + dy));
    const b = -2 * (H + sq), c = dy - b;
    x = lerp(desde[0], hasta[0], u); y = y0 + b * u + c * u * u; d = lerp(tamIni, tamFin, Math.min(1, u * 1.4));
    const vy = (b + 2 * c * u) / T, vx = (hasta[0] - desde[0]) / T;
    const v = Math.hypot(vx, vy);
    sx = 1 + Math.min(0.35, v / 6000); sy = 1 / sx;
    const ang = Math.atan2(vy, vx) / RAD;
    const c2 = color ?? est.acento;
    return <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%", background: c2, transform: `rotate(${ang}deg) scale(${sx}, ${sy})` }} />;
  } else {
    x = hasta[0]; y = hasta[1]; d = tamFin;
    const q = 1 - cl01((t - t1 - 1 / 30) / 0.06);
    sx = 1 + (1 / aplasta - 1) * q; sy = 1 - (1 - aplasta) * q;
    y += (d / 2) * (1 - sy);
  }
  return <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%", background: color ?? est.acento, transform: `scale(${sx}, ${sy})` }} />;
};
