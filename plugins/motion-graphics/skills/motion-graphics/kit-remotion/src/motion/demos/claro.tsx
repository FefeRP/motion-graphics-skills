// Demo del estilo CLARO (ref: intros de SaaS). 10 s, 60 fps, 120 BPM. Todo entra en 0,12–0,17 s
// desde desenfocado/grande, lo rápido lleva estela, y cada escena sale de un objeto de la anterior.
// Marca ficticia «ruta» (app de viajes). Medidas y recetas: referencias/motion-graphics/analisis/a-fondo-saas.md
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Camara2D, ConDesenfoque, Contador, CURVAS, EstiloProvider, Flash, Forma, FugaLuz, Movil, Palabra, Sonido, Tarjeta, Teclea, tramo, useSeg, type Sfx } from "../base";
import { CLARO, FondoClaro, RUEDA_CLARO } from "../capas";

export const duracionClaro = 10;
const AZUL = "#2B35E0", TINTA = "#1D1D1F";
const F = CLARO.fuente;

/** Marca «ruta»: cuadrado azul con flecha + palabra. */
const Logo: React.FC<{ tam?: number; palabra?: boolean }> = ({ tam = 120, palabra = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: tam * 0.25 }}>
    <div style={{ width: tam, height: tam, borderRadius: tam * 0.28, background: AZUL, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: CLARO.sombra }}>
      <svg width={tam * 0.56} height={tam * 0.56} viewBox="0 0 10 10"><path d="M2 8 L8 2 M4 2 H8 V6" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
    {palabra && <div style={{ fontFamily: F, fontWeight: 700, fontSize: tam * 0.95, letterSpacing: "-0.04em", color: TINTA }}>ruta</div>}
  </div>
);

const Escena1: React.FC = () => {
  const t = useSeg();
  if (t > 3.45) return null;
  // logo con destello: entra 2,2→1 en 10 fotogramas
  const logo = tramo(t, 0.02, 0.19);
  const logoSale = tramo(t, 1.05, 1.2, CURVAS.acelera);
  return (
    <>
      {t < 1.25 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `scale(${interpolate(logo, [0, 1], [2.2, 1]) * (1 - 0.3 * logoSale)})`, opacity: 1 - logoSale, filter: logo < 0.98 ? `blur(${(1 - logo) * 12}px)` : undefined }}><Logo /></div>
        </AbsoluteFill>
      )}
      {/* widget de vuelo: entra desde más grande (1,2→1) */}
      <Movil claves={[{ t: 1.15, x: 760, y: 560, s: 1.2, o: 0, b: 8 }, { t: 1.65, x: 760, y: 560, s: 1, o: 1, b: 0 }, { t: 3.3, x: 740, y: 570, s: 1, o: 1 }, { t: 3.45, x: 740, y: 570, o: 0 }]}>
        <Tarjeta ancho={760} alto={400} padding={48}>
          <div style={{ fontSize: 40, color: "#6E6E73" }}>Próximo viaje</div>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 8 }}>Lisboa</div>
          <div style={{ fontSize: 40, color: "#6E6E73", marginTop: 34 }}>Vie 18 · 08:40 · Puerta B12</div>
        </Tarjeta>
      </Movil>
      {/* el avión despega (expo-in con estela vertical) y se convierte en punto azul que estalla en el mapa */}
      <Movil estela={0.35} claves={[{ t: 1.6, x: 960, y: 520, o: 0, s: 1 }, { t: 1.7, x: 960, y: 520, o: 1 }, { t: 1.9, x: 960, y: 520 }, { t: 2.23, x: 1180, y: -40, s: 0.45, para: true }]}>
        <svg width={90} height={90} viewBox="0 0 24 24"><path d="M2 16l20-8-20-8 4 8-4 8z" fill={TINTA} transform="rotate(-50 12 12)" /></svg>
      </Movil>
      <Forma fondo="#0A84FF" colorLuz="#0A84FF" claves={[{ t: 2.2, x: 1240, y: 300, w: 22, h: 22, r: 11, luz: 0.8, o: 0 }, { t: 2.25, x: 1240, y: 300, w: 22, h: 22, luz: 0.8, o: 1 }, { t: 2.33, x: 1240, y: 300, w: 22, h: 22, o: 1 }, { t: 2.36, o: 0 }]} />
      {/* mapa: estallido con sobrepaso SIN rebote (0,15→1,4 en 8 f, luego 1,4→1 expo) */}
      <MapaPop />
    </>
  );
};

const MapaPop: React.FC = () => {
  const t = useSeg();
  if (t < 2.33 || t > 3.45) return null;
  const f = (t - 2.33) * 60;
  const s = f < 8 ? interpolate(f, [0, 8], [0.15, 1.4]) : interpolate(f, [8, 26], [1.4, 1], { extrapolateRight: "clamp", easing: CURVAS.expo });
  const blur = interpolate(f, [0, 8, 20], [10, 6, 0], { extrapolateRight: "clamp" });
  const sale = tramo(t, 3.3, 3.45, CURVAS.acelera);
  return (
    <div style={{ position: "absolute", left: 1240 - 230, top: 300 - 150, width: 460, height: 300, transform: `scale(${1.35 * s * (1 - 0.3 * sale)})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity: 1 - sale, borderRadius: 28, overflow: "hidden", boxShadow: CLARO.sombra, background: "#DDE9F7" }}>
      <svg width={460} height={300}>
        {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={0} y1={i * 38} x2={460} y2={i * 38 + 40} stroke="#C5D7EE" strokeWidth={10} />)}
        <path d="M60 240 C 160 120, 260 220, 400 70" stroke={AZUL} strokeWidth={6} fill="none" strokeDasharray="12 10" />
        <circle cx={400} cy={70} r={14} fill="#0A84FF" /><circle cx={60} cy={240} r={10} fill={TINTA} />
      </svg>
    </div>
  );
};

/** Logo → barra de búsqueda (se estira en ease-in, gira −4°→0, el relleno se vacía) → lista con scroll e impulso. */
const Escena2: React.FC = () => {
  const t = useSeg();
  if (t < 3.3 || t > 4.6) return null;
  const vacia = tramo(t, 3.62, 3.8);
  const scroll = interpolate(t, [3.95, 4.05, 4.37, 4.55], [0, 30, -700, -820], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scrollPrev = interpolate(t - 1 / 60, [3.95, 4.05, 4.37, 4.55], [0, 30, -700, -820], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = Math.abs(scroll - scrollPrev);
  const sel = tramo(t, 4.4, 4.6);
  return (
    <>
      <Forma fondo={`rgba(43,53,224,${1 - vacia})`} colorBorde="#C9CACF" claves={[
        { t: 3.3, x: 960, y: 300, w: 92, h: 92, r: 26, rz: 0, o: 0 }, { t: 3.35, x: 960, y: 300, w: 92, h: 92, o: 1 }, { t: 3.42, w: 92, h: 92 },
        { t: 3.62, x: 960, y: 300, w: 960, h: 120, r: 60, rz: -4, borde: 0 }, { t: 3.8, x: 960, y: 300, w: 960, h: 120, rz: 0, borde: 2 }, { t: 4.6, x: 960, y: 300, w: 960, h: 120, rz: 0, borde: 2 },
      ]}>
        <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 48px", fontFamily: F, fontSize: 44, color: TINTA, opacity: vacia }}>
          <span style={{ color: "#8E8E93", marginRight: 22 }}>⌕</span><Teclea texto="Hoteles en Lisboa" t0={3.8} letrasPorSeg={70} cursor />
        </div>
      </Forma>
      {/* resultados: suben con anticipación y cola larga, desenfoque SOLO vertical según la velocidad */}
      <AbsoluteFill style={{ clipPath: "inset(380px 0 0 0)" }}><AbsoluteFill style={{ transform: `translateY(${scroll}px)`, filter: v > 1 ? `blur(${Math.min(12, v * 0.2)}px)` : undefined, opacity: tramo(t, 3.85, 3.95) }}>
        {["Casa Alfama · 4,8", "Hotel Baixa · 4,6", "Rio Tejo Suites · 4,9", "LX Factory Lofts · 4,7", "Belém Garden · 4,8", "Miradouro Inn · 4,5"].map((r, i) => (
          <div key={i} style={{ position: "absolute", left: 480, top: 470 + i * 150, width: 960 }}>
            <Tarjeta ancho={960} alto={120} padding={30} brillo={i === 5 ? sel : 0}><div style={{ fontSize: 40, fontWeight: 600 }}>{r} <span style={{ color: "#8E8E93", fontWeight: 400 }}>· desde 89 €</span></div></Tarjeta>
          </div>
        ))}
      </AbsoluteFill></AbsoluteFill>
    </>
  );
};

/** Tras la fuga de luz: gris vacío y palabras gigantes, una por pulso (0,3 s), cada una de un color. */
const Escena3: React.FC = () => {
  const t = useSeg();
  if (t < 4.75 || t > 6.68) return null;
  const pal = ["Así", "de", "fácil", "y", "rápido."];
  // zoom a través del logo (6,35–6,6): escala exponencial acelerada hacia el «mordisco», el azul llena el cuadro
  const z = tramo(t, 6.48, 6.66, CURVAS.lineal);
  const s = Math.pow(9, Easing3(z));
  return (
    <>
      {pal.map((p, i) => <Palabra key={p} texto={p} t0={5.0 + i * 0.3} dur={0.3} color={RUEDA_CLARO[i]} tam={300} />)}
      {t > 6.47 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${s})`, transformOrigin: "48% 50%", filter: z > 0.3 ? `blur(${(z - 0.3) * 20}px)` : undefined, opacity: tramo(t, 6.47, 6.5) }}>
          <Logo tam={180} palabra={false} />
        </AbsoluteFill>
      )}
    </>
  );
};
const Easing3 = (x: number) => x * x * x;

/** Contador sobre el azul con desenfoque según la velocidad de las cifras; cortinilla suave; botón línea↔píldora. */
const Escena4: React.FC = () => {
  const t = useSeg();
  if (t < 6.64) return null;
  const x = tramo(t, 6.75, 7.92, CURVAS.lineal);
  const vel = (3 * Math.pow(1 - x, 2)) / 1.17; // derivada de easeOutCubic
  const corte = interpolate(t, [7.85, 8.02], [108, -8], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CURVAS.inOut });
  // botón: nace de una línea (ancho y alto con cubic-out), se pulsa en 9,0 y vuelve a línea en 9,6
  const w = interpolate(t, [8.15, 8.98], [114, 1240], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CURVAS.suave });
  const h = interpolate(t, [8.15, 8.65], [18, 240], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: CURVAS.suave });
  const clic = tramo(t, 9.0, 9.05);
  const sale = tramo(t, 9.6, 9.8, CURVAS.acelera);
  const pulsa = t > 9.0 && t < 9.17 ? 1 - 0.04 * (1 - tramo(t, 9.0, 9.17)) : 1;
  return (
    <>
      {t < 8.05 && (
        <AbsoluteFill style={{ background: AZUL, alignItems: "center", justifyContent: "center", WebkitMaskImage: t > 7.85 ? `linear-gradient(90deg, #000 ${corte - 7}%, transparent ${corte}%)` : undefined }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 260, color: "#FFFFFF", letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", filter: vel > 0.3 ? `blur(${Math.min(6, vel * 3)}px)` : undefined }}>
            <Contador hasta={5000} t0={6.75} dur={1.17} sufijo=" €" />
          </div>
          <div style={{ fontFamily: F, fontSize: 48, color: "rgba(255,255,255,0.8)", marginTop: -10 }}>ahorrados en viajes este año</div>
        </AbsoluteFill>
      )}
      {t > 8.1 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: w * (1 - 0.32 * sale), height: h * (1 - 0.93 * sale), borderRadius: 200, background: clic > 0.5 ? "#2E2D33" : "#E5173B", transform: `scale(${pulsa * (1 + 0.12 * tramo(t, 8.6, 9.6, CURVAS.lineal))})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", opacity: 1 - tramo(t, 9.8, 9.87) }}>
            <div style={{ fontFamily: F, fontWeight: 650, fontSize: 104, color: "#FFFFFF", opacity: tramo(t, 8.6, 8.8) * (1 - sale), whiteSpace: "nowrap" }}>{clic > 0.5 ? "Listo." : "Empieza gratis"}</div>
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};

// Deriva perpetua + corte con zoom sobre la acción (0,6 s: ×1,9 descentrado, sin transición) que vuelve en 1,05.
const CAM = [
  { t: 0, x: 960, y: 540, s: 1 }, { t: 0.59, x: 960, y: 540, s: 1.03 }, { t: 0.6, x: 860, y: 560, s: 1.9 }, { t: 1.04, x: 860, y: 560, s: 1.95 },
  { t: 1.05, x: 960, y: 540, s: 1.1 }, { t: 2.2, x: 900, y: 500, s: 1.25 }, { t: 3.3, x: 1020, y: 440, s: 1.42, rz: -1 }, { t: 3.32, x: 960, y: 520, s: 1.12 },
  { t: 4.6, x: 960, y: 560, s: 1.25 }, { t: 6.3, x: 960, y: 540, s: 1.06 }, { t: 10, x: 960, y: 540, s: 1.1 },
];

const SFX: Sfx[] = [
  { t: 0.0, f: "impacto", v: 0.45 }, { t: 0.6, f: "impacto", v: 0.4 }, { t: 1.15, f: "whoosh-suave", v: 0.3 }, { t: 1.9, f: "whoosh-rapido", v: 0.35 },
  { t: 2.33, f: "pop", v: 0.45 }, { t: 3.42, f: "whoosh-suave", v: 0.3 }, { t: 3.8, f: "tic", v: 0.25 }, { t: 4.05, f: "whoosh-rapido", v: 0.35 }, { t: 4.4, f: "click", v: 0.35 },
  { t: 4.55, f: "whoosh", v: 0.35 }, ...[5.0, 5.3, 5.6, 5.9, 6.2].map((t) => ({ t, f: "tic", v: 0.3 })), { t: 6.5, f: "whoosh-rapido", v: 0.45 }, { t: 6.66, f: "impacto", v: 0.5 },
  { t: 7.85, f: "whoosh-suave", v: 0.35 }, { t: 8.15, f: "subida", v: 0.25 }, { t: 9.0, f: "click", v: 0.6 }, { t: 9.5, f: "impacto", v: 0.4 },
];

export const DemoClaro: React.FC = () => {
  const t = useSeg();
  return (
    <EstiloProvider tokens={CLARO}>
      <AbsoluteFill>
        <FondoClaro />
        <ConDesenfoque ventanas={[[6.52, 6.68]]} muestras={5}>
          <Camara2D claves={CAM}>
            <Escena1 />
            <Escena2 />
            <Escena3 />
          </Camara2D>
        </ConDesenfoque>
        <Escena4 />
        <Flash t0={0.0} dur={0.18} color="#B8F5C8" fuerza={0.6} />
        <FugaLuz t0={4.5} dur={0.45} />
        {t > 4.62 && t < 5.0 && <AbsoluteFill style={{ background: "#D9DBDF", opacity: 1 - tramo(t, 4.9, 5.0) }} />}
        <Sonido sfx={SFX} musica="musica/musica-claro.wav" volumenMusica={0.65} />
      </AbsoluteFill>
    </EstiloProvider>
  );
};
