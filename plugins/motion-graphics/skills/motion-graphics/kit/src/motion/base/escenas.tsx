// Base común · escenas encadenadas con transiciones POTENTES (nunca un fundido de diapositiva).
// Cada escena tiene su reloj propio (useSeg empieza en 0 al entrar). Las transiciones solapan escena saliente y
// entrante `dur` s y llevan desenfoque de movimiento real en los barridos.
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CURVAS, tramo, useSeg } from "./tiempo";

export type Transicion =
  | { tipo: "corte" }
  /** El plano nuevo EMPUJA al viejo (los dos se mueven juntos), con desenfoque de movimiento. */
  | { tipo: "barrido"; dur?: number; dir?: "izquierda" | "derecha" | "arriba" | "abajo" }
  /** Zoom que atraviesa: el viejo crece y se desenfoca, el nuevo llega desde más grande y se enfoca. */
  | { tipo: "zoom"; dur?: number }
  /** El nuevo se destapa con una máscara circular desde (x, y) (0–1). */
  | { tipo: "circulo"; dur?: number; x?: number; y?: number }
  /** Un bloque de color cruza la pantalla y deja detrás la escena nueva (cortinilla de agencia). */
  | { tipo: "cortina"; dur?: number; color: string; dir?: "izquierda" | "arriba" };

export type Escena = { dur: number; contenido: React.ReactNode; fondo?: string; entrada?: Transicion };

const durT = (tr?: Transicion) => (!tr || tr.tipo === "corte" ? 0 : tr.dur ?? (tr.tipo === "barrido" ? 0.3 : tr.tipo === "cortina" ? 0.45 : 0.4));

/** Duración total de una lista de escenas (restando los solapes de las transiciones). */
export const duracionEscenas = (escenas: Escena[]) => escenas.reduce((s, e, i) => s + e.dur - (i > 0 ? durT(e.entrada) : 0), 0);

/** Envuelve la escena según la fase de la transición: `p` 0→1 dentro de la entrada (o de la salida, con `sale`). */
const Capa: React.FC<{ tr?: Transicion; sale?: Transicion; dur: number; fondo?: string; children: React.ReactNode }> = ({ tr, sale, dur, fondo, children }) => {
  const t = useSeg();
  const dE = durT(tr), dS = durT(sale);
  let estilo: React.CSSProperties = {};
  let mascara: string | undefined;
  // entrada
  if (tr && tr.tipo !== "corte" && t < dE) {
    const p = tramo(t, 0, dE, CURVAS.inOutFuerte);
    if (tr.tipo === "barrido") {
      const v = vector(tr.dir);
      estilo.transform = `translate(${v[0] * (1 - p) * 100}%, ${v[1] * (1 - p) * 100}%)`;
    } else if (tr.tipo === "zoom") {
      const q = tramo(t, 0, dE, CURVAS.expo);
      estilo = { transform: `scale(${1.25 - 0.25 * q})`, filter: `blur(${(1 - q) * 22}px)`, opacity: Math.min(1, q * 2.5) };
    } else if (tr.tipo === "circulo") {
      mascara = `circle(${p * 150}% at ${(tr.x ?? 0.5) * 100}% ${(tr.y ?? 0.5) * 100}%)`;
    } else if (tr.tipo === "cortina") {
      // la escena aparece cuando la cortina pasa por la mitad
      estilo.opacity = t > dE * 0.5 ? 1 : 0;
    }
  }
  // salida
  if (sale && sale.tipo !== "corte" && t > dur - dS) {
    const p = tramo(t, dur - dS, dur, CURVAS.inOutFuerte);
    if (sale.tipo === "barrido") {
      const v = vector(sale.dir);
      estilo.transform = `translate(${-v[0] * p * 100}%, ${-v[1] * p * 100}%)`;
    } else if (sale.tipo === "zoom") {
      const q = tramo(t, dur - dS, dur, CURVAS.acelera);
      estilo = { transform: `scale(${1 + 0.6 * q})`, filter: `blur(${q * 26}px)`, opacity: 1 - q };
    }
  }
  return (
    <AbsoluteFill style={{ background: fondo, clipPath: mascara, ...estilo }}>{children}</AbsoluteFill>
  );
};

const vector = (dir?: string): [number, number] => (dir === "derecha" ? [-1, 0] : dir === "arriba" ? [0, 1] : dir === "abajo" ? [0, -1] : [1, 0]);

/** Cortina de color que cruza la pantalla en una transición `cortina`. */
const Cortina: React.FC<{ tr: Extract<Transicion, { tipo: "cortina" }> }> = ({ tr }) => {
  const t = useSeg();
  const d = durT(tr);
  const p = tramo(t, 0, d, CURVAS.inOutFuerte);
  const pos = -100 + 200 * p;
  return <AbsoluteFill style={{ background: tr.color, transform: tr.dir === "arriba" ? `translateY(${-pos}%)` : `translateX(${pos}%)` }} />;
};

/**
 * Encadena escenas. `desenfoque` (por defecto sí) mete desenfoque de movimiento real en las transiciones de tipo
 * barrido/cortina. La duración del vídeo debe ser duracionEscenas(escenas).
 */
export const Escenas: React.FC<{ escenas: Escena[]; desenfoque?: boolean }> = ({ escenas, desenfoque = true }) => {
  const { fps } = useVideoConfig();
  let inicio = 0;
  const bloques: React.ReactNode[] = [];
  const ventanas: [number, number][] = [];
  escenas.forEach((e, i) => {
    const dE = i > 0 ? durT(e.entrada) : 0;
    inicio -= dE;
    const sig = escenas[i + 1]?.entrada;
    if (dE > 0 && e.entrada && (e.entrada.tipo === "barrido" || e.entrada.tipo === "cortina")) ventanas.push([inicio - 0.02, inicio + dE + 0.02]);
    bloques.push(
      <Sequence key={i} from={Math.round(inicio * fps)} durationInFrames={Math.round(e.dur * fps)}>
        <Capa tr={i > 0 ? e.entrada : undefined} sale={sig} dur={e.dur} fondo={e.fondo}>{e.contenido}</Capa>
      </Sequence>
    );
    if (e.entrada?.tipo === "cortina" && i > 0) {
      bloques.push(<Sequence key={`c${i}`} from={Math.round(inicio * fps)} durationInFrames={Math.round(dE * fps) + 1}><Cortina tr={e.entrada} /></Sequence>);
    }
    inicio += e.dur;
  });
  return desenfoque ? <Desenfocar ventanas={ventanas}>{bloques}</Desenfocar> : <>{bloques}</>;
};

const Desenfocar: React.FC<{ ventanas: [number, number][]; children: React.ReactNode }> = ({ ventanas, children }) => {
  const t = useSeg();
  return ventanas.some(([a, b]) => t >= a && t <= b) ? <CameraMotionBlur samples={6} shutterAngle={300}>{children}</CameraMotionBlur> : <AbsoluteFill>{children}</AbsoluteFill>;
};
