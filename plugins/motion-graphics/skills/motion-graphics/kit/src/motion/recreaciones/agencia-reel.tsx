// Recreación de referencias/motion-graphics/ref-agencia-reel.mp4 (reel de motion designer: HUD + un color por compás).
// 15 s = 8 compases de 128 BPM, 1920×1080 a 60 fps, con los MISMOS tiempos que el original (análisis y receta en
// referencias/motion-graphics/analisis/a-fondo-agencia-reel.md §2 y §7). Estilo: AGENCIA_PUNTO. Marca genérica «Studio.».
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  CajaTransformacion, ConDesenfoque, CintaRayas, Corchetes, CURVAS, EstiloProvider, FormaPolar, HudCompas, IrisAro, NubePuntos, PuntoSalta, PuntosDivide, Sonido, TextoAnillos,
  anchoTexto, formaCubo, formaEsfera, formaFlor, formaRejilla, formaToro, pista, rangosDesdeCentro, rebote, tramo, useSeg, type ClaveNube, type OndaTrama, type Sfx, type VistaNube,
} from "../base";
import { AGENCIA_PUNTO, BARLOW, COLORES_PUNTO as K, MONTSERRAT, SOURCE_SERIF } from "../capas/agencia-punto";

export const duracionRecAgenciaReel = 15;
const C = 1.875, T = C / 4; // compás y tiempo a 128 BPM
const cl01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const Vineta: React.FC<{ f?: number }> = ({ f = 0.07 }) => <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,${f}) 100%)` }} />;
const Fondo: React.FC<{ c: string; f?: number }> = ({ c, f }) => <AbsoluteFill style={{ background: c }}><Vineta f={f} /></AbsoluteFill>;

// ───────── Compás 1 · el punto que se divide ─────────
const Compas1: React.FC = () => (
  <PuntosDivide x={960} y={540} tamPop={51} tam={38} giro={20} color={K.rojo} cruz={0.938} hasta={C + 0.06}
    pasos={[{ t: 0.133, n: 1, r: 0 }, { t: T, n: 2, r: 64, angulo: 17, sobrepaso: 0.23 }, { t: 2 * T, n: 4, r: 95, sobrepaso: 0.08 }, { t: 3 * T, n: 8, r: 176, sobrepaso: 0.11 }]}
    guias={[{ t: 3 * T, r: 216 }, { t: 3 * T, r: 120, punteado: true }]} fusion={{ t: 1.72, dur: 0.11, tam: 140 }} />
);

// ───────── Compás 2 · EVERY [FRAME] ON PURPOSE. (cámara 2D con latigazos y zoom al punto) ─────────
const FT = 183; // cuerpo de la display (altura de mayúscula 128 px)
const L1 = 355, L2 = 538, X0 = 259, XFRAME = 963, XPURPOSE = 617;
const anchoPurpose = () => anchoTexto("PURPOSE", MONTSERRAT, 900, FT);
const puntoFinal = () => ({ x: XPURPOSE + anchoPurpose() + FT * 0.135, y: 695 - FT * 0.075, d: FT * 0.15 });
type Mov = { t0: number; t1: number; x?: number; y?: number; s?: number; curva?: (q: number) => number };
const MOVS: Mov[] = [
  { t0: C, t1: C + 0.1, s: 1.7 },
  { t0: C + 0.1, t1: 2.344, s: 1.735, curva: CURVAS.lineal },
  { t0: 2.344, t1: 2.64, x: 965, y: 471, s: 1.097 },
  { t0: 2.64, t1: 2.79, s: 1.12, curva: CURVAS.lineal },
  { t0: 2.79, t1: 2.92, x: 579, y: 653, s: 1.36 },
  { t0: 2.92, t1: 3.281, s: 1.39, curva: CURVAS.lineal },
  { t0: 3.281, t1: 3.39, x: 960, y: 540, s: 1.0 },
  { t0: 3.39, t1: 3.58, s: 1.02, curva: CURVAS.lineal },
];
const camTexto = (t: number) => {
  let x = 584, y = 448, ls = Math.log(1.92);
  for (const m of MOVS) {
    if (t <= m.t0) break;
    const q = (m.curva ?? CURVAS.expo)(cl01((t - m.t0) / (m.t1 - m.t0)));
    x = lerp(x, m.x ?? x, q); y = lerp(y, m.y ?? y, q); ls = lerp(ls, Math.log(m.s ?? Math.exp(ls)), q);
  }
  // 3,60–3,75: zoom con ease-in al punto final; el punto va de su sitio en pantalla al centro mientras crece ×38
  if (t > 3.58) {
    const p = puntoFinal();
    const q = CURVAS.acelera(cl01((t - 3.58) / 0.15));
    const s0 = Math.exp(ls), sx0 = 960 + s0 * (p.x - x), sy0 = 540 + s0 * (p.y - y);
    ls = lerp(ls, Math.log(1040 / p.d), q);
    const s = Math.exp(ls);
    x = p.x - (lerp(sx0, 960, q) - 960) / s; y = p.y - (lerp(sy0, 540, q) - 540) / s;
  }
  return { x, y, s: Math.exp(ls) };
};
const disp: React.CSSProperties = { position: "absolute", fontFamily: MONTSERRAT, fontWeight: 900, fontSize: FT, lineHeight: 1, color: K.tinta, whiteSpace: "pre", display: "flex" };
const Letras: React.FC<{ texto: string; left: number; top: number; anim: (i: number) => { dx?: number; dy?: number; rot?: number; s?: number; o?: number } }> = ({ texto, left, top, anim }) => (
  <div style={{ ...disp, left, top }}>
    {Array.from(texto).map((ch, i) => { const a = anim(i); return <span key={i} style={{ display: "inline-block", opacity: a.o ?? 1, transform: `translate(${a.dx ?? 0}px, ${a.dy ?? 0}px) rotate(${a.rot ?? 0}deg) scale(${a.s ?? 1})` }}>{ch}</span>; })}
  </div>
);
const TextoCompas2: React.FC = () => {
  const t = useSeg();
  const cam = camTexto(t);
  const p = puntoFinal();
  const tPunto = 3.3 + 7 * 0.03;
  const qp = tramo(t, tPunto, tPunto + 0.1);
  const rojo = tramo(t, 3.62, 3.73, CURVAS.lineal) * p.d * 0.19;
  return (
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)` }}>
      <div style={{ ...disp, left: X0, top: L1 }}>EVERY</div>
      {t >= 2.344 && <Letras texto="FRAME" left={XFRAME} top={L1} anim={(i) => {
        const ti = 2.344 + 0.02 * i, q = rebote(t - ti, 0.15, 0.08), r = 1 - q;
        return { dx: r * 360, dy: r * (-430 + (i % 2 ? 60 : -40)), rot: r * (i % 2 ? 18 : -25), s: 1 + 0.15 * r, o: t >= ti ? 1 : 0 };
      }} />}
      <Corchetes t0={2.4} x={1316} y={446} ancho={777} alto={191} grosor={4.5} largo={30} color={K.tinta} desde={1.35} />
      {t >= 2.813 && <Letras texto="ON" left={X0} top={L2} anim={(i) => { const ti = 2.813 + 0.04 * i, q = rebote(t - ti, 0.13, 0.06); return { dy: (1 - q) * 150, o: cl01((t - ti) / 0.05) }; }} />}
      {t >= 3.3 && <Letras texto="PURPOSE" left={XPURPOSE} top={L2} anim={(i) => { const ti = 3.3 + 0.03 * i, q = tramo(t, ti, ti + 0.12); return { dx: (1 - q) * 90, s: 1 + 0.15 * (1 - q), o: cl01((t - ti) / 0.04) }; }} />}
      {t >= tPunto && <div style={{ position: "absolute", left: p.x - p.d / 2 + (1 - qp) * 60, top: p.y - p.d / 2, width: p.d, height: p.d, borderRadius: "50%", background: K.tinta, opacity: cl01((t - tPunto) / 0.04) }} />}
      {rojo > 0 && <div style={{ position: "absolute", left: p.x - rojo / 2, top: p.y - rojo / 2, width: rojo, height: rojo, borderRadius: "50%", background: K.rojo }} />}
    </AbsoluteFill>
  );
};
const Compas2: React.FC = () => {
  const t = useSeg();
  if (t >= 2 * C) return null;
  return (
    <IrisAro t0={C} dur={0.05} desde={55} aro={{ color: K.aro, grosor: 6, separacion: 68 }}>
      <Fondo c={K.rojo} />
      <ConDesenfoque ventanas={[[2.34, 2.56], [2.78, 2.93], [3.27, 3.52]]} muestras={6}><TextoCompas2 /></ConDesenfoque>
    </IrisAro>
  );
};

// ───────── Compás 3 · círculo → cuadrado → triángulo → flor con caja de transformación ─────────
const MORPHS = [{ t: 4.219, d: 90 }, { t: 4.688, d: 150 }, { t: 5.156, d: 60 }];
const rotCaja = (t: number) => MORPHS.reduce((s, m) => s + m.d * rebote(t - m.t, 0.27, 0.12), 0);
// medido: 196 → 485 (pico a 0,17 s) y asienta en 424 SIN rebote por debajo (decae en ~0,2 s)
const diamCirculo = (t: number) => { const dt = t - 2 * C; return dt < 0.17 ? 196 + (485 - 196) * CURVAS.expo(dt / 0.17) : 424 + 61 * Math.exp(-(dt - 0.17) / 0.2); };
const Compas3: React.FC = () => {
  const t = useSeg();
  if (t < 2 * C || t >= 3 * C) return null;
  const rot = rotCaja(t), d = diamCirculo(t);
  const forma = t >= 5.156 ? "FLOWER" : t >= 4.688 ? "TRIANGLE" : t >= 4.219 ? "SQUARE" : "CIRCLE";
  const r = ((rot % 360) + 360) % 360;
  return (
    <AbsoluteFill>
      <Fondo c={K.negro} />
      <FormaPolar tam={d} rot={rot} opacidad={1 - tramo(t, 5.4, 5.5)} claves={[{ t: 2 * C, forma: "circulo", color: K.rojo }, { t: 4.219, forma: "cuadrado", color: K.azul }, { t: 4.688, forma: "triangulo", color: K.amarillo }, { t: 5.156, forma: "flor", color: K.rojo }]} />
      <CajaTransformacion t0={3.8} lado={d * 1.29} rot={rot} sale={5.36} fondo={K.negro} color="rgba(255,255,255,0.72)" fuente={BARLOW}
        etiqueta={[`ROT ${r.toFixed(1).padStart(5, "0")}°`, `SHAPE ${forma}`]} />
    </AbsoluteFill>
  );
};

// ───────── Compases 3½–5 · UNA nube de puntos: flor → rejilla con ondas → suelo 3D → esfera → toro → cubo ─────────
const REJ = formaRejilla(33, 19, 58);
const N = REJ.length;
const FLOR = formaFlor(N, 212, "flor", rangosDesdeCentro(REJ));
const CLAVES_NUBE: ClaveNube[] = [
  { t: 0, forma: FLOR },
  { t: 5.68, forma: REJ, dur: 0.3, escalon: 0.08, orden: "centro" },
  { t: 7.72, forma: formaEsfera(N, 340), dur: 0.18, escalon: 0.06, orden: "indice", curva: CURVAS.inOut },
  { t: 8.06, forma: formaToro(N, 33, 230, 100), dur: 0.22, escalon: 0.06, orden: "indice", curva: CURVAS.inOut },
  { t: 8.6, forma: formaCubo(N, 440), dur: 0.2, escalon: 0.05, orden: "azar", curva: CURVAS.inOut },
];
const ONDAS: OndaTrama[] = [
  { t: 5.85, tipo: "cuadrado", vel: 0, claves: [[5.85, 0], [6.1, 505], [6.25, 620]], aspecto: 1.78, ancho: 45, desplaza: 14, dur: 0.38 },
  { t: 6.1, tipo: "banda", vel: 0, claves: [[6.1, -1050], [6.3, -480], [6.5, 90], [6.8, 315], [7.0, 420]], ancho: 60, desplaza: 18, dur: 0.95 },
  { t: 6.563, tipo: "diagonal", desde: -950, vel: 2400, ancho: 60, desplaza: 14, dur: 0.5 },
  { t: 7.031, tipo: "circulo", vel: 2700, ancho: 55, desplaza: 16, dur: 0.42, relleno: 0.3, cy: -38, cx: -15 },
];
const VISTA_K = [
  { t: 7.27, rx: 0, ry: 0, rz: 0, x: 0, y: 0, z: 0 },
  { t: 7.5, rx: 60, ry: 0, rz: 0, x: 0, y: 0, z: 0 },
  { t: 7.64, rx: 62, ry: -6, rz: -6, x: 60, y: 80, z: 0 },
  { t: 7.8, rx: 18, ry: 0, rz: -6, x: 0, y: 0, z: 0 },
  { t: 8.06, rx: 18, ry: 0, rz: -6, x: 0, y: 0, z: 0 },
  { t: 8.3, rx: 55, ry: 0, rz: 60, x: 0, y: 0, z: 0 },
  { t: 8.42, rx: 55, ry: 0, rz: 60, x: 0, y: 0, z: 0 },
  { t: 8.72, rx: 30, ry: 0, rz: 15, x: 0, y: 0, z: 0 },
];
const vistaNube = (t: number): VistaNube => {
  if (t < 7.27) return {};
  if (t < 7.5) return { rx: 60 * CURVAS.acelera(cl01((t - 7.27) / 0.23)) };
  const v = pista(VISTA_K, t, ["rx", "ry", "rz", "x", "y", "z"] as const);
  const giro = t > 7.8 ? 70 * (t - 7.8) : 0;
  const empuje = Math.exp(Math.log(7) * CURVAS.acelera(cl01((t - 9.14) / 0.235)));
  return { ...v, ry: v.ry + giro, s: empuje };
};
const Nube: React.FC = () => {
  const t = useSeg();
  return (
    <>
      {t >= 3 * C && t < 4 * C && <Fondo c={K.crema} f={0.05} />}
      {t >= 4 * C && t < 5 * C && <Fondo c={K.azul} f={0.06} />}
      <NubePuntos claves={CLAVES_NUBE} desde={5.39} hasta={5 * C} aparece={{ t: 5.36, dur: 0.1 }} vista={vistaNube}
        tam={(tt) => (tt < 3 * C ? 13 : tt < 4 * C ? lerp(12, 9, tramo(tt, 5.62, 5.8)) : lerp(10, 7, tramo(tt, 8.58, 8.8)))}
        color={(tt) => (tt < 3 * C ? K.rojo : tt < 4 * C ? K.negro : K.particula)} ondas={ONDAS} tamCresta={24} colorCresta={K.rojo}
        colorAcento={K.amarillo} pctAcento={0.05} acentoDesde={4 * C} estela={0.016} profundidadAlfa={0.65} rangoProfundidad={450} perspectiva={1700} />
    </>
  );
};

// ───────── Compás 6 · cinta de rayas con lazo ─────────
const CAMINO = "M -250 960 C 250 830 650 700 915 555 C 1130 437 1200 230 1030 130 C 860 30 640 120 650 300 C 660 440 780 520 915 575 C 1150 670 1600 700 2600 650";
const cabezaCinta = (t: number) => 250 + 2540 * (t - 5 * C) + (t > 10.33 ? 1720 * (t - 10.33) ** 2 : 0);
const Compas6: React.FC = () => {
  const t = useSeg();
  if (t < 5 * C || t >= 6 * C) return null;
  return (
    <AbsoluteFill>
      <Fondo c={K.amarillo} f={0.05} />
      <CintaRayas camino={CAMINO} rayas={[K.negro, "#FA4F30", K.cremaCinta, "#343BF3"]} ancho={87} largo={1650} cabeza={cabezaCinta} corte={2000}
        impacto={{ t: 10.31, x: 894, y: 566, n: 6, largo: 26, color: K.negro, dur: 0.2 }} />
    </AbsoluteFill>
  );
};

// ───────── Compás 7 · filas de texto que se curvan en anillos ─────────
const Compas7: React.FC = () => {
  const t = useSeg();
  if (t < 6 * C || t >= 7 * C + 0.1) return null;
  return (
    <AbsoluteFill>
      <Fondo c={K.negro} />
      <TextoAnillos fuente={MONTSERRAT} centro={[960, 540]} radios={[448, 364, 281, 206]} filasY={[330, 456, 585, 711]} vel={[266, -260, 265, -270]} fases={[1405, 22, 52, 299]} escalonEntra={0.05}
        filas={[
          { texto: "MOTION DESIGN • ANIMATION • ART DIRECTION • ", tam: 64, peso: 800, tracking: 0.35, color: K.textoAnillo },
          { texto: "TYPOGRAPHY • 3D • ILLUSTRATION • ", tam: 56, peso: 800, tracking: 0.02, relleno: false, color: K.textoAnillo },
          { texto: "RHYTHM • TIMING • EASING • ", tam: 50, peso: 800, tracking: 0.04, color: K.textoAnillo },
          { texto: "LINE • COLOR • SHAPE • ", tam: 42, peso: 800, tracking: 0.04, relleno: false, color: K.textoAnillo },
        ]}
        tEntra={6 * C} tCurva={11.87} durCurva={0.36} tAcelera={12.65} durAcelera={0.25} factor={12} tColapso={12.97} durColapso={0.15}
        colorVineta="#F84D30" tamVineta={14} punto={{ t: 11.87, tam: 67, color: K.rojo }} hasta={7 * C + 0.1} />
    </AbsoluteFill>
  );
};

// ───────── Compás 8 · iris crema, el punto salta y es el punto del logo ─────────
const LOGO = "Studio", LT = 240;
const Compas8: React.FC = () => {
  const t = useSeg();
  if (t < 7 * C) return null;
  const W = anchoTexto(LOGO, SOURCE_SERIF, 600, LT);
  const total = W + 46;
  const left = 960 - total / 2;
  const punto: [number, number] = [left + W + 30, 564];
  const sub = tramo(t, 13.63, 13.72);
  const pie = "900 FRAMES · 60 FPS · 128 BPM · WRITTEN ENTIRELY IN CODE";
  const nPie = Math.floor(pie.length * cl01((t - 14.06) / 0.54));
  return (
    <>
      <IrisAro t0={7 * C} dur={0.06} desde={118} aro={null} curva={CURVAS.lineal}>
        <Fondo c={K.crema} f={0.05} />
        <div style={{ position: "absolute", left, top: 580 - LT * 0.98, fontFamily: SOURCE_SERIF, fontWeight: 600, fontSize: LT, lineHeight: 1.2, color: K.tinta, whiteSpace: "pre", display: "flex", letterSpacing: "-0.01em" }}>
          {Array.from(LOGO).map((ch, i) => { const ti = 13.3 + 0.05 * i, q = tramo(t, ti, ti + 0.12); return <span key={i} style={{ display: "inline-block", opacity: cl01((t - ti) / 0.05), transform: `translateY(${(1 - q) * 14}px)` }}>{ch}</span>; })}
        </div>
        <div style={{ position: "absolute", left: 0, width: 1920, top: 684 - 14, textAlign: "center", fontFamily: BARLOW, fontWeight: 500, fontSize: 28, lineHeight: 1, letterSpacing: `${lerp(0.6, 0.35, sub)}em`, color: K.tinta, opacity: sub, paddingLeft: "0.35em" }}>MOTION DESIGNER</div>
        <div style={{ position: "absolute", left: 960 - 470, width: 940, top: 750 - 9, fontFamily: BARLOW, fontWeight: 400, fontSize: 17, lineHeight: 1, letterSpacing: "0.3em", color: K.gris, whiteSpace: "pre", textAlign: "left" }}>
          <span style={{ display: "inline-block", width: "100%", textAlign: "center" }}><span style={{ visibility: "hidden" }}>{""}</span>{pie.slice(0, nPie)}<span style={{ visibility: "hidden" }}>{pie.slice(nPie)}</span></span>
        </div>
      </IrisAro>
      <PuntoSalta t0={13.15} t1={13.6} desde={[960, 540]} hasta={punto} altura={235} tamIni={75} tamFin={33} aplasta={0.55} color={K.rojo} visibleDesde={7 * C} />
    </>
  );
};

const SFX: Sfx[] = [
  { t: 0.133, f: "click", v: 0.35 }, { t: T, f: "tic", v: 0.4 }, { t: 2 * T, f: "tic", v: 0.4 }, { t: 3 * T, f: "tic", v: 0.45 },
  { t: C, f: "impacto", v: 0.3 }, { t: 2.344, f: "pop", v: 0.4 }, { t: 2.8, f: "whoosh-rapido", v: 0.35 }, { t: 3.27, f: "whoosh-rapido", v: 0.35 }, { t: 3.6, f: "whoosh", v: 0.3 },
  { t: 2 * C, f: "pop", v: 0.45 }, { t: 4.219, f: "click", v: 0.45 }, { t: 4.688, f: "click", v: 0.45 }, { t: 5.156, f: "click", v: 0.45 },
  { t: 3 * C, f: "impacto", v: 0.22 }, { t: 6.094, f: "whoosh-suave", v: 0.25 }, { t: 4 * C, f: "whoosh-rapido", v: 0.3 }, { t: 7.97, f: "pop", v: 0.3 },
  { t: 8.1, f: "whoosh-suave", v: 0.25 }, { t: 8.6, f: "click", v: 0.35 }, { t: 9.14, f: "whoosh", v: 0.35 }, { t: 5 * C, f: "whoosh-rapido", v: 0.3 },
  { t: 10.31, f: "click", v: 0.5 }, { t: 10.6, f: "whoosh", v: 0.3 }, { t: 6 * C, f: "whoosh-rapido", v: 0.4 }, { t: 11.87, f: "pop", v: 0.35 },
  { t: 7 * C, f: "impacto", v: 0.55 }, { t: 13.6, f: "pop", v: 0.5 }, { t: 14.52, f: "click", v: 0.25 },
];

const BARRAS_CLARAS = [1, 3, 5, 7];
export const RecAgenciaReel: React.FC = () => (
  <EstiloProvider tokens={AGENCIA_PUNTO}>
    <AbsoluteFill style={{ background: K.negro }}>
      <Compas1 />
      <Compas2 />
      <Compas3 />
      <Nube />
      <Compas6 />
      <Compas7 />
      <Compas8 />
      <HudCompas marca="STUDIO" subtitulo="MOTION REEL 2026" bpm={128} compases={8} fpsTC={60} desde={0.133} ocultarArribaDesde={7 * C + 0.08} fuente={BARLOW}
        color={(t) => (BARRAS_CLARAS.includes(Math.floor(t / C) + 1) ? K.claro : K.tinta)} />
      <Sonido sfx={SFX} musica="musica/musica-agencia-punto.wav" volumenMusica={0.55} volumen={0.7} />
    </AbsoluteFill>
  </EstiloProvider>
);
