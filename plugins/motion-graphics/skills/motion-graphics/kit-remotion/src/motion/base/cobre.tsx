// Base común · efectos «cobre» (keynote cálida con serif: TODO NACE CON LUZ Y SE ENFRÍA). Medidos fotograma a
// fotograma en referencias/motion-graphics/analisis/a-fondo-serif-calido.md (§3 y §10).
//  · intro de marca: Meteoro → MarcaEstalla (Asterisco) → MarcaBrota
//  · chispas: ArcoChispa + TextoDeChispas (+ Resplandor, bloom que sube y se corta en 2 fotogramas)
//  · interfaz: CajaCristal (luz interior refractada + luz bajo la caja), EcoZoom (salto de zoom con doble exposición)
//  · clímax de «enviar»: BotonPulsa + CursorMano + OndaChoque
//  · texto: CodigoCae (+ Salida3D), GlifoCambia, TextoBrasa
// Reglas: 60 fps, colores del estilo (`useEstilo()`) con props para sobrescribir, nada de `filter` en contenedores
// `preserve-3d`, curvas extremas y cortas (expo-out, ease-in, expo in-out duro), sin vaivenes.
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pchip, tramo, useSeg } from "./tiempo";
import { anchoTexto } from "./efectos-2";

// ───────── utilidades ─────────
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hexRgb = (h: string) => {
  const s = h.replace("#", "");
  const n = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};
/** Mezcla dos colores hex (k = 0 → a, 1 → b) y devuelve `rgb()`. Vale para SVG y para sombras. */
export const lerpColor = (a: string, b: string, k: number) => {
  const A = hexRgb(a), B = hexRgb(b), q = c01(k);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * q)).join(",")})`;
};
/** Color hex con transparencia `a` (0–1) como `rgba()`. */
export const hexAlfa = (h: string, a: number) => `rgba(${hexRgb(h).join(",")},${c01(a).toFixed(3)})`;
/** Curvas medidas en la referencia: expo in-out muy duro (56 % del camino en 2 fotogramas a 30 fps). */
export const EXPO_INOUT = Easing.bezier(0.85, 0, 0.15, 1);
/** Valor por claves lineales [t, v] (para pulsos de luz: sube, se mantiene, se corta). */
export const curvaLuz = (t: number, ts: number[], vs: number[]) => interpolate(t, ts, vs, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const useIdSvg = (p: string) => p + React.useId().replace(/[^a-zA-Z0-9]/g, "");
/** Filtro SVG de desenfoque direccional (bx horizontal, by vertical) listo para `filter: url(#id)`. */
const FiltroEstela: React.FC<{ id: string; bx: number; by: number }> = ({ id, bx, by }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={`${bx.toFixed(1)} ${by.toFixed(1)}`} /></filter>
  </svg>
);

// ═════════ ASTERISCO (logo genérico de brazos romos irregulares) ═════════
/** Brazo: [ángulo en grados (0 = derecha, horario), largo (R = 1), grosor (fracción de R)]. */
export type Brazo = [number, number, number];
/** 12 brazos con separaciones desiguales (19–36°), largos y grosores propios: carácter "dibujado a mano". */
export const BRAZOS_COBRE: Brazo[] = [
  [8, 0.95, 0.14], [37, 0.97, 0.11], [61, 0.92, 0.16], [88, 1, 0.11], [116, 0.95, 0.13], [147, 0.97, 0.15],
  [171, 0.93, 0.11], [203, 0.99, 0.19], [236, 0.96, 0.17], [268, 0.9, 0.14], [301, 0.94, 0.22], [333, 0.92, 0.13],
];
/** Brazos al azar (deterministas por `semilla`): n brazos repartidos con ±12° de desorden. */
export const brazosAzar = (semilla = "brazos", n = 12): Brazo[] =>
  Array.from({ length: n }, (_, i) => [(i * 360) / n + (random(`${semilla}a${i}`) - 0.5) * 24, 0.86 + 0.14 * random(`${semilla}l${i}`), 0.1 + 0.13 * random(`${semilla}g${i}`)] as Brazo);

/**
 * Asterisco SVG: cubo central macizo + brazos de grosor constante con extremos redondos, color plano.
 * Props: `tam` (px del cuadrado), `color` (acento del estilo), `brazos` (BRAZOS_COBRE o brazosAzar()), `cubo` (radio del
 * centro, 0,28), `giro` (grados).
 */
export const Asterisco: React.FC<{ tam: number; color?: string; brazos?: Brazo[]; cubo?: number; giro?: number; style?: React.CSSProperties }> = ({ tam, color, brazos = BRAZOS_COBRE, cubo = 0.28, giro = 0, style }) => {
  const est = useEstilo();
  const c = color ?? est.acento;
  return (
    <svg width={tam} height={tam} viewBox="-1 -1 2 2" style={{ overflow: "visible", display: "block", ...style }}>
      <g transform={`rotate(${giro})`}>
        <circle r={cubo} style={{ fill: c }} />
        {brazos.map(([a, l, g], i) => {
          const r = (a * Math.PI) / 180, L = l - g / 2;
          return <line key={i} x1={0} y1={0} x2={L * Math.cos(r)} y2={L * Math.sin(r)} strokeWidth={g} strokeLinecap="round" style={{ stroke: c }} />;
        })}
      </g>
    </svg>
  );
};

// ═════════ METEORO (E1) ═════════
/**
 * Aguja de luz con forma de huso que cruza el cuadro y SE METE en un punto (puente hacia un estallido).
 * Props: `t0`, `dur` (0,17 s), `desde`/`hasta` [x, y], `largo` (px máx.), `grosor`, `nucleo` (#FDF994), `color` (halo
 * cercano #E16726), `lejano` (#72331A), `recorrido`/`longitud`/`luz` (perfiles 0–1 en 6 pasos iguales del tiempo; por
 * defecto los medidos: rápido, frena al final y se acorta a nada), `resplandor` (0–1: luz ancha que ilumina el cuadro).
 */
export const Meteoro: React.FC<{ t0: number; dur?: number; desde: [number, number]; hasta: [number, number]; largo?: number; grosor?: number; nucleo?: string; color?: string; lejano?: string;
  recorrido?: number[]; longitud?: number[]; luz?: number[]; resplandor?: number }> = ({ t0, dur = 0.17, desde, hasta, largo = 600, grosor = 14, nucleo = "#FDF994", color = "#E16726", lejano = "#72331A",
  recorrido = [0, 0.29, 0.5, 0.78, 0.89, 1], longitud = [0.2, 0.8, 1, 0.4, 0.09, 0], luz = [0.8, 1, 1, 0.95, 0.55, 0], resplandor = 1 }) => {
  const t = useSeg();
  const id = useIdSvg("met");
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return null;
  const ts = recorrido.map((_, i) => i / (recorrido.length - 1));
  const p = pchip(ts, recorrido, u), L = largo * Math.max(0, pchip(ts, longitud, u)), b = Math.max(0, pchip(ts, luz, u));
  if (L < 1 || b < 0.01) return null;
  const dx = hasta[0] - desde[0], dy = hasta[1] - desde[1], D = Math.hypot(dx, dy), ux = dx / D, uy = dy / D, nx = -uy, ny = ux;
  // la cabeza nunca pasa del punto de llegada: la aguja "entra" en él
  const hx = Math.min(1, (p * D + L / 2) / D) * D, head = [desde[0] + ux * hx, desde[1] + uy * hx], tail = [head[0] - ux * L, head[1] - uy * L];
  const mx = (head[0] + tail[0]) / 2, my = (head[1] + tail[1]) / 2;
  const huso = (w: number) => `M${tail[0]},${tail[1]} Q${mx + nx * w},${my + ny * w} ${head[0]},${head[1]} Q${mx - nx * w},${my - ny * w} ${tail[0]},${tail[1]}Z`;
  return (
    <>
    {resplandor > 0 && <AbsoluteFill style={{ opacity: b, background: `radial-gradient(circle ${(largo * 1.15).toFixed(0)}px at ${(mx + head[0]) / 2}px ${(my + head[1]) / 2}px, ${hexAlfa(color, 0.42 * resplandor)} 0%, ${hexAlfa(lejano, 0.38 * resplandor)} 30%, ${hexAlfa(lejano, 0.12 * resplandor)} 65%, transparent 100%)` }} />}
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: b }}>
      <defs>
        <filter id={`${id}a`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={grosor * 3} /></filter>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={grosor * 0.8} /></filter>
        <filter id={`${id}c`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={grosor * 0.12} /></filter>
      </defs>
      <path d={huso(grosor * 7)} fill={lejano} opacity={0.55} filter={`url(#${id}a)`} />
      <path d={huso(grosor * 2.4)} fill={color} opacity={0.95} filter={`url(#${id}b)`} />
      <path d={huso(grosor * 0.9)} fill={nucleo} filter={`url(#${id}c)`} />
    </svg>
    </>
  );
};

// ═════════ MARCA QUE ESTALLA (E2) ═════════
/**
 * El logo nace de un punto: escala 0 → `pico` en `sube` s (expo-out) y vuelve a 1 en `asienta` s sin rebote, SOBREEXPUESTO
 * (color `caliente` + halo ancho de luz) hasta el pico; la luz cae en 2 fotogramas y queda el color final.
 * Props: `t0`, `x`, `y` (centro), `tam`, `pico` (1,2), `sube` (0,2), `asienta` (0,3), `color` (acento), `caliente`
 * (#F6B38A), `halo` (fuerza 0–1), `hasta` (deja de pintarse; p. ej. cuando otro componente recoge el logo), `brazos`.
 */
export const MarcaEstalla: React.FC<{ t0: number; x: number; y: number; tam: number; pico?: number; sube?: number; asienta?: number; color?: string; caliente?: string; halo?: number; hasta?: number; brazos?: Brazo[] }> = ({
  t0, x, y, tam, pico = 1.2, sube = 0.2, asienta = 0.3, color, caliente = "#F6B38A", halo = 1, hasta, brazos }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0 || (hasta !== undefined && t >= hasta)) return null;
  const s = t < t0 + sube ? pico * tramo(t, t0, t0 + sube) : pico + (1 - pico) * tramo(t, t0 + sube, t0 + sube + asienta, Easing.bezier(0.4, 0, 0.2, 1));
  const frio = tramo(t, t0 + sube * 0.8, t0 + sube * 1.15, CURVAS.lineal);
  const luz = 1 - frio;
  const R = tam * 4.5;
  return (
    <>
      {halo > 0 && luz > 0.01 && (
        <AbsoluteFill style={{ background: `radial-gradient(circle ${R}px at ${x}px ${y}px, ${hexAlfa(caliente, 0.45 * halo * luz)} 0%, ${hexAlfa("#9E4921", 0.32 * halo * luz)} 15%, ${hexAlfa("#72331A", 0.22 * halo * luz)} 50%, transparent 100%)` }} />
      )}
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${Math.max(0.001, s)})` }}>
        <Asterisco tam={tam} brazos={brazos} color={lerpColor(caliente, color ?? est.acento, frio)}
          style={{ filter: luz > 0.02 ? `drop-shadow(0 0 ${(tam * 0.12 * luz).toFixed(1)}px ${caliente}) brightness(${1 + 0.15 * luz})` : undefined }} />
      </div>
    </>
  );
};

// ═════════ MARCA QUE BROTA (E3) + DISOLUCIÓN EN TRAZOS (E4) ═════════
/**
 * Lockup que se forma: el logo viaja de `desdeX` a su sitio con un expo in-out muy duro mientras la palabra se
 * DESPLIEGA hacia la izquierda desde una letra que crece en un punto a la derecha (estela horizontal en el salto); la
 * última letra entra pequeña y crece en su sitio; brillo blanco que se apaga. Con `sale`, la marca se carga de luz
 * (baja y crece ×1,1), se estira en trazos verticales naranjas y desaparece (puente hacia `ArcoChispa`).
 * Props: `t0`, `dur` (0,73 s), `x` (centro final del logo), `y`, `desdeX`, `logo` (nodo), `logoTam`, `texto`, `tam` (px
 * de la letra), `hueco`, `fuente`, `peso`, `color`, `curva` (u 0–1 → progreso), `sale` (t), `colorChispa`.
 */
export const MarcaBrota: React.FC<{ t0: number; dur?: number; x: number; y: number; desdeX: number; logo: React.ReactNode; logoTam: number; texto: string; tam: number; hueco?: number;
  fuente?: string; peso?: number; color?: string; curva?: (u: number) => number; sale?: number; colorChispa?: string; hasta?: number }> = ({
  t0, dur = 0.73, x, y, desdeX, logo, logoTam, texto, tam, hueco = 30, fuente, peso, color = "#E1DBE0", curva = EXPO_INOUT, sale, colorChispa = "#E16726", hasta }) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const est = useEstilo();
  const id = useIdSvg("brota");
  if (t < t0 || (hasta !== undefined && t >= hasta)) return null;
  const fam = fuente ?? est.fuente, pes = peso ?? est.peso;
  const u = c01((t - t0) / dur), uPrev = c01((t - 1 / fps - t0) / dur);
  const p = curva(u);
  // progreso del despliegue de las letras (empieza cuando el logo ya se mueve)
  const pl = (v: number) => c01((curva(v) - 0.5) / 0.32);
  const q = pl(u), qPrev = pl(uPrev);
  const lx = desdeX + (x - desdeX) * p;
  const tx0 = x + logoTam / 2 + hueco;
  const letras = texto.split("");
  const izq = letras.map((_, i) => anchoTexto(texto.slice(0, i), fam, pes, tam));
  const W = anchoTexto(texto, fam, pes, tam);
  const R0 = tx0 + W - (W - izq[letras.length - 1]) + tam * 0.35; // punto de nacimiento: a la derecha de la palabra
  const estela = Math.min(45, Math.abs(q - qPrev) * (R0 - tx0) * 0.55);
  const brillo = 1 - tramo(u, 0.5, 0.66, CURVAS.lineal);
  const velo = brillo * tramo(u, 0.3, 0.45, CURVAS.lineal);
  // disolución
  const carga = sale !== undefined ? tramo(t, sale, sale + 0.13, CURVAS.suave) : 0;
  const trazo = sale !== undefined ? tramo(t, sale + 0.13, sale + 0.2, CURVAS.acelera) : 0;
  const fuera = sale !== undefined ? 1 - tramo(t, sale + 0.16, sale + 0.22, CURVAS.lineal) : 1;
  if (fuera <= 0.003) return null;
  const by = 22 * trazo, bx = estela;
  const colorTxt = trazo > 0 ? lerpColor("#FFF3EA", colorChispa, trazo) : color;
  const sombra = `0 0 ${(18 * brillo + 26 * carga).toFixed(1)}px rgba(255,236,220,${(0.5 * brillo + 0.55 * carga).toFixed(3)})`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: fuera, transformOrigin: `${(x + tx0 + W) / 2}px ${y}px`,
      transform: `translateY(${39 * carga}px) scale(${1 + 0.1 * carga}) scaleY(${1 + 1.6 * trazo})`, filter: bx > 0.4 || by > 0.4 ? `url(#${id})` : undefined }}>
      {(bx > 0.4 || by > 0.4) && <FiltroEstela id={id} bx={bx} by={by} />}
      {velo > 0.01 && <div style={{ position: "absolute", left: (x + tx0 + W) / 2 - 520, top: y - 260, width: 1040, height: 520, opacity: velo, background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,232,214,0.16) 0%, rgba(255,220,200,0.06) 45%, transparent 100%)" }} />}
      <div style={{ position: "absolute", left: lx, top: y, transform: "translate(-50%, -50%)", filter: carga > 0.01 ? `brightness(${1 + 0.4 * carga}) drop-shadow(0 0 ${12 * carga}px ${colorChispa})` : undefined }}>{logo}</div>
      {letras.map((l, i) => {
        const ultima = i === letras.length - 1 && letras.length > 1;
        let left = izq[i], s = 1, o = 1;
        if (ultima) {
          const k = tramo(u, 0.5, 0.64);
          s = 0.3 + 0.7 * k; o = u >= 0.5 ? 1 : 0;
        } else if (i === 0) {
          // la primera letra crece de un punto a la derecha y luego viaja a su sitio
          s = tramo(u, 0.18, 0.32); left = R0 - tx0 + (izq[0] - (R0 - tx0)) * q;
          o = u >= 0.18 ? 1 : 0;
        } else {
          left = R0 - tx0 + (izq[i] - (R0 - tx0)) * q;
          o = q > 0.02 ? 1 : 0;
        }
        if (!o) return null;
        return (
          <span key={i} style={{ position: "absolute", left: tx0 + left, top: y, transform: `translateY(-50%) scale(${s})`, transformOrigin: ultima ? "0% 75%" : "50% 60%",
            fontFamily: fam, fontWeight: pes, fontSize: tam, lineHeight: 1, color: colorTxt, whiteSpace: "pre", textShadow: sombra }}>{l}</span>
        );
      })}
    </div>
  );
};

// ═════════ RESPLANDOR (bloom) ═════════
/**
 * Bloom de pantalla: velo de luz (`color`, elipse centrada en `x`,`y` %) en modo `screen` y, si hay hijos, una copia
 * desenfocada de ellos encima. `fuerza` 0–1: anímala con `curvaLuz` (sube en 3–4 fotogramas y se CORTA en 2 en el golpe).
 * Props: `fuerza`, `color` (#352220), `radio` (px de la copia), `x`, `y`, `tam` (% de la elipse), `children`.
 */
export const Resplandor: React.FC<{ fuerza: number; color?: string; radio?: number; x?: number; y?: number; tam?: number; children?: React.ReactNode }> = ({ fuerza, color = "#352220", radio = 24, x = 50, y = 50, tam = 70, children }) => {
  const f = c01(fuerza);
  return (
    <>
      {children}
      {f > 0.005 && <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: f, background: `radial-gradient(ellipse ${tam}% ${tam * 1.1}% at ${x}% ${y}%, ${color} 0%, ${hexAlfa(color, 0.55)} 45%, transparent 100%)` }} />}
      {f > 0.005 && children && <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: f, filter: `blur(${radio}px) brightness(1.5)` }}>{children}</AbsoluteFill>}
    </>
  );
};

// ═════════ ARCO DE CHISPA (E4) ═════════
/**
 * Cometa curva: trazo fino con núcleo crema y halo naranja que se dibuja por la cabeza y se borra por la cola (fuegos que
 * llevan a algo). Props: `t0`, `dur` (0,25 s), `camino` [x0, y0, cx, cy, x1, y1] (Bézier cuadrática, px del contenedor),
 * `grosor` (2,5), `cola` (fracción del arco, 0,4), `color` (#E16726), `nucleo` (#FFE9C9).
 */
export const ArcoChispa: React.FC<{ t0: number; dur?: number; camino: [number, number, number, number, number, number]; grosor?: number; cola?: number; color?: string; nucleo?: string }> = ({ t0, dur = 0.25, camino, grosor = 2.5, cola = 0.4, color = "#E16726", nucleo = "#FFE9C9" }) => {
  const t = useSeg();
  const id = useIdSvg("arco");
  const u = (t - t0) / dur;
  if (u <= 0 || u >= 1) return null;
  const cab = CURVAS.suave(c01(u / (1 - cola * 0.3)));
  const col = CURVAS.acelera(c01((u - cola * 0.5) / (1 - cola * 0.5)));
  const ini = Math.max(0, Math.min(col, cab - 0.002)), len = Math.max(0.002, cab - ini);
  const [x0, y0, cx, cy, x1, y1] = camino;
  const d = `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`;
  const comun = { d, fill: "none", pathLength: 1, strokeLinecap: "round" as const, strokeDasharray: `${len} 2`, strokeDashoffset: -ini };
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={grosor * 2.2} /></filter>
      <path {...comun} stroke={color} strokeWidth={grosor * 4} opacity={0.8} filter={`url(#${id})`} />
      <path {...comun} stroke={color} strokeWidth={grosor * 1.6} opacity={0.9} />
      <path {...comun} stroke={nucleo} strokeWidth={grosor * 0.7} />
    </svg>
  );
};

// ═════════ TEXTO NACIDO DE CHISPAS (E4) ═════════
export type PalabraChispa = { texto: string; t: number; arco?: { desde: [number, number]; control: [number, number]; dur?: number } };
/**
 * Cada palabra nace donde aterriza su chispa (`arco` opcional: ArcoChispa que acaba en el centro de la palabra justo en
 * `t`), crece de 0,2 a 1 con bloom y, con `separacion` > 1, empiezan más separadas y el hueco se cierra en `cierra`.
 * Props: `palabras` [{texto, t, arco}], `x` (borde izquierdo de la línea), `y` (centro), `tam`, `fuente`, `peso`, `color`,
 * `prefijo` {nodo, ancho, t, hueco} (logo antes del texto), `separacion` (1), `cierra` (t), `crece` (0,12 s), `bloom` (px).
 */
export const TextoDeChispas: React.FC<{ palabras: PalabraChispa[]; x: number; y: number; tam: number; fuente?: string; peso?: number; color?: string;
  prefijo?: { nodo: React.ReactNode; ancho: number; t: number; hueco?: number }; separacion?: number; cierra?: number; crece?: number; bloom?: number; colorChispa?: string; brilloFinal?: number }> = ({
  palabras, x, y, tam, fuente, peso, color, prefijo, separacion = 1, cierra = 0, crece = 0.12, bloom = 26, colorChispa = "#E16726", brilloFinal = 0 }) => {
  const t = useSeg();
  const est = useEstilo();
  const fam = fuente ?? est.fuente, pes = peso ?? est.peso, col = color ?? est.texto;
  const x0 = x + (prefijo ? prefijo.ancho + (prefijo.hueco ?? tam * 0.25) : 0);
  const esp = anchoTexto(" ", fam, pes, tam);
  let acc = 0;
  const pos = palabras.map((p) => { const w = anchoTexto(p.texto, fam, pes, tam); const l = acc; acc += w + esp; return { l, w }; });
  const total = x0 + acc - esp, centro = (x + total) / 2;
  const abre = (separacion - 1) * (1 - tramo(t, cierra, cierra + 0.1));
  const desplaza = (cx: number) => (cx - centro) * abre;
  const nace = (t0: number) => ({ s: 0.2 + 0.8 * tramo(t, t0, t0 + crece), o: t >= t0 ? 1 : 0, luz: Math.max(brilloFinal, 1 - tramo(t, t0, t0 + 0.35, CURVAS.lineal)) });
  const sombra = (luz: number) => `0 0 ${(bloom * luz).toFixed(1)}px rgba(255,226,205,${(0.75 * luz).toFixed(3)}), 0 0 ${(bloom * 2.2 * luz).toFixed(1)}px ${hexAlfa(colorChispa, 0.45 * luz)}`;
  return (
    <>
      {palabras.map((p, i) => {
        if (!p.arco) return null;
        const cx = x0 + pos[i].l + pos[i].w / 2, cxa = cx + desplaza(cx);
        const dur = p.arco.dur ?? 0.25;
        return <ArcoChispa key={`a${i}`} t0={p.t - dur} dur={dur + 0.02} camino={[...p.arco.desde, ...p.arco.control, cxa, y] as [number, number, number, number, number, number]} />;
      })}
      {prefijo && (() => {
        const n = nace(prefijo.t);
        if (!n.o) return null;
        const cx = x + prefijo.ancho / 2;
        return <div style={{ position: "absolute", left: cx + desplaza(cx), top: y, transform: `translate(-50%, -50%) scale(${n.s})`, filter: n.luz > 0.02 ? `drop-shadow(0 0 ${(bloom * 0.5 * n.luz).toFixed(1)}px #FFD9C0)` : undefined }}>{prefijo.nodo}</div>;
      })()}
      {palabras.map((p, i) => {
        const n = nace(p.t);
        if (!n.o) return null;
        const cx = x0 + pos[i].l + pos[i].w / 2;
        return (
          <span key={i} style={{ position: "absolute", left: cx + desplaza(cx), top: y, transform: `translate(-50%, -52%) scale(${n.s})`, fontFamily: fam, fontWeight: pes, fontSize: tam, lineHeight: 1,
            color: col, whiteSpace: "pre", textShadow: n.luz > 0.01 ? sombra(n.luz) : undefined }}>{p.texto}</span>
        );
      })}
    </>
  );
};

// ═════════ CAJA DE CRISTAL (E5) ═════════
/**
 * Caja de prompt de cristal oscuro: entra subiendo y fundiéndose; su interior muestra la luz de detrás REFRACTADA (anillo
 * desenfocado con el centro oscuro que se abre hacia los bordes y se aclara) y se apaga de golpe en `luz.apaga`; desde
 * entonces, luz cálida pegada BAJO la caja. `apaga` = [t0, t1] la funde (ease-in) subiendo un poco.
 * Props: `x`, `y` (esquina sup. izq.), `ancho`, `alto`, `radio` (27), `t0`, `luz` {t0, t1, apaga, colores, fuerza}, `luzBajo`
 * {t0, color, fuerza}, `apaga`, `fondo` (#261F1E), `borde`, `children` (contenido de la interfaz).
 */
export const CajaCristal: React.FC<{ x: number; y: number; ancho: number; alto: number; radio?: number; t0: number; luz?: { t0: number; t1: number; apaga: number; colores?: [string, string]; fuerza?: number };
  luzBajo?: { t0: number; color?: string; fuerza?: number }; apaga?: [number, number]; fondo?: string; borde?: string; children?: React.ReactNode }> = ({
  x, y, ancho, alto, radio = 27, t0, luz, luzBajo, apaga, fondo = "#261F1E", borde = "rgba(255,255,255,0.06)", children }) => {
  const t = useSeg();
  if (t < t0) return null;
  const e = tramo(t, t0, t0 + 0.13);
  const ap = apaga ? tramo(t, apaga[0], apaga[1], CURVAS.acelera) : 0;
  if (ap >= 0.999) return null;
  const dy = 60 * (1 - e) - 30 * ap;
  const op = e * (1 - ap);
  const k = luz ? tramo(t, luz.t0, luz.t1, CURVAS.lineal) : 0;
  const enc = luz ? (t < luz.t0 ? 0 : 1 - tramo(t, luz.apaga, luz.apaga + 0.03, CURVAS.lineal)) : 0;
  const [c0, c1] = luz?.colores ?? ["#BF8F76", "#EFC5A9"];
  const lb = luzBajo ? tramo(t, luzBajo.t0, luzBajo.t0 + 0.12) * (luzBajo.fuerza ?? 1) : 0;
  const cLb = luzBajo?.color ?? "#6B3E2D";
  return (
    <div style={{ position: "absolute", left: x, top: y + dy, width: ancho, height: alto, opacity: op }}>
      {lb > 0.01 && <div style={{ position: "absolute", left: ancho / 2 - ancho * 0.57, top: alto - 170, width: ancho * 1.14, height: 420, opacity: lb,
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${hexAlfa(cLb, 1)} 0%, ${hexAlfa(cLb, 0.55)} 35%, ${hexAlfa("#482820", 0.25)} 65%, transparent 100%)` }} />}
      <div style={{ position: "absolute", inset: 0, borderRadius: radio, background: fondo, overflow: "hidden", boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px ${borde}` }}>
        {enc * k > 0.01 && (
          <div style={{ position: "absolute", inset: -40, opacity: enc * Math.min(1, k * 1.6) * (luz?.fuerza ?? 1), filter: "blur(22px)",
            background: `radial-gradient(ellipse ${30 + 85 * k}% ${70 + 50 * k}% at 50% 55%, rgba(40,26,22,${(0.85 - 0.35 * k).toFixed(2)}) 0%, rgba(80,50,40,0.6) ${6 + 4 * k}%, ${lerpColor(c0, c1, k)} ${26 + 10 * k}%, ${hexAlfa("#E8BCA0", 0.75 * k)} 75%, ${hexAlfa("#C79A80", 0.5 * k)} 100%)` }} />
        )}
        {children}
      </div>
    </div>
  );
};

// ═════════ ECO DE ZOOM (E5) ═════════
/**
 * Salto de zoom tapado por una doble exposición: entre `t0` y `t0 + dur` se pintan, además de la escena, copias suyas a
 * otras escalas (relativas, alrededor de `origen`) con `opacidad`. Combínalo con un salto de cámara en `t0`.
 * Props: `t0`, `dur` (2 fotogramas a 60 fps), `ecos` ([1,23]), `opacidad` (0,5), `origen` [x, y], `children`.
 */
export const EcoZoom: React.FC<{ t0: number; dur?: number; ecos?: number[]; opacidad?: number; origen?: [number, number]; children: React.ReactNode }> = ({ t0, dur = 2 / 60, ecos = [1.23], opacidad = 0.5, origen = [960, 540], children }) => {
  const t = useSeg();
  const activo = t >= t0 && t < t0 + dur;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: activo ? 1 - opacidad * 0.6 : 1 }}>{children}</AbsoluteFill>
      {activo && ecos.map((e, i) => (
        <AbsoluteFill key={i} style={{ opacity: opacidad, transformOrigin: `${origen[0]}px ${origen[1]}px`, transform: `scale(${e})` }}>{children}</AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

// ═════════ BOTÓN QUE SE PULSA + CURSOR DE MANO (E7) ═════════
/** Flecha hacia arriba (icono de enviar) en SVG. */
export const FlechaArriba: React.FC<{ tam: number; color?: string; grosor?: number }> = ({ tam, color = "#3A1A12", grosor = 2.2 }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M12 20V4.5M5.5 11L12 4.5L18.5 11" />
  </svg>
);
/**
 * Botón aislado que se pulsa: se encoge a `profundidad` (0,45) en `baja` s con ease-in mientras se aclara a
 * `colorPulsado` y su halo crece; se suelta con expo-out en `sube` s sin sobrepaso. `brillo` 0–1 lo enciende desde
 * `apagado` (antes de la pulsación). Se coloca con el contenedor (p. ej. `Movil`).
 * Props: `tam`, `t0` (empieza a bajar), `baja` (0,23), `sube` (0,3), `profundidad`, `color` (#D67051), `colorPulsado`
 * (#F5B694), `apagado` (#5A2A20), `brillo`, `halo` (0–1), `radio` (fracción, 0,16), `icono`.
 */
export const BotonPulsa: React.FC<{ tam: number; t0: number; baja?: number; sube?: number; profundidad?: number; color?: string; colorPulsado?: string; apagado?: string; brillo?: number; halo?: number; radio?: number; icono?: React.ReactNode }> = ({
  tam, t0, baja = 0.23, sube = 0.3, profundidad = 0.45, color = "#D67051", colorPulsado = "#F5B694", apagado = "#5A2A20", brillo = 1, halo = 1, radio = 0.16, icono }) => {
  const t = useSeg();
  const s = t < t0 ? 1 : t < t0 + baja ? 1 - (1 - profundidad) * CURVAS.acelera((t - t0) / baja) : profundidad + (1 - profundidad) * tramo(t, t0 + baja, t0 + baja + sube);
  // la luz del pulsado tarda más en irse que la forma en volver (se enfría en `sube` × 1,3, lineal)
  const pk = t < t0 + baja ? c01((1 - s) / (1 - profundidad)) : 1 - tramo(t, t0 + baja, t0 + baja + sube * 1.3, CURVAS.lineal);
  const base = lerpColor(apagado, color, brillo);
  const fondo = pk > 0 ? `color-mix(in srgb, ${colorPulsado} ${(pk * 100).toFixed(1)}%, ${base})` : base;
  const h = halo * (0.18 * brillo + 0.7 * pk);
  return (
    <div style={{ width: tam, height: tam, transform: `scale(${s})`, borderRadius: tam * radio, background: fondo, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 ${(tam * (0.5 + 0.9 * pk)).toFixed(0)}px ${(tam * 0.1 * pk).toFixed(0)}px ${hexAlfa(colorPulsado, h)}` }}>
      {icono ?? <FlechaArriba tam={tam * 0.42} color={lerpColor("#2A120C", "#3A1A12", brillo)} grosor={1.6} />}
    </div>
  );
};
/** Mano de cursor (blanca con contorno negro); la punta del índice está en (6, 1) del viewBox 20×24. */
export const Mano: React.FC<{ tam?: number }> = ({ tam = 150 }) => (
  <svg width={(tam * 20) / 24} height={tam} viewBox="0 0 20 24" style={{ display: "block", overflow: "visible" }}>
    <path d="M6 1C7.1 1 8 1.9 8 3V10H9V8.6C9 7.8 9.7 7.1 10.5 7.1S12 7.8 12 8.6V10.4H12.6V9.4C12.6 8.6 13.3 7.9 14.1 7.9S15.6 8.6 15.6 9.4V11H16C16.1 10.3 16.6 9.9 17.3 9.9C18 9.9 18.6 10.5 18.6 11.2V17C18.6 20.5 16.5 23 13 23H10C7.8 23 6.6 22 5.4 20.4L1.4 14.8C0.8 14 1 12.9 1.8 12.4C2.6 11.9 3.6 12.1 4.1 12.9L4 13V3C4 1.9 4.9 1 6 1Z"
      fill="#FFFFFF" stroke="#000000" strokeWidth={1.1} strokeLinejoin="round" />
    <path d="M10.4 15.2V19.6M13 15.2V19.6M15.6 15.2V19.6" stroke="#000000" strokeWidth={1.1} strokeLinecap="round" />
  </svg>
);
/**
 * Cursor de mano que sube desde `desde` y se posa (expo-out) con la punta en `hasta`; con `pulsa` se encoge un poco al
 * pulsar; con `sale` cae (`dy`) con estela vertical y se funde (ease-in).
 * Props: `t0`, `desde`, `hasta` [x, y] (punta del dedo), `dur` (0,47 s), `tam` (alto, 150), `pulsa` (t), `sale` {t0, dy, dur}.
 */
export const CursorMano: React.FC<{ t0: number; desde: [number, number]; hasta: [number, number]; dur?: number; tam?: number; pulsa?: number; sale?: { t0: number; dy?: number; dur?: number } }> = ({ t0, desde, hasta, dur = 0.47, tam = 150, pulsa, sale }) => {
  const t = useSeg();
  const id = useIdSvg("mano");
  if (t < t0) return null;
  const k = tramo(t, t0, t0 + dur);
  const sl = sale ? tramo(t, sale.t0, sale.t0 + (sale.dur ?? 0.15), CURVAS.acelera) : 0;
  if (sl >= 0.999) return null;
  const px = desde[0] + (hasta[0] - desde[0]) * k, py = desde[1] + (hasta[1] - desde[1]) * k + (sale?.dy ?? 150) * sl;
  const ps = pulsa !== undefined ? 1 - 0.08 * Math.min(tramo(t, pulsa, pulsa + 0.08), 1 - tramo(t, pulsa + 0.2, pulsa + 0.4)) : 1;
  const by = 18 * sl;
  const esc = tam / 24;
  return (
    <div style={{ position: "absolute", left: px - 6 * esc, top: py - 1 * esc, opacity: 1 - sl, transformOrigin: `${6 * esc}px ${esc}px`, transform: `scale(${ps})`, filter: by > 0.4 ? `url(#${id})` : undefined }}>
      {by > 0.4 && <FiltroEstela id={id} bx={0} by={by} />}
      <Mano tam={tam} />
    </div>
  );
};

// ═════════ ONDA DE CHOQUE (E8) ═════════
/**
 * Anillo ancho de luz que se abre desde (x, y) hasta salirse del cuadro en `dur` s, con un valle oscuro detrás. Con
 * `pixel` (px de celda) se pinta en mosaico de franjas, como la referencia; sin él, liso.
 * Props: `t0`, `x`, `y`, `dur` (0,15), `banda` (260 px), `radioMax` (1150), `color` (#B58E73), `valle` (#43211A), `pixel`, `fuerza`.
 */
export const OndaChoque: React.FC<{ t0: number; x: number; y: number; dur?: number; banda?: number; radioMax?: number; color?: string; valle?: string; pixel?: number; fuerza?: number }> = ({ t0, x, y, dur = 0.15, banda = 260, radioMax = 1150, color = "#B58E73", valle = "#43211A", pixel, fuerza = 1 }) => {
  const t = useSeg();
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return null;
  // la cresta va de 0,35 a 1 × radioMax (lineal-rápido) y se enciende en el primer cuarto; dentro queda el valle (luz
  // cálida apagada) que cubre el cuadro
  const rc = radioMax * (0.35 + 0.65 * u);
  const op = fuerza * Math.min(1, 0.5 + 2.5 * u) * (u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2);
  if (!pixel) {
    return <AbsoluteFill style={{ pointerEvents: "none", opacity: op, background: `radial-gradient(circle at ${x}px ${y}px, ${hexAlfa(valle, 0.9)} 0px, ${hexAlfa(valle, 0.9)} ${Math.max(0, rc - banda * 0.6)}px, ${color} ${rc}px, transparent ${rc + banda * 0.5}px)` }} />;
  }
  // mosaico en franjas: color de cada celda (pixel × 1,4 pixel) según su distancia al centro
  const [cr, cg, cb] = hexRgb(color), [vr, vg, vb] = hexRgb(valle);
  const ph = pixel * 1.4, celdas: React.ReactNode[] = [];
  for (let j = 0; j * ph < 1080; j++) {
    for (let i = 0; i * pixel < 1920; i++) {
      const d = Math.hypot(i * pixel + pixel / 2 - x, j * ph + ph / 2 - y);
      const cresta = c01(1 - Math.abs(d - rc) / (banda * 0.5));
      const a = Math.max(cresta, d < rc ? 0.9 : 0);
      if (a < 0.02) continue;
      celdas.push(<rect key={`${i}-${j}`} x={i * pixel} y={j * ph} width={pixel + 0.5} height={ph + 0.5} fill={`rgb(${Math.round(vr + (cr - vr) * cresta)},${Math.round(vg + (cg - vg) * cresta)},${Math.round(vb + (cb - vb) * cresta)})`} opacity={a} />);
    }
  }
  return <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: op, pointerEvents: "none" }} shapeRendering="crispEdges">{celdas}</svg>;
};

// ═════════ CÓDIGO QUE CAE Y SE ENFRÍA (E9) + SALIDA 3D ═════════
/**
 * Bloque de código que entra cayendo desde arriba (expo-out exponencial, ~23 % del camino restante por fotograma a 30
 * fps), desenfocado y caliente, y se ENFRÍA a blanco mientras se teclea línea a línea. `sacudida` = desenfoque vertical
 * 0 → `fuerza` → 0 (en un golpe).
 * Props: `lineas`, `t0`, `x`, `y` (esquina sup. izq. final), `tam` (38), `interlineado` (59), `caida` (0,6 s), `desdeY`
 * (px por encima), `escritura` [[t, líneas hechas]…] o `lineaCada` (s), `caliente` (#E5AC91), `frio` (#F7E5E0),
 * `enfriar` (0,5 s), `blur` (9 px), `fuente`, `peso`.
 */
export const CodigoCae: React.FC<{ lineas: string[]; t0: number; x: number; y: number; tam?: number; interlineado?: number; caida?: number; desdeY?: number; escritura?: [number, number][]; lineaCada?: number;
  caliente?: string; frio?: string; enfriar?: number; blur?: number; fuente?: string; peso?: number; sacudida?: { t0: number; dur?: number; fuerza?: number } }> = ({
  lineas, t0, x, y, tam = 38, interlineado = 59, caida = 0.6, desdeY = 290, escritura, lineaCada = 0.12, caliente = "#E5AC91", frio = "#F7E5E0", enfriar = 0.5, blur = 9, fuente, peso = 400, sacudida }) => {
  const t = useSeg();
  const est = useEstilo();
  const id = useIdSvg("cod");
  if (t < t0) return null;
  const K = 7.8, dt = Math.max(0, t - t0);
  const bajada = Math.min(1, (1 - Math.exp(-K * dt)) / (1 - Math.exp(-K * caida)));
  const fr = tramo(t, t0, t0 + enfriar, CURVAS.lineal);
  const hechas = escritura ? curvaLuz(t, escritura.map((e) => e[0]), escritura.map((e) => e[1])) : dt / lineaCada;
  const sac = sacudida ? Math.sin(Math.PI * c01((t - sacudida.t0) / (sacudida.dur ?? 0.13))) * (sacudida.fuerza ?? 24) : 0;
  const b = blur * (1 - fr);
  const col = lerpColor(caliente, frio, fr);
  return (
    <div style={{ position: "absolute", left: x, top: y - desdeY * (1 - bajada), fontFamily: fuente ?? est.fuenteTexto, fontWeight: peso, fontSize: tam, lineHeight: `${interlineado}px`, color: col, whiteSpace: "pre",
      textShadow: `0 0 ${(6 + 10 * (1 - fr)).toFixed(1)}px ${hexAlfa(fr < 1 ? caliente : "#FFE6DA", 0.35 + 0.4 * (1 - fr))}`,
      filter: [b > 0.3 ? `blur(${b.toFixed(2)}px)` : "", sac > 0.4 ? `url(#${id})` : ""].join(" ").trim() || undefined }}>
      {sac > 0.4 && <FiltroEstela id={id} bx={0} by={sac} />}
      {lineas.map((l, i) => {
        if (i > hechas) return null;
        const txt = i + 1 <= hechas ? l : l.slice(0, Math.round((hechas - i) * l.length));
        return <div key={i} style={{ height: interlineado }}>{txt || " "}</div>;
      })}
    </div>
  );
};
/**
 * Salida en 3D de una capa entera: se inclina (giro Y y Z con perspectiva) y se aleja hacia `origen` con ease-in en
 * `dur` s; a partir de `t0 + dur` no se pinta (deja 1 fotograma negro de corte).
 * Props: `t0`, `dur` (0,17), `ry` (−50°), `rz` (−8°), `escala` (0,5), `perspectiva` (1400), `origen` [x, y], `children`.
 */
export const Salida3D: React.FC<{ t0: number; dur?: number; ry?: number; rz?: number; escala?: number; perspectiva?: number; origen?: [number, number]; children: React.ReactNode }> = ({ t0, dur = 0.17, ry = -50, rz = -8, escala = 0.5, perspectiva = 1400, origen = [960, 540], children }) => {
  const t = useSeg();
  if (t >= t0 + dur) return null;
  const u = t < t0 ? 0 : CURVAS.acelera(c01((t - t0) / dur));
  if (u <= 0) return <>{children}</>;
  return (
    <AbsoluteFill style={{ perspective: perspectiva, perspectiveOrigin: `${origen[0]}px ${origen[1]}px` }}>
      <AbsoluteFill style={{ transformOrigin: `${origen[0]}px ${origen[1]}px`, transform: `rotateY(${ry * u}deg) rotateZ(${rz * u}deg) scale(${1 - (1 - escala) * u})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═════════ GLIFO QUE CAMBIA (E10) ═════════
/**
 * Un símbolo (`de`, desenfocado y caliente con halo) se convierte en la primera letra de `palabra` en `cambia` (fundido
 * con desenfoque de `dur` s); el resto de letras se teclea a los `tiempos` dados, cada una destapándose de izquierda a
 * derecha en `revela` s (el trazo se dibuja) y entra CALIENTE (`caliente`) enfriándose a `color` en `enfria` s. La palabra va
 * centrada en (x, y) con sus posiciones finales desde el principio.
 * Props: `de`, `palabra`, `t0` (aparece el símbolo), `cambia`, `tiempos` (uno por letra tras la primera), `dur` (0,07),
 * `blur` (8), `revela` (0,1), `tam`, `x`, `y`, `fuente`, `peso`, `color` (#FCEDE6), `caliente` (#F29A70), `enfria` (0,35 s),
 * `colorDe` (#F08A5D), `halo` (px), `opacidad`.
 */
export const GlifoCambia: React.FC<{ de: string; palabra: string; t0: number; cambia: number; tiempos?: number[]; dur?: number; blur?: number; revela?: number; tam: number; x: number; y: number;
  fuente?: string; peso?: number; color?: string; caliente?: string; enfria?: number; colorDe?: string; halo?: number; opacidad?: number }> = ({
  de, palabra, t0, cambia, tiempos = [], dur = 0.07, blur = 8, revela = 0.1, tam, x, y, fuente, peso, color = "#FCEDE6", caliente = "#F29A70", enfria = 0.35, colorDe = "#F08A5D", halo = 22, opacidad = 1 }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0) return null;
  const k = tramo(t, cambia, cambia + dur, CURVAS.lineal);
  const tinta = (ti: number) => lerpColor(caliente, color, tramo(t, ti, ti + enfria, CURVAS.lineal));
  const sombra = (c: string, f = 1) => `0 0 ${halo * f}px ${hexAlfa(c, 0.85)}, 0 0 ${halo * 2.4 * f}px ${hexAlfa("#E16726", 0.45)}`;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", fontFamily: fuente ?? est.fuente, fontWeight: peso ?? est.peso, fontSize: tam, lineHeight: 1, whiteSpace: "pre", color, opacity: opacidad }}>
      {palabra.split("").map((l, i) => {
        if (i === 0) {
          return (
            <span key={i} style={{ position: "relative", display: "inline-block" }}>
              <span style={{ opacity: k, color: tinta(cambia), filter: k < 1 ? `blur(${(blur * (1 - k)).toFixed(1)}px)` : undefined, textShadow: sombra(caliente) }}>{l}</span>
              {k < 1 && <span style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", color: colorDe, opacity: 1 - k, filter: `blur(${(blur * 0.35 + blur * 0.65 * k).toFixed(1)}px)`, textShadow: sombra(colorDe, 1.3) }}>{de}</span>}
            </span>
          );
        }
        const ti = tiempos[i - 1] ?? Infinity;
        if (!Number.isFinite(ti) || t < ti) return <span key={i} style={{ display: "inline-block", opacity: 0 }}>{l}</span>;
        const r = tramo(t, ti, ti + revela, CURVAS.lineal);
        return <span key={i} style={{ display: "inline-block", opacity: r > 0 ? 1 : 0, clipPath: r < 1 ? `inset(-30% ${((1 - r) * 100).toFixed(1)}% -30% -10%)` : undefined, color: tinta(ti), textShadow: sombra(caliente) }}>{l}</span>;
      })}
    </div>
  );
};

// ═════════ TEXTO BRASA (E11) ═════════
/**
 * Palabra que entra de golpe con un bloom fuerte (`caliente`) que decae en `cae` s a su color, mientras se aleja
 * (escala 1 → 1 − `alejar` lineal en `durAlejar` s); con `sale` se funde en 0,07 s.
 * Props: `texto`, `t0`, `x`, `y` (centro), `tam`, `bloom` (40 px), `cae` (0,23), `alejar` (0,09), `durAlejar` (0,5),
 * `color` (#FFEEEA), `caliente` (#FFDBC1), `sale`, `fuente`, `peso`.
 */
export const TextoBrasa: React.FC<{ texto: string; t0: number; x: number; y: number; tam: number; bloom?: number; cae?: number; alejar?: number; durAlejar?: number; color?: string; caliente?: string; sale?: number; fuente?: string; peso?: number }> = ({
  texto, t0, x, y, tam, bloom = 40, cae = 0.23, alejar = 0.09, durAlejar = 0.5, color = "#FFEEEA", caliente = "#FFDBC1", sale, fuente, peso }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0) return null;
  const k = 1 - tramo(t, t0, t0 + cae, CURVAS.lineal);
  const s = 1 - alejar * tramo(t, t0, t0 + durAlejar, CURVAS.lineal);
  const o = sale !== undefined ? 1 - tramo(t, sale, sale + 0.07, CURVAS.lineal) : 1;
  if (o <= 0.003) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, fontFamily: fuente ?? est.fuente, fontWeight: peso ?? est.peso, fontSize: tam, lineHeight: 1, whiteSpace: "pre",
      color: lerpColor(color, caliente, k), opacity: o, textShadow: `0 0 ${(bloom * 0.35 * k + 3).toFixed(1)}px ${hexAlfa(caliente, 0.9 * k + 0.15)}, 0 0 ${(bloom * k).toFixed(1)}px ${hexAlfa(caliente, 0.7 * k)}, 0 0 ${(bloom * 2.2 * k).toFixed(1)}px ${hexAlfa("#E8956A", 0.45 * k)}` }}>
      {texto}
    </div>
  );
};
