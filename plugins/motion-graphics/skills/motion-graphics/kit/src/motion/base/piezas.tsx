// Base común · piezas con trayectoria propia. Una pieza ENTRA (desde fuera o desde el fondo), SE COLOCA, puede
// REORDENARSE (cambia de sitio pasando por delante, z +120–300) y SALE. Nunca queda quieta y sola en pantalla.
import React from "react";
import { Img, staticFile, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pista, tramo, useSeg, type Clave } from "./tiempo";

/** Clave de una pieza: posición (mundo o pantalla), giros, escala `s`, opacidad `o` y desenfoque `b` (px, para entradas 2D). */
export type ClavePieza = { t: number; x: number; y: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number; o?: number; b?: number; para?: boolean };

const CAMPOS = ["x", "y", "z", "rx", "ry", "rz", "s", "o", "b"] as const;
export const piezaEn = (claves: ClavePieza[], t: number) => pista(claves as Clave[], t, CAMPOS, { s: 1, o: 1 });

/**
 * Contenedor genérico con trayectoria: cualquier contenido (tarjeta HTML, texto, icono, imagen) se mueve según sus
 * claves. Sale de escena tras la última clave salvo `queda`. `b` (desenfoque) solo fuera de <Camara> (2D).
 */
export const Movil: React.FC<{ claves: ClavePieza[]; ancho?: number; alto?: number; queda?: boolean; estela?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ claves, ancho, alto, queda, estela = 0, children, style }) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const id = "est" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const fin = claves[claves.length - 1].t;
  if (t < claves[0].t - 0.02 || (!queda && t > fin + 0.02)) return null;
  const e = piezaEn(claves, Math.min(t, fin));
  if (e.o <= 0.003) return null;
  // estela direccional: desenfoque SOLO en la dirección del movimiento, proporcional a la velocidad (px/fotograma)
  let filtro = e.b > 0.2 ? `blur(${e.b.toFixed(2)}px)` : undefined;
  let bx = 0, by = 0;
  if (estela > 0 && t <= fin) {
    const q = piezaEn(claves, Math.max(claves[0].t, t - 1 / fps));
    bx = Math.min(60, Math.abs(e.x - q.x) * estela * (60 / fps));
    by = Math.min(60, Math.abs(e.y - q.y) * estela * (60 / fps));
    if (bx > 0.4 || by > 0.4) filtro = `url(#${id})${filtro ? " " + filtro : ""}`;
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, e.o), transformStyle: "preserve-3d", filter: filtro,
      transform: `translate3d(${e.x}px, ${e.y}px, ${e.z}px) rotateX(${e.rx}deg) rotateY(${e.ry}deg) rotateZ(${e.rz}deg) scale(${e.s}) translate(-50%, -50%)`, width: ancho, height: alto, ...style }}>
      {(bx > 0.4 || by > 0.4) && <svg width={0} height={0} style={{ position: "absolute" }}><filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={`${bx.toFixed(1)} ${by.toFixed(1)}`} /></filter></svg>}
      {children}
    </div>
  );
};

/**
 * Trozo recortado de una captura real (rect 0–1 de la imagen) con trayectoria. `brillo` = [t0, t1] con el borde de
 * acento encendido; `revela` = [t0, t1] destapa el contenido de arriba abajo (líneas de consola que aparecen).
 */
export const Pieza: React.FC<{ imagen: string; rect: [number, number, number, number]; ancho: number; aspecto?: number; claves: ClavePieza[]; brillo?: [number, number]; revela?: [number, number]; fondoRevela?: string; radio?: number; sombra?: boolean; queda?: boolean; estela?: number; mascara?: "difuminada" }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const [rx, ry, rw, rh] = p.rect;
  const asp = p.aspecto ?? 16 / 9;
  const W = p.ancho, H = (W * rh) / rw / asp;
  const fullW = W / rw, fullH = fullW / asp;
  const b = p.brillo ? Math.min(tramo(t, p.brillo[0], p.brillo[0] + 0.25), 1 - tramo(t, p.brillo[1], p.brillo[1] + 0.3)) : 0;
  const rev = p.revela ? tramo(t, p.revela[0], p.revela[1], CURVAS.lineal) : 1;
  return (
    <Movil claves={p.claves} queda={p.queda} ancho={W} alto={H} estela={p.estela}>
      <div style={{ width: W, height: H, overflow: "hidden", borderRadius: p.radio ?? Math.min(W, H) * 0.08, position: "relative", background: est.tarjeta,
        // borde difuminado: para recortes cuyo borde no es limpio (sin tarjeta detrás); se recomienda sombra={false}
        WebkitMaskImage: p.mascara === "difuminada" ? "radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)" : undefined,
        boxShadow: `${p.sombra === false ? `0 0 0 1px ${est.borde}` : `${est.sombra}, 0 0 0 1px ${est.borde}`}${b > 0 ? `, 0 0 0 ${2 * b}px ${est.acento}, 0 0 ${60 * b}px ${est.acento}80` : ""}` }}>
        <Img src={staticFile(p.imagen)} style={{ position: "absolute", width: fullW, height: fullH, left: -rx * fullW, top: -ry * fullH, maxWidth: "none" }} />
        {rev < 1 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(1 - rev) * 100}%`, background: p.fondoRevela ?? est.tarjeta }} />}
      </div>
    </Movil>
  );
};

/** Tarjeta HTML con la superficie del estilo (para maquetas de interfaz hechas a mano: filas, botones, gráficas). */
export const Tarjeta: React.FC<{ ancho: number; alto?: number; padding?: number; brillo?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ ancho, alto, padding = 28, brillo = 0, children, style }) => {
  const est = useEstilo();
  return (
    <div style={{ width: ancho, height: alto, padding, boxSizing: "border-box", borderRadius: est.radio, background: est.tarjeta, color: est.textoTarjeta ?? est.texto, fontFamily: est.fuenteTexto,
      boxShadow: `${est.sombra}, 0 0 0 1px ${est.borde}${brillo > 0 ? `, 0 0 0 ${2 * brillo}px ${est.acento}, 0 0 ${50 * brillo}px ${est.acento}80` : ""}`, ...style }}>
      {children}
    </div>
  );
};

/**
 * Receta de trayectoria típica: entra desde (dx, dy, dz) con giro, se coloca en (x, y) en `dur` s y, si se da `sale`,
 * se va hacia (sx, sy). Devuelve claves listas para Movil/Pieza.
 */
export const entraSale = (o: { t0: number; x: number; y: number; z?: number; desde?: Partial<ClavePieza>; dur?: number; sale?: number; hacia?: Partial<ClavePieza>; durSale?: number; deriva?: [number, number] }): ClavePieza[] => {
  const dur = o.dur ?? 0.5, z = o.z ?? 0;
  const llega: ClavePieza = { t: o.t0 + dur, x: o.x, y: o.y, z, o: 1, s: 1, rx: 0, ry: 0, rz: 0, b: 0 };
  const cl: ClavePieza[] = [{ t: o.t0, x: o.x, y: o.y, z, o: 0, s: 1, rx: 0, ry: 0, rz: 0, b: 0, ...o.desde }, llega];
  if (o.sale !== undefined) {
    // deriva lenta mientras está colocada: nunca quieta
    const [dx, dy] = o.deriva ?? [0, -14];
    cl.push({ ...llega, t: o.sale, x: o.x + dx, y: o.y + dy });
    cl.push({ ...llega, t: o.sale + (o.durSale ?? 0.35), x: o.x + dx, y: o.y + dy, o: 0, ...o.hacia });
  }
  return cl;
};
