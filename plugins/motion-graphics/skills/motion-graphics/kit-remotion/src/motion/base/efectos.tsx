// Base común · efectos que se repiten en las 5 referencias (análisis a fondo en referencias/motion-graphics/analisis/
// a-fondo-*.md). Regla madre: NINGÚN corte ni fundido de diapositiva; cada plano nace de un objeto del anterior
// (Forma), y el cambio se tapa con velocidad (zoom/estela) o con luz (Flash).
import React from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pista, tramo, useSeg, type Clave } from "./tiempo";

/**
 * OBJETO PUENTE: una forma que cambia de tamaño, radio, color, borde y brillo por claves (PCHIP). Es la transición
 * de las referencias: texto → píldora → tarjeta → punto → logo; barra → punto → cápsula; navegador → móvil.
 * Claves: { t, x, y, w, h, r (radio px), o, rz, luz (0–1 halo), borde (px) }; colores con `fondos` por tramos.
 */
export type ClaveForma = { t: number; x?: number; y?: number; w?: number; h?: number; r?: number; o?: number; rz?: number; luz?: number; borde?: number; para?: boolean };
export const Forma: React.FC<{ claves: ClaveForma[]; fondo?: string | ((t: number) => string); colorBorde?: string; colorLuz?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ claves, fondo, colorBorde, colorLuz, children, style }) => {
  const t = useSeg();
  const est = useEstilo();
  const fin = claves[claves.length - 1].t;
  if (t < claves[0].t - 0.02 || t > fin + 0.02) return null;
  const e = pista(claves as Clave[], t, ["x", "y", "w", "h", "r", "o", "rz", "luz", "borde"] as const, { o: 1, w: 100, h: 100, r: 20 });
  if (e.o <= 0.003) return null;
  const bg = typeof fondo === "function" ? fondo(t) : fondo ?? est.tarjeta;
  const luz = colorLuz ?? est.acento;
  return (
    <div style={{ position: "absolute", left: e.x - e.w / 2, top: e.y - e.h / 2, width: e.w, height: e.h, borderRadius: Math.min(e.r, Math.min(e.w, e.h) / 2), background: bg, opacity: Math.min(1, e.o), transform: `rotate(${e.rz}deg)`, overflow: "hidden",
      boxShadow: `${e.borde > 0 ? `inset 0 0 0 ${e.borde}px ${colorBorde ?? est.borde}, ` : ""}0 0 ${60 * e.luz}px ${16 * e.luz}px ${luz}${Math.round(Math.min(1, e.luz) * 200).toString(16).padStart(2, "0")}`, ...style }}>
      {children}
    </div>
  );
};

/** Onda de llegada: un aro fino que se abre (1→1,45× en 0,4 s, expo-out) y se apaga. Al aterrizar algo importante. */
export const Onda: React.FC<{ t0: number; x?: number; y?: number; w: number; h?: number; radio?: number; crece?: number; dur?: number; color?: string; grosor?: number }> = ({ t0, x = 960, y = 540, w, h, radio, crece = 0.45, dur = 0.4, color = "rgba(255,255,255,0.7)", grosor = 2 }) => {
  const t = useSeg();
  const k = tramo(t, t0, t0 + dur);
  if (t < t0 || t > t0 + dur) return null;
  const s = 1 + crece * k, H = h ?? w;
  return <div style={{ position: "absolute", left: x - (w * s) / 2, top: y - (H * s) / 2, width: w * s, height: H * s, borderRadius: radio ?? "50%", border: `${grosor}px solid ${color}`, opacity: 0.8 * (1 - k) }} />;
};

/** Anillo de progreso que se dibuja (círculo o píldora) a la vez que un Contador con la MISMA curva. */
export const Progreso: React.FC<{ t0: number; dur?: number; ancho: number; alto: number; color?: string; grosor?: number; hasta?: number }> = ({ t0, dur = 0.8, ancho, alto, color, grosor = 4, hasta = 1 }) => {
  const t = useSeg();
  const est = useEstilo();
  const p = hasta * tramo(t, t0, t0 + dur, CURVAS.inOut);
  const c = color ?? est.acento;
  return (
    <svg width={ancho} height={alto} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <rect x={grosor / 2} y={grosor / 2} width={ancho - grosor} height={alto - grosor} rx={(alto - grosor) / 2} fill="none" stroke={c} strokeOpacity={0.18} strokeWidth={grosor} />
      <rect x={grosor / 2} y={grosor / 2} width={ancho - grosor} height={alto - grosor} rx={(alto - grosor) / 2} fill="none" stroke={c} strokeWidth={grosor} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${c})` }} />
    </svg>
  );
};

/** Destello: la pantalla se sobreexpone 1–2 fotogramas y decae (tapa cortes y cambios de forma). */
export const Flash: React.FC<{ t0: number; dur?: number; color?: string; fuerza?: number }> = ({ t0, dur = 0.25, color = "#FFFFFF", fuerza = 0.9 }) => {
  const t = useSeg();
  if (t < t0 || t > t0 + dur) return null;
  const a = fuerza * (1 - tramo(t, t0 + 0.02, t0 + dur));
  return <AbsoluteFill style={{ background: color, opacity: a, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Deriva continua: nada queda quieto (≈36 px/s y +2,4 %/s en agencia; +1,5–2,5 %/s en keynote). */
export const Deriva: React.FC<{ vx?: number; vy?: number; zoom?: number; desde?: number; children: React.ReactNode }> = ({ vx = -20, vy = -6, zoom = 0.02, desde = 0, children }) => {
  const t = Math.max(0, useSeg() - desde);
  return <AbsoluteFill style={{ transform: `translate(${vx * t}px, ${vy * t}px) scale(${1 + zoom * t})` }}>{children}</AbsoluteFill>;
};

/**
 * Zoom que ATRAVIESA un punto: escala exponencial acelerada 1→`hasta` hacia (ox, oy) entre t0 y t1, con desenfoque y
 * ecos de aberración. Lo de dentro desaparece en el último 15 %: ahí entra la escena siguiente (match cut).
 */
export const ZoomAtraves: React.FC<{ t0: number; t1: number; ox: number; oy: number; hasta?: number; ecos?: boolean; children: React.ReactNode }> = ({ t0, t1, ox, oy, hasta = 10, ecos = true, children }) => {
  const t = useSeg();
  if (t < t0) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (t > t1) return null;
  const p = (t - t0) / (t1 - t0);
  const s = Math.pow(hasta, p * p);
  const capa = (k: number, op: number, tinte?: string) => (
    <AbsoluteFill key={`${k}${tinte}`} style={{ transform: `scale(${s * (1 + k * 0.04 * p)})`, transformOrigin: `${ox}px ${oy}px`, opacity: op, mixBlendMode: tinte ? "screen" : undefined, filter: `blur(${p * 10}px)${tinte ? ` drop-shadow(0 0 0 ${tinte})` : ""}` }}>{children}</AbsoluteFill>
  );
  return <AbsoluteFill style={{ opacity: 1 - tramo(t, t0 + (t1 - t0) * 0.85, t1, CURVAS.lineal) }}>{[capa(0, 1), ...(ecos ? [capa(1.2, 0.3 * p), capa(2.4, 0.18 * p)] : [])]}</AbsoluteFill>;
};

/** Fuga de luz (quemado de película) de 0,4 s: crema y luego rojo; tapa el cambio de escena. */
export const FugaLuz: React.FC<{ t0: number; dur?: number; colores?: [string, string] }> = ({ t0, dur = 0.4, colores = ["#F3E2A0", "#8A2009"] }) => {
  const t = useSeg();
  if (t < t0 || t > t0 + dur) return null;
  const k = (t - t0) / dur;
  const crema = interpolate(k, [0, 0.3, 0.55], [0, 1, 0], { extrapolateRight: "clamp" });
  const rojo = interpolate(k, [0.3, 0.6, 1], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: crema, background: `radial-gradient(60% 80% at 70% 30%, ${colores[0]}, transparent 70%), ${colores[0]}AA` }} />
      <AbsoluteFill style={{ opacity: rojo * 0.9, background: `radial-gradient(70% 90% at 30% 70%, ${colores[1]}, ${colores[1]}CC 60%, #1A0505)` }} />
    </AbsoluteFill>
  );
};

/** Barrido radial de color desde un objeto puente (que se queda encima): el fondo de la sección cambia en 0,13 s. */
export const BarridoRadial: React.FC<{ t0: number; dur?: number; x: number; y: number; color: string; borde?: string }> = ({ t0, dur = 0.14, x, y, color, borde }) => {
  const t = useSeg();
  if (t < t0) return null;
  const r = tramo(t, t0, t0 + dur, CURVAS.inOut) * 2300;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}px ${y}px, ${color} ${r * 0.86}px, ${borde ?? color} ${r * 0.95}px, transparent ${r}px)` }} />;
};

/** Glitch RGB de 0,2 s: copias desplazadas en rojo/cian y franjas horizontales desplazadas. */
export const Glitch: React.FC<{ t0: number; dur?: number; children: React.ReactNode }> = ({ t0, dur = 0.2, children }) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  if (t < t0 || t > t0 + dur) return <AbsoluteFill>{children}</AbsoluteFill>;
  const g = Math.floor(((t - t0) * fps) / 2);
  const r = (k: number) => random(`gl-${g}-${k}`);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${(r(1) - 0.5) * 30}px)`, mixBlendMode: "screen", filter: "sepia(1) saturate(8) hue-rotate(-50deg)", opacity: 0.7 }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${(r(2) - 0.5) * -30}px)`, mixBlendMode: "screen", filter: "sepia(1) saturate(8) hue-rotate(140deg)", opacity: 0.7 }}>{children}</AbsoluteFill>
      {Array.from({ length: 7 }).map((_, i) => {
        const y0 = r(10 + i) * 95, h = 1 + r(20 + i) * 4;
        return <AbsoluteFill key={i} style={{ clipPath: `inset(${y0}% 0 ${100 - y0 - h}% 0)`, transform: `translateX(${(r(30 + i) - 0.5) * 240}px)` }}>{children}</AbsoluteFill>;
      })}
    </AbsoluteFill>
  );
};

/**
 * Palabra gigante de desenfocada a nítida (intros SaaS): entra en 0,15 s (escala 0,8→1,06→1, desenfoque 14→0, tracking
 * que se cierra), vive ~0,3 s y sale seca en 2 fotogramas. Una sola palabra en pantalla, cada una de un color.
 */
export const Palabra: React.FC<{ texto: string; t0: number; dur?: number; color?: string; tam?: number; style?: React.CSSProperties }> = ({ texto, t0, dur = 0.3, color, tam = 280, style }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0 || t > t0 + dur) return null;
  const f = (t - t0) * 60;
  const op = interpolate(f, [0, 4, dur * 60 - 3, dur * 60 - 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blur = interpolate(f, [0, 9], [14, 0], { extrapolateRight: "clamp", easing: CURVAS.expo });
  const s = interpolate(f, [0, 5, 10], [0.8, 1.06, 1], { extrapolateRight: "clamp" });
  const ls = interpolate(f, [0, 9], [0.06, -0.015], { extrapolateRight: "clamp", easing: CURVAS.expo });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: est.fuente, fontWeight: 650, fontSize: tam, letterSpacing: `${ls}em`, color: color ?? est.texto, opacity: op, transform: `scale(${s})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, whiteSpace: "nowrap", ...style }}>{texto}</div>
    </AbsoluteFill>
  );
};

/** Rodillo de palabra: una palabra se va arriba (expo-in) y la siguiente sube desde abajo (expo-out), 0,22 s. */
export const Rodillo: React.FC<{ palabras: string[]; t0: number; cada?: number; style?: React.CSSProperties }> = ({ palabras, t0, cada = 0.6, style }) => {
  const t = useSeg();
  const i = Math.max(0, Math.min(palabras.length - 1, Math.floor((t - t0) / cada)));
  const g = (t - t0 - i * cada) * 60;
  const vieja = i > 0 ? palabras[i - 1] : "";
  const sal = interpolate(g, [0, 8], [0, -110], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CURVAS.acelera });
  const ent = interpolate(g, [3, 13], [110, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CURVAS.expo });
  if (t < t0) return null;
  return (
    <span style={{ display: "inline-block", overflow: "hidden", height: "1.15em", verticalAlign: "bottom", ...style }}>
      {vieja && <span style={{ display: "block", transform: `translateY(${sal}%)` }}>{vieja}</span>}
      <span style={{ display: "block", marginTop: vieja ? "-1.15em" : 0, transform: `translateY(${i === 0 && g > 13 ? 0 : ent}%)` }}>{palabras[i]}</span>
    </span>
  );
};

/** Tecleo: letras que aparecen de 1 en 1 (o `porFotograma` a 60 fps) con cursor opcional. */
export const Teclea: React.FC<{ texto: string; t0: number; letrasPorSeg?: number; cursor?: boolean; style?: React.CSSProperties }> = ({ texto, t0, letrasPorSeg = 30, cursor = false, style }) => {
  const t = useSeg();
  if (t < t0) return null;
  const n = Math.min(texto.length, Math.floor((t - t0) * letrasPorSeg));
  const parpadea = Math.floor(t * 2.2) % 2 === 0;
  return <span style={{ whiteSpace: "pre", ...style }}>{texto.slice(0, n)}{cursor && (n < texto.length || parpadea) ? "▍" : ""}</span>;
};

/** Láser de escaneo vertical que barre de x0 a x1 (expo-out) y revela lo que hay detrás (`revela` se recorta). */
export const Escaneo: React.FC<{ t0: number; dur?: number; x0: number; x1: number; color?: string; antes: React.ReactNode; despues: React.ReactNode }> = ({ t0, dur = 0.35, x0, x1, color, antes, despues }) => {
  const t = useSeg();
  const est = useEstilo();
  const c = color ?? est.acento;
  const x = x0 + (x1 - x0) * tramo(t, t0, t0 + dur);
  const visible = t >= t0 - 0.07 && t <= t0 + dur + 0.1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${x}px)` }}>{antes}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${1920 - x}px 0 0)` }}>{despues}</AbsoluteFill>
      {visible && <div style={{ position: "absolute", left: x - 2, top: 0, bottom: 0, width: 4, background: c, boxShadow: `0 0 18px ${c}, 0 0 60px ${c}` }} />}
    </AbsoluteFill>
  );
};

/** Chispas que salen de un punto y frenan (cierre con destello). */
export const Chispas: React.FC<{ t0: number; x?: number; y?: number; n?: number; colores?: string[] }> = ({ t0, x = 960, y = 540, n = 60, colores }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0 || t > t0 + 1.5) return null;
  const f = (t - t0) * 60;
  const cs = colores ?? [est.acento, "#FFFFFF"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const ang = random(`ch-a${i}`) * Math.PI * 2, v = 15 + random(`ch-v${i}`) * 12, d = v * 14 * (1 - Math.exp(-f / 14));
        const L = 20 + random(`ch-l${i}`) * 20;
        return <div key={i} style={{ position: "absolute", left: x + Math.cos(ang) * d, top: y + Math.sin(ang) * d, width: L, height: 4, borderRadius: 2, background: cs[i % cs.length], transform: `rotate(${ang}rad)`, opacity: interpolate(f, [0, 60, 90], [1, 1, 0], { extrapolateRight: "clamp" }) }} />;
      })}
    </AbsoluteFill>
  );
};
