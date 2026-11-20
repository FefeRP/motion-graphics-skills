// Pieza de técnica «mapas 3D en perspectiva» (referencias/motion-graphics/analisis/a-fondo-mapas-3d.md), hecha con la
// skill maestra sobre un producto FICTICIO: «ruta», app de seguimiento de entregas. 12 s a 60 fps, 100 BPM (golpe 0,6 s).
// Hilo conductor: el PUNTO de la marca (aro con punto) → punto azul de posición → cabeza de la ruta → pin de destino →
// el aro vuelve a dibujarse sobre el mapa plegado en tarjeta → símbolo de la marca.
// Guion por golpes:
//   0,0  símbolo (aro + punto) que respira; 0,9 el aro se cierra y queda el punto (objeto puente)
//   1,2  el mapa aparece debajo, casi cenital; tarjeta de giro; los edificios crecen por ola desde el punto
//   1,2–2,6 la cámara se inclina a 58° siguiendo la cabeza de la ruta
//   2,6  barrido hacia arriba (desenfoque de movimiento por submuestras) → vista alta; capa de tráfico
//   4,2  ficha del almacén con gráfica de afluencia; el almacén se resalta
//   6,0  barrido hacia abajo, vista baja; flechas en el suelo; 7,4 cae el pin de destino con onda; el edificio sube
//   8,4  barrido a cenital; 9,0 el mapa se pliega en tarjeta sobre fondo noche y el aro se dibuja encima
//   10,4 marca que se teclea + lema
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  CURVAS, INTER, MapaCanvas, MarcaTeclea, PALETAS_MAPA, Sonido, camaraMapa, enMapa, generaCiudad, medirRuta, olaCrece, rutaPorCruces, tramo, useSeg,
  type CamMapa, type OpcionesMapa, type RGB, type Sfx,
} from "../base";

export const duracionMapaRuta = 12;
const AZUL = "#2F6BFF", AZUL_RGB: RGB = [47, 107, 255], NARANJA_RGB: RGB = [246, 140, 52], NOCHE = "#0C1222", TINTA = "#16181D";

// ───────── el mundo: ciudad generada, ruta por cruces, almacén y destino ─────────
const CIUDAD = generaCiudad({ semilla: 11, cols: 24, filas: 24, parques: [[13, 9], [13, 10], [14, 9], [14, 10], [8, 13], [9, 13]], rotondas: [[12, 12]] });
const RUTA = rutaPorCruces(CIUDAD, [[9, 8], [12, 8], [12, 12], [12, 14], [15, 14], [15, 16]]);
const MR = medirRuta(RUTA);
const cerca = (x: number, y: number) => CIUDAD.edificios.reduce((m, e) => (Math.hypot(e.cx - x, e.cy - y) < Math.hypot(m.cx - x, m.cy - y) ? e : m));
const [fx, fy] = RUTA[RUTA.length - 1];
const DESTINO = cerca(fx + 30, fy + 30);
const [ax, ay] = CIUDAD.cruce(12, 10);
const ALMACEN = cerca(ax + 34, ay + 20);
const CENTRO = { x: (RUTA[0][0] + fx) / 2, y: (RUTA[0][1] + fy) / 2 };

// progreso de la ruta: avanza a tirones suaves (cada tramo, una frase del guion)
const progreso = (t: number) =>
  0.16 * tramo(t, 1.2, 2.7, CURVAS.inOut) + 0.44 * tramo(t, 3.0, 6.0, CURVAS.inOut) + 0.4 * tramo(t, 6.4, 7.5, CURVAS.inOut);

// cámara: inclinación, giro y distancia por claves (PCHIP); el centro sigue a la cabeza de la ruta y al final al conjunto.
// El giro mira A LO LARGO del tramo que se recorre (giro −90 = mirar al este, 0 = al norte): si no, los edificios tapan
// la ruta. Tramos: este (cruces 9→12) · norte por la avenida y la rotonda (8→14) · este (12→15) · norte (14→16).
const CLAVES = [
  { t: 1.2, dist: 170, inclina: 6, giro: -90 },
  { t: 2.5, dist: 260, inclina: 58, giro: -72 },
  { t: 3.2, dist: 1000, inclina: 50, giro: -40 },
  { t: 5.8, dist: 1080, inclina: 54, giro: -16 },
  { t: 6.6, dist: 330, inclina: 60, giro: -80 },
  { t: 7.5, dist: 300, inclina: 60, giro: -40 },
  { t: 8.3, dist: 290, inclina: 62, giro: -24 },
  { t: 9.0, dist: 1250, inclina: 0, giro: 0 },
  { t: 12, dist: 1250, inclina: 0, giro: 0 },
];
const camara = (t: number): CamMapa => {
  const c = camaraMapa(CLAVES, Math.max(1.2, t));
  const cab = MR.en(progreso(t));
  const fin = tramo(t, 8.3, 9.0, CURVAS.inOut);
  return { ...c, x: cab.x + (CENTRO.x - cab.x) * fin, y: cab.y + (CENTRO.y - cab.y) * fin };
};
const BARRIDOS = [[2.55, 3.25], [5.85, 6.6], [8.3, 9.0]];
// el obturador se abre y se cierra con el barrido (seno): encender el desenfoque de golpe se ve como un salto
const obturador = (t: number) => {
  for (const [a, b] of BARRIDOS) { const u = (t - a + 0.1) / (b - a + 0.2); if (u > 0 && u < 1) return Math.sin(Math.PI * u) / 45; }
  return 0;
};

const opciones = (t: number): OpcionesMapa => {
  const cam = camara(t);
  const pin = tramo(t, 7.4, 7.9);
  return {
    ciudad: CIUDAD, cam, paleta: PALETAS_MAPA.claro,
    crece: olaCrece(t, 1.25, RUTA[0][0], RUTA[0][1], 520, 0.55),
    trafico: tramo(t, 3.0, 3.8),
    rutas: [{ pts: RUTA, progreso: progreso(t), ancho: 10, halo: 1, cabeza: tramo(t, 1.2, 1.4) * (1 - tramo(t, 7.3, 7.5)) }],
    resalta: [
      { id: ALMACEN.id!, color: NARANJA_RGB, k: tramo(t, 4.2, 4.6) * (1 - tramo(t, 6.0, 6.4)), sube: 0.15 },
      { id: DESTINO.id!, color: AZUL_RGB, k: tramo(t, 7.4, 8.0), sube: 0.9 * tramo(t, 7.4, 8.1, CURVAS.inOut) },
    ],
    flechas: t > 6.2 && t < 8.6 ? [{ pts: RUTA.slice(-3), fase: t * 26, color: [70, 196, 230], tam: 6, alfa: tramo(t, 6.3, 6.7) * (1 - tramo(t, 8.2, 8.5)) }] : [],
    ondas: pin > 0 ? [{ x: DESTINO.cx, y: DESTINO.cy, r: 8 + 70 * tramo(t, 7.45, 8.4, CURVAS.expo), alfa: 0.55 * (1 - tramo(t, 7.6, 8.4)), color: AZUL_RGB }] : [],
    niebla: [cam.dist * 1.2, cam.dist * (4 - 1.7 * Math.min(1, Math.max(0, (cam.inclina - 20) / 25)))], // en vista alta, la niebla esconde el borde de la ciudad
  };
};

// ───────── piezas de interfaz (HTML, miran siempre a cámara) ─────────
const muelle = (t: number, t0: number, k = 1) => { const s = (t - t0) / k; return s <= 0 ? 0 : 1 - Math.exp(-s * 9) * Math.cos(s * 13); }; // entra con un pelo de sobrepaso
const Simbolo: React.FC<{ tam: number; aro?: number; punto?: number; color?: string }> = ({ tam, aro = 1, punto = 1, color = AZUL }) => (
  <svg width={tam} height={tam} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <circle cx={50} cy={50} r={38} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${aro} 1`} transform="rotate(-90 50 50)" />
    <circle cx={50} cy={50} r={15 * punto} fill={color} />
  </svg>
);
const TarjetaGiro: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  const e = muelle(t, t0), s = tramo(t, t1, t1 + 0.3);
  if (e <= 0 || s >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: 56, transform: `translateY(${(1 - e) * -40 - s * 30}px) scale(${0.85 + 0.15 * e})`, transformOrigin: "left top", opacity: Math.min(1, e * 1.6) * (1 - s),
      background: AZUL, color: "#fff", borderRadius: 22, padding: "22px 30px 22px 24px", display: "flex", gap: 22, alignItems: "center", fontFamily: INTER, boxShadow: "0 18px 40px rgba(20,40,110,0.25)" }}>
      <svg width={54} height={54} viewBox="0 0 24 24"><path d="M6 20V11a3 3 0 0 1 3-3h9m-4-4 4 4-4 4" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div><div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>Calle Mayor</div><div style={{ fontSize: 24, opacity: 0.85, marginTop: 2 }}>Gira a la derecha en 200 m</div></div>
    </div>
  );
};
const Ficha: React.FC<{ t: number; t0: number; t1: number; cam: CamMapa }> = ({ t, t0, t1, cam }) => {
  const p = enMapa(cam, ALMACEN.cx, ALMACEN.cy, ALMACEN.h * 1.2);
  const e = muelle(t, t0), s = tramo(t, t1, t1 + 0.3);
  if (!p || e <= 0 || s >= 1) return null;
  const barras = [0.25, 0.4, 0.62, 0.8, 0.95, 0.7, 0.5, 0.58, 0.85, 1, 0.66, 0.35];
  return (
    <>
      <div style={{ position: "absolute", left: p.x - 22, top: p.y - 58, width: 44, height: 58, transform: `scale(${e})`, transformOrigin: "50% 100%" }}>
        <svg width={44} height={58} viewBox="0 0 44 58"><path d="M22 57C22 57 3 34 3 21a19 19 0 0 1 38 0c0 13-19 36-19 36z" fill="#F68C34" /><circle cx={22} cy={21} r={7.5} fill="#fff" /></svg>
      </div>
      <div style={{ position: "absolute", left: 80, top: 250, width: 520, transform: `translateX(${(1 - e) * -60 - s * 80}px)`, opacity: Math.min(1, e * 1.5) * (1 - s),
        background: "#fff", borderRadius: 26, padding: "30px 34px", fontFamily: INTER, color: TINTA, boxShadow: "0 2px 6px rgba(20,30,60,0.06), 0 24px 60px rgba(20,30,60,0.14)" }}>
        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>Almacén Norte</div>
        <div style={{ fontSize: 23, color: "#5F6672", marginTop: 6 }}>Recogida a las 9:40 · 2,1 km</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 120, marginTop: 26 }}>
          {barras.map((b, i) => { const k = tramo(t, t0 + 0.25 + i * 0.045, t0 + 0.75 + i * 0.045); return (
            <div key={i} style={{ flex: 1, height: `${b * 100 * k}%`, borderRadius: 6, background: i === 9 ? "#F68C34" : "#C9D6F5" }} />); })}
        </div>
        <div style={{ fontSize: 20, color: "#8A909B", marginTop: 12 }}>Actividad por horas</div>
      </div>
    </>
  );
};
const PinDestino: React.FC<{ t: number; cam: CamMapa }> = ({ t, cam }) => {
  const h = DESTINO.h * (1 + 0.9 * tramo(t, 7.4, 8.1, CURVAS.inOut));
  const p = enMapa(cam, DESTINO.cx, DESTINO.cy, h + 4);
  const cae = tramo(t, 7.15, 7.45, CURVAS.acelera), e = muelle(t, 7.45), s = tramo(t, 8.35, 8.6);
  if (!p || cae <= 0 || s >= 1) return null;
  const etiqueta = muelle(t, 7.75);
  return (
    <div style={{ opacity: 1 - s }}>
      <div style={{ position: "absolute", left: p.x - 34, top: p.y - 88 - (1 - cae) * 380, width: 68, height: 88, transform: `scale(${0.9 + 0.1 * e}, ${1.12 - 0.12 * e})`, transformOrigin: "50% 100%" }}>
        <svg width={68} height={88} viewBox="0 0 44 58"><path d="M22 57C22 57 3 34 3 21a19 19 0 0 1 38 0c0 13-19 36-19 36z" fill={AZUL} /><circle cx={22} cy={21} r={8} fill="#fff" /></svg>
      </div>
      {etiqueta > 0 && <div style={{ position: "absolute", left: p.x + 46, top: p.y - 128, transform: `scale(${etiqueta})`, transformOrigin: "0% 100%", background: "#fff", borderRadius: 18,
        padding: "16px 24px", fontFamily: INTER, color: TINTA, boxShadow: "0 18px 44px rgba(20,30,60,0.18)", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: 22, color: "#5F6672" }}>Entrega</div><div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>Llega en 12 min</div>
      </div>}
    </div>
  );
};

// ───────── sonido: los mismos tiempos que la imagen ─────────
const SFX: Sfx[] = [
  { t: 0.9, f: "whoosh-suave", v: 0.5 }, { t: 1.35, f: "pop", v: 0.55 },
  { t: 2.55, f: "whoosh-rapido", v: 0.7 }, { t: 4.2, f: "pop", v: 0.55 }, { t: 4.45, f: "tic", v: 0.35 },
  { t: 5.85, f: "whoosh", v: 0.7 }, { t: 7.42, f: "impacto", v: 0.6 }, { t: 7.75, f: "pop", v: 0.5 },
  { t: 8.3, f: "whoosh-rapido", v: 0.65 }, { t: 9.3, f: "subida", v: 0.45 }, { t: 10.4, f: "impacto", v: 0.55 },
];

export const RecMapaRuta: React.FC = () => {
  const t = useSeg();
  const o = opciones(t);
  // pliegue final: el mapa (ya cenital) se convierte en tarjeta inclinada sobre fondo noche
  const pl = tramo(t, 9.0, 10.2, CURVAS.inOut), sale = tramo(t, 10.3, 10.9, CURVAS.acelera);
  const intro = 1 - tramo(t, 1.15, 1.45);
  const mapaVis = tramo(t, 1.1, 1.4);
  const aro = 1 - tramo(t, 0.85, 1.15, CURVAS.acelera); // el aro se cierra: queda el punto
  const respira = 1 + 0.04 * Math.sin(t * 5);
  const trazo = tramo(t, 9.35, 10.15, CURVAS.inOut);
  return (
    <AbsoluteFill style={{ background: pl > 0 ? NOCHE : "#EEF0F3", overflow: "hidden" }}>
      {pl > 0 && <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 60% at ${44 + 12 * tramo(t, 9, 12)}% ${40 + 8 * tramo(t, 9, 12)}%, #1D2A4D 0%, ${NOCHE} 100%)` }} />}
      {mapaVis > 0 && sale < 1 && (
        <AbsoluteFill style={{ opacity: mapaVis * (1 - sale), perspective: 1600 }}>
          <AbsoluteFill style={{ transform: `rotateX(${pl * 24}deg) rotateZ(${pl * -14 + sale * -10}deg) scale(${1 - pl * 0.56 - sale * 0.2})`, borderRadius: pl * 46, overflow: "hidden",
            boxShadow: pl > 0 ? `0 ${40 * pl}px ${90 * pl}px rgba(0,0,0,${0.5 * pl})` : undefined }}>
            <MapaCanvas {...o} t={t} opcionesEn={opciones} submuestras={obturador(t) > 0.0015 ? 5 : 1} obturador={obturador(t)} />
            {trazo > 0 && (
              <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={760} height={760} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#8EB4FF" strokeOpacity={0.35} strokeWidth={6} pathLength={1} strokeDasharray={`${trazo} 1`} transform="rotate(-90 50 50)" />
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray={`${trazo} 1`} transform="rotate(-90 50 50)" />
                  <circle cx={50} cy={50} r={13 * tramo(t, 9.9, 10.3)} fill="#FFFFFF" />
                </svg>
              </AbsoluteFill>
            )}
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {/* intro: el símbolo, y su punto se queda como posición */}
      {intro > 0 && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: t < 1.2 ? 1 : intro }}>
          {[0.15, 0.45, 0.75].map((o0) => { const u = tramo(t, o0, o0 + 0.75, CURVAS.suave); return u > 0 && u < 1 ? (
            <div key={o0} style={{ position: "absolute", width: 240 + 900 * u, height: 240 + 900 * u, borderRadius: "50%", border: `6px solid ${AZUL}`, opacity: 0.6 * (1 - u) }} />
          ) : null; })}
          <div style={{ transform: `scale(${(t < 0.85 ? respira : 1) * (1 - 0.55 * tramo(t, 0.85, 1.2, CURVAS.inOut)) * (0.35 + 0.65 * tramo(t, 0, 0.6, CURVAS.expo))})` }}>
            <Simbolo tam={240} aro={aro} />
          </div>
        </AbsoluteFill>
      )}
      {sale < 1 && pl < 0.05 && <TarjetaGiro t={t} t0={1.35} t1={2.6} />}
      {pl < 0.05 && <Ficha t={t} t0={4.2} t1={5.85} cam={o.cam} />}
      {pl < 0.05 && <PinDestino t={t} cam={o.cam} />}
      {t >= 10.3 && (<AbsoluteFill style={{ transform: `scale(${1 + 0.1 * tramo(t, 10.9, 12, CURVAS.inOut)})` }}>
        <MarcaTeclea t0={10.4} logo={<Simbolo tam={150} color="#FFFFFF" />} logoTam={150} texto="ruta" tam={150} fuente={INTER} color="#FFFFFF"
          lema={{ texto: "Cada entrega, a la vista.", tam: 40, color: "#A9C1FF", peso: 500 }} />
      </AbsoluteFill>)}
      <Sonido sfx={SFX} musica="musica/mapa-ruta.wav" volumenMusica={0.55} volumen={0.72} fundidoFinal={0.6} duracion={duracionMapaRuta} />
    </AbsoluteFill>
  );
};
