// Recreación de la referencia «prompt de cristal» (util.mp4, 21,73 s) con la base de motion graphics y la variante
// OSCURO_CRISTAL. Análisis, medidas y tabla de eventos: referencias/motion-graphics/analisis/a-fondo-prompt-cristal.md.
// Medidas a 1920 (×1,5 de util.mp4) y tiempos en segundos del vídeo (cortes en el mismo fotograma que el original).
// Marcas del original → genéricas: producto «Orbita» (estrella de 4 puntas en degradado), chips «Modelo A/B/C», iconos
// de apps → glifos genéricos en aros, logo de contorno → `Roseton`.
import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import {
  BarraPrompt, Camara2D, Chispa, ConDesenfoque, CURVAS, Cursor, EstiloProvider, Estallido, FondoCristal, Glitch, Mosaico, pchip,
  RedNodos, Roseton, Sonido, TecleaLuz, tramo, useSeg, type ClaveCamara2D, type EscenaFondo, type Sfx,
} from "../base";
import { OSCURO_CRISTAL, PALETA_CRISTAL as P, URBANIST } from "../capas/oscuro-cristal";

export const duracionPromptCristal = 1304 / 60; // = 652 f a 30 fps
// cortes (fotograma del original ×2 / 60)
const C1 = 194 / 60, C2 = 308 / 60, C3 = 370 / 60, C4 = 452 / 60, C5 = 837 / 60, C6 = 1018 / 60, C7 = 1102 / 60;
const PRODUCTO = "Orbita";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const En: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => {
  const t = useSeg();
  return t >= a && t < b ? <>{children}</> : null;
};
const ESTRELLA_COLOR = "radial-gradient(circle at 56% 52%, #7FB2FF 0%, #4C8DF6 22%, transparent 48%), conic-gradient(from -25deg, #F25C54, #B06AF2 55deg, #4C8DF6 95deg, #4C8DF6 150deg, #3BD16F 195deg, #F2C531 265deg, #F25C54 335deg)";

// ───────── fondo de manchas por escena (muestreado del original) ─────────
const FONDOS: EscenaFondo[] = [
  { t: 0, fondo: "#030509", manchas: [{ x: 760, y: 1010, r: 760, color: "#3E506C", vx: -200, vy: 20 }, { x: 260, y: 1120, r: 480, color: "#22304A" }] },
  { t: 1.72, fundido: 0.45, fondo: "#050308", manchas: [{ x: 150, y: 640, r: 760, color: "#302945" }, { x: 1900, y: 600, r: 640, color: "#231F3A" }, { x: 260, y: 1120, r: 520, color: "#21213E" }] },
  { t: C1, fondo: "#040207", manchas: [{ x: 260, y: 1080, r: 720, color: "#2A1F38" }, { x: 1700, y: -40, r: 640, color: "#1C1B2D" }, { x: 40, y: 20, r: 420, color: "#1B2131", a: 0.8 }] },
  { t: C2, fondo: "#03060D", manchas: [{ x: 1960, y: 610, r: 980, color: "#9BADC5", vx: -30 }, { x: 1450, y: -80, r: 520, color: "#231F37" }, { x: 100, y: 0, r: 460, color: "#172029" }] },
  { t: C3, fondo: "#020306", manchas: [{ x: 1650, y: 680, r: 1120, color: "#7A90B0", a: 0.95 }, { x: 1350, y: 80, r: 520, color: "#444D68", a: 0.6 }] },
  { t: C4, fondo: "#1A0D0E", manchas: [] },
  { t: C5, fondo: "#010002", manchas: [{ x: 0, y: 0, r: 420, color: "#0F1016", a: 0.8 }, { x: 1920, y: 1080, r: 420, color: "#0B0B10" }] },
  { t: C6, fondo: "#020308", manchas: [{ x: 250, y: -50, r: 660, color: "#283048" }, { x: 700, y: 1160, r: 620, color: "#252E43" }, { x: 1960, y: 700, r: 560, color: "#1A202E" }] },
  { t: C7, fondo: "#010002", manchas: [{ x: 1990, y: 150, r: 760, color: "#363E51", vy: 15 }, { x: 1990, y: 860, r: 560, color: "#182130" }, { x: 723, y: 537, r: 380, color: "#17151D", a: 0.8 }] },
];

// ───────── glifos genéricos ─────────
const Flecha: React.FC<{ izq?: boolean }> = ({ izq }) => (
  <svg width={62} height={36} viewBox="0 0 62 36" style={{ display: "block", transform: izq ? "scaleX(-1)" : undefined }}>
    <path d="M3 18 H58 M44 5 L58 18 L44 31" stroke="#F7F8FC" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoChip: React.FC<{ tipo: "aro" | "chispa" | "asterisco" | "puntos" }> = ({ tipo }) => {
  if (tipo === "chispa") return <Chispa tam={22} />;
  if (tipo === "puntos") return <svg width={22} height={22} viewBox="0 0 22 22">{[4, 11, 18].map((x) => <circle key={x} cx={x} cy={11} r={2.2} fill="#E6E6EE" />)}</svg>;
  if (tipo === "asterisco") return <svg width={22} height={22} viewBox="-11 -11 22 22">{Array.from({ length: 8 }, (_, i) => <line key={i} x1={0} y1={0} x2={10} y2={0} stroke="#E6E6EE" strokeWidth={2} transform={`rotate(${i * 45 + 8})`} />)}</svg>;
  return <svg width={22} height={22} viewBox="0 0 22 22"><circle cx={11} cy={11} r={8} stroke="#E6E6EE" strokeWidth={2} fill="none" /><circle cx={11} cy={11} r={3} fill="#E6E6EE" /></svg>;
};
const CHIPS = [
  { icono: <IcoChip tipo="aro" />, nombre: "Modelo A" },
  { icono: <IcoChip tipo="chispa" />, nombre: "Modelo B", halo: (t: number) => (t < C2 ? P.verde : P.ambar) },
  { icono: <IcoChip tipo="asterisco" />, nombre: "Modelo C" },
  { icono: <IcoChip tipo="puntos" />, nombre: "Otro" },
];
// Iconos de apps → glifos geométricos de una sola familia (nada que recuerde a logos reales: van a un repo público).
const G = (hijos: React.ReactNode, color: string) => (
  <svg width={92} height={92} viewBox="-46 -46 92 92"><circle r={44} fill={color} opacity={0.16} />{hijos}</svg>
);
const ICONOS_APP: React.ReactNode[] = [
  G(<circle r={22} stroke="#F25C54" strokeWidth={10} fill="none" />, "#F25C54"),
  G(<rect x={-20} y={-20} width={40} height={40} rx={9} fill="#F2C531" />, "#F2C531"),
  G(<path d="M0 -26 Q4 -4 26 0 Q4 4 0 26 Q-4 4 -26 0 Q-4 -4 0 -26Z" fill="#B06AF2" />, "#B06AF2"),
  G(<polygon points="-18,-22 24,0 -18,22" fill="#3BD16F" />, "#3BD16F"),
  G(<g stroke="#4C8DF6" strokeWidth={9} strokeLinecap="round">{[-16, 0, 16].map((x, k) => <line key={x} x1={x} y1={18} x2={x} y2={[2, -16, -6][k]} />)}</g>, "#4C8DF6"),
  G(<polygon points="0,-24 24,0 0,24 -24,0" fill="#7998FD" />, "#7998FD"),
  G(<path d="M-24 6 Q-12 -14 0 4 Q12 22 24 2" stroke="#3BD16F" strokeWidth={9} fill="none" strokeLinecap="round" />, "#3BD16F"),
  G(<g stroke="#F2A541" strokeWidth={10} strokeLinecap="round"><line x1={-18} y1={0} x2={18} y2={0} /><line x1={0} y1={-18} x2={0} y2={18} /></g>, "#F2A541"),
];

// ───────── P1–P2: frases con la flecha (0 → C1) ─────────
const EscenaFrases: React.FC = () => {
  const t = useSeg();
  const GL = 0.633;
  let ax: number | null = null;
  if (t >= 0.067 && t < 1.57) ax = t < GL ? 558 + (826 - 558) * CURVAS.expo(clamp01((t - 0.067) / 0.233)) : 480;
  else if (t >= 1.57 && t < 1.72) ax = 480 + 1700 * CURVAS.acelera(clamp01((t - 1.57) / 0.15));
  const tx = t < GL ? 933 : 720;
  const u = clamp01((t - 2.4) / (C1 - 2.4));
  const caida = (306 * (Math.exp(4.5 * u) - 1)) / (Math.exp(4.5) - 1);
  const dFlecha = t < 2.2 ? null : 430 * Math.exp(-(t - 2.2) / 0.15);
  // fuga de luz gris que barre desde arriba a la derecha
  const kf = clamp01((t - 1.3) / 0.65);
  const fuga = Math.sin(Math.PI * kf);
  const texto: React.CSSProperties = { fontSize: 61, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1 };
  return (
    <AbsoluteFill>
      {fuga > 0.01 && <AbsoluteFill style={{ background: `radial-gradient(circle 700px at ${1900 - 500 * kf}px ${-200 + 1100 * kf}px, rgba(138,143,157,${0.5 * fuga}) 0%, rgba(138,143,157,0) 100%)` }} />}
      <Glitch t0={GL - 0.01} dur={0.04}>
        {ax !== null && <div style={{ position: "absolute", left: ax, top: 543 - 18 }}><Flecha /></div>}
        {t < 1.75 && <div style={{ position: "absolute", left: tx, top: 543, transform: "translateY(-50%)" }}>
          <TecleaLuz texto="Need business app." t0={0.3} cps={30} borra={{ t: 1.3, desde: "fin", cps: 60 }} style={texto} />
        </div>}
      </Glitch>
      {t >= 1.62 && <div style={{ position: "absolute", left: 0, width: 1920, top: 555, textAlign: "center", transform: `translateY(calc(-50% + ${caida}px)) scale(${1 - 0.1 * tramo(t, 2.3, C1, CURVAS.lineal)})` }}>
        <span style={{ position: "relative" }}>
          <TecleaLuz texto="Stop manual coding." t0={1.62} cps={57} style={{ ...texto, fontSize: 75 }} />
          {dFlecha !== null && <span style={{ position: "absolute", left: "calc(100% + 14px)", top: "50%", transform: `translate(${dFlecha}px, -50%)` }}><Flecha izq /></span>}
        </span>
      </div>}
    </AbsoluteFill>
  );
};

// ───────── P3–P5: la barra de prompt (C1 → C4) ─────────
const BX = 356, BY = 465; // esquina sup.-izq. de la barra en su mundo
const MundoBarra: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: BX, top: BY }}>
      <BarraPrompt t0={C1} texto="Need a business app." tEscribe={4.13} cps={21} chips={CHIPS} tClic={6.5} tEnciende={7.2}
        vidrio={P.vidrio} encendido={["#5A7090", "#B4C2D6"]} borde={P.borde} />
    </div>
    <Cursor ruta={[{ t: 5.333, x: 1770, y: 850 }, { t: 5.6, x: 1627, y: 694 }, { t: 5.95, x: 1510, y: 610 }, { t: C3 - 0.01, x: 1510, y: 610 }, { t: C3, x: 1416, y: 540 }]} tClic={6.5} curva={CURVAS.suave} />
  </>
);
const PLANOS_BARRA: [number, number, ClaveCamara2D[]][] = [
  [C1, C2, [{ t: C1, x: 574, y: 760, s: 1.9 }, { t: 3.4, x: 574, y: 650 }, { t: 3.533, y: 612 }, { t: 3.633, y: 590 }, { t: 3.767, y: 575 }, { t: 3.9, y: 560 },
    { t: 4.0, y: 553 }, { t: 4.133, x: 576, y: 552 }, { t: 4.6, x: 610, y: 545 }, { t: C2, x: 652, y: 539 }, { t: 5.3, x: 670, y: 536 }]],
  [C2, C3, [{ t: C2, x: 704, y: 542, s: 1 }, { t: 5.233, x: 830 }, { t: 5.333, x: 868 }, { t: 5.9, x: 968 }, { t: C3, x: 1080 }, { t: 6.3, x: 1180 }]],
  [C3, C4, [{ t: C3, x: 1203, y: 540, s: 2 }, { t: 6.4, x: 1267, y: 535 }, { t: 6.6, x: 1282, y: 532 }, { t: 7.37, x: 1295, y: 532 }, { t: 7.45, x: 1285, y: 515 }, { t: C4, x: 1240, y: 450 }, { t: 7.62, x: 1150, y: 330 }]],
];
const EscenaBarra: React.FC = () => (
  <>{PLANOS_BARRA.map(([a, b, claves], i) => <En key={i} a={a} b={b}><Camara2D claves={claves}><MundoBarra /></Camara2D></En>)}</>
);

// ───────── P6–P9: mosaico con canales blancos (C4 → C5) ─────────
const CODIGO = [
  "const app = createApp({", "  name: \"NextGen SaaS\",", "  platforms: [\"iOS\", \"Android\", \"Web\"],", "  aiModel: \"orbita-1.5-pro\",", "  authentication: true,",
  "  database: \"Cloud\",", "  payments: true,", "  smartNotifications: true,", "});", "", "generateUI(app);", "generateBackend(app);", "connectDatabase(app);",
  "integrateOrbita(app);", "runTests(app);", "deploy(app);",
];
const PanelCodigo: React.FC = () => {
  const t = useSeg();
  const k = tramo(t, C4, C4 + 1.1, CURVAS.suave);
  return (
    <>
      <div style={{ position: "absolute", left: 305, top: 150, fontSize: 82, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
        <TecleaLuz texto="Generating code." t0={7.72} cps={28} cursor />
      </div>
      <div style={{ position: "absolute", left: 305, top: 280, fontSize: 27, fontWeight: 400, opacity: 0.75 }}>
        <TecleaLuz texto={`// Powered by ${PRODUCTO} AI`} t0={8.1} cps={70} />
      </div>
      <div style={{ position: "absolute", left: 305, top: 340, fontSize: 25, fontWeight: 400, lineHeight: "29px", opacity: 0.92 }}>
        {CODIGO.map((l, i) => <div key={i} style={{ height: 29 }}><TecleaLuz texto={l} t0={7.95 + i * 0.022} cps={260} enfria={0.25} /></div>)}
      </div>
      <Estallido x={1500} y={327 + (850 - 327) * k} t0={C4} R={700} grosor={85} />
    </>
  );
};
const TarjetaBlanca: React.FC<{ x: number; y: number; w: number; h: number; t0: number; children?: React.ReactNode }> = ({ x, y, w, h, t0, children }) => {
  const t = useSeg();
  const k = tramo(t, t0, t0 + 0.4, CURVAS.suave);
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 18, background: "rgba(255,255,255,0.96)", boxShadow: "0 10px 30px rgba(0,0,20,0.35)", padding: 16, boxSizing: "border-box",
    opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>{children}</div>;
};
const Barra: React.FC<{ w: number; c: string; lleno: number }> = ({ w, c, lleno }) => (
  <div style={{ width: w, height: 18, borderRadius: 9, background: "#AEB8F0", marginTop: 12, overflow: "hidden" }}><div style={{ width: `${lleno * 100}%`, height: "100%", borderRadius: 9, background: c }} /></div>
);
const PanelAnalisis: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: 319, top: 128, fontSize: 98, fontWeight: 500, letterSpacing: "-0.01em" }}><TecleaLuz texto="Visual analysis." t0={9.05} cps={30} /></div>
    <TarjetaBlanca x={649} y={304} w={120} h={131} t0={9.2}><div style={{ color: "#8FD3A0", fontSize: 18, fontFamily: URBANIST }}>96%</div><div style={{ display: "flex", gap: 6, marginTop: 40 }}><div style={{ width: 36, height: 14, borderRadius: 7, background: "#8C93E8" }} /><div style={{ width: 36, height: 14, borderRadius: 7, background: "#8C93E8" }} /></div></TarjetaBlanca>
    <TarjetaBlanca x={799} y={304} w={120} h={131} t0={9.25}><svg width={88} height={88} viewBox="-44 -44 88 88"><polygon points="0,-34 32,-10 20,28 -20,28 -32,-10" fill="#E3F2E6" stroke="#B9C1E8" strokeWidth={2} /><polygon points="0,-18 18,-4 10,14 -12,16 -16,-6" fill="#A7DDB4" /></svg></TarjetaBlanca>
    <TarjetaBlanca x={649} y={450} w={270} h={225} t0={9.3}>
      <div style={{ color: "#7C86E0", fontSize: 24, fontFamily: URBANIST, fontWeight: 500 }}>Total balance</div>
      <Barra w={238} c="#9ED7A9" lleno={0.45} /><Barra w={238} c="#9ED7A9" lleno={0.75} /><Barra w={238} c="#7F8BE8" lleno={0.25} /><Barra w={238} c="#8C80E8" lleno={0.9} />
    </TarjetaBlanca>
    <Chispa tam={980} x={1640} y={790} curva={0.2} relleno="linear-gradient(225deg, #4DB2FD 0%, #5FA6FD 40%, #7998FD 65%, #9B7BF5 100%)" />
  </>
);
// panel de flujo: coordenadas del panel (x0 = −2446, y0 = −300)
const FX = -2446, FY = -300;
const PanelFlujo: React.FC = () => {
  const t = useSeg();
  const apaga = 1 - tramo(t, 13.4, 13.85, CURVAS.suave);
  const cx = -986 - FX, cy = 1353 - FY;
  return (
    <>
      <div style={{ position: "absolute", left: -1340 - FX, top: 1048 - FY, fontSize: 90, fontWeight: 600, color: "#E6E6EE", letterSpacing: "-0.01em" }}>
        <TecleaLuz texto="Organizing Workflow" t0={10.9} cps={40} borra={{ t: 13.4, desde: "inicio", cps: 57 }} />
      </div>
      <div style={{ position: "absolute", left: cx - 460, top: cy - 1, width: 740, height: 2, opacity: apaga, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7) 55%, rgba(255,255,255,0.7))" }} />
      <div style={{ position: "absolute", left: cx - 1, top: cy, width: 2, height: 255, opacity: apaga, background: "rgba(255,255,255,0.7)" }} />
      {[[cx + 279, cy], [cx, cy + 255]].map(([x, y], i) => { const d = 69 * apaga; return <div key={i} style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: d, background: "#F7F8FC" }} />; })}
      <Chispa tam={135} x={cx} y={cy} halo={0.8} colorHalo="#FFFFFF" />
      <div style={{ opacity: apaga }}><Roseton x={-290 - FX} y={1815 - FY} R={250} grosor={34} fondo={P.negro} giro={10} /></div>
    </>
  );
};
const PANELES = [
  { x: 0, y: 0, w: 1920, h: 1080, fondo: "radial-gradient(ellipse 60% 55% at 22% 0%, #A26D5B 0%, #8C594C 35%, rgba(140,89,76,0) 80%), radial-gradient(ellipse 45% 40% at 95% 5%, #4B2921 0%, rgba(75,41,33,0) 100%), linear-gradient(170deg, #8A5649 0%, #5E3B33 30%, #2A1612 58%, #0D080B 80%, #140A0C 100%)", contenido: <PanelCodigo /> },
  { x: 0, y: 1126, w: 1920, h: 1080, fondo: "radial-gradient(ellipse 30% 35% at 38% 75%, #56607A 0%, rgba(86,96,122,0) 100%), radial-gradient(ellipse 55% 60% at 52% 100%, #4A5D8C 0%, #2C3A5E 35%, rgba(37,51,79,0) 75%), radial-gradient(ellipse 50% 50% at 0% 0%, #1A2235 0%, rgba(26,34,53,0) 100%), #06070C", contenido: <PanelAnalisis /> },
  { x: FX, y: FY, w: 2400, h: 2700, fondo: "radial-gradient(ellipse 25% 20% at 0% 55%, #161A25 0%, rgba(22,26,37,0) 100%), #010002", contenido: <PanelFlujo /> },
];
// cámara medida (canales blancos): y = 1620 − 1,5·Y, x = 914 − 1,5·X (Y, X medidos en util.mp4)
const CAM_Y: [number, number][] = [[C4, 540], [9.0, 553], [9.067, 594], [9.133, 651], [9.2, 721], [9.267, 802], [9.333, 879], [9.4, 946], [9.467, 1006], [9.533, 1056], [9.6, 1099],
  [9.667, 1137], [9.8, 1198], [10.0, 1270], [10.333, 1352], [10.667, 1402], [11.0, 1438], [11.333, 1456], [11.8, 1470], [13.333, 1472], [13.9, 1353]];
const CAM_X: [number, number][] = [[C4, 960], [10.667, 916], [10.867, 912], [11.067, 869], [11.267, 754], [11.333, 701], [11.467, 494], [11.667, 200], [11.867, -136], [12.0, -376],
  [12.167, -518], [12.333, -608], [12.667, -718], [13.0, -802], [13.333, -969], [13.6, -986], [13.9, -986]];
const CAM_S: [number, number][] = [[C4, 1], [13.35, 1], [13.9, 1.4]];
const pis = (k: [number, number][], t: number) => pchip(k.map((p) => p[0]), k.map((p) => p[1]), t);
const camMosaico = (t: number) => ({ x: pis(CAM_X, t), y: pis(CAM_Y, t), s: pis(CAM_S, t) });

// ───────── P9–P11: chispa → aro → pastilla → red (C5 → C6) ─────────
const ESTIRA = Easing.bezier(0.7, 0, 0.2, 1);
const NODOS: [number, number][] = [[-464, -603], [464, -603], [-1084, -183], [-1084, 174], [1084, -183], [1084, 174], [-464, 594], [464, 594]];
const MundoRed: React.FC = () => {
  const t = useSeg();
  const d = t < 14.45 ? 0 : 279 + (400 - 279) * CURVAS.expo(clamp01((t - 14.45) / 0.27));
  const w = d + (1185 - 400) * ESTIRA(clamp01((t - 14.733) / 0.45));
  const chX = 960 + Math.min(0, 276 - w / 2);
  const gira = tramo(t, 14.333, 14.55, CURVAS.expo);
  return (
    <>
      {d > 0 && <div style={{ position: "absolute", left: 960 - w / 2, top: 540 - d / 2, width: w, height: d, borderRadius: d, background: P.pastilla, boxShadow: `inset 0 0 0 2px ${P.borde}`, opacity: clamp01((t - 14.45) / 0.05), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: chX - (960 - w / 2) + 142, top: 0, height: d, display: "flex", alignItems: "center", fontSize: 205, fontWeight: 500, letterSpacing: "-0.01em" }}>
          <TecleaLuz texto={PRODUCTO} t0={14.9} cps={30} />
        </div>
      </div>}
      <Chispa tam={189 - 14 * gira} x={chX} y={540} giro={90 * gira} halo={1 - 0.6 * tramo(t, 14.45, 14.8)} colorHalo="#FFFFFF" />
      <RedNodos x={960} y={540} w={1185} h={400} t0={15.27} tIconos={15.57} aro={246} nodos={NODOS.map(([x, y], i) => ({ x, y, icono: ICONOS_APP[i] }))}
        colorLinea={P.conector} colorAro={P.aro} grosor={2.5} escalaIcono={1.65} />
    </>
  );
};
const CAM_RED: ClaveCamara2D[] = [{ t: C5, x: 960, y: 540, s: 1 }, { t: 15.2, s: 1 }, { t: 15.5, s: 0.85 }, { t: 16.0, s: 0.689 }, { t: 16.2, s: 0.646 }, { t: 16.4, s: 0.616 },
  { t: 16.6, s: 0.587 }, { t: 16.8, s: 0.563 }, { t: 16.93, s: 0.519 }, { t: C6, s: 0.49 }, { t: 17.05, s: 0.4 }];

// ───────── P12: lema (C6 → C7) ─────────
const EscenaLema: React.FC = () => {
  const t = useSeg();
  const s = 1 + 0.05 * tramo(t, C6, C7, CURVAS.lineal);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${s})` }}>
      <TecleaLuz texto={`From Idea to App. Powered by ${PRODUCTO} AI`} t0={16.95} dur={1.1} curva={CURVAS.expo} negrita={[29, 38]} colapsa
        borra={{ t: 17.95, desde: "inicio", cps: 52 }} style={{ fontSize: 57, fontWeight: 400, letterSpacing: "-0.01em" }} />
    </AbsoluteFill>
  );
};

// ───────── P13: marca final (C7 → fin) ─────────
const EscenaMarca: React.FC = () => {
  const t = useSeg();
  const k = tramo(t, C7, C7 + 0.5, CURVAS.expo);
  const s = 1.08 - 0.08 * tramo(t, C7, C7 + 0.6, CURVAS.expo);
  const ai = 1 - tramo(t, C7, C7 + 0.12, CURVAS.lineal);
  return (
    <AbsoluteFill style={{ transform: `scale(${s})` }}>
      <div style={{ position: "absolute", right: 1920 - 873 + 30, top: 537, transform: "translateY(-50%)", fontSize: 144, fontWeight: 400, letterSpacing: "-0.01em" }}>
        <TecleaLuz texto="ed by" t0={C7 - 1} cps={1000} colapsa borra={{ t: C7, desde: "inicio", cps: 14 }} />
      </div>
      <div style={{ position: "absolute", left: 873, top: 537, transform: "translateY(-50%)", fontSize: 144, fontWeight: 500, letterSpacing: "-0.01em", color: P.texto, fontFamily: URBANIST, whiteSpace: "pre" }}>
        {PRODUCTO}<span style={{ opacity: ai }}> AI</span>
      </div>
      <Chispa tam={220} x={-200 + (723 + 200) * k} y={537} giro={-90 * (1 - k)} curva={0.2} relleno={ESTRELLA_COLOR} halo={0.9 * k} colorHalo="#6E8EFF" />
    </AbsoluteFill>
  );
};

// ───────── sonido (tabla de eventos del análisis, §7) ─────────
const tics = (a: number, b: number, paso: number, v: number): Sfx[] => Array.from({ length: Math.floor((b - a) / paso) + 1 }, (_, i) => ({ t: a + i * paso, f: "tic", v }));
const SFX: Sfx[] = [
  { t: 0.03, f: "impacto", v: 0.22 }, ...tics(0.3, 0.9, 0.1, 0.08), { t: 0.97, f: "tic", v: 0.25 }, { t: 1.46, f: "whoosh-suave", v: 0.45 }, { t: 1.6, f: "subida", v: 0.15 },
  { t: 3.08, f: "impacto", v: 0.45 }, ...tics(3.4, 4.0, 0.1, 0.12), ...tics(4.15, 5.05, 0.12, 0.08),
  { t: 5.12, f: "whoosh-rapido", v: 0.35 }, { t: 6.0, f: "impacto", v: 0.18 }, { t: 6.15, f: "whoosh-rapido", v: 0.3 }, { t: 6.5, f: "click", v: 0.6 },
  { t: 7.15, f: "subida", v: 0.3 }, { t: 7.5, f: "impacto", v: 0.5 }, ...tics(8.0, 8.8, 0.13, 0.08),
  { t: 9.1, f: "whoosh", v: 0.3 }, { t: 9.26, f: "impacto", v: 0.35 }, { t: 11.4, f: "whoosh", v: 0.4 }, { t: 11.75, f: "impacto", v: 0.35 },
  { t: 13.42, f: "pop", v: 0.2 }, { t: 14.33, f: "tic", v: 0.3 }, { t: 14.45, f: "impacto", v: 0.38 }, { t: 15.15, f: "pop", v: 0.22 }, { t: 15.5, f: "whoosh-suave", v: 0.3 },
  { t: 16.45, f: "subida", v: 0.3 }, ...tics(17.1, 17.7, 0.12, 0.07), { t: 18.35, f: "impacto", v: 0.42 }, { t: 18.72, f: "impacto", v: 0.22 },
];

const VENTANAS: [number, number][] = [[1.56, 1.7], [C2 - 0.03, C2 + 0.04], [C3 - 0.03, C3 + 0.04], [7.42, C4 + 0.03], [9.17, 9.4], [11.5, 11.85], [16.85, C6 + 0.03], [C7 - 0.03, C7 + 0.2]];

export const RecPromptCristal: React.FC = () => (
  <EstiloProvider tokens={OSCURO_CRISTAL}>
    <AbsoluteFill style={{ background: P.fondo, fontFamily: URBANIST, color: P.texto }}>
      <ConDesenfoque ventanas={VENTANAS}>
        <AbsoluteFill>
          <FondoCristal escenas={FONDOS} />
          <En a={0} b={C1}><EscenaFrases /></En>
          <EscenaBarra />
          <En a={C4} b={C5}><Mosaico paneles={PANELES} camara={camMosaico} /></En>
          <En a={C5} b={C6}><Camara2D claves={CAM_RED}><MundoRed /></Camara2D></En>
          <En a={C6} b={C7}><EscenaLema /></En>
          <En a={C7} b={99}><EscenaMarca /></En>
        </AbsoluteFill>
      </ConDesenfoque>
      <Sonido sfx={SFX} musica="musica/musica-prompt-cristal.wav" volumenMusica={0.8} volumen={1.1} />
    </AbsoluteFill>
  </EstiloProvider>
);
