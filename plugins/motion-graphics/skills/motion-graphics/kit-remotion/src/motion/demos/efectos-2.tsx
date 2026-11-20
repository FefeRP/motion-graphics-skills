// Muestrario de los efectos nuevos de la base (src/motion/base/efectos-2.tsx), una sección por componente, sobre el
// estilo OSCURO. 60 fps. Textos de ejemplo genéricos.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  EstiloProvider, FlashCromatico, FondoEstilo, Forma, FraseVoz, Horizonte, LineaLuz, ManchasLiquidas, Orbitas, ParedPaneles, PildoraElastica, PilaTarjetas,
  Portal, Seleccion, Sonido, Estrobo, Teclea, Tunel, clavesOla, palabrasCada, tramo, useSeg, type Mancha,
} from "../base";
import { MONO, OSCURO } from "../capas";

// Secciones: [nombre, inicio, duración] en s
export const SECCIONES_EFECTOS2: [string, number, number][] = [
  ["ManchasLiquidas", 0, 2], ["FraseVoz", 2, 2], ["FlashCromatico", 4, 1.6], ["PildoraElastica", 5.6, 1.8], ["Estrobo", 7.4, 1.6],
  ["LenteBarril · ParedPaneles", 9, 2], ["LineaLuz", 11, 1.6], ["TarjetaBrillo · PilaTarjetas", 12.6, 2], ["Orbitas", 14.6, 2],
  ["Seleccion", 16.6, 1.6], ["Tunel", 18.2, 2], ["Portal", 20.2, 2], ["Horizonte", 22.2, 1.8],
];
export const duracionEfectos2 = 24;

const T = OSCURO.texto, F = OSCURO.fuente;
const Rotulo: React.FC<{ texto: string; oscuro?: boolean }> = ({ texto, oscuro }) => (
  <div style={{ position: "absolute", left: 56, top: 44, fontFamily: MONO, fontSize: 22, letterSpacing: "0.06em", color: oscuro ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.55)" }}>{texto}</div>
);
const Centro: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ display: "grid", placeItems: "center", fontFamily: F, color: T, ...style }}>{children}</AbsoluteFill>
);

// ───── 1 · manchas: ola que cubre el cuadro en 0,18 s, se retira a los bordes y deriva; segunda ola a 1,3 s
const LOB_A: [number, number, number][] = [[0, 0, 300], [220, -120, 220], [-180, 160, 200], [120, 220, 170], [-60, -200, 150]];
const LOB_B: [number, number, number][] = [[0, 0, 220], [150, 80, 150], [-130, -60, 130]];
const MANCHAS: Mancha[] = [
  { lobulos: LOB_A, claves: clavesOla({ t0: 0.05, desde: [-250, 700], cubre: [820, 560], queda: [1700, 260], sOla: 1.7, sQueda: 0.75, hasta: 2 }) },
  { lobulos: LOB_B, claves: clavesOla({ t0: 0.05, desde: [300, 1300], cubre: [700, 820], queda: [140, 1000], sOla: 1.4, sQueda: 0.8, deriva: [60, -40], hasta: 2 }) },
  { lobulos: LOB_B, semilla: "ola2", claves: clavesOla({ t0: 1.3, desde: [2300, 300], cubre: [1350, 450], queda: [1850, 950], s0: 0.4, sOla: 1.5, sQueda: 0.7, retirada: 0.6, hasta: 2 }) },
];
const S1: React.FC = () => (
  <>
    <ManchasLiquidas manchas={MANCHAS} />
    <Centro><div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-0.02em" }}>Fondo vivo</div></Centro>
  </>
);

// ───── 2 · frase que sigue a la voz y sale apretándose hacia la izquierda
const S2: React.FC = () => <FraseVoz palabras={palabrasCada("Imagina que pudieras *crearlo* todo", 0.1, 0.2)} sale={1.45} tam={80} />;

// ───── 3 · destello cromático entre dos mundos (morado → blanco → acento → oscuro)
const S3: React.FC = () => {
  const t = useSeg();
  const antes = t < 0.73;
  return (
    <>
      <Centro>
        {antes ? (
          <div style={{ width: 900 + t * 300, height: 560 + t * 190, borderRadius: 48, background: "linear-gradient(135deg, #A36AEE, #4E1EB0)", display: "grid", placeItems: "center", fontSize: 72, fontWeight: 600 }}>Portada</div>
        ) : (
          <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: "-0.02em", transform: `scale(${1.08 - 0.08 * tramo(t, 0.73, 1.2)})` }}>Otro mundo</div>
        )}
      </Centro>
      <FlashCromatico t0={0.5} colores={["#A36AEE", "#F1E5EF", "#FFFFFF", "#C8F7F2", OSCURO.acento, "#0B2A2A"]} />
    </>
  );
};

// ───── 4 · píldora elástica entre chips
const CHIPS = [{ texto: "Todo", x: 660 }, { texto: "Música", x: 850 }, { texto: "Pódcasts", x: 1075 }, { texto: "Directo", x: 1290 }];
const S4: React.FC = () => (
  <>
    <PildoraElastica y={540} de={0} chips={CHIPS} pasos={[{ t: 0.3, a: 1 }, { t: 0.85, a: 3 }, { t: 1.35, a: 2 }]} />
    <Centro style={{ alignContent: "start", paddingTop: 330 }}><div style={{ fontSize: 40, fontWeight: 600, color: OSCURO.suave }}>Elige una pestaña</div></Centro>
  </>
);

// ───── 5 · estroboscopios de negativo (el mundo cambia debajo, en el 2.º fotograma del patrón)
const S5: React.FC = () => {
  const t = useSeg();
  const mundo = t < 0.5 + 2 / 30 ? 0 : t < 1.1 + 2 / 30 ? 1 : 2;
  return (
    <>
      {mundo === 0 && <AbsoluteFill style={{ background: "#F5F5F5" }} />}
      {mundo >= 1 && <LineaLuz y={mundo === 1 ? 600 : 450} />}
      <Centro><div style={{ fontSize: 64, fontWeight: 600, color: mundo === 0 ? "#000" : T }}>{["Bienvenido", "a mi trabajo", "en marcha"][mundo]}</div></Centro>
      <Estrobo t0={0.5} patron="gkikrk" previo={0.17} />
      <Estrobo t0={1.1} patron="ininin" />
    </>
  );
};

// ───── 6 · pared de paneles a través de la lente de barril: paneo de un panel y zoom atrás
const PANEL = ["#D2001D", "#FFFFFF", "#1A191E"];
const Panel: React.FC<{ i: number; j: number }> = ({ i, j }) => {
  const c = PANEL[(i + j * 2) % 3];
  const claro = c === "#FFFFFF";
  return (
    <div style={{ width: "100%", height: "100%", background: c, position: "relative", fontFamily: F, color: claro ? "#111" : "#FFF" }}>
      <div style={{ position: "absolute", left: 80, top: 70, fontSize: 54, fontWeight: 600, letterSpacing: "-0.02em" }}>{["¿Dónde empiezan", "Un proyecto", "Ideas"][(i + j) % 3]}</div>
      {[0, 1, 2, 3].map((k) => (
        <div key={k} style={{ position: "absolute", left: 80 + k * 265, top: 260, width: 230, height: 300, borderRadius: 14, background: claro ? "#ECECEC" : "rgba(255,255,255,0.14)" }} />
      ))}
      <div style={{ position: "absolute", left: 80, top: 620, width: 520, height: 18, borderRadius: 9, background: claro ? "#DDD" : "rgba(255,255,255,0.25)" }} />
    </div>
  );
};
const S6: React.FC = () => (
  <>
    <LineaLuz y={560} />
    <ParedPaneles columnas={5} filas={3} camara={[{ t: 0, x: 0, y: 0, s: 1 }, { t: 0.1, x: 0 }, { t: 0.95, x: 1270, para: true }, { t: 1.05, x: 1270, s: 1 }, { t: 1.9, x: 635, y: 405, s: 0.62, para: true }]}
      panel={(i, j) => <Panel i={i} j={j} />} />
  </>
);

// ───── 7 · línea de luz ondulada
const S7: React.FC = () => (
  <>
    <LineaLuz y={570} />
    <Centro><div style={{ fontSize: 56, fontWeight: 600, transform: "translateY(-80px)" }}>Proyectos</div></Centro>
  </>
);

// ───── 8 · tarjetas con brillo que suben y se apilan; la cámara se aleja
const Escribe: React.FC = () => {
  const t = useSeg();
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: F, fontSize: 52, fontWeight: 600, color: "#111" }}>
      <span><Teclea texto="¿Tienes un proyecto?" t0={0.25} letrasPorSeg={22} /><span style={{ display: "inline-block", width: 30, height: 34, marginLeft: 6, background: "#111", opacity: Math.floor(t * 4) % 2 ? 0.2 : 1 }} /></span>
    </div>
  );
};
const Filas: React.FC<{ claro?: boolean }> = ({ claro }) => (
  <div style={{ position: "absolute", inset: 60 }}>
    {[0, 1, 2, 3].map((k) => <div key={k} style={{ height: 56, marginBottom: 40, width: `${90 - k * 14}%`, borderRadius: 12, background: claro ? "#E9E9EE" : "rgba(255,255,255,0.12)" }} />)}
  </div>
);
const S8: React.FC = () => (
  <PilaTarjetas
    camara={[{ t: 0, s: 1, x: -760, y: 400 }, { t: 0.35, s: 1, x: -760, y: 400 }, { t: 1.65, s: 0.5, x: 0, y: 0 }, { t: 2, s: 0.48, x: -20, y: 0 }]}
    tarjetas={[
      { t0: 0.0, contenido: <Escribe /> },
      { t0: 0.6, fondo: "linear-gradient(135deg, #FFFFFF, #E6ECFF)", contenido: <Filas claro /> },
      { t0: 0.9, fondo: "#1A191E", contenido: <Filas /> },
      { t0: 1.15, fondo: "#D2001D", contenido: <Filas /> },
      { t0: 1.4, fondo: "#FFFFFF", contenido: <Filas claro /> },
    ]} />
);

// ───── 9 · órbitas con iconos genéricos
const ICONOS = ["#E8453C", "#4A90E2", "#F5A623", "#7ED321", "#9B51E0", "#111111"].map((c, i) => (
  <svg key={i} width={44} height={44} viewBox="0 0 44 44">
    {i % 3 === 0 ? <circle cx={22} cy={22} r={16} fill={c} /> : i % 3 === 1 ? <rect x={7} y={7} width={30} height={30} rx={8} fill={c} /> : <path d="M22 5 L39 37 L5 37 Z" fill={c} />}
  </svg>
));
const S9: React.FC = () => (
  <Orbitas t0={0} sale={1.45} iconos={ICONOS}>
    <div style={{ fontFamily: F, color: T, textAlign: "center", lineHeight: 1.05 }}>
      <div style={{ fontSize: 30, fontWeight: 500, color: OSCURO.suave }}>Demasiadas</div>
      <div style={{ fontSize: 52, fontWeight: 600 }}>apps sueltas</div>
    </div>
  </Orbitas>
);

// ───── 10 · selección que crece desde un cursor
const S10: React.FC = () => (
  <Centro><div style={{ fontSize: 110, fontWeight: 600, letterSpacing: "-0.02em" }}>El trabajo está <Seleccion texto="roto" t0={0.35} /></div></Centro>
);

// ───── 11 · túnel de móviles con pantallas recreadas
const Pantalla: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ position: "absolute", inset: 0, padding: 60, fontFamily: F, background: ["#FFFFFF", "#F3F6FF", "#FFF7F0", "#F2FFF6"][n] }}>
    <div style={{ width: 120, height: 120, borderRadius: 30, background: ["#111", "#4A90E2", "#F5A623", "#2BB673"][n], margin: "120px auto 60px" }} />
    <div style={{ fontSize: 58, fontWeight: 700, textAlign: "center", color: "#111" }}>{["Entrar", "Tu cuenta", "Reunión", "Ajustes"][n]}</div>
    {[0, 1, 2].map((k) => <div key={k} style={{ height: 90, borderRadius: 22, background: "#E7E9EE", marginTop: 50 }} />)}
  </div>
);
const S11: React.FC = () => (
  <Tunel t0={0} dur={2} pantallas={[0, 1, 2, 3].map((n) => <Pantalla key={n} n={n} />)}>
    <div style={{ fontFamily: F, fontSize: 64, fontWeight: 700, color: "#070504", letterSpacing: "-0.02em" }}>Todo está en todas partes</div>
  </Tunel>
);

// ───── 12 · portal de luz + círculo que se estira en barra de búsqueda
const S12: React.FC = () => (
  <>
    <Portal t0={0} />
    <Forma fondo="rgba(2,13,16,0.85)" colorBorde="rgba(120,200,200,0.35)" colorLuz={OSCURO.acento} claves={[
      { t: 0, x: 960, y: 540, w: 1000, h: 1000, r: 500, borde: 2, luz: 0 }, { t: 0.27, w: 270, h: 270, r: 135 }, { t: 0.4, w: 180, h: 180, r: 90 },
      { t: 0.47, w: 488, h: 68, r: 34 }, { t: 0.6, w: 830, h: 68 }, { t: 0.94, w: 1030, h: 68, luz: 0.6 }, { t: 2, w: 1030, h: 68, y: 540 },
    ]}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 34px", color: "#F2F6F7", fontFamily: F, fontSize: 30, fontWeight: 500, whiteSpace: "nowrap" }}>
        <Teclea texto="¿Cómo organizo mi trabajo?" t0={0.55} letrasPorSeg={55} />
      </div>
    </Forma>
  </>
);

// Un efecto de sonido al empezar cada sección (el estrobo, con glitch)
const SFX_SECCION = ["whoosh-suave", "pop", "impacto", "click", "glitch", "whoosh", "subida", "whoosh-rapido", "whoosh-suave", "click", "whoosh", "subida", "impacto"];

// ───── 13 · horizonte de planeta con la marca
const S13: React.FC = () => <Horizonte t0={0.05}>aurora</Horizonte>;

const SECCION = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13];

export const DemoEfectos2: React.FC = () => (
  <EstiloProvider tokens={OSCURO}>
    <AbsoluteFill style={{ background: OSCURO.fondo }}>
      <FondoEstilo />
      {SECCIONES_EFECTOS2.map(([nombre, a, d], i) => {
        const C = SECCION[i];
        return (
          <Sequence key={nombre} from={Math.round(a * 60)} durationInFrames={Math.round(d * 60)} name={nombre}>
            <C />
            <Rotulo texto={nombre} oscuro={nombre === "Tunel"} />
          </Sequence>
        );
      })}
      <Sonido volumen={0.7} sfx={SECCIONES_EFECTOS2.map(([, a], i) => ({ t: a + 0.02, f: SFX_SECCION[i] ?? "pop", v: 0.45 }))} />
    </AbsoluteFill>
  </EstiloProvider>
);
