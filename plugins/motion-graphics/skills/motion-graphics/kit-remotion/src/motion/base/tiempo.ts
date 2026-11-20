// Base común de motion graphics · tiempo, curvas y trayectorias.
// Reglas de fluidez (aprendidas a base de renders que se veían a tirones): 60 fps, trayectorias PCHIP (no frenan en
// cada clave ni se pasan de largo), nada de vaivenes senoidales ni muelles con sobrepaso en piezas grandes.
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Segundos desde el inicio de la secuencia actual (admite fotogramas fraccionarios del desenfoque de movimiento). */
export const useSeg = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

/** Curvas con nombre. expo = entradas (arranca rápido, frena largo); inOut = viajes; acelera = salidas. */
export const CURVAS = {
  expo: Easing.bezier(0.16, 1, 0.3, 1),
  suave: Easing.bezier(0.25, 1, 0.5, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  inOutFuerte: Easing.bezier(0.83, 0, 0.17, 1),
  acelera: Easing.bezier(0.55, 0, 1, 0.45),
  lineal: (t: number) => t,
};
export const expo = CURVAS.expo;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** 0→1 entre a y b con la curva dada (por defecto expo-out). */
export const tramo = (t: number, a: number, b: number, e: (x: number) => number = expo) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
/** Sube en [a, a+dentro] y baja en [b, b+fuera]: visible entre medias. */
export const ventana = (t: number, a: number, b: number, dentro = 0.3, fuera = 0.25) => Math.min(tramo(t, a, a + dentro), 1 - tramo(t, b, b + fuera, CURVAS.acelera));

/**
 * PCHIP (Fritsch–Carlson): interpola (ts[i], vs[i]) con una curva C1 que no se pasa de largo entre claves y no frena
 * en cada una (solo en los extremos, en máximos/mínimos y donde se pide con `para`).
 */
export const pchip = (ts: number[], vs: number[], t: number, para?: boolean[]) => {
  const n = ts.length;
  if (n === 1 || t <= ts[0]) return vs[0];
  if (t >= ts[n - 1]) return vs[n - 1];
  let i = 0;
  while (i < n - 2 && t > ts[i + 1]) i++;
  const h = (k: number) => ts[k + 1] - ts[k];
  const d = (k: number) => (vs[k + 1] - vs[k]) / Math.max(1e-6, h(k));
  const m = (k: number) => {
    if (k === 0 || k === n - 1 || para?.[k]) return 0;
    const d0 = d(k - 1), d1 = d(k), h0 = h(k - 1), h1 = h(k);
    if (d0 * d1 <= 0) return 0;
    return (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  };
  const H = h(i), u = (t - ts[i]) / H, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * H * m(i) + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * H * m(i + 1);
};

/** Clave genérica: `t` + valores numéricos con nombre; `para: true` fuerza velocidad 0 en esa clave.
 *  OJO: un campo que falta en una clave CONSERVA el valor de la anterior (si una clave pone o: 0, las siguientes
 *  deben poner o: 1 para volver a verse). */
export type Clave = { t: number; para?: boolean; [k: string]: number | boolean | undefined };

/** Valor de cada campo en t, interpolado con PCHIP. `def` da el valor de los campos que falten en una clave. */
export const pista = <K extends string>(claves: Clave[], t: number, campos: readonly K[], def: Partial<Record<K, number>> = {}) => {
  const ts = claves.map((c) => c.t), para = claves.map((c) => !!c.para);
  const out = {} as Record<K, number>;
  for (const k of campos) {
    let ultimo = def[k] ?? 0;
    const vs = claves.map((c) => { const v = c[k]; if (typeof v === "number") ultimo = v; return ultimo; });
    out[k] = pchip(ts, vs, t, para);
  }
  return out;
};

/** Pulso musical: tiempo del golpe n a `bpm` (con desfase opcional). Para clavar cortes y entradas a la música. */
export const golpe = (n: number, bpm = 120, desde = 0) => desde + (n * 60) / bpm;
