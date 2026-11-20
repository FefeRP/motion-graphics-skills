// Demo del estilo AGENCIA (ref Iván García / Hyperframes). 11,25 s, 60 fps, 128 BPM: una sección por compás
// (1,875 s), cada una con su color plano; las transiciones las hace un objeto (láser, móvil, punto), nunca un fundido.
// Estudio ficticio «norte». Medidas y recetas: referencias/motion-graphics/analisis/a-fondo-agencia.md
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { BarridoRadial, Chispas, CURVAS, Descifra, EstiloProvider, Flash, Forma, Glitch, Golpe, Lineas, Movil, Onda, PorLetra, Sonido, tramo, useSeg, ZoomAtraves, type Sfx } from "../base";
import { AGENCIA, COLORES_AGENCIA as C, MONO, SERIF, SYNE, useTimecode } from "../capas";

export const duracionAgencia = 11.25;
const COMPAS = 1.875, T = COMPAS / 4; // 0,469 s por tiempo
const S = (n: number) => n * COMPAS;

/** Cilindro tipográfico: anillos de texto girando (relleno crema con extrusión, contorno, serif cursiva lima). */
const Cilindro: React.FC = () => {
  const t = useSeg();
  const entra = tramo(t, 0, 0.6);
  const cae = tramo(t, 1.5, 1.77, CURVAS.acelera);
  const giro = t * 40 + cae * 160; // 40°/s y ×4 al salir
  const anillo = (texto: string, y: number, estilo: React.CSSProperties, signo: number, extru = false) => {
    const chars = Array.from(texto.repeat(2));
    const paso = 360 / chars.length;
    return (
      <div style={{ position: "absolute", left: 0, top: y, transformStyle: "preserve-3d", transform: `rotateY(${signo * giro}deg)` }}>
        {chars.map((ch, i) => (
          <span key={i} style={{ position: "absolute", left: 0, top: 0, transform: `rotateY(${i * paso}deg) translateZ(560px) translate(-50%, -50%)`, whiteSpace: "pre", fontFamily: SYNE, fontWeight: 800, fontSize: 96, lineHeight: 1, ...estilo,
            textShadow: extru ? "0 2px 0 #6b6658, 0 4px 0 #57534a, 0 6px 0 #45413a, 0 8px 0 #2a2822" : undefined }}>{ch}</span>
        ))}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ perspective: 1400, opacity: 1 - tramo(t, 1.7, 1.78) }}>
      <div style={{ position: "absolute", left: 960, top: 540, transformStyle: "preserve-3d", transform: `rotateX(${-18 - 70 * cae}deg) rotateZ(-5deg) scale(${interpolate(entra, [0, 1], [3, 1])})` }}>
        {anillo("DISEÑO WEB · ", -240, { color: C.crema }, 1, true)}
        {anillo("BRANDING · ", -120, { color: "transparent", WebkitTextStroke: `2px ${C.crema}` }, -1)}
        {anillo("desarrollo · ", 0, { fontFamily: SERIF, fontWeight: 400, fontStyle: "italic", color: C.lima, fontSize: 110 }, 1)}
        {anillo("MOTION · ", 120, { color: C.crema }, -1, true)}
        {anillo("PRODUCTO · ", 240, { color: "transparent", WebkitTextStroke: `2px ${C.crema}` }, 1)}
      </div>
    </AbsoluteFill>
  );
};

/** Navegador crema → móvil (muelle con un sobrepaso del ~35 %, giro en Y que va y vuelve). Es el objeto puente S1→S2. */
const Navegador: React.FC = () => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  if (t < S(1) || t > S(3)) return null;
  const p = tramo(t, S(1) + 0.02, S(1) + 0.39);
  const m = spring({ frame: (t - (S(1) + 1.45)) * fps, fps, config: { mass: 1, stiffness: 340, damping: 12 } });
  const W = interpolate(m, [0, 1], [820, 420]), H = interpolate(m, [0, 1], [560, 760]);
  const ry = Math.sin(Math.min(m, 1) * Math.PI) * 30;
  const x = interpolate(m, [0, 1], [1460, 1420]);
  const pantalla = tramo(t, S(2), S(2) + 0.14);
  return (
    <div style={{ position: "absolute", left: x - W / 2, top: 560 - H / 2 + (1 - p) * 300, width: W, height: H, borderRadius: interpolate(m, [0, 1], [14, 48], { extrapolateRight: "clamp" }), background: C.crema, overflow: "hidden",
      transform: `perspective(1600px) rotateX(${(1 - p) * 28 + 4}deg) rotateY(${-ry - 14 + 6 * Math.sin(t * 1.3)}deg) scale(${0.6 + 0.4 * p})`, transformOrigin: "50% 100%", boxShadow: "0 40px 80px rgba(0,0,0,0.35)", filter: p < 0.33 ? `blur(${(1 - p * 3) * 8}px)` : undefined }}>
      <div style={{ height: 40, background: "#E4DED0", display: "flex", alignItems: "center", gap: 10, padding: "0 16px" }}>{["#E8302A", "#F5B400", "#22C55E"].map((c) => <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}</div>
      <div style={{ padding: 30, transform: `translateY(${-40 * pantalla}%)`, filter: pantalla > 0 && pantalla < 1 ? "blur(6px)" : undefined }}>
        <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 54, color: C.negro, lineHeight: 1 }}>NUEVA WEB</div>
        {[0, 1, 2].map((i) => <div key={i} style={{ height: 70, marginTop: 22, borderRadius: 12, background: i === 1 ? C.lima : "#D9D2C2" }} />)}
        {/* casilla con el punto negro por la que entra el zoom (S2→S3) */}
        <div style={{ marginTop: 22, height: 110, borderRadius: 12, background: "#D9D2C2", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 30, height: 30, borderRadius: 15, background: C.negro }} /></div>
      </div>
    </div>
  );
};

const Titulo: React.FC<{ n: number; lineas: string[]; cursiva?: string; color?: string; tam?: number; extra?: number }> = ({ n, lineas, cursiva, color = C.crema, tam = 132, extra = 0 }) => {
  const t = useSeg();
  const t0 = S(n) + 0.12, t1 = S(n + 1) - 0.14 + extra;
  if (t < S(n) || t > S(n + 1) + extra) return null;
  return (
    <div style={{ position: "absolute", left: 120, top: 250 }}>
      <div style={{ fontFamily: MONO, fontSize: 24, color, opacity: 0.8, letterSpacing: "0.08em", transform: `scaleX(${tramo(t, t0, t0 + 0.09)})`, transformOrigin: "left", border: `1.5px solid ${color}`, borderRadius: 30, padding: "6px 16px", display: "inline-block" }}>{`0${n} / 05`}</div>
      <Lineas lineas={lineas} t0={t0 + 0.05} t1={t1} escalon={0.05} dur={0.16} style={{ marginTop: 22, fontFamily: SYNE, fontWeight: 800, fontSize: tam, lineHeight: 0.95, color, textTransform: "uppercase", letterSpacing: "-0.03em" }} />
      {cursiva && <Lineas lineas={[cursiva]} t0={t0 + 0.1} t1={t1} dur={0.16} style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 104, color: C.lima, lineHeight: 1.05 }} />}
    </div>
  );
};

const Hud: React.FC = () => {
  const t = useSeg();
  const tc = useTimecode();
  const sec = Math.min(4, Math.floor(t / COMPAS));
  const prog = (t % COMPAS) / COMPAS;
  if (t < S(1) + 0.05) return null;
  const col = "rgba(242,237,226,0.7)", m = 46, L = 22;
  const esq = (s: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, borderStyle: "solid", borderColor: col, borderWidth: 0, ...s }} />;
  return (
    <AbsoluteFill style={{ fontFamily: MONO, fontSize: 18, color: col, letterSpacing: "0.1em", pointerEvents: "none" }}>
      {esq({ left: m, top: m, borderLeftWidth: 2, borderTopWidth: 2 })}{esq({ right: m, top: m, borderRightWidth: 2, borderTopWidth: 2 })}
      {esq({ left: m, bottom: m, borderLeftWidth: 2, borderBottomWidth: 2 })}{esq({ right: m, bottom: m, borderRightWidth: 2, borderBottomWidth: 2 })}
      <div style={{ position: "absolute", left: m + 40, top: m - 4 }}>NORTE STUDIO · REEL 2026</div>
      <div style={{ position: "absolute", right: m + 40, top: m - 4 }}>{tc}</div>
      <div style={{ position: "absolute", right: m + 40, bottom: m - 4, display: "flex", gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ width: 46, height: 4, background: "rgba(242,237,226,0.25)", overflow: "hidden" }}><div style={{ height: "100%", width: i < sec ? "100%" : i === sec ? `${prog * 100}%` : 0, background: C.lima }} /></div>)}
      </div>
    </AbsoluteFill>
  );
};

/** Fondo plano por sección; S1→S2 lo cambia un barrido radial desde el móvil. */
const Fondo: React.FC = () => {
  const t = useSeg();
  const base = t < S(1) ? C.negro : t < S(2) ? C.azul : t < S(3) ? C.rojo : t < S(4) ? C.negro : t < S(5) ? C.morado : C.negro;
  return (
    <AbsoluteFill style={{ background: t < S(2) ? base : t < S(3) ? C.azul : base }}>
      {t >= S(2) && t < S(3) && <BarridoRadial t0={S(2)} dur={0.14} x={1420} y={560} color={C.rojo} borde="#FF3E8A" />}
      {t >= S(4) && t < S(5) && <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${C.moradoLuz}, transparent 70%)` }} />}
    </AbsoluteFill>
  );
};

/** S3: el punto negro de la casilla llega centrado y se desliza a su sitio; luego cambia de forma en cada tiempo. */
const Formas: React.FC = () => {
  const t = useSeg();
  if (t < S(3) || t > S(4) + 0.2) return null;
  const k = (n: number) => S(3) + n * T;
  return (
    <Forma fondo={(tt) => (tt < k(1) ? C.lima : tt < k(2) ? C.crema : C.lima)} colorLuz={C.lima} claves={[
      { t: S(3), x: 960, y: 540, w: 300, h: 300, r: 150, rz: 0, luz: 0.2 }, { t: S(3) + 0.2, x: 1360, y: 560, w: 300, h: 300, r: 150, rz: 0, luz: 0.4 },
      { t: k(1), x: 1360, y: 560, w: 300, h: 300, r: 150, rz: 0 }, { t: k(1) + 0.13, w: 280, h: 280, r: 30, rz: 45 },
      { t: k(2), w: 280, h: 280, r: 30, rz: 45 }, { t: k(2) + 0.13, w: 460, h: 160, r: 80, rz: 90 },
      { t: k(3), w: 460, h: 160, r: 80, rz: 90 }, { t: k(3) + 0.13, w: 300, h: 300, r: 150, rz: 180 }, { t: S(4), x: 1380, y: 560, w: 300, h: 300, rz: 190 },
    ]} />
  );
};

const Cierre: React.FC = () => {
  const t = useSeg();
  if (t < S(5)) return null;
  const golpe = S(5) + 0.9375 + 0.0025; // 10,3125 s: en la rejilla, tras 2 fotogramas de silencio
  const sub = tramo(t, golpe + 0.25, golpe + 0.45);
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SYNE, fontWeight: 800, fontSize: 300, color: C.crema, letterSpacing: "-0.04em" }}>
        <div style={{ position: "absolute" }}><Golpe texto="TODO" t0={S(5) + 0.02} t1={S(5) + T - 0.02} desde={1.4} /></div>
        <div style={{ position: "absolute", color: C.lima }}><Golpe texto="EN UNO" t0={S(5) + T} t1={golpe - 0.08} desde={1.4} /></div>
      </AbsoluteFill>
      {t > golpe && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 170, color: C.crema, letterSpacing: "-0.03em" }}><PorLetra texto="NORTE" t0={golpe + 0.05} escalon={0.033} dur={0.14} desde={{ y: 1, s: 1, blur: 0 }} /></div>
          <div style={{ width: 520 * sub, height: 6, background: C.lima, marginTop: 12, boxShadow: `0 0 20px ${C.lima}` }} />
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: C.lima, marginTop: 14, opacity: sub }}>estudio de diseño</div>
        </AbsoluteFill>
      )}
      <Onda t0={golpe} w={80} crece={30} dur={0.3} color="rgba(240,240,240,0.6)" grosor={8} />
      <Onda t0={golpe + 0.05} w={80} crece={30} dur={0.3} color="rgba(240,240,240,0.5)" grosor={8} />
      <Chispas t0={golpe} colores={[C.lima, C.azul, C.rojo, C.crema]} n={70} />
    </>
  );
};

const SFX: Sfx[] = [
  { t: 0.0, f: "whoosh-suave", v: 0.35 }, { t: 1.55, f: "subida", v: 0.3 }, { t: S(1), f: "impacto", v: 0.55 }, { t: S(1) + 0.14, f: "pop", v: 0.3 },
  { t: S(1) + 1.45, f: "whoosh-rapido", v: 0.4 }, { t: S(2), f: "whoosh", v: 0.45 }, ...[0, 1, 2].map((i) => ({ t: S(2) + 0.5 + i * 0.12, f: "click", v: 0.3 })),
  { t: S(3) - 0.25, f: "whoosh-rapido", v: 0.5 }, { t: S(3), f: "impacto", v: 0.5 }, ...[1, 2, 3].map((n) => ({ t: S(3) + n * T, f: "tic", v: 0.35 })),
  { t: S(4), f: "click", v: 0.5 }, ...Array.from({ length: 6 }).map((_, i) => ({ t: S(4) + 0.25 + i * 0.07, f: "tic", v: 0.2 })), { t: S(4) + 1.0, f: "impacto", v: 0.5 },
  { t: S(5) + 0.02, f: "impacto", v: 0.5 }, { t: S(5) + T, f: "impacto", v: 0.5 }, { t: S(5) + 0.94, f: "impacto", v: 0.75 },
];

export const DemoAgencia: React.FC = () => {
  const t = useSeg();
  // deriva continua dentro de cada sección (≈36 px/s y +2,4 %/s): nunca un fotograma quieto
  const ts = t % COMPAS;
  const deriva = `translate(${-0.6 * ts * 60 * 0.5}px, ${-0.2 * ts * 60 * 0.5}px) scale(${1 + ts * 0.024})`;
  return (
    <EstiloProvider tokens={AGENCIA}>
      <AbsoluteFill>
        <Fondo />
        <AbsoluteFill style={{ transform: deriva }}>
          <Glitch t0={S(4)} dur={0.2}>
            <AbsoluteFill>
              {t < S(1) && <Cilindro />}
              {/* línea láser lima que nace al plegarse el cilindro + destello anamórfico cian en el tiempo */}
              {t > 1.62 && t < S(1) + 0.2 && <div style={{ position: "absolute", left: 960 - 900 * tramo(t, 1.62, 1.75), top: 538, width: 1800 * tramo(t, 1.62, 1.75), height: 4, background: C.lima, boxShadow: `0 0 12px ${C.lima}, 0 0 40px ${C.lima}`, opacity: 1 - tramo(t, S(1), S(1) + 0.15) }} />}
              <Titulo n={1} lineas={["Diseño"]} cursiva="& desarrollo web" tam={116} />
              <Titulo n={2} lineas={["Responsive"]} cursiva="en cada pantalla" tam={94} />
              {t >= S(2) + 0.45 && t < S(3) && [0, 1, 2].map((i) => (
                <Movil key={i} estela={0.4} claves={[{ t: S(2) + 0.45 + i * 0.12, x: 2300, y: 330 + i * 150, o: 1, rz: 8, ry: -40 }, { t: S(2) + 0.82 + i * 0.12, x: 860 + i * 70, y: 640 + i * 110, rz: -3, ry: -18 }, { t: S(3), x: 840 + i * 70, y: 630 + i * 110, rz: -3, ry: -14 }]}>
                  <div style={{ width: 300, height: 90, borderRadius: 16, background: [C.crema, C.lima, C.negro][i], color: i === 2 ? C.crema : C.negro, fontFamily: MONO, fontSize: 24, display: "flex", alignItems: "center", padding: "0 24px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>{["móvil · 390", "tablet · 820", "escritorio · 1440"][i]}</div>
                </Movil>
              ))}
              <ZoomAtraves t0={S(3) - 0.25} t1={S(3)} ox={1420} oy={657} hasta={14}>
                <Navegador />
              </ZoomAtraves>
              <Titulo n={3} lineas={["Sistemas"]} cursiva="& automatización" extra={0.2} />
              <Formas />
              {t >= S(4) && t < S(5) && (
                <div style={{ position: "absolute", left: 120, top: 330, fontFamily: SYNE, fontWeight: 800, fontSize: 120, color: C.crema, textTransform: "uppercase" }}>
                  <div style={{ background: "linear-gradient(90deg,#5EE6D0,#B48CFF)", WebkitBackgroundClip: "text", color: t < S(4) + 0.75 ? "transparent" : C.crema }}><Descifra texto="EXPERTOS EN" t0={S(4) + 0.22} dur={0.55} /></div>
                  <div style={{ fontSize: 280, color: C.lima, lineHeight: 1, marginTop: 10 }}><Golpe texto="IA." t0={S(4) + 1.0} t1={S(5) - 0.08} desde={1.4} /></div>
                </div>
              )}
              <Cierre />
            </AbsoluteFill>
          </Glitch>
        </AbsoluteFill>
        <Hud />
        <Flash t0={S(1)} dur={0.17} color="#FFFFFF" fuerza={0.85} />
        {t > S(1) && t < S(1) + 0.17 && <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 6% at 50% 50%, #7fe8ff, transparent)", transform: `scaleX(${0.5 + 1.5 * tramo(t, S(1), S(1) + 0.17)})`, opacity: 1 - tramo(t, S(1), S(1) + 0.17) }} />}
        <Flash t0={S(5) + 0.9375} dur={0.27} fuerza={0.9} />
        <Sonido sfx={SFX} musica="musica/musica-agencia.wav" volumenMusica={0.55} volumen={0.7} />
      </AbsoluteFill>
    </EstiloProvider>
  );
};
