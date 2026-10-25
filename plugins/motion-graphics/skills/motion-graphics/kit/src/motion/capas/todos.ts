// Todos los estilos y variantes del universo mezclable, por nombre. Las variantes nuevas viven en su fichero
// (importan de ./index), así que el mapa completo se arma aquí para no crear importaciones circulares.
import { ESTILOS } from "./index";
import { AGENCIA_PUNTO } from "./agencia-punto";
import { CLARO_LAVANDA } from "./claro-lavanda";
import { OSCURO_COBRE } from "./oscuro-cobre";
import { OSCURO_CRISTAL } from "./oscuro-cristal";
import { TALLER, TALLER_CLARO } from "./taller";

export const TODOS_ESTILOS = {
  ...ESTILOS,
  "agencia-punto": AGENCIA_PUNTO,
  "oscuro-cobre": OSCURO_COBRE,
  "oscuro-cristal": OSCURO_CRISTAL,
  taller: TALLER,
  "taller-claro": TALLER_CLARO,
  "claro-lavanda": CLARO_LAVANDA,
};
export type NombreEstiloTodos = keyof typeof TODOS_ESTILOS;

export { AGENCIA_PUNTO, CLARO_LAVANDA, OSCURO_COBRE, OSCURO_CRISTAL, TALLER, TALLER_CLARO };
