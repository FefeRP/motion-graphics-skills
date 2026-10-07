// Base común · el ESTILO como conjunto de ajustes mezclables (no un menú cerrado).
// Un estilo = paleta + tipografía + ritmo + curvas + muelle + luz de fondo + texturas. Todos los componentes de la base
// leen los ajustes de aquí, así que el mismo vídeo cambia de carácter cambiando solo el estilo. Se combinan con
// `mezclar(oscuro, { paleta… de agencia })`, `mezclar(claro, { ritmo: agencia.ritmo })`, etc.
import React, { createContext, useContext } from "react";
import { Easing, spring, useVideoConfig } from "remotion";
import { loadFont as inter } from "@remotion/google-fonts/Inter";

export const INTER = inter("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"], ignoreTooManyRequestsWarning: true }).fontFamily;

export type Bezier = [number, number, number, number];
export type LuzFondo =
  /** cono de luz desde arriba (keynote) */
  | { tipo: "foco"; colores: [string, string] }
  /** halo de un color que deriva y late con los eventos */
  | { tipo: "halo"; colores: [string] }
  /** color plano (con viñeta si se pide) */
  | { tipo: "liso"; colores: [string] }
  /** degradado radial suave (fondos claros) */
  | { tipo: "degradado"; colores: [string, string, string] }
  /** manchas de color que fluyen (gradientes vivos) */
  | { tipo: "manchas"; colores: string[] };

export type TokensEstilo = {
  id: string;
  // paleta
  fondo: string;
  texto: string;
  suave: string;
  acento: string;
  /** colores extra: secciones, rueda de palabras, manchas… */
  paleta?: string[];
  tarjeta: string;
  /** color del texto SOBRE las tarjetas (si la tarjeta es clara en un estilo oscuro, o al revés) */
  textoTarjeta?: string;
  borde: string;
  sombra: string;
  radio: number;
  // tipografía
  fuente: string;
  fuenteTexto: string;
  peso: number;
  tracking: string;
  mayusculas: boolean;
  /** fuente secundaria (serif cursiva, mono…) */
  fuente2?: string;
  // movimiento
  /** pulso de la música y del montaje: un evento por golpe */
  ritmo?: { bpm: number };
  /** curvas de entrada (llegar), salida (irse) y viaje (cámara/paneos) */
  curvas?: { entrada: Bezier; salida: Bezier; viaje: Bezier };
  /** duración típica de una entrada (s) */
  entradaDur?: number;
  /** muelle para los aterrizajes con pegada; `sobrepaso` máximo permitido (0,1 = 10 %); null = sin muelle */
  muelle?: { stiffness: number; damping: number; mass: number; sobrepaso: number } | null;
  // luz y texturas
  luz?: LuzFondo;
  texturas?: { vineta?: number; grano?: number; hud?: boolean; bokeh?: number };
};

export const TOKENS_BASE: TokensEstilo = {
  id: "base", fondo: "#050505", texto: "#FFFFFF", suave: "rgba(255,255,255,0.62)", acento: "#F7A01E",
  tarjeta: "#121214", borde: "rgba(255,255,255,0.10)", sombra: "0 30px 70px rgba(0,0,0,0.7)", radio: 24,
  fuente: INTER, fuenteTexto: INTER, peso: 800, tracking: "-0.045em", mayusculas: false,
  ritmo: { bpm: 120 },
  curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.65, 0, 0.35, 1] },
  entradaDur: 0.35,
  muelle: null,
  luz: { tipo: "liso", colores: ["#050505"] },
  texturas: { vineta: 0.55 },
};

/**
 * Mezcla estilos o ajustes: los posteriores pisan a los anteriores; los objetos (curvas, texturas, ritmo) se mezclan
 * campo a campo. Ej.: `mezclar(OSCURO, { acento: "#FF3B30" })`, `mezclar(CLARO, { ritmo: AGENCIA.ritmo, curvas: AGENCIA.curvas })`.
 */
export const mezclar = (...partes: Partial<TokensEstilo>[]): TokensEstilo => {
  const out: Record<string, unknown> = { ...TOKENS_BASE };
  for (const p of partes) {
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) continue;
      const prev = out[k];
      out[k] = v && typeof v === "object" && !Array.isArray(v) && prev && typeof prev === "object" && !Array.isArray(prev) && k !== "luz" ? { ...(prev as object), ...(v as object) } : v;
    }
  }
  return out as TokensEstilo;
};

const Ctx = createContext<TokensEstilo>(TOKENS_BASE);
export const EstiloProvider: React.FC<{ tokens: TokensEstilo; children: React.ReactNode }> = ({ tokens, children }) => <Ctx.Provider value={tokens}>{children}</Ctx.Provider>;
export const useEstilo = () => useContext(Ctx);

/** Estilo de titular del estilo actual (para envolver Golpe, Mascara, etc.). */
export const useTitular = (tam: number): React.CSSProperties => {
  const e = useEstilo();
  return { fontFamily: e.fuente, fontWeight: e.peso, letterSpacing: e.tracking, color: e.texto, fontSize: tam, lineHeight: 1.02, textTransform: e.mayusculas ? "uppercase" : undefined };
};

/** Curva del estilo actual como función 0→1. */
export const useCurva = (tipo: "entrada" | "salida" | "viaje" = "entrada") => {
  const e = useEstilo();
  const b = (e.curvas ?? TOKENS_BASE.curvas!)[tipo];
  return Easing.bezier(b[0], b[1], b[2], b[3]);
};

/**
 * Muelle CONTROLADO: valor 0→1 desde `t0` con la pegada del estilo, pero con el sobrepaso recortado a `sobrepaso`
 * (nunca rebotes raros). Si el estilo no tiene muelle, devuelve una entrada con su curva normal.
 */
export const useMuelle = (t: number, t0: number, ajuste?: Partial<NonNullable<TokensEstilo["muelle"]>>) => {
  const e = useEstilo();
  const { fps } = useVideoConfig();
  const ent = useCurva("entrada");
  const m = e.muelle ? { ...e.muelle, ...ajuste } : ajuste?.stiffness ? { stiffness: 170, damping: 14, mass: 1, sobrepaso: 0.1, ...ajuste } : null;
  if (!m) return ent(Math.max(0, Math.min(1, (t - t0) / (e.entradaDur ?? 0.35))));
  const v = spring({ frame: (t - t0) * fps, fps, config: { stiffness: m.stiffness, damping: m.damping, mass: m.mass } });
  // recorta el sobrepaso de forma suave: lo que pase de 1 se comprime para no superar `sobrepaso`
  if (v <= 1) return v;
  const ex = v - 1;
  return 1 + m.sobrepaso * (1 - Math.exp(-ex / Math.max(0.001, m.sobrepaso)));
};

/** Segundos del golpe n según el ritmo del estilo (para clavar cortes y entradas a la música). */
export const useGolpe = () => {
  const e = useEstilo();
  const bpm = e.ritmo?.bpm ?? 120;
  return (n: number, desde = 0) => desde + (n * 60) / bpm;
};
