// Composiciones del kit: las demos de cada estilo, la escena de mezcla y el catálogo de efectos.
import React from "react";
import { Composition } from "remotion";
import { DemoOscuro, duracionOscuro } from "./motion/demos/oscuro";
import { DemoClaro, duracionClaro } from "./motion/demos/claro";
import { DemoAgencia, duracionAgencia } from "./motion/demos/agencia";
import { DemoMezcla, duracionMezcla, type PropsMezcla } from "./motion/demos/mezcla";
import { DemoEfectos2, duracionEfectos2 } from "./motion/demos/efectos-2";

export const Root: React.FC = () => (
  <>
    <Composition id="DemoOscuro" component={DemoOscuro} fps={60} width={1920} height={1080} durationInFrames={duracionOscuro * 60} />
    <Composition id="DemoClaro" component={DemoClaro} fps={60} width={1920} height={1080} durationInFrames={duracionClaro * 60} />
    <Composition id="DemoAgencia" component={DemoAgencia} fps={60} width={1920} height={1080} durationInFrames={Math.round(duracionAgencia * 60)} />
    <Composition id="DemoMezcla" component={DemoMezcla} defaultProps={{ estilo: "oscuro" } as PropsMezcla} fps={60} width={1920} height={1080} durationInFrames={540}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.round(duracionMezcla(props) * 60) })} />
    <Composition id="DemoEfectos2" component={DemoEfectos2} fps={60} width={1920} height={1080} durationInFrames={duracionEfectos2 * 60} />
  </>
);
