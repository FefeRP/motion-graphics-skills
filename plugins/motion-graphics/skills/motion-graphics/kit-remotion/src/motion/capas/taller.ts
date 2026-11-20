// Variante TALLER (análisis a-fondo-reel-pantalla): «el vídeo enseña la herramienta con la que está hecho».
// Primera mitad = oscuro-brasa (escenario grafito con luz naranja de suelo); segunda = claro (blanco roto, tarjetas
// blancas). Un solo acento naranja, grotesca neutra muy gruesa + mono, rejilla de pulso estricta (un evento por pulso:
// 28 fotogramas a 60 fps = 128,57 BPM) y el muelle spring(180, 12) que se enseña en el editor de curvas.
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { INTER, mezclar } from "../base";
import { CLARO, MONO, OSCURO_BRASA } from "./index";

// peso fino para la tarjeta de tipografía variable (la base carga 400–900)
inter("normal", { weights: ["300"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

/** Pulso de la variante en segundos (28 f a 60 fps). */
export const PULSO_TALLER = 28 / 60;

export const COLORES_TALLER = {
  acento: "#FF4F2D", luz: "#FF5A1F", halo: "#FF7A1A", llenoCentro: "#FF7A2E",
  grafitoArriba: "#55524F", grafito: "#2A2A2C", grafitoAbajo: "#141415", esquina: "#0C0C0D", panel: "#151617",
  crema: "#F7F5EE", fondoClaro: "#F5F3EF", tarjeta: "#FFFFFF", textoOscuro: "#1F1D24", gris: "#77787C",
};

/** Mitad oscura: escenario grafito con cúpula de luz naranja pegada abajo. */
export const TALLER = mezclar(OSCURO_BRASA, {
  id: "taller", fondo: COLORES_TALLER.grafito, texto: COLORES_TALLER.crema, suave: COLORES_TALLER.gris, acento: COLORES_TALLER.acento,
  tarjeta: COLORES_TALLER.panel, borde: "rgba(255,255,255,0.10)", radio: 18,
  fuente: INTER, fuenteTexto: INTER, peso: 800, tracking: "-0.01em", mayusculas: false, fuente2: MONO,
  paleta: [COLORES_TALLER.acento, COLORES_TALLER.luz, COLORES_TALLER.crema, COLORES_TALLER.gris],
  ritmo: { bpm: 128.57 }, entradaDur: 0.2,
  curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.5, 1, 0.89, 1] },
  muelle: { stiffness: 180, damping: 12, mass: 1, sobrepaso: 0.2 },
  luz: { tipo: "halo", colores: [COLORES_TALLER.luz] }, texturas: { vineta: 0.5 },
});

/** Mitad clara: blanco roto con tarjetas blancas, mismo acento, ritmo y muelle. */
export const TALLER_CLARO = mezclar(CLARO, {
  id: "taller-claro", fondo: COLORES_TALLER.fondoClaro, texto: COLORES_TALLER.textoOscuro, suave: COLORES_TALLER.gris, acento: COLORES_TALLER.acento,
  tarjeta: COLORES_TALLER.tarjeta, radio: 24, fuente: INTER, fuenteTexto: INTER, peso: 800, tracking: "-0.01em", fuente2: MONO,
  ritmo: TALLER.ritmo, muelle: TALLER.muelle, curvas: TALLER.curvas, entradaDur: 0.2,
  luz: { tipo: "liso", colores: [COLORES_TALLER.fondoClaro] }, texturas: { vineta: 0 },
});
