// Base común · fondos y acabados (luz, grano, viñeta, HUD, destellos). Nunca un fondo plano y quieto del todo.
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, useSeg } from "./tiempo";

/** Halo radial del color dado que respira y deriva despacio. */
export const Halo: React.FC<{ color?: string; fuerza?: number; x?: number; y?: number; tam?: number }> = ({ color, fuerza = 1, x = 50, y = 55, tam = 55 }) => {
  const t = useSeg();
  const est = useEstilo();
  const c = color ?? est.acento;
  const cx = x + Math.sin(t * 0.4) * 6, cy = y + Math.cos(t * 0.33) * 5, r = tam * (1 + Math.sin(t * 1.6) * 0.04);
  const a = (n: number) => Math.round(Math.min(1, n * fuerza) * 255).toString(16).padStart(2, "0");
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse ${r}% ${r * 0.9}% at ${cx}% ${cy}%, ${c}${a(0.32)} 0%, ${c}${a(0.1)} 45%, transparent 75%)` }} />;
};

/** Viñeta: oscurece las esquinas. */
export const Vineta: React.FC<{ fuerza?: number }> = ({ fuerza = 0.55 }) => <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,${fuerza}) 100%)` }} />;

/** Grano de película animado (SVG feTurbulence, cambia cada 2 fotogramas). Caro: úsalo solo si el estilo lo pide. */
export const Grano: React.FC<{ fuerza?: number }> = ({ fuerza = 0.05 }) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const sem = Math.floor((t * fps) / 2) % 50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fuerza, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%"><filter id={`g${sem}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={sem} /></filter><rect width="100%" height="100%" filter={`url(#g${sem})`} /></svg>
    </AbsoluteFill>
  );
};

/** Luces desenfocadas que derivan (profundidad sin distraer). */
export const Bokeh: React.FC<{ color?: string; n?: number; fuerza?: number }> = ({ color, n = 6, fuerza = 1 }) => {
  const t = useSeg();
  const est = useEstilo();
  const c = color ?? est.acento;
  const P = [[0.12, 0.2, 260], [0.82, 0.18, 200], [0.7, 0.82, 320], [0.25, 0.78, 180], [0.5, 0.1, 140], [0.93, 0.55, 240], [0.4, 0.6, 200], [0.6, 0.35, 160]].slice(0, n);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {P.map(([x, y, r], i) => (
        <div key={i} style={{ position: "absolute", left: `${(x + Math.sin(t * 0.25 + i) * 0.03) * 100}%`, top: `${(y + Math.cos(t * 0.2 + i * 2) * 0.03) * 100}%`, width: r, height: r, marginLeft: -r / 2, marginTop: -r / 2, borderRadius: r, background: `radial-gradient(circle, ${c}${Math.round(0.14 * fuerza * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)` }} />
      ))}
    </AbsoluteFill>
  );
};

/** Destello: una raya de luz que cruza la pantalla (une dos planos). */
export const Destello: React.FC<{ t0: number; dur?: number; y?: number; vertical?: boolean; color?: string }> = ({ t0, dur = 0.45, y = 540, vertical, color = "255,214,150" }) => {
  const t = useSeg();
  const k = (t - t0) / dur;
  if (k < 0 || k > 1) return null;
  const pos = -400 + (vertical ? 1480 : 2720) * CURVAS.expo(k);
  const a = Math.sin(Math.PI * k);
  return vertical
    ? <div style={{ position: "absolute", top: pos, left: 0, right: 0, height: 360, background: `linear-gradient(180deg, transparent, rgba(${color},${0.5 * a}), transparent)`, mixBlendMode: "screen" }} />
    : <div style={{ position: "absolute", left: pos, top: y - 3, width: 700, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, rgba(${color},${a}), transparent)`, boxShadow: `0 0 40px rgba(${color},${0.8 * a})` }} />;
};

/** Degradado lateral para leer rótulos aunque pasen piezas por debajo. */
export const Sombra: React.FC<{ lado?: "izquierda" | "abajo"; fuerza?: number; color?: string }> = ({ lado = "izquierda", fuerza = 1, color = "5,5,5" }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: lado === "izquierda"
    ? `linear-gradient(90deg, rgba(${color},${0.95 * fuerza}) 0%, rgba(${color},${0.85 * fuerza}) 28%, rgba(${color},0) 45%)`
    : `linear-gradient(0deg, rgba(${color},${0.9 * fuerza}) 0%, rgba(${color},0) 40%)` }} />
);

/** HUD de agencia: marcas de esquina finas y rótulos monoespaciados («01 / 05»). */
export const Hud: React.FC<{ izquierda?: string; derecha?: string; color?: string; fuente?: string }> = ({ izquierda, derecha, color = "rgba(255,255,255,0.75)", fuente }) => {
  const m = 48, L = 34;
  const esq = (s: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, borderColor: color, borderStyle: "solid", borderWidth: 0, ...s }} />;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: fuente ?? "monospace", fontSize: 22, letterSpacing: "0.08em", color }}>
      {esq({ left: m, top: m, borderLeftWidth: 2, borderTopWidth: 2 })}{esq({ right: m, top: m, borderRightWidth: 2, borderTopWidth: 2 })}
      {esq({ left: m, bottom: m, borderLeftWidth: 2, borderBottomWidth: 2 })}{esq({ right: m, bottom: m, borderRightWidth: 2, borderBottomWidth: 2 })}
      {izquierda && <div style={{ position: "absolute", left: m + 50, top: m + 4 }}>{izquierda}</div>}
      {derecha && <div style={{ position: "absolute", right: m + 50, top: m + 4 }}>{derecha}</div>}
    </AbsoluteFill>
  );
};

/**
 * Manchas de color que fluyen (gradientes vivos): N manchas grandes y muy desenfocadas que derivan despacio por
 * trayectorias de Lissajous distintas. `vel` en vueltas por 10 s. Sin `filter` por mancha (es caro): el borde suave
 * sale del propio degradado radial.
 */
export const Manchas: React.FC<{ colores: string[]; fondo?: string; vel?: number; tam?: number }> = ({ colores, fondo, vel = 1, tam = 70 }) => {
  const t = useSeg();
  const w = (t / 10) * Math.PI * 2 * vel;
  return (
    <AbsoluteFill style={{ background: fondo ?? colores[0], overflow: "hidden" }}>
      {colores.map((c, i) => {
        const x = 50 + 32 * Math.sin(w * (0.7 + i * 0.23) + i * 1.9), y = 50 + 28 * Math.cos(w * (0.5 + i * 0.17) + i * 2.7);
        const r = tam * (0.8 + 0.25 * Math.sin(w * 0.9 + i));
        return <AbsoluteFill key={i} style={{ background: `radial-gradient(circle ${r}vh at ${x}% ${y}%, ${c} 0%, ${c}AA 35%, transparent 70%)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** Fondo del estilo actual según su `luz` (foco, halo, liso, degradado, manchas) + viñeta/bokeh de sus texturas. */
export const FondoEstilo: React.FC<{ intensidad?: number; color?: string }> = ({ intensidad = 1, color }) => {
  const est = useEstilo();
  const luz = est.luz ?? { tipo: "liso", colores: [est.fondo] };
  const tex = est.texturas ?? {};
  return (
    <AbsoluteFill style={{ background: est.fondo }}>
      {luz.tipo === "foco" && <AbsoluteFill style={{ background: `radial-gradient(ellipse 58% 48% at 50% 0%, ${luz.colores[0]} 0%, ${luz.colores[1]} 45%, transparent 100%)`, opacity: intensidad }} />}
      {luz.tipo === "halo" && <Halo color={color ?? luz.colores[0]} fuerza={0.6 * intensidad} y={50} tam={50} />}
      {luz.tipo === "degradado" && <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${luz.colores[0]} 0%, ${luz.colores[1]} 60%, ${luz.colores[2]} 100%)` }} />}
      {luz.tipo === "manchas" && <Manchas colores={luz.colores} fondo={est.fondo} />}
      {tex.bokeh ? <Bokeh color={color ?? est.acento} fuerza={tex.bokeh} /> : null}
      {tex.vineta ? <Vineta fuerza={tex.vineta} /> : null}
      {tex.grano ? <Grano fuerza={tex.grano} /> : null}
    </AbsoluteFill>
  );
};
