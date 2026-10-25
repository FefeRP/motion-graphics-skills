// Variante CLARO-LAVANDA (análisis a fondo de tres motion de producto claros, 2026-10-25:
// referencias/motion-graphics/analisis/a-fondo-tres-motion-panel{1,2,3}.md). Papel cálido casi blanco con un velo lila
// en una esquina, tarjetas blancas con sombra difusa, morado profundo de marca para el cierre, grotesca neutra de peso
// medio y TODO entra desenfocado y se enfoca al llegar (técnicas en base/enfoque.tsx y base/producto.tsx).
// Ritmo medido: 90,7 BPM (golpe 0,662 s); los cambios caen en el golpe ±1 fotograma y los picos de velocidad de cámara también.
import { INTER, mezclar } from "../base";
import { CLARO } from "./index";

/** Pulso de la variante en segundos (90 BPM). */
export const PULSO_LAVANDA = 60 / 90;

/** Paleta muestreada en parches (hex). */
export const COLORES_LAVANDA = {
  papel: "#F3F3EE", papel2: "#FBFBFB", tarjeta: "#FBFBFB", tinta: "#1E161F", gris: "#9A93A8",
  velo: "#614D8A", neblina: "#CFC6DF", eje: "#7B6F9E", nodo: "#5B4D86", final: "#3B1A6F",
  titularCentro: "#1F1535", titularMedio: "#3A2F55", titularBorde: "#8A8599", chispa: "#48328A", chispaLuz: "#7A4ECC",
  marcaClaro: "#5A33A6", marcaCentro: "#40207B", marcaOscuro: "#280D60", lema: "#CFB4F3", verde: "#1A817B",
};

export const CLARO_LAVANDA = mezclar(CLARO, {
  id: "claro-lavanda", fondo: COLORES_LAVANDA.papel, texto: COLORES_LAVANDA.tinta, suave: COLORES_LAVANDA.gris, acento: COLORES_LAVANDA.final,
  tarjeta: COLORES_LAVANDA.tarjeta, radio: 22, fuente: INTER, fuenteTexto: INTER, peso: 500, tracking: "-0.01em", mayusculas: false,
  paleta: [COLORES_LAVANDA.final, COLORES_LAVANDA.marcaClaro, COLORES_LAVANDA.eje, COLORES_LAVANDA.verde],
  sombra: "0 2px 6px rgba(40,24,80,0.05), 0 18px 44px rgba(40,24,80,0.09)",
  ritmo: { bpm: 90 }, entradaDur: 0.4,
  // entradas = palabra que enfoca; salidas aceleran; viajes largos con pico al centro
  curvas: { entrada: [0.22, 1, 0.36, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.65, 0.1, 0.25, 0.95] },
  muelle: null, luz: { tipo: "liso", colores: [COLORES_LAVANDA.papel] }, texturas: { vineta: 0 },
});
