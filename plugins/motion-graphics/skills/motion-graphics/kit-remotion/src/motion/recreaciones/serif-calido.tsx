// Recreación de ref-serif-calido.mp4 (keynote cálida con serif: «todo nace con luz y se enfría») con la base común y
// los componentes de src/motion/base/cobre.tsx. Mismos tiempos que el original (11,5 s) a 60 fps y 1920×1080.
// Tiempos escritos con F(f) = fotograma del original a 30 fps (análisis: referencias/motion-graphics/analisis/
// a-fondo-serif-calido.md). Marca y textos genéricos: «Lumen», «Good morning, Alex», «Model 4.6 Adaptive».
import React from "react";
import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import {
  ArcoChispa, Asterisco, BotonPulsa, CajaCristal, Camara2D, CodigoCae, CursorMano, CURVAS, curvaLuz, EcoZoom, EstiloProvider, FlechaArriba, GlifoCambia,
  MarcaBrota, MarcaEstalla, Meteoro, Movil, OndaChoque, pchip, Resplandor, Salida3D, Sonido, TextoBrasa, TextoDeChispas, tramo, useSeg, Vineta,
  type ClaveCamara2D, type Sfx,
} from "../base";
import { COBRE, OSCURO_COBRE } from "../capas/oscuro-cobre";

export const duracionSerifCalido = 11.5;
const F = (f: number) => f / 30;
const C = COBRE;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ───────── cámara del plano del saludo y la caja (mundo = pantalla a escala 1 en el fotograma 95) ─────────
/** Progreso medido por fotograma (pchip) de un tramo de cámara: claves [f, p]. */
const progreso = (t: number, claves: [number, number][]) => pchip(claves.map((c) => F(c[0])), claves.map((c) => c[1]), t);
const LATIGAZO_1: [number, number][] = [[98, 0], [100, 0.03], [102, 0.09], [103, 0.14], [104, 0.32], [105, 0.6], [106, 0.75], [108, 0.88], [110, 0.95], [113, 1]];
const LATIGAZO_2: [number, number][] = [[128, 0], [130, 0.05], [132, 0.16], [134, 0.38], [136, 0.64], [138, 0.83], [141, 0.93], [145, 0.98], [150, 1]];
const camCaja = (t: number) => {
  if (t < F(77)) return { x: 960, y: 405, s: 1.39 + 0.012 * tramo(t, F(60), F(77), CURVAS.lineal) };
  if (t < F(87)) { const k = tramo(t, F(77), F(87), CURVAS.suave); return { x: 960, y: lerp(405, 475, k), s: lerp(1.402, 1.29, k) }; }
  if (t < F(98)) { const k = tramo(t, F(87), F(98), CURVAS.suave); return { x: 960, y: lerp(522, 540, k), s: lerp(1.06, 1.0, k) }; }
  if (t < F(113)) { const p = progreso(t, LATIGAZO_1); return { x: lerp(960, 532, p), y: lerp(540, 548, p), s: Math.pow(1.5, p) }; }
  if (t < F(128)) { const k = Math.pow(tramo(t, F(113), F(128), CURVAS.lineal), 1.5); return { x: lerp(532, 692, k), y: 548, s: 1.5 }; }
  if (t < F(150)) { const p = progreso(t, LATIGAZO_2); return { x: lerp(692, 1491, p), y: lerp(548, 549, p), s: lerp(1.5, 1.53, p) }; }
  const k = tramo(t, F(150), F(176), CURVAS.lineal);
  return { x: lerp(1491, 1480, k), y: lerp(549, 590, k), s: lerp(1.53, 1.49, k) };
};
const T0_CAJA = F(46), T1_CAJA = F(178);
const CLAVES_CAJA: ClaveCamara2D[] = Array.from({ length: Math.round((T1_CAJA - T0_CAJA) * 60) + 1 }, (_, i) => { const t = T0_CAJA + i / 60; return { t, ...camCaja(t) }; });

// ───────── textos ─────────
const TECLEO = "Help me build an app that prints mone";
const RITMO_TECLEO: [number, number][] = [[112.5, 0], [113, 1], [116, 2], [119, 4], [120, 6], [122, 9], [125, 15], [128, 20], [131, 24], [134, 27], [137, 30], [142, 32], [148, 34], [152, 35], [155, 36], [161, 37]];
const CODIGO = [
  "struct User {",
  " var sec[40],   char name[50];",
  "   int score;",
  "};",
  "int generateScore() {",
  "   return rand() % 100 + 1;",
  "  users[currentProcessingIndex]Processed += 1;",
  "       printf(\"Transaction Completed For Use)r:",
  "}",
  "void displayUsers(struct User users[], int count) {",
  "   printf(\"\\n=== USER LIST ===\\n\");",
  "   for (int i = 0; i < count; i++) {",
  "              void searchUser(struct User users[], int count, char target[]) {",
  "                               printf(\"%d. Name: %s | Score: %d\\n\",",
  "             i + 1, users[i].name, users[i].score);",
  "   }",
  "}",
  "void findTopUser(struct User users[], int count) {void processVirtu",
  "   int maxIndex = 0;",
  "   for (int i = 1; i < count; void processVirtualMoneyPrintin",
  "gOperation(struct users[], int totalRegi}",
];
const ESCRITURA: [number, number][] = ([[212, 1.2], [216, 4.5], [220, 6.5], [224, 7.6], [229, 10], [234, 12], [239, 13.7], [245, 15.2], [251, 17.4], [258, 18.6], [264, 20.3], [269, 21]] as [number, number][]).map(([f, l]) => [F(f), l]);

// ───────── fondo (luz por planos, colores muestreados) ─────────
const Fondo: React.FC = () => {
  const t = useSeg();
  const domo = t < F(77) ? 1 : 1 - tramo(t, F(77), F(90), CURVAS.lineal);
  const codigo = Math.min(tramo(t, F(211), F(216), CURVAS.lineal), 1 - tramo(t, F(272), F(277), CURVAS.lineal));
  const barrido = t >= F(208.3) && t < F(212) ? tramo(t, F(208.3), F(210.5), CURVAS.lineal) : 0;
  const diag = t >= F(277.5) ? (t < F(301) ? curvaLuz(t, [F(277.5), F(279), F(295), F(300)], [0, 0.35, 1.05, 0.85]) : t < F(308) ? 1.5 : 1.05 - 0.6 * tramo(t, F(308), F(345), CURVAS.lineal)) : 0;
  const negro = tramo(t, F(207), F(212), CURVAS.lineal);
  // brillo cálido alrededor del código mientras está caliente (sube f212–230, se va con la sacudida f233–242)
  const brasaCodigo = curvaLuz(t, [F(212), F(222), F(231), F(235), F(243)], [0, 0.4, 0.55, 0.45, 0]);
  // «faster» entra con la pantalla encendida (bloom) que se corta en f308
  const brasaPalabra = t >= F(301) && t < F(308) ? lerp(1, 0.55, (t - F(301)) / F(7)) : 0;
  return (
    <AbsoluteFill style={{ background: "#09060A" }}>
      {negro > 0 && <AbsoluteFill style={{ background: "#000", opacity: 0.95 * negro }} />}
      {domo > 0 && <AbsoluteFill style={{ opacity: domo, background: "radial-gradient(ellipse 30% 42% at 50% 104%, #1a1011 0%, #120b0d 45%, rgba(9,6,10,0) 100%)" }} />}
      {codigo > 0 && <AbsoluteFill style={{ opacity: codigo, background: "radial-gradient(ellipse 34% 50% at 46% 92%, #4a2c22 0%, #2a1611 38%, rgba(20,10,8,0.6) 62%, rgba(0,0,0,0) 100%)" }} />}
      {brasaCodigo > 0 && <AbsoluteFill style={{ opacity: brasaCodigo, background: "radial-gradient(ellipse 30% 42% at 40% 50%, #5e4840 0%, #4a342c 35%, #2a1a14 65%, rgba(0,0,0,0) 100%)" }} />}
      {brasaPalabra > 0 && <AbsoluteFill style={{ opacity: brasaPalabra, background: "radial-gradient(ellipse 48% 62% at 50% 50%, #4a3128 0%, #321d14 40%, rgba(40,18,8,0.5) 75%, rgba(30,12,4,0.3) 100%)" }} />}
      {barrido > 0 && <AbsoluteFill style={{ opacity: barrido, background: "linear-gradient(to top, #311B15 0%, #1d110f 55%, #0E090B 100%)" }} />}
      {diag > 0 && <AbsoluteFill style={{ opacity: Math.min(1, diag), background: "radial-gradient(ellipse 75% 105% at 0% 100%, #3a1103 0%, #260b02 30%, #140501 55%, rgba(0,0,0,0) 85%)" }} />}
    </AbsoluteFill>
  );
};

// ───────── acto 1 · meteoro → estallido → marca que brota → disolución ─────────
const CURVA_MARCA = (u: number) => pchip([0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 16, 22].map((f) => f / 22), [0.04, 0.06, 0.1, 0.16, 0.22, 0.78, 0.85, 0.88, 0.92, 0.95, 0.97, 1].map((v) => (v - 0.04) / 0.96), u);
const ActoMarca: React.FC = () => {
  const t = useSeg();
  if (t > F(56)) return null;
  return (
    <>
      <Meteoro t0={F(1)} dur={F(5)} desde={[144, 1062]} hasta={[982, 540]} largo={700} grosor={16} resplandor={1} nucleo={C.meteoroNucleo} color={C.meteoroHalo} lejano={C.meteoroLejano} />
      <MarcaEstalla t0={F(6.6)} x={982} y={540} tam={105} pico={1.2} sube={F(6)} asienta={F(9)} caliente={C.estallido} color={C.acento} hasta={F(22)} />
      <MarcaBrota t0={F(22)} dur={F(22)} x={787} y={540} desdeX={982} logo={<Asterisco tam={105} color={C.acento} />} logoTam={105} texto="Lumen" tam={104} hueco={36} peso={400}
        color={C.textoMarca} sale={F(47)} colorChispa={C.meteoroHalo} curva={CURVA_MARCA} />
    </>
  );
};

// ───────── acto 2 · saludo nacido de chispas + caja de cristal + tecleo (cámara 2D) ─────────
const SALUDO_Y = 402;
const CAJA = { x: 343, y: 459, w: 1229, h: 223 };
const Interfaz: React.FC = () => {
  const t = useSeg();
  const n = Math.max(0, Math.round(progreso(t, RITMO_TECLEO)));
  const cursor = t >= F(104) && t < F(166);
  return (
    <>
      <div style={{ position: "absolute", left: 57, top: 46, fontFamily: OSCURO_COBRE.fuenteTexto, fontSize: 36, lineHeight: "40px", color: "#F5F0EC", whiteSpace: "pre", display: "flex", alignItems: "center" }}>
        <span>{TECLEO.slice(0, n)}</span>
        {cursor && <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 3, background: C.cursorTexto, boxShadow: "0 0 10px #E08A50, 0 0 3px #E08A50" }} />}
      </div>
      <svg width={34} height={34} viewBox="0 0 34 34" style={{ position: "absolute", left: 57 - 17, top: 174 - 17 }}>
        <path d="M17 4V30M4 17H30" stroke="#DCD5D4" strokeWidth={2} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 703, top: 174 - 24, width: 361, height: 48, borderRadius: 10, background: "rgba(42,40,44,0.45)", display: "flex", alignItems: "center", gap: 14, paddingLeft: 16, boxSizing: "border-box",
        fontFamily: OSCURO_COBRE.fuenteTexto, fontSize: 28, color: C.selector, whiteSpace: "pre" }}>
        <span>Model 4.6  Adaptive</span>
        <svg width={18} height={18} viewBox="0 0 18 18"><path d="M3 6.5L9 12.5L15 6.5" stroke={C.selector} strokeWidth={1.8} fill="none" strokeLinecap="round" /></svg>
      </div>
    </>
  );
};
const BotonCaja: React.FC = () => (
  <div style={{ width: 67, height: 62, borderRadius: 10, background: "#D9714F", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <FlechaArriba tam={36} color="#3A1A12" grosor={2.2} />
  </div>
);
const Saludo: React.FC = () => (
  <>
    <ArcoChispa t0={F(55)} dur={0.26} camino={[850, 440, 560, 560, 667, SALUDO_Y]} grosor={3.5} />
    <ArcoChispa t0={F(52.5)} dur={0.3} camino={[960, 445, 1330, 230, 1230, 700]} grosor={3.5} />
    <ArcoChispa t0={F(53)} dur={0.26} camino={[880, 445, 700, 720, 590, 560]} grosor={3.5} />
    <TextoDeChispas x={632} y={SALUDO_Y} tam={70} peso={400} color={C.textoSaludo} separacion={1.12} cierra={F(66.5)} crece={0.12} bloom={22}
      prefijo={{ nodo: <Asterisco tam={71} color="#D37E71" />, ancho: 71, t: F(62), hueco: 19 }}
      palabras={[
        { texto: "Good", t: F(60), arco: { desde: [905, 438], control: [640, 170], dur: 0.24 } },
        { texto: "morning,", t: F(64), arco: { desde: [1010, 440], control: [1170, 120], dur: 0.3 } },
        { texto: "Alex", t: F(63), arco: { desde: [1110, 446], control: [1420, 720], dur: 0.32 } },
      ]} />
  </>
);
const MundoCaja: React.FC = () => {
  const t = useSeg();
  const halo = Math.min(curvaLuz(t, [F(78), F(88), F(96)], [0, 0.8, 1]), 1 - tramo(t, F(160), F(172), CURVAS.lineal));
  const sale = 1 - tramo(t, F(159), F(169), CURVAS.lineal);
  return (
    <>
      {halo > 0 && <div style={{ position: "absolute", left: 958 - 1800, top: 600 - 980, width: 3600, height: 1960, opacity: halo,
        background: "radial-gradient(ellipse 50% 50% at 50% 50%, #5e3729 0%, #50301f 13%, #42271d 22%, #331e18 32%, #231512 44%, #150d0f 56%, rgba(9,6,10,0) 70%)" }} />}
      <div style={{ position: "absolute", left: 0, top: -30 * (1 - sale), width: 1920, height: 1080, opacity: sale }}><Saludo /></div>
      <CajaCristal x={CAJA.x} y={CAJA.y} ancho={CAJA.w} alto={CAJA.h} radio={27} t0={F(78)} luz={{ t0: F(80), t1: F(86.5), apaga: F(87), colores: C.luzInterior, fuerza: 0.72 }}
        luzBajo={{ t0: F(87), color: C.haloCaja, fuerza: 1 }} apaga={[F(159), F(169)]} fondo={C.cristal}>
        <Interfaz />
      </CajaCristal>
      <Movil claves={[
        { t: F(77), x: 1496, y: 360, s: 0.15, o: 1 }, { t: F(80), x: 1496, y: 590, s: 0.55 }, { t: F(83), x: 1496, y: 633, s: 1 },
        { t: F(159), x: 1496, y: 633, s: 1, o: 1 }, { t: F(169), x: 1496, y: 603, s: 1, o: 0 },
      ]}><BotonCaja /></Movil>
    </>
  );
};
const ActoCaja: React.FC = () => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  if (t < F(52) || t > F(173)) return null;
  // estela horizontal en los latigazos: proporcional a la velocidad de la cámara en pantalla
  const a = camCaja(t), b = camCaja(t - 1 / fps);
  const v = Math.abs(a.x - b.x) * a.s;
  const bx = v > 10 ? Math.min(90, (v - 10) * 1.6) : 0;
  return (
    <EcoZoom t0={F(87)} dur={F(1)} ecos={[1.23]} opacidad={0.5}>
      <AbsoluteFill style={{ filter: bx > 0.5 ? "url(#estelaCaja)" : undefined }}>
        {bx > 0.5 && <svg width={0} height={0} style={{ position: "absolute" }}><filter id="estelaCaja" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={`${bx.toFixed(1)} 0`} /></filter></svg>}
        <Camara2D claves={CLAVES_CAJA}><MundoCaja /></Camara2D>
      </AbsoluteFill>
    </EcoZoom>
  );
};

// ───────── acto 3 · botón aislado, cursor, pulsación y onda ─────────
const ActoBoton: React.FC = () => {
  const t = useSeg();
  if (t < F(162) || t > F(212)) return null;
  const brillo = tramo(t, F(176), F(186), CURVAS.suave);
  const S = 214;
  return (
    <>
      <AbsoluteFill style={{ opacity: Math.min(tramo(t, F(172), F(180), CURVAS.lineal), 1 - tramo(t, F(204), F(209), CURVAS.lineal)),
        background: "radial-gradient(circle 420px at 965px 535px, rgba(60,26,20,0.55) 0%, rgba(30,14,12,0.4) 45%, rgba(0,0,0,0) 100%)" }} />
      <OndaChoque t0={F(194.5)} x={963} y={527} dur={F(5)} banda={520} radioMax={1350} color={C.ondaCresta} valle="#43211A" pixel={72} />
      <Movil estela={0.6} claves={[
        { t: F(162), x: 967, y: 640, s: 102 / S, o: 0 }, { t: F(164), x: 966, y: 690, o: 0.35 }, { t: F(170), x: 965, y: 860, s: 150 / S, o: 0.45 }, { t: F(174), x: 965, y: 600, s: 168 / S, o: 1 },
        { t: F(176), x: 965, y: 575, s: 180 / S }, { t: F(180), x: 965, y: 548, s: 198 / S }, { t: F(187), x: 965, y: 535, s: 1, para: true },
        { t: F(204.5), x: 965, y: 535, s: 1, o: 1, para: true }, { t: F(209.5), x: 965, y: 685, s: 0.95, o: 0 },
      ]}>
        <BotonPulsa tam={S} t0={F(187)} baja={F(7)} sube={F(10)} profundidad={0.45} color={C.boton} colorPulsado={C.pulsado} apagado="#5A2A20" brillo={brillo} />
      </Movil>
      <CursorMano t0={F(172)} desde={[1185, 1160]} hasta={[1005, 560]} dur={F(14)} tam={150} pulsa={F(187)} sale={{ t0: F(205), dy: 160, dur: F(5) }} />
    </>
  );
};

// ───────── acto 4 · código que cae, se teclea y sale en 3D ─────────
const CLAVES_CODIGO: ClaveCamara2D[] = [
  { t: F(212), x: 960, y: 540, s: 1 }, { t: F(236), x: 960, y: 540, s: 1, para: true }, { t: F(241), x: 1000, y: 665, s: 0.82 },
  { t: F(246), x: 1022, y: 790, s: 0.71 }, { t: F(255), x: 1013, y: 849, s: 0.68 }, { t: F(271), x: 1026, y: 905, s: 0.64 },
];
const ActoCodigo: React.FC = () => {
  const t = useSeg();
  if (t < F(211.5) || t > F(277)) return null;
  return (
    <Salida3D t0={F(271)} dur={F(6)} ry={-50} rz={-8} escala={0.5} origen={[945, 535]}>
      <Camara2D claves={CLAVES_CODIGO}>
        <CodigoCae lineas={CODIGO} t0={F(212)} x={520} y={282} tam={29.5} interlineado={58.7} caida={F(18)} desdeY={300} escritura={ESCRITURA}
          caliente={C.codigoCaliente} frio={C.codigoFrio} enfriar={0.5} blur={9} sacudida={{ t0: F(235), dur: F(6), fuerza: 24 }} />
      </Camara2D>
    </Salida3D>
  );
};

// ───────── acto 5 · «$» → «Code» → «faster» → marca final con muelle ─────────
const AsteriscoFinal: React.FC = () => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  if (t < F(315.5)) return null;
  // muelle medido: ζ ≈ 0,45, sobrepaso 22 %, periodo ≈ 0,47 s (stiffness 170, damping 12)
  const s = spring({ frame: (t - F(313.9)) * fps, fps, config: { stiffness: 170, damping: 12, mass: 1 } });
  return (
    <div style={{ position: "absolute", left: 960, top: 540, transform: `translate(-50%, -50%) scale(${s})`, opacity: tramo(t, F(315.5), F(316.5), CURVAS.lineal) }}>
      <Asterisco tam={146} color={C.acento} />
    </div>
  );
};
const ActoFinal: React.FC = () => {
  const t = useSeg();
  if (t < F(277.5)) return null;
  const apaga = 1 - 0.65 * tramo(t, F(296), F(300), CURVAS.lineal);
  return (
    <>
      {t < F(301) && (
        // alejamiento continuo mientras se teclea (medido: la «C» ×1,28 → «Code» ×1,0 en 0,5 s), anclado a la derecha
        <AbsoluteFill style={{ transformOrigin: "1150px 525px", transform: `scale(${progreso(t, [[277, 1.34], [281, 1.28], [290, 1.12], [295, 1], [301, 0.96]])})` }}>
          <GlifoCambia de="$" palabra="Code" t0={F(277.5)} cambia={F(280.4)} tiempos={[F(285.5), F(290), F(295)]} dur={F(1.5)} blur={8} revela={F(3)} tam={140} x={960} y={525}
            color="#FCEDE6" caliente="#F29A70" enfria={0.3} colorDe="#F08A5D" halo={18} opacidad={apaga} />
        </AbsoluteFill>
      )}
      <TextoBrasa texto="faster" t0={F(301)} x={955} y={526} tam={102} bloom={48} cae={F(9)} alejar={0.09} durAlejar={F(15)} color={C.textoBrasa} caliente="#FFDBC1" sale={F(316)} />
      <AsteriscoFinal />
    </>
  );
};

// ───────── sonido (efectos de assets/sfx en los golpes del análisis + música sintetizada a 124 BPM) ─────────
const SFX: Sfx[] = [
  { t: F(1), f: "whoosh-rapido", v: 0.35 }, { t: F(7), f: "impacto", v: 0.45 }, { t: F(29), f: "whoosh-suave", v: 0.3 }, { t: F(32), f: "tic", v: 0.35 },
  { t: F(51), f: "whoosh-suave", v: 0.35 }, { t: F(60), f: "pop", v: 0.25 }, { t: F(64), f: "pop", v: 0.2 }, { t: F(87), f: "impacto", v: 0.4 },
  { t: F(102), f: "whoosh-rapido", v: 0.35 }, { t: F(130), f: "whoosh-rapido", v: 0.35 }, { t: F(180), f: "subida", v: 0.25 }, { t: F(188), f: "click", v: 0.5 },
  { t: F(195), f: "impacto", v: 0.55 }, { t: F(210), f: "whoosh", v: 0.3 }, { t: F(235), f: "glitch", v: 0.2 }, { t: F(272), f: "whoosh-rapido", v: 0.3 },
  { t: F(281), f: "tic", v: 0.3 }, { t: F(301), f: "impacto", v: 0.4 }, { t: F(317), f: "impacto", v: 0.5 },
];

export const RecSerifCalido: React.FC = () => {
  const t = useSeg();
  // bloom de pantalla: sube con la carga de la marca, se mantiene con las chispas y se corta en 2 fotogramas (f69–70)
  const bloom = curvaLuz(t, [F(46), F(50), F(51), F(52.5), F(55), F(58), F(62), F(66), F(68.5), F(69.5), F(71)], [0, 0.5, 0.45, 0.08, 0.15, 0.25, 0.45, 0.6, 0.6, 0.1, 0]);
  return (
    <EstiloProvider tokens={OSCURO_COBRE}>
      <AbsoluteFill style={{ background: C.fondo, overflow: "hidden" }}>
        <Fondo />
        <Resplandor fuerza={bloom} color="#5a3a34" x={50} y={50} tam={62} />
        <ActoMarca />
        <ActoCaja />
        <ActoBoton />
        <ActoCodigo />
        <ActoFinal />
        <Vineta fuerza={0.55} />
        <Sonido sfx={SFX} musica="musica/serif-calido.wav" volumenMusica={0.55} volumen={0.75} />
      </AbsoluteFill>
    </EstiloProvider>
  );
};
