// Capas de estilo encima de la base común (src/motion/base). Cada una = tokens medidos en sus referencias
// (referencias/motion-graphics/analisis/a-fondo-*.md) + su fondo/acabado firma. Las recetas, en la skill de cada estilo.
//  · oscuro  ← keynotes de producto: casi negro con LUZ (foco arriba o halo de marca), un acento.
//  · claro   ← intros de SaaS: gris claro, palabras gigantes de desenfoque a nítido, color por palabra.
//  · agencia ← Iván García / Hyperframes: un color saturado por compás, display ancha + serif cursiva + mono, HUD.
import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as syne } from "@remotion/google-fonts/Syne";
import { loadFont as instrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as jetbrains } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as sora } from "@remotion/google-fonts/Sora";
import { Halo, INTER, TOKENS_BASE, Vineta, mezclar, useSeg, type TokensEstilo } from "../base";

const op = { subsets: ["latin" as const, "latin-ext" as const], ignoreTooManyRequestsWarning: true };
export const SYNE = syne("normal", { weights: ["700", "800"], ...op }).fontFamily;
export const SERIF = instrumentSerif("italic", { weights: ["400"], ...op }).fontFamily;
export const SORA = sora("normal", { weights: ["600", "700"], ...op }).fontFamily;
export const MONO = jetbrains("normal", { weights: ["400", "500"], subsets: ["latin"], ignoreTooManyRequestsWarning: true }).fontFamily;

// ───────── OSCURO ─────────
export const OSCURO: TokensEstilo = mezclar({
  id: "oscuro", fondo: "#080808", texto: "#F5F5F7", suave: "#8E8E93", acento: "#14E3E2",
  tarjeta: "#161616", borde: "rgba(255,255,255,0.07)", sombra: "0 40px 90px rgba(0,0,0,0.75)", radio: 36,
  fuente: INTER, fuenteTexto: INTER, peso: 600, tracking: "-0.02em", mayusculas: false,
  // medido: un evento cada 0,5 s (120–132 BPM), entradas expo 0,25–0,4 s, rebote solo en el clímax (~10 %)
  ritmo: { bpm: 120 }, entradaDur: 0.35, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.65, 0, 0.35, 1] },
  muelle: { stiffness: 760, damping: 23, mass: 0.5, sobrepaso: 0.1 },
  luz: { tipo: "foco", colores: ["#332C3B", "#1A1720"] }, texturas: { vineta: 0.6, bokeh: 0 },
});
/** Variantes de luz del estilo oscuro: `foco` (cono de luz arriba, violáceo) o `halo` (halo de marca que se mueve y late). */
export const FondoOscuro: React.FC<{ luz?: "foco" | "halo"; color?: string; intensidad?: number }> = ({ luz = "foco", color, intensidad = 1 }) => (
  <AbsoluteFill style={{ background: "#080808" }}>
    {luz === "foco"
      ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 58% 48% at 50% 0%, #332C3B 0%, #1A1720 45%, rgba(8,8,8,0) 100%)", opacity: intensidad }} />
      : <Halo color={color ?? "#81CF32"} fuerza={0.6 * intensidad} y={50} tam={50} />}
    <Vineta fuerza={0.6} />
  </AbsoluteFill>
);

// ───────── CLARO ─────────
export const CLARO: TokensEstilo = mezclar({
  id: "claro", fondo: "#E4E5EA", texto: "#1D1D1F", suave: "#6E6E73", acento: "#2B35E0",
  tarjeta: "#FFFFFF", borde: "rgba(0,0,0,0.06)", sombra: "0 2px 4px rgba(0,0,0,0.03), 0 12px 24px -4px rgba(0,0,0,0.07), 0 30px 60px -12px rgba(0,0,0,0.10)", radio: 28,
  fuente: INTER, fuenteTexto: INTER, peso: 650, tracking: "-0.015em", mayusculas: false,
  paleta: ["#2B35E0", "#7A2FD0", "#D0306E", "#E8571C", "#5DBB63"],
  // medido: entradas de 0,12–0,17 s de desenfocado a nítido, sobrepaso grande sin rebote (claves, no muelle)
  ritmo: { bpm: 108 }, entradaDur: 0.16, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.7, 0, 0.84, 0], viaje: [0.33, 1, 0.68, 1] },
  muelle: null, luz: { tipo: "degradado", colores: ["#EEEEF2", "#E4E5EA", "#D9DBDF"] }, texturas: { vineta: 0 },
});
/** Rueda de colores de las palabras (una por palabra). */
export const RUEDA_CLARO = ["#2B35E0", "#7A2FD0", "#D0306E", "#E8571C", "#5DBB63"];
export const FondoClaro: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #EEEEF2 0%, #E4E5EA 60%, #D9DBDF 100%)" }} />
);

// ───────── AGENCIA ─────────
export const COLORES_AGENCIA = { azul: "#2B2BF0", rojo: "#E8302A", lima: "#C6FF1A", crema: "#F2EDE2", negro: "#0F0F13", morado: "#140A2E", moradoLuz: "#3B1D7A" };
export const AGENCIA: TokensEstilo = mezclar({
  id: "agencia", fondo: COLORES_AGENCIA.negro, texto: COLORES_AGENCIA.crema, suave: "rgba(242,237,226,0.6)", acento: COLORES_AGENCIA.lima,
  tarjeta: COLORES_AGENCIA.crema, textoTarjeta: COLORES_AGENCIA.negro, borde: "rgba(255,255,255,0.25)", sombra: "0 30px 60px rgba(0,0,0,0.3)", radio: 18,
  fuente: SYNE, fuenteTexto: INTER, peso: 800, tracking: "-0.03em", mayusculas: true, fuente2: SERIF,
  paleta: [COLORES_AGENCIA.azul, COLORES_AGENCIA.rojo, COLORES_AGENCIA.lima, COLORES_AGENCIA.negro, COLORES_AGENCIA.morado],
  // medido: 128 BPM, una sección por compás, expo muy fuerte (81 % del camino por fotograma a 60 fps), muelle 35 % solo en morphs
  ritmo: { bpm: 128 }, entradaDur: 0.37, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.32, 0, 0.67, 0], viaje: [0.83, 0, 0.17, 1] },
  muelle: { stiffness: 340, damping: 12, mass: 1, sobrepaso: 0.35 },
  luz: { tipo: "liso", colores: [COLORES_AGENCIA.negro] }, texturas: { vineta: 0.4, hud: true },
});

// ───────── VARIANTES (no son estilos nuevos: son mezclas de los 3, medidas en otras referencias) ─────────
/** Oscuro con halo de marca que se mueve y late (lanzamiento de app tipo tienda o streaming). */
export const OSCURO_HALO = mezclar(OSCURO, { id: "oscuro-halo", acento: "#1ED760", luz: { tipo: "halo", colores: ["#1ED760"] }, texturas: { vineta: 0.6, bokeh: 0.5 } });
/** Oscuro sobre negro puro con luz naranja: líneas de luz, tarjetas con brillo, estroboscopios (portfolio). */
export const OSCURO_BRASA = mezclar(OSCURO, { id: "oscuro-brasa", fondo: "#000000", acento: "#EF5023", luz: { tipo: "halo", colores: ["#DD5E27"] }, texturas: { vineta: 0.5 }, paleta: ["#DD5E27", "#A53F1C", "#FFFFE8", "#10AFDF"] });
/** Oscuro casi negro con luz turquesa centrada; cortes por continuidad de velocidad (producto de productividad). */
export const OSCURO_TURQUESA = mezclar(OSCURO, { id: "oscuro-turquesa", fondo: "#000306", acento: "#18D9C9", luz: { tipo: "halo", colores: ["#0E6E6A"] }, texturas: { vineta: 0.6 }, paleta: ["#18D9C9", "#60AAE1", "#0433EC"] });
/** Claro con manchas líquidas lima y frases que siguen a la voz (producto creativo, IA). */
export const CLARO_LIMA = mezclar(CLARO, { id: "claro-lima", fondo: "#FAF9FB", texto: "#183527", acento: "#86BA00", fuente: SORA, peso: 650,
  paleta: ["#9CD20A", "#C9E800", "#7EAE01"], luz: { tipo: "manchas", colores: ["#9CD20A", "#C9E800", "#7EAE01"] }, ritmo: { bpm: 124 } });

/** Todos los estilos y variantes por nombre (para pedir "estilo X" o mezclar: `mezclar(ESTILOS.oscuro, { acento: … })`). */
export const ESTILOS = { oscuro: OSCURO, claro: CLARO, agencia: AGENCIA, "oscuro-halo": OSCURO_HALO, "oscuro-brasa": OSCURO_BRASA, "oscuro-turquesa": OSCURO_TURQUESA, "claro-lima": CLARO_LIMA };
export type NombreEstilo = keyof typeof ESTILOS;
/** Código de tiempo del HUD (00:00:SS:FF), calculado del fotograma: corre siempre, une todas las escenas. */
export const useTimecode = () => {
  const t = useSeg();
  const s = Math.floor(t), f = Math.floor((t - s) * 30);
  return `00:00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};
