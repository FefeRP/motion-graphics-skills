// Variante OSCURO-CRISTAL (referencia «prompt de cristal», análisis en
// referencias/motion-graphics/analisis/a-fondo-prompt-cristal.md): casi negro azulado con MANCHAS DE COLOR POR ESCENA
// que derivan siempre, UI de cristal con contornos blancos de 1–2 px, tecleo con luz, un bloque de color plano (coral)
// y canales blancos entre paneles. Ritmo pausado (~100 BPM, un evento cada 0,4 s), expo-out largos y SIN rebotes.
import { loadFont as urbanist } from "@remotion/google-fonts/Urbanist";
import { mezclar } from "../base";
import { OSCURO } from "./index";

/** Sans geométrica con «a» y «g» de un piso (también para el código: no hay monoespaciada). */
export const URBANIST = urbanist("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin", "latin-ext"], ignoreTooManyRequestsWarning: true }).fontFamily;

/** Colores medidos (muestreo 5×5 px del original). */
export const PALETA_CRISTAL = {
  fondo: "#06070C", negro: "#010002", texto: "#F7F8FC", brillo: "#6E8EFF",
  pizarra: "#455876", violeta: "#33284D", violetaOscuro: "#2A2947", luzAzulada: "#9CA7C0", calido: "#8A5649", calidoClaro: "#BA9E94",
  marino: "#25334F", coral: "#DB7B61", azul: "#4DB2FD", azulVioleta: "#7998FD", violetaVivo: "#9B7BF5",
  vidrio: ["#262542", "#333250", "#464768", "#54577A"] as [string, string, string, string], encendido: ["#445C7E", "#4A6281"] as [string, string],
  borde: "#E9E9F2", conector: "#4A4A55", aro: "#5A5A66", pastilla: "#0A0A10", verde: "#3BD16F", ambar: "#F2A541",
};

export const OSCURO_CRISTAL = mezclar(OSCURO, {
  id: "oscuro-cristal", fondo: PALETA_CRISTAL.fondo, texto: PALETA_CRISTAL.texto, suave: "rgba(247,248,252,0.7)", acento: PALETA_CRISTAL.azulVioleta,
  tarjeta: "#14131C", borde: "rgba(233,233,242,0.9)", radio: 82,
  fuente: URBANIST, fuenteTexto: URBANIST, peso: 500, tracking: "-0.01em", mayusculas: false,
  ritmo: { bpm: 100 }, entradaDur: 0.4, curvas: { entrada: [0.25, 1, 0.5, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.45, 0, 0.1, 1] },
  muelle: null,
  luz: { tipo: "manchas", colores: [PALETA_CRISTAL.pizarra, PALETA_CRISTAL.violeta, PALETA_CRISTAL.marino] }, texturas: { vineta: 0.3 },
  paleta: [PALETA_CRISTAL.coral, PALETA_CRISTAL.azulVioleta, PALETA_CRISTAL.azul, PALETA_CRISTAL.verde, PALETA_CRISTAL.ambar],
});
