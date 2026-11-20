// Demo del estilo OSCURO (refs: keynotes de producto). 10 s, 60 fps, 120 BPM: un evento por pulso,
// ningún corte: cada plano nace de un objeto del anterior y los cambios se tapan con velocidad o con luz.
// Marca ficticia «foco» (app de concentración). Secuencia y medidas: referencias/motion-graphics/analisis/a-fondo-*.md
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Bokeh, Camara2D, ConDesenfoque, Contador, CURVAS, Descifra, EstiloProvider, Flash, Forma, Movil, Onda, PorLetra, Progreso, Sonido, Teclea, tramo, useSeg, type Sfx } from "../base";
import { FondoOscuro, OSCURO } from "../capas";

export const duracionOscuro = 10;
const CIAN = "#14E3E2", BLANCO = "#FFFFFF", ROJO = "#E11428", LIMA = "#D0FB46";
const mezcla = (a: string, b: string, k: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`;
};

// Tarjeta del principio (1100×700 sin escalar): gráfica de barras de tiempo de pantalla.
const ALTOS = [220, 300, 180, 360, 420, 260, 200];
const Tarjeta1: React.FC = () => {
  const t = useSeg();
  return (
    <div style={{ width: 1100, height: 700, borderRadius: 60, background: "#161616", boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 50px 120px rgba(0,0,0,0.8)", position: "relative", fontFamily: OSCURO.fuente }}>
      <div style={{ position: "absolute", left: 70, top: 56, color: "#8E8E93", fontSize: 34, fontWeight: 500 }}>Tiempo de pantalla</div>
      <div style={{ position: "absolute", left: 70, top: 100, color: BLANCO, fontSize: 84, fontWeight: 600, letterSpacing: "-0.03em" }}><Contador hasta={4.2} decimales={1} t0={0.15} dur={0.8} sufijo=" h" /></div>
      {ALTOS.map((h, i) => {
        // cada barra se enciende a blanco en cascada (33 ms) y vuelve a gris; la 4 es la que sale de la tarjeta
        const on = Math.min(tramo(t, 0.23 + i * 0.033, 0.33 + i * 0.033), 1 - tramo(t, 0.45 + i * 0.033, 0.7 + i * 0.033));
        return <div key={i} style={{ position: "absolute", left: 85 + i * 140, top: 640 - h, width: 90, height: h, borderRadius: 12, background: mezcla("#3A3A3A", "#FFFFFF", on), opacity: i === 4 && t > 1.45 ? 0 : 1 }} />;
      })}
    </div>
  );
};

// Geometría: la tarjeta queda frontal en (960, 560) a escala 1,35 → la barra 4 está en pantalla en (1149, 668), 121×567.
const BX = 217.5 + 690 * 1.35, BY = 87.5 + 430 * 1.35;

const Mundo: React.FC = () => {
  const t = useSeg();
  // color de la barra que sale: gris → cian (se llena) → blanco (sobreexpone)
  const fondoBarra = (tt: number) => {
    const lleno = tramo(tt, 1.2, 1.67), blanco = tramo(tt, 1.9, 2.03, CURVAS.acelera), apaga = tramo(tt, 2.12, 2.3);
    if (tt > 2.1) return `rgba(255,255,255,${1 - apaga})`;
    return `linear-gradient(to top, ${mezcla(CIAN, BLANCO, blanco)} ${lleno * 100}%, #3A3A3A ${lleno * 100}%)`;
  };
  return (
    <>
      {/* A · tarjeta 3D tumbada que asciende y gira a frontal con el drop (1,0 s) */}
      <AbsoluteFill style={{ perspective: 1000 }}>
        <Movil ancho={1100} alto={700} claves={[
          { t: 0, x: 960, y: 1500, rx: 70, s: 0.9, o: 0 }, { t: 0.15, x: 960, y: 980, rx: 68, o: 1 }, { t: 0.95, x: 960, y: 700, rx: 60, s: 1 },
          { t: 1.45, x: 960, y: 560, rx: 0, s: 1.35 }, { t: 2.0, x: 960, y: 560, rx: 0, s: 1.35, o: 1 }, { t: 2.12, x: 960, y: 560, s: 1.5, o: 0 },
        ]}><Tarjeta1 /></Movil>
      </AbsoluteFill>
      {/* B · la barra 4 se llena, se sobreexpone y se encoge a un punto (4 fotogramas) que viaja al centro */}
      <Forma fondo={fondoBarra} claves={[
        { t: 1.45, x: BX, y: BY, w: 121, h: 567, r: 16, luz: 0 }, { t: 1.67, luz: 0.5 }, { t: 1.9, w: 121, h: 567, luz: 0.8 },
        { t: 2.03, x: BX, y: BY, w: 125, h: 567, r: 16, luz: 1.6 }, { t: 2.1, x: BX, y: BY, w: 24, h: 24, r: 12, luz: 1.4 },
        { t: 2.22, x: 960, y: 540, w: 24, h: 24, luz: 1.2 }, { t: 2.3, x: 960, y: 540, w: 300, h: 120, r: 60, luz: 0.1 }, { t: 2.32, o: 0 },
      ]} colorLuz={BLANCO} />
      {/* C · cápsula con anillo de progreso y contador (misma curva) */}
      <Movil claves={[{ t: 2.28, x: 960, y: 540, o: 0 }, { t: 2.3, x: 960, y: 540, o: 1 }, { t: 2.97, x: 960, y: 540 }, { t: 3.27, x: 540, y: 540, b: 6 }, { t: 3.43, x: 440, y: 540, b: 0, para: true }, { t: 4.0, x: 430, y: 540 }, { t: 4.35, x: 1380, y: 400, s: 1.5 }, { t: 5.15, x: 1390, y: 392, s: 1.55 }]} estela={0.5} ancho={300} alto={120}>
        <div style={{ position: "relative", width: 300, height: 120, color: BLANCO, fontFamily: OSCURO.fuente }}>
          <Progreso t0={2.3} dur={0.8} ancho={300} alto={120} color="#DBD6F0" hasta={0.67} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 44, fontWeight: 600 }}>
            <PorLetra texto="Sueño" t0={2.33} escalon={0.02} dur={0.1} desde={{ blur: 6, y: 0 }} style={{ fontSize: 30, color: "#B9B4CC" }} />
            <Contador hasta={67} t0={2.3} dur={0.8} sufijo="%" />
          </div>
        </div>
      </Movil>
      {/* D · nacen dos cápsulas más por "gota de luz" (escalón 0,2 s) */}
      {[{ t0: 3.27, y: 470, txt: "Foco", v: 82 }, { t0: 3.47, y: 610, txt: "Pantalla", v: 35 }].map((c, i) => (
        <React.Fragment key={i}>
          <Forma fondo={BLANCO} colorLuz={BLANCO} claves={[{ t: c.t0 - 0.12, x: 1180, y: c.y - 160, w: 30, h: 30, r: 15, luz: 1.2, o: 0 }, { t: c.t0, x: 1180, y: c.y, w: 30, h: 30, luz: 1.4, o: 1 }, { t: c.t0 + 0.12, x: 1180, y: c.y, w: 300, h: 110, r: 55, luz: 0.2, o: 0 }]} />
          <Movil claves={[{ t: c.t0 + 0.08, x: 1180, y: c.y, o: 0, s: 0.9 }, { t: c.t0 + 0.2, x: 1180, y: c.y, s: 1, o: 1 }, { t: 4.0, x: 1170, y: c.y }, { t: 4.35 + i * 0.06, x: 1380, y: c.y === 470 ? 590 : 780, s: 1.5 }, { t: 5.15, x: 1390, y: c.y === 470 ? 584 : 772, s: 1.55 }]} ancho={300} alto={110}>
            <div style={{ position: "relative", width: 300, height: 110, color: BLANCO, fontFamily: OSCURO.fuente }}>
              <Progreso t0={c.t0 + 0.1} dur={0.7} ancho={300} alto={110} color={i ? CIAN : "#DBD6F0"} hasta={c.v / 100} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 40, fontWeight: 600 }}>
                <span style={{ fontSize: 28, color: "#B9B4CC" }}>{c.txt}</span><Contador hasta={c.v} t0={c.t0 + 0.1} dur={0.7} sufijo="%" />
              </div>
            </div>
          </Movil>
        </React.Fragment>
      ))}

      {/* E · tras el flash (4,0): titular que se descifra + neón que se dibuja y se rellena */}
      {t > 3.98 && t < 5.7 && (
        <>
          <div style={{ position: "absolute", left: 115, top: 380, fontFamily: OSCURO.fuente, fontWeight: 650, fontSize: 112, lineHeight: 1.0, letterSpacing: "-0.02em", color: BLANCO }}>
            <div><Descifra texto="Menos ruido." t0={4.02} dur={0.22} /></div>
            <div style={{ color: "#8E8E93", fontSize: 40, fontWeight: 400, marginTop: 26, letterSpacing: "0" }}><Teclea texto="Más tiempo para lo importante." t0={4.35} letrasPorSeg={60} /></div>
          </div>
        </>
      )}

      {/* F/G · 1650 px más arriba: el icono de la app, trazo de neón que lo rodea, gota que cae y candado con halo rojo */}
      <Icono />
      {/* H · frase que se comprime a píldora (silencio) y estalla en notificación (golpe 8,0) */}
      <FrasePildora />
    </>
  );
};

const IY = -1110; // y del mundo donde vive el icono
const Icono: React.FC = () => {
  const t = useSeg();
  if (t < 4.9 || t > 7.3) return null;
  const traza = interpolate(t, [5.3, 5.67], [0.6, 1.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CURVAS.inOut });
  const largo = interpolate(t, [5.3, 5.67], [0.33, 0.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gotaY = t < 5.93 ? interpolate(t, [5.7, 5.93], [-180, -320], { extrapolateLeft: "clamp", easing: CURVAS.expo }) : t < 6.03 ? -320 : interpolate(t, [6.03, 6.17], [-320, -40], { extrapolateRight: "clamp", easing: CURVAS.acelera });
  const candado = tramo(t, 6.17, 6.3);
  const cierra = tramo(t, 6.63, 6.7, CURVAS.acelera);
  const halo = tramo(t, 6.67, 6.8);
  const sale = tramo(t, 6.95, 7.1, CURVAS.acelera);
  return (
    <div style={{ position: "absolute", left: 960 - 130, top: IY - 130, width: 260, height: 260, transform: `scale(${1 - 0.6 * sale})`, opacity: 1 - sale }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 64, background: candado > 0 ? mezcla("#1B1B1D", "#141012", candado) : "linear-gradient(145deg, #2E2E33, #111113)", boxShadow: `0 0 ${180 * halo}px ${40 * halo}px rgba(225,20,40,${0.85 * halo}), 0 0 0 1px rgba(255,255,255,0.08)` }} />
      {/* glifo de la app → candado */}
      <svg width={260} height={260} style={{ position: "absolute", inset: 0 }}>
        <circle cx={130} cy={130} r={54} fill="none" stroke={BLANCO} strokeWidth={14} opacity={1 - candado} />
        <g opacity={candado}>
          <rect x={80} y={126} width={100} height={78} rx={16} fill={halo > 0.2 ? ROJO : BLANCO} />
          <path d="M 100 126 V 104 A 30 30 0 0 1 160 104 V 126" fill="none" stroke={halo > 0.2 ? ROJO : BLANCO} strokeWidth={14} transform={`translate(0 ${-20 * (1 - cierra)}) rotate(${-25 * (1 - cierra)} 160 126)`} />
        </g>
      </svg>
      {/* trazo de neón que recorre el borde */}
      {t > 5.3 && t < 5.72 && (
        <svg width={300} height={300} style={{ position: "absolute", left: -20, top: -20, overflow: "visible" }}>
          <defs><linearGradient id="neon" x1="0" x2="1"><stop offset="0" stopColor="#FE2C55" /><stop offset="0.5" stopColor="#FFFFFF" /><stop offset="1" stopColor="#25F4EE" /></linearGradient></defs>
          <rect x={10} y={10} width={280} height={280} rx={72} fill="none" stroke="url(#neon)" strokeWidth={5} pathLength={1} strokeDasharray={`${largo} ${1 - largo}`} strokeDashoffset={-traza} style={{ filter: "drop-shadow(0 0 10px #FFFFFF)" }} />
        </svg>
      )}
      {/* gota de luz que sube, se para y cae sobre el icono */}
      {t > 5.68 && t < 6.18 && <div style={{ position: "absolute", left: 126, top: 130 + gotaY, width: 8, height: 30, borderRadius: 4, background: BLANCO, boxShadow: "0 0 12px 4px #FFFFFF" }} />}
      {/* rótulo */}
      <div style={{ position: "absolute", left: -320, top: 290, width: 900, textAlign: "center", fontFamily: OSCURO.fuente, fontWeight: 650, fontSize: 64, color: BLANCO, letterSpacing: "-0.02em", opacity: 1 - sale }}>
        <Descifra texto="Apps en pausa." t0={6.7} dur={0.2} />
      </div>
    </div>
  );
};

const FrasePildora: React.FC = () => {
  const t = useSeg();
  if (t < 7.0) return null;
  const c = tramo(t, 7.35, 7.73, CURVAS.acelera);
  const fraseVis = t < 7.75;
  const cardIn = tramo(t, 8.07, 8.25);
  const cardOut = tramo(t, 8.6, 8.7, CURVAS.acelera);
  const marca = tramo(t, 9.0, 9.37);
  const deriva = interpolate(t, [9.37, 10], [1, 0.95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fin = tramo(t, 9.93, 10, CURVAS.acelera);
  return (
    <>
      {fraseVis && (
        <div style={{ position: "absolute", left: 0, width: 1920, top: IY - 50, textAlign: "center", fontFamily: OSCURO.fuente, fontWeight: 600, fontSize: 72, color: "#F2F2F0", letterSpacing: `${-0.01 - 0.12 * c}em`, transform: `scaleX(${1 - 0.54 * c}) scaleY(${1 - 0.3 * c})`, filter: c > 0.05 ? `blur(${2 * c}px)` : undefined, opacity: 1 - tramo(t, 7.68, 7.75) }}>
          <PorLetra texto="Recupera tu " t0={7.12} escalon={0.012} dur={0.12} desde={{ blur: 6, y: 0.2 }} />
          <PorLetra texto="tiempo." t0={7.24} escalon={0.012} dur={0.12} desde={{ blur: 6, y: 0.2 }} style={{ color: LIMA }} />
        </div>
      )}
      {/* píldora → (silencio) → estallido con un único sobrepaso (~10 %) → tarjeta → píldora → punto */}
      <Forma fondo={(tt) => (tt < 8.0 || tt > 8.62 ? LIMA : "rgba(28,29,31,0.94)")} colorLuz={LIMA} colorBorde="rgba(255,255,255,0.55)" claves={[
        { t: 7.7, x: 960, y: IY, w: 420, h: 56, r: 28, luz: 0.6, o: 0 }, { t: 7.75, x: 960, y: IY, w: 400, h: 54, luz: 1, o: 1 }, { t: 8.0, w: 360, h: 50, luz: 1.2, borde: 0 },
        { t: 8.1, w: 1290, h: 186, r: 40, luz: 0.5, borde: 1.5 }, { t: 8.22, w: 1200, h: 170, luz: 0.2 }, { t: 8.6, w: 1200, h: 170, luz: 0.2, borde: 1.5 },
        { t: 8.73, w: 420, h: 56, r: 28, luz: 0.8, borde: 0 }, { t: 8.8, w: 30, h: 30, r: 15, luz: 1.4 }, { t: 9.0, w: 26, h: 26, luz: 1.8, o: 1 }, { t: 9.05, w: 26, h: 26, o: 0 },
      ]}>
        <div style={{ display: "flex", alignItems: "center", gap: 34, padding: "0 40px", height: "100%", opacity: cardIn * (1 - cardOut), fontFamily: OSCURO.fuente, color: BLANCO, whiteSpace: "nowrap" }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: "#141012", boxShadow: `0 0 30px rgba(225,20,40,0.6)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={56} height={56}><rect x={10} y={24} width={36} height={28} rx={6} fill={ROJO} /><path d="M 18 24 V 16 A 10 10 0 0 1 38 16 V 24" fill="none" stroke={ROJO} strokeWidth={6} /></svg>
          </div>
          <div><div style={{ fontSize: 46, fontWeight: 600 }}>Bloqueo activo</div><div style={{ fontSize: 32, color: "#A1A1A6", marginTop: 6 }}>3 apps en pausa hasta las 18:00</div></div>
        </div>
      </Forma>
      {t > 8.0 && t < 8.5 && <Onda t0={8.05} x={960} y={IY} w={1200} h={170} radio={40} crece={0.5} color="rgba(208,251,70,0.8)" />}
      {/* I · el punto es la marca: «foco» se enfoca en el golpe (9,0) */}
      {t > 9.0 && (
        <div style={{ position: "absolute", left: 0, width: 1920, top: IY - 90, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity: interpolate(marca, [0, 1], [0.6, 1]) * (1 - fin), transform: `scale(${interpolate(marca, [0, 1], [0.43, 1]) * deriva})`, filter: marca < 0.99 ? `blur(${28 * (1 - marca)}px)` : undefined }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, border: `16px solid ${BLANCO}`, boxSizing: "border-box", boxShadow: `0 0 40px ${CIAN}66` }} />
          <div style={{ fontFamily: OSCURO.fuente, fontWeight: 600, fontSize: 150, color: BLANCO, letterSpacing: "-0.04em" }}>foco</div>
        </div>
      )}
    </>
  );
};

// Cámara 2D: deriva continua, zoom a la cápsula, punch + flash en 4,0, paneo vertical de 1650 px con desenfoque.
const CAM = [
  { t: 0, x: 960, y: 540, s: 1 }, { t: 1.0, s: 1.0 }, { t: 1.45, x: 960, y: 560, s: 1.04 }, { t: 2.1, x: 960, y: 540, s: 1.06 },
  { t: 2.9, x: 960, y: 540, s: 2.2 }, { t: 3.43, x: 850, y: 545, s: 2.0 }, { t: 3.85, x: 840, y: 545, s: 2.1 }, { t: 4.0, x: 880, y: 540, s: 3.2 },
  { t: 4.02, x: 960, y: 540, s: 1.06 }, { t: 5.1, x: 960, y: 540, s: 1.0 }, { t: 5.35, x: 960, y: -200, s: 1.1 }, { t: 5.6, x: 960, y: IY, s: 1.4 },
  { t: 5.9, x: 960, y: IY + 30, s: 1.55 }, { t: 6.4, x: 960, y: IY + 40, s: 1.75, rz: -1 }, { t: 6.95, x: 960, y: IY + 40, s: 1.95, rz: 0 }, { t: 7.25, x: 960, y: IY, s: 1.25 }, { t: 7.8, x: 960, y: IY, s: 1.4 }, { t: 8.0, x: 960, y: IY, s: 1.45 }, { t: 8.3, x: 960, y: IY, s: 1.25 },
  { t: 8.6, x: 960, y: IY, s: 1.3 }, { t: 9.0, x: 960, y: IY, s: 1.5 }, { t: 10, x: 960, y: IY, s: 1.75, rz: 1 },
];

const SFX: Sfx[] = [
  { t: 0.54, f: "tic", v: 0.3 }, { t: 0.76, f: "tic", v: 0.3 }, { t: 0.96, f: "whoosh", v: 0.4 }, { t: 2.07, f: "tic", v: 0.35 },
  { t: 2.3, f: "pop", v: 0.35 }, { t: 3.22, f: "pop", v: 0.4 }, { t: 3.45, f: "pop", v: 0.4 }, { t: 3.85, f: "whoosh-rapido", v: 0.45 },
  { t: 4.0, f: "impacto", v: 0.5 }, { t: 4.04, f: "tic", v: 0.25 }, { t: 4.12, f: "tic", v: 0.25 }, { t: 5.12, f: "whoosh-rapido", v: 0.5 },
  { t: 6.14, f: "tic", v: 0.35 }, { t: 6.65, f: "click", v: 0.6 }, { t: 7.0, f: "whoosh-suave", v: 0.35 }, { t: 7.35, f: "subida", v: 0.3 },
  { t: 8.0, f: "impacto", v: 0.65 }, { t: 8.6, f: "whoosh-suave", v: 0.3 }, { t: 9.0, f: "impacto", v: 0.6 },
];

export const DemoOscuro: React.FC = () => (
  <EstiloProvider tokens={OSCURO}>
    <AbsoluteFill style={{ background: "#080808" }}>
      <FondoOscuro luz="foco" />
      <Bokeh color="#7A6CA8" n={7} fuerza={0.9} />
      <ConDesenfoque ventanas={[[0.95, 1.4], [3.85, 4.05], [5.1, 5.6], [7.0, 7.2], [8.0, 8.12]]} muestras={6}>
        <Camara2D claves={CAM}><Mundo /></Camara2D>
      </ConDesenfoque>
      <Flash t0={4.0} dur={0.25} />
      <Flash t0={8.0} dur={0.22} color={LIMA} fuerza={0.45} />
      <Sonido sfx={SFX} musica="musica/musica-oscuro.wav" volumenMusica={0.55} volumen={0.75} />
    </AbsoluteFill>
  </EstiloProvider>
);
