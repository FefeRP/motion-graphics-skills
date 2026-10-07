// Base común · tipografía cinética. Todos leen colores y fuente del estilo (useEstilo); `style` lo sobreescribe.
import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { useCurva, useEstilo } from "./estilo";
import { CURVAS, tramo, useSeg } from "./tiempo";

const GLIFOS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#%&";

/** Texto que se descifra letra a letra (glifos aleatorios que se asientan de izquierda a derecha). */
export const Descifra: React.FC<{ texto: string; t0: number; dur?: number; style?: React.CSSProperties }> = ({ texto, t0, dur = 0.6, style }) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const k = (t - t0) / dur;
  if (k < 0) return null;
  const fr = Math.floor(t * fps * 0.5); // cambia de glifo cada 2 fotogramas a 60 fps (como a 30 fps en la referencia)
  const out = Array.from(texto).map((ch, i) => {
    if (ch === " " || k >= 1) return ch;
    const umbral = i / texto.length;
    if (k > umbral + 0.25) return ch;
    if (k < umbral) return " ";
    return GLIFOS[(fr * 7 + i * 13) % GLIFOS.length];
  }).join("");
  return <span style={{ whiteSpace: "pre", ...style }}>{out}</span>;
};

/** Palabras que suben desde una máscara (bajo su línea) con escalón; salen subiendo. La entrada clásica de titulares. */
export const Mascara: React.FC<{ texto: string; t0: number; t1?: number; escalon?: number; dur?: number; style?: React.CSSProperties; acento?: string[] }> = ({ texto, t0, t1, escalon = 0.06, dur: durP, style, acento = [] }) => {
  const t = useSeg();
  const est = useEstilo();
  const ent = useCurva("entrada");
  const dur = durP ?? Math.max(0.3, (est.entradaDur ?? 0.35) * 1.3);
  const pal = texto.split(" ");
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "0 0.26em", ...style }}>
      {pal.map((w, i) => {
        const k = tramo(t, t0 + i * escalon, t0 + i * escalon + dur, ent);
        const s = t1 === undefined ? 0 : tramo(t, t1 + i * escalon * 0.5, t1 + i * escalon * 0.5 + 0.35, CURVAS.acelera);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.04em 0 0.1em" }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 105 - s * 105}%)`, color: acento.includes(w) ? est.acento : undefined }}>{w}</span>
          </span>
        );
      })}
    </span>
  );
};

/** Líneas que suben desde su máscara (una por línea, escalón 0,07 s): titulares de agencia en mayúsculas. */
export const Lineas: React.FC<{ lineas: string[]; t0: number; t1?: number; escalon?: number; dur?: number; style?: React.CSSProperties; estiloLinea?: (i: number) => React.CSSProperties }> = ({ lineas, t0, t1, escalon = 0.07, dur: durP, style, estiloLinea }) => {
  const t = useSeg();
  const est = useEstilo();
  const ent = useCurva("entrada");
  const dur = durP ?? Math.max(0.16, est.entradaDur ?? 0.35);
  return (
    <div style={style}>
      {lineas.map((l, i) => {
        const k = tramo(t, t0 + i * escalon, t0 + i * escalon + dur, ent);
        const s = t1 === undefined ? 0 : tramo(t, t1 + i * escalon * 0.5, t1 + i * escalon * 0.5 + 0.3, CURVAS.acelera);
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
            <div style={{ transform: `translateY(${(1 - k) * 110 - s * 110}%)`, ...estiloLinea?.(i) }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Letra a letra: cada letra entra con escala, subida y desenfoque (escalón 0,03 s). */
export const PorLetra: React.FC<{ texto: string; t0: number; escalon?: number; dur?: number; desde?: { y?: number; s?: number; blur?: number }; style?: React.CSSProperties }> = ({ texto, t0, escalon = 0.03, dur = 0.45, desde = {}, style }) => {
  const t = useSeg();
  const { y = 0.4, s = 0.6, blur = 10 } = desde;
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {Array.from(texto).map((ch, i) => {
        const k = tramo(t, t0 + i * escalon, t0 + i * escalon + dur);
        return <span key={i} style={{ display: "inline-block", opacity: Math.min(1, k * 1.6), transform: `translateY(${(1 - k) * y}em) scale(${interpolate(k, [0, 1], [s, 1])})`, filter: k < 0.98 ? `blur(${(1 - k) * blur}px)` : undefined }}>{ch}</span>;
      })}
    </span>
  );
};

/** Palabra que golpea al ritmo: entra grande y desenfocada con estela, se clava y sale de golpe (0,07 s). */
export const Golpe: React.FC<{ texto: string; t0: number; t1: number; desde?: number; estela?: boolean; style?: React.CSSProperties }> = ({ texto, t0, t1, desde = 1.6, estela = true, style }) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < t0 || t > t1 + 0.07) return null;
  const k = tramo(t, t0, t0 + 0.28);
  const s = tramo(t, t1, t1 + 0.07, CURVAS.acelera);
  const esc = interpolate(k, [0, 1], [desde, 1]) * (1 + s * 0.5);
  const e = estela ? (1 - k) * 0.5 : 0;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {[0.18, 0.36].map((d, i) => e > 0.02 && <span key={i} style={{ position: "absolute", left: 0, top: 0, display: "inline-block", whiteSpace: "nowrap", transform: `scale(${esc * (1 + d)})`, filter: `blur(${8 + i * 6}px)`, opacity: e * (0.6 - i * 0.25), color: est.acento, ...style }}>{texto}</span>)}
      <span style={{ display: "inline-block", whiteSpace: "nowrap", transform: `scale(${esc})`, filter: k < 0.98 || s > 0 ? `blur(${(1 - k) * 14 + s * 10}px)` : undefined, opacity: Math.min(1, k * 2) * (1 - s), ...style }}>{texto}</span>
    </span>
  );
};

/** Cifra que cuenta de `desde` a `hasta` (expo-out, cifras tabulares). */
export const Contador: React.FC<{ hasta: number; desde?: number; t0: number; dur?: number; decimales?: number; prefijo?: string; sufijo?: string; style?: React.CSSProperties }> = ({ hasta, desde = 0, t0, dur = 1.2, decimales = 0, prefijo = "", sufijo = "", style }) => {
  const t = useSeg();
  const v = desde + (hasta - desde) * tramo(t, t0, t0 + dur);
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{prefijo}{v.toLocaleString("es-ES", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}{sufijo}</span>;
};

/** Texto en contorno que se dibuja (trazo SVG) y luego se rellena: el «neón» de las keynote. */
export const Neon: React.FC<{ texto: string; t0: number; dibuja?: number; rellena?: number; tam: number; ancho: number; color?: string; style?: React.CSSProperties }> = ({ texto, t0, dibuja = 0.9, rellena = 0.4, tam, ancho, color, style }) => {
  const t = useSeg();
  const est = useEstilo();
  const c = color ?? est.acento;
  const k = tramo(t, t0, t0 + dibuja, CURVAS.inOut);
  const r = tramo(t, t0 + dibuja * 0.8, t0 + dibuja * 0.8 + rellena);
  const L = ancho * 3;
  return (
    <svg width={ancho} height={tam * 1.25} style={{ overflow: "visible", ...style }}>
      <text x="50%" y={tam} textAnchor="middle" fontFamily={est.fuente} fontWeight={est.peso} fontSize={tam} letterSpacing={est.tracking}
        fill={c} fillOpacity={r} stroke={c} strokeWidth={2} strokeDasharray={L} strokeDashoffset={L * (1 - k)}
        style={{ filter: `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 16px ${c}99)` }}>{texto}</text>
    </svg>
  );
};

/** Anillo de texto 3D que gira (cilindro): apertura de agencia. Letras repartidas en 360°, `vel` grados/s. */
export const Anillo: React.FC<{ texto: string; radio?: number; vel?: number; tam?: number; inclinacion?: number; color?: string; style?: React.CSSProperties }> = ({ texto, radio = 620, vel = 66, tam = 110, inclinacion = -14, color, style }) => {
  const t = useSeg();
  const est = useEstilo();
  const letras = Array.from(texto);
  const paso = 360 / letras.length;
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", perspective: 2400, transformStyle: "preserve-3d" }}>
      <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${inclinacion}deg) rotateY(${-t * vel}deg)` }}>
        {letras.map((ch, i) => (
          <span key={i} style={{ position: "absolute", left: 0, top: 0, transform: `rotateY(${i * paso}deg) translateZ(${radio}px) translate(-50%, -50%)`, fontFamily: est.fuente, fontWeight: est.peso, fontSize: tam, color: color ?? est.texto, backfaceVisibility: "hidden", textTransform: "uppercase", ...style }}>{ch}</span>
        ))}
      </div>
    </div>
  );
};
