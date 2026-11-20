// Variante AGENCIA-PUNTO (reel de estudio: un punto rojo que lo es todo + una nube de puntos que cambia de forma).
// Medida en referencias/motion-graphics/analisis/a-fondo-agencia-reel.md: 128 BPM, un color plano por compás, HUD tipo
// DIN con casillas de tiempo, muelles con sobrepaso del 6–26 % (12 % típico) y pico a ~0,17 s.
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as sourceSerif } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as barlow } from "@remotion/google-fonts/Barlow";
import { mezclar } from "../base";
import { AGENCIA } from "./index";

const op = { subsets: ["latin" as const], ignoreTooManyRequestsWarning: true };
/** Display: geométrica negra, ancha y redonda. */
export const MONTSERRAT = montserrat("normal", { weights: ["800", "900"], ...op }).fontFamily;
/** Serif recta seminegrita del logotipo final. */
export const SOURCE_SERIF = sourceSerif("normal", { weights: ["600"], ...op }).fontFamily;
/** HUD, etiquetas y pie: grotesca técnica tipo DIN. */
export const BARLOW = barlow("normal", { weights: ["400", "500", "700"], ...op }).fontFamily;

/** Paleta muestreada en parches (hex). */
export const COLORES_PUNTO = {
  negro: "#110E14", tinta: "#120E14", rojo: "#FA4C2E", crema: "#E9E2DB", azul: "#2B43F8", amarillo: "#F5C139",
  claro: "#F2EDE6", particula: "#E6EEF8", cremaCinta: "#EAE6DA", naranja: "#F08A3A", aro: "#B5B5B8", textoAnillo: "#EEE4E2", gris: "#77716B",
};

export const AGENCIA_PUNTO = mezclar(AGENCIA, {
  id: "agencia-punto",
  fondo: COLORES_PUNTO.negro, texto: COLORES_PUNTO.claro, suave: "rgba(242,237,230,0.55)", acento: COLORES_PUNTO.rojo,
  tarjeta: COLORES_PUNTO.crema, textoTarjeta: COLORES_PUNTO.tinta,
  paleta: [COLORES_PUNTO.rojo, COLORES_PUNTO.azul, COLORES_PUNTO.amarillo, COLORES_PUNTO.crema, COLORES_PUNTO.negro],
  fuente: MONTSERRAT, peso: 900, tracking: "-0.01em", mayusculas: true, fuente2: SOURCE_SERIF, fuenteTexto: BARLOW,
  ritmo: { bpm: 128 }, entradaDur: 0.2,
  // pico en 5 fotogramas a 30 (0,17 s) y sobrepaso recortado al 12 % (las divisiones del punto llegan al 23 %)
  muelle: { stiffness: 260, damping: 14, mass: 1, sobrepaso: 0.12 },
  luz: { tipo: "liso", colores: [COLORES_PUNTO.negro] }, texturas: { vineta: 0.12, hud: true },
});
