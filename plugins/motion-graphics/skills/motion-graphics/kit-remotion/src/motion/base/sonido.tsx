// Base común · sonido. Regla de las referencias: el efecto entra EN EL FOTOGRAMA en que el objeto aterriza (nunca
// después) y el whoosh en el centro de la transición. Escribe los tiempos de los efectos con las mismas constantes que
// animan las piezas, así nunca se desincronizan. Música propia: `node scripts/musica.mjs <salida.wav>`.
import React from "react";
import { Html5Audio as Audio, Sequence, staticFile, useVideoConfig } from "remotion";

export type Sfx = { t: number; f: "pop" | "click" | "tic" | "impacto" | "whoosh" | "whoosh-suave" | "whoosh-rapido" | "subida" | string; v?: number };

/** Coloca los efectos (ficheros `sfx/<f>.wav` de la carpeta public) y, si se da, la música. */
export const Sonido: React.FC<{ sfx: Sfx[]; musica?: string; volumenMusica?: number; volumen?: number; fundidoFinal?: number; duracion?: number }> = ({ sfx, musica, volumenMusica = 0.6, volumen = 1, fundidoFinal = 0, duracion }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const total = duracion ? duracion * fps : durationInFrames;
  return (
    <>
      {musica && <Audio src={staticFile(musica)} volume={(f) => volumenMusica * (fundidoFinal > 0 ? Math.min(1, Math.max(0, (total - f) / (fundidoFinal * fps))) : 1)} />}
      {sfx.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.t * fps))} durationInFrames={Math.round(1.4 * fps)}>
          <Audio src={staticFile(`sfx/${s.f}.wav`)} volume={(s.v ?? 0.4) * volumen} />
        </Sequence>
      ))}
    </>
  );
};
