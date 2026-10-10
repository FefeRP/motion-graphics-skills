// Base común · herramientas de FIDELIDAD para la vía «recrear la interfaz». Una recreación tiene que ser idéntica al
// producto real: misma letra, colores, radios, iconos, textos y proporciones. Esto ayuda a conseguirlo y a comprobarlo.
import React from "react";
import { continueRender, delayRender, Img, staticFile } from "remotion";

/**
 * Calco: la captura REAL encima de la recreación, en las mismas coordenadas, para cuadrar medidas al píxel mientras
 * construyes (como papel de calco). Solo para desarrollo y comprobación: quítalo del vídeo final.
 * - `modo="encima"`: la captura semitransparente (`opacidad`).
 * - `modo="cortina"`: a la izquierda de `cortina` (0–1) se ve la captura y a la derecha la recreación.
 * - `modo="diferencia"`: mezcla de diferencia: lo que coincide queda NEGRO; cualquier desajuste brilla.
 * La captura debe estar a la misma escala que la recreación (captúrala al tamaño de la interfaz recreada).
 */
export const Calco: React.FC<{ imagen: string; x?: number; y?: number; ancho: number; alto: number; modo?: "encima" | "cortina" | "diferencia"; opacidad?: number; cortina?: number }> = ({
  imagen, x = 0, y = 0, ancho, alto, modo = "encima", opacidad = 0.5, cortina = 0.5,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: ancho, height: alto, pointerEvents: "none", overflow: "hidden",
    opacity: modo === "encima" ? opacidad : 1, mixBlendMode: modo === "diferencia" ? "difference" : undefined,
    clipPath: modo === "cortina" ? `inset(0 ${(1 - cortina) * 100}% 0 0)` : undefined }}>
    <Img src={staticFile(imagen)} style={{ width: ancho, height: alto, display: "block" }} />
    {modo === "cortina" && <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 2, background: "#FF2D55", boxShadow: "0 0 12px #FF2D55" }} />}
  </div>
);

/**
 * Icono REAL del producto (su fichero SVG, tal cual) recoloreable: el SVG hace de máscara y el color lo pones tú.
 * Úsalo cuando el producto tenga iconos propios o de una librería que no quieras instalar: copia sus .svg a public/.
 * Si el producto usa una librería de iconos de React (lucide-react, heroicons…), mejor instálala y usa los MISMOS
 * componentes por su nombre: así el trazo es exactamente el del producto.
 */
export const IconoMascara: React.FC<{ src: string; tam?: number; color?: string; style?: React.CSSProperties }> = ({ src, tam = 20, color = "currentColor", style }) => {
  const url = `url(${staticFile(src)})`;
  return <div style={{ width: tam, height: tam, flexShrink: 0, background: color, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", ...style }} />;
};

const cargadas = new Set<string>();
/**
 * Fuente REAL del producto desde un fichero (woff2/ttf en public/), cuando no está en @remotion/google-fonts.
 * Devuelve la familia para usarla en `fontFamily`. Llama una vez por peso: `useFuenteLocal("Marca", "fuentes/marca-600.woff2", { weight: "600" })`.
 */
export const useFuenteLocal = (familia: string, fichero: string, descriptores: FontFaceDescriptors = {}) => {
  const clave = `${familia}|${fichero}|${JSON.stringify(descriptores)}`;
  const [h] = React.useState(() => (cargadas.has(clave) ? null : delayRender(`fuente ${familia}`)));
  React.useEffect(() => {
    if (h === null) return;
    const f = new FontFace(familia, `url(${staticFile(fichero)})`, descriptores);
    f.load().then((ff) => { (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff); cargadas.add(clave); continueRender(h); }).catch((e) => { console.error(`No carga la fuente ${fichero}`, e); continueRender(h); });
  }, [h, clave, familia, fichero, descriptores]);
  return familia;
};

/** Marco a escala 1:1 para construir una pantalla recreada con las MISMAS medidas que la captura (luego la cámara la mueve). */
export const Lienzo: React.FC<{ ancho: number; alto: number; x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ ancho, alto, x = 0, y = 0, children, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: ancho, height: alto, overflow: "hidden", ...style }}>{children}</div>
);
