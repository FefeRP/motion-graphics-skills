// Variante OSCURO-COBRE (keynote cálida con serif editorial): negro cálido-violáceo con halos cobre, un acento naranja
// y la regla "todo nace con luz y se enfría". Paleta muestreada en ref-serif-calido (análisis:
// referencias/motion-graphics/analisis/a-fondo-serif-calido.md §6 y §8). Componentes firma: src/motion/base/cobre.tsx.
import { loadFont as ebGaramond } from "@remotion/google-fonts/EBGaramond";
import { INTER, mezclar } from "../base";
import { OSCURO } from "./index";

export const EB_GARAMOND = ebGaramond("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"], ignoreTooManyRequestsWarning: true }).fontFamily;

/** Colores medidos además de los tokens (para escenas que los necesiten por nombre). */
export const COBRE = {
  fondo: "#0B080C", haloCaja: "#6B3E2D", haloLejano: "#482820", haloFondo: "#351E1B", bloom: "#352220", luzDiagonal: "#180901",
  acento: "#D87457", boton: "#D67051", pulsado: "#F5B694", estallido: "#F6B38A",
  meteoroNucleo: "#FDF994", meteoroHalo: "#E16726", meteoroMedio: "#9E4921", meteoroLejano: "#72331A",
  textoSaludo: "#FFFFFF", textoMarca: "#E1DBE0", textoBrasa: "#FFEEEA", glifo: "#FECEBD", selector: "#B0AAAC", pildora: "#252325",
  cursorTexto: "#E5BD9A", cristal: "#261F1E", luzInterior: ["#BF8F76", "#EFC5A9"] as [string, string], codigoCaliente: "#E5AC91", codigoFrio: "#F7E5E0",
  ondaCresta: "#B58E73", ondaValle: "#2F1815",
};

export const OSCURO_COBRE = mezclar(OSCURO, {
  id: "oscuro-cobre", fondo: COBRE.fondo, texto: "#F5F0EC", suave: COBRE.selector, acento: COBRE.acento,
  tarjeta: COBRE.cristal, borde: "rgba(255,255,255,0.06)", sombra: "0 30px 80px rgba(0,0,0,0.6)", radio: 27,
  fuente: EB_GARAMOND, fuenteTexto: INTER, peso: 500, tracking: "0em", mayusculas: false,
  paleta: [COBRE.acento, COBRE.pulsado, COBRE.meteoroHalo, COBRE.haloCaja],
  // medido: ≈ 124 BPM (golpes a ±3 fotogramas), entradas expo 0,2 s, viajes expo in-out muy duros, muelle ζ ≈ 0,45 en la marca final
  ritmo: { bpm: 124 }, entradaDur: 0.2,
  curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.85, 0, 0.15, 1] },
  muelle: { stiffness: 170, damping: 12, mass: 1, sobrepaso: 0.22 },
  luz: { tipo: "halo", colores: [COBRE.haloCaja] }, texturas: { vineta: 0.7, grano: 0.035 },
});
