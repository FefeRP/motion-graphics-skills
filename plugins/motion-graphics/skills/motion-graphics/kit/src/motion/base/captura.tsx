// Base común · vía 2: la captura ENTERA (web, app, panel) dentro de un marco de navegador o de móvil, con un recorrido
// de cámara por claves (punto mirado + zoom) y resaltes que se dibujan. Úsala cuando lo que importa es reconocer la
// pantalla real tal cual (una web conocida, un tutorial). Si hay que animar sus partes, mejor la vía 1 (recrear) o la
// vía 3 (recortar piezas con `Pieza` o `scripts/recortar.mjs`).
import React from "react";
import { Img, staticFile } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pista, tramo, useSeg, type Clave } from "./tiempo";

/** Punto mirado de la captura (0–1) y zoom; PCHIP entre claves (sin frenar en cada una). */
export type ClaveCaptura = { t: number; x?: number; y?: number; z?: number; para?: boolean };
export type Resalte = { x: number; y: number; w: number; h: number; t: number; hasta?: number };

/**
 * Captura entera en un marco. `marco`: "navegador" (barra con URL), "movil" (bisel y esquinas) o "nada".
 * `ancho`/`alto` del hueco en pantalla; la imagen se recorre por `claves`. `resaltes` dibujan un borde de acento.
 */
export const Captura: React.FC<{ imagen: string; aspecto?: number; ancho: number; alto: number; claves?: ClaveCaptura[]; marco?: "navegador" | "movil" | "nada"; url?: string; resaltes?: Resalte[]; style?: React.CSSProperties }> = ({ imagen, aspecto = 16 / 9, ancho, alto, claves = [{ t: 0, x: 0.5, y: 0.5, z: 1 }], marco = "navegador", url, resaltes = [], style }) => {
  const t = useSeg();
  const est = useEstilo();
  const c = pista(claves as Clave[], t, ["x", "y", "z"] as const, { x: 0.5, y: 0.5, z: 1 });
  const barra = marco === "navegador" ? Math.round(ancho * 0.028) : 0;
  const hH = alto - barra;
  // la imagen ocupa el ancho del hueco a zoom 1; el punto (x, y) queda en el centro del hueco
  const W = ancho * c.z, H = W / aspecto;
  const left = ancho / 2 - c.x * W, top = hH / 2 - c.y * H;
  const lim = (v: number, min: number) => Math.min(0, Math.max(min, v)); // nunca enseña fuera de la captura
  const L = lim(left, ancho - W), T = lim(top, hH - H);
  return (
    <div style={{ width: ancho, height: alto, borderRadius: marco === "movil" ? ancho * 0.12 : est.radio * 0.6, overflow: "hidden", position: "relative", background: "#0B0B0C",
      boxShadow: `${est.sombra}, 0 0 0 ${marco === "movil" ? ancho * 0.025 : 1}px ${marco === "movil" ? "#1C1C1E" : est.borde}`, ...style }}>
      {marco === "navegador" && (
        <div style={{ height: barra, display: "flex", alignItems: "center", gap: barra * 0.22, padding: `0 ${barra * 0.45}px`, background: "#141416" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => <div key={col} style={{ width: barra * 0.27, height: barra * 0.27, borderRadius: barra, background: col, opacity: 0.85 }} />)}
          {url && <div style={{ marginLeft: barra * 0.5, height: barra * 0.58, padding: `0 ${barra * 0.4}px`, borderRadius: barra, background: "#1E1E21", fontFamily: est.fuenteTexto, fontSize: barra * 0.34, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center" }}>{url}</div>}
        </div>
      )}
      <div style={{ position: "relative", width: ancho, height: hH, overflow: "hidden" }}>
        <Img src={staticFile(imagen)} style={{ position: "absolute", width: W, height: H, left: L, top: T, maxWidth: "none" }} />
        {resaltes.map((r, i) => {
          const k = tramo(t, r.t, r.t + 0.35, CURVAS.expo);
          const fuera = r.hasta !== undefined ? tramo(t, r.hasta, r.hasta + 0.25) : 0;
          if (k <= 0 || fuera >= 1) return null;
          return <div key={i} style={{ position: "absolute", left: L + r.x * W, top: T + r.y * H, width: r.w * W, height: r.h * H, borderRadius: 12, border: `3px solid ${est.acento}`, boxShadow: `0 0 30px ${est.acento}88`, opacity: k * (1 - fuera), transform: `scale(${1.08 - 0.08 * k})` }} />;
        })}
      </div>
    </div>
  );
};
