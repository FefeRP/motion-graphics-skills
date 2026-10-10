// Recreación del «reel en pantalla» (referencias/motion-graphics/analisis/a-fondo-reel-pantalla.md, §10).
// 1920×1080 a 60 fps, mismos tiempos que pantalla.mp4: el reel empieza a los 20 fotogramas (0,333 s) y dura 900 f;
// lo que sigue es el último plano quieto. Todo va en «tiempo del reel» (dentro de la Sequence) y en la rejilla de
// pulso P = 28 f. Cadena de objetos puente: MOTION → O → bola → (editor) → píldora → interruptor → disco → naranja
// → tarjeta Springs → mosaico → contador → «0» → «O» del logo. Logo genérico «Onda 5.5». Sin música (el original no tiene).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Freeze, Sequence, useVideoConfig } from "remotion";
import {
  BolaRebote, Camara, ConDesenfoque, ContadorRodillo, CURVAS, DiscoObturador, EditorCurvas, EstiloProvider, GlifoPuente, INTER, Interruptor,
  MosaicoVivo, PalabraLetras, PorLetra, Sonido, VentanaEditor, anchoTexto, mezclaColor, tamParaAncho, tramo, trayectoriaBola, useSeg,
  type ClaveCamara, type PropsBola, type Sfx,
} from "../base";
import { COLORES_TALLER as K, PULSO_TALLER as P, TALLER, TALLER_CLARO } from "../capas/taller";

export const OFF_REEL = 20;
export const duracionReelPantalla = 938; // 15,63 s a 60 fps

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const EXPO = CURVAS.expo, INOUT = CURVAS.inOut, ACELERA = CURVAS.acelera;

// ───────── escenario oscuro ─────────
const SUELO = 822;
const BOLA: PropsBola = {
  desde: { x: 960, y: 548 }, nace: { t0: 1.8, dur: 0.2, diametro: 225, grosor: 0.27 }, diametro: 155, suelo: SUELO, color: K.luz, brillo: K.luz,
  anticipa: { t0: 1.967, dy: 50, dur: 0.133 }, caida: { t0: 2.13, t1: 2.333 }, contactos: [2.333, 2.8, 3.267], altura: 292, avance: 440,
  ultimo: { t1: 3.5, altura: 69 }, rueda: { t1: 3.75, hastaX: 1494 }, despues: { t0: 5.133, hastaX: 611, stiffness: 180, damping: 12 },
  rastro: true, marca: true, colorMarca: K.acento, ocultaEn: 6.15,
};
// ventana del editor (pantalla) y dónde queda el escenario dentro (escala 0,555)
const VEN = { x: 413, y: 50, w: 1090, h: 986 };
const ESC_VEN = { s: 0.555, tx: 427, ty: 117 };
const FOCO = { x: 611, y: 744.5 }; // la bola en reposo tras el muelle (coordenadas del escenario)

const camEscenario = (t: number) => {
  const k1 = tramo(t, 3.733, 4.4, CURVAS.suave), k2 = tramo(t, 6.033, 6.2, INOUT);
  let s = lerp(1, ESC_VEN.s, k1), tx = lerp(0, ESC_VEN.tx, k1), ty = lerp(0, ESC_VEN.ty, k1);
  if (k2 > 0) {
    const s2 = lerp(ESC_VEN.s, 1.4, k2);
    const fx = lerp(ESC_VEN.tx + ESC_VEN.s * FOCO.x, 960, k2), fy = lerp(ESC_VEN.ty + ESC_VEN.s * FOCO.y, 538, k2);
    s = s2; tx = fx - s2 * FOCO.x; ty = fy - s2 * FOCO.y;
  }
  return { s, tx, ty, k1, k2 };
};

/** Pulso de la luz de suelo: +8 % en cada golpe, cae en 0,15 s. */
const latido = (t: number) => 0.92 + 0.08 * Math.exp(-((((t % P) + P) % P) / 0.15));

const FondoGrafito: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${K.grafitoArriba} 0%, ${K.grafito} 50%, ${K.grafitoAbajo} 100%)` }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 95% at 50% 45%, rgba(0,0,0,0) 55%, rgba(12,12,13,0.5) 100%)" }} />
  </AbsoluteFill>
);

/** Fondo del escenario (se escala con él): degradado grafito + cúpula de luz naranja pegada abajo, muy extendido por los lados. */
const FondoEscenario: React.FC<{ t: number }> = ({ t }) => {
  const M = 2500;
  return (
    <div style={{ position: "absolute", left: -M, top: -M, width: 1920 + 2 * M, height: 1080 + M + 600,
      background: `linear-gradient(to bottom, ${K.grafitoArriba} ${M}px, ${K.grafito} ${M + 540}px, ${K.grafitoAbajo} ${M + 1080}px)` }}>
      <div style={{ position: "absolute", inset: 0, opacity: latido(t),
        background: `radial-gradient(ellipse 1152px 346px at ${M + 960}px ${M + 1080}px, ${K.luz} 0%, rgba(255,90,31,0.55) 35%, rgba(255,90,31,0) 100%)` }} />
      <div style={{ position: "absolute", left: M - 300, top: M - 200, width: 2520, height: 1480,
        background: "radial-gradient(ellipse 50% 55% at 50% 45%, rgba(0,0,0,0) 60%, rgba(12,12,13,0.45) 100%)" }} />
    </div>
  );
};

const Rotulos: React.FC<{ t: number }> = ({ t }) => {
  const tS = tamParaAncho("Squash & stretch.", INTER, 700, 510);
  const tE = tamParaAncho("Easing.", INTER, 700, 380);
  const kSale = tramo(t, 5.133, 5.267, ACELERA), kE = tramo(t, 5.133, 5.267);
  const linea: React.CSSProperties = { position: "absolute", left: 0, width: 1920, textAlign: "center", fontFamily: INTER, fontWeight: 700, lineHeight: 1, whiteSpace: "pre" };
  return (
    <>
      {kSale < 1 && (
        <div style={{ ...linea, top: 915 - tS / 2, fontSize: tS, opacity: 1 - kSale, filter: kSale > 0 ? `blur(${12 * kSale}px)` : undefined }}>
          <PorLetra texto="Squash & " t0={2.38} escalon={1 / 60} dur={0.12} desde={{ y: 0.25, s: 0.9, blur: 6 }} style={{ color: K.crema }} />
          <PorLetra texto="stretch." t0={2.38 + 9 / 60} escalon={1 / 60} dur={0.12} desde={{ y: 0.25, s: 0.9, blur: 6 }} style={{ color: K.acento }} />
        </div>
      )}
      {kE > 0 && <div style={{ ...linea, top: 915 - tE / 2, fontSize: tE, color: K.acento, opacity: kE, filter: kE < 0.99 ? `blur(${12 * (1 - kE)}px)` : undefined }}>Easing.</div>}
    </>
  );
};

const MOTION_ESTALLIDO = [{ x: -400, y: 40, rz: -30 }, { x: 0, y: 0 }, { x: 500, y: -250, rz: 35 }, { x: 700, y: -150, rz: 25 }, { x: 900, y: -300, rz: 40 }, { x: 1100, y: -80, rz: 20 }];

const MundoOscuro: React.FC = () => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const c = camEscenario(t);
  const kVen = c.k1 * (1 - c.k2);
  const pos = trayectoriaBola(BOLA, fps);
  const xBola = pos(Math.min(t, 6.0)).x;
  const kSuelo = tramo(t, 1.9, 2.067);
  const apaga = 1 - c.k2;
  const ins = (v: number) => lerp(-2600, v, kVen);
  const chrome = tramo(t, 3.733, 3.833, CURVAS.lineal) * (1 - tramo(t, 6.033, 6.133, CURVAS.lineal));
  const tM = tamParaAncho("Morph.", INTER, 700, 332), kM = tramo(t, 6.267, 6.4);
  const kPil = tramo(t, 6.15, 6.2);
  return (
    <AbsoluteFill>
      <FondoGrafito />
      {kVen > 0.003 && <AbsoluteFill style={{ opacity: kVen, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, rgba(255,255,255,0) 1.6px)", backgroundSize: "33px 33px" }} />}
      <VentanaEditor parte="fondo" x={VEN.x} y={VEN.y} ancho={VEN.w} alto={VEN.h} tiempo={t} opacidad={chrome} />
      {/* escenario: se mete en el visor de la ventana y luego la cámara entra hasta la bola */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(${c.tx}px, ${c.ty}px) scale(${c.s})`,
        clipPath: `inset(${ins(-38)}px ${ins(-19)}px ${ins(0)}px ${ins(-23)}px)` }}>
        <FondoEscenario t={t} />
        {kSuelo > 0 && <div style={{ position: "absolute", left: 960 - 690 * kSuelo, top: SUELO - 1, width: 1380 * kSuelo, height: 2, background: "rgba(255,255,255,0.8)", opacity: apaga }} />}
        <BolaRebote {...BOLA} opacidadRastro={apaga} />
        {apaga > 0.01 && <div style={{ position: "absolute", inset: 0, opacity: apaga }}><Rotulos t={t} /></div>}
        <PalabraLetras texto="MOTION" x={960} y={541} tam={293} peso={900} color={K.crema} ocultaEn={1.8}
          entrada={{ t0: 0.07, entradas: ["arriba", "abajo", "cae-girada", "raya", "punto", "lateral"], inicios: [0.067, 0.1, 0.2, 0.267, 0.333, 0.433], durs: [0.2, 0.2, 0.25, 0.25, 0.3, 0.35], sobrepaso: 0.15 }}
          respira={[{ t: 0.55, ancho: 1 }, { t: 1.033, ancho: 0.7, curva: INOUT }, { t: 1.4, ancho: 0.7 }, { t: 1.667, ancho: 1.233, curva: CURVAS.suave }]}
          volteo={{ t0: 0.55, escalon: 0.08, dur: 0.3 }}
          eco={{ t0: 0.55, t1: 1.633, grosor: 2, opacidad: 0.5, factor: 1.25, letraAcento: 4, colorAcento: K.acento }}
          estallido={{ t0: 1.633, conserva: 1, dur: 0.167, colorConserva: K.acento, hacia: { x: 960, y: 548 }, durConserva: 0.167, desenfoque: 60, desvios: MOTION_ESTALLIDO }} />
      </div>
      <VentanaEditor parte="marco" x={VEN.x} y={VEN.y} ancho={VEN.w} alto={VEN.h} tiempo={t} opacidad={chrome} archivo="reel.html" pestanas={["Viewport", "Graph"]} activa={0} />
      {t >= 3.733 && (
        <EditorCurvas x={425} y={736} ancho={1066} alto={290} propiedades={["Position X", "Position Y", "Scale", "Rotation"]} activa={0} valor={xBola.toFixed(1)}
          muelle={{ stiffness: 180, damping: 12, dur: 0.733 }} dibuja={{ t0: 3.933, dur: 0.2 }} cambio={{ t0: 4.667, dur: 0.2 }} cabezal={{ t0: 5.133, t1: 5.867 }}
          opacidad={tramo(t, 3.733, 3.833, CURVAS.lineal) * (1 - c.k2 * c.k2)}
          transform={c.k2 > 0 ? `perspective(1200px) translateY(${400 * c.k2}px) rotateX(${60 * c.k2}deg)` : undefined} filtro={c.k2 > 0 ? `blur(${10 * c.k2}px)` : undefined} />
      )}
      {/* morph: bola → píldora → interruptor → círculo → disco de cristal → naranja a pantalla completa */}
      {t >= 6.15 && t < 6.21 && (
        <div style={{ position: "absolute", left: 960 - lerp(217, 290, kPil) / 2, top: 538 - lerp(217, 195, kPil) / 2, width: lerp(217, 290, kPil), height: lerp(217, 195, kPil),
          borderRadius: 150, background: K.luz, boxShadow: `0 0 40px ${K.luz}` }}>
          <div style={{ position: "absolute", left: 24, top: lerp(217, 195, kPil) / 2 - 20, width: 40, height: 40, borderRadius: 20, background: "#FFFFFF", opacity: kPil }} />
        </div>
      )}
      <Interruptor t0={6.2} x={960} y={538} desde={{ w: 290, h: 195, color: K.luz }} durNace={0.083} tClic={6.533} durClic={0.133} tRecoge={6.733} durRecoge={0.167} diametroRecoge={292} punto={30} colorOn={K.acento} hasta={6.92} />
      <DiscoObturador t0={6.9} x={960} y={538} diametro={292} sectores={6} vel={20} punto={30} color={K.acento} tLlena={7.4} durLlena={0.15} curvaLlena={CURVAS.lineal} colorLlena={K.luz} colorCentro={K.llenoCentro} />
      {kM > 0 && t < 7.6 && <div style={{ position: "absolute", left: 0, width: 1920, top: 850 - tM / 2, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: tM, lineHeight: 1, color: K.acento, opacity: kM, filter: kM < 0.99 ? `blur(${12 * (1 - kM)}px)` : undefined }}>Morph.</div>}
    </AbsoluteFill>
  );
};

// ───────── mundo claro ─────────
const CAM_MOSAICO: ClaveCamara[] = [
  { t: 7.9, x: 0, y: 0, z: 1, rx: 0, rz: 0 },
  { t: 8.333, x: 6, y: 3, z: 1, rx: 0, rz: 0, para: true },
  { t: 8.767, x: 11, y: -180, z: 1.45, rx: 25, rz: -10 },
  { t: 9.3, x: -300, y: -120, z: 1.5, rx: 20, rz: -8 },
  { t: 9.767, x: -350, y: 120, z: 1.25, rx: 10, rz: -3 },
  { t: 10.067, x: 11, y: 5, z: 1, rx: 0, rz: 0, para: true },
  { t: 11.2, x: 11, y: 5, z: 1, rx: 0, rz: 0 },
];
const CELDAS = [
  { titulo: "Kinetic type", num: "01", tipo: "peso" as const, aparece: 8.1 },
  { titulo: "Springs", num: "02", tipo: "muelles" as const, acento: true, aparece: 7.95 },
  { titulo: "3D", num: "03", tipo: "cubo" as const, aparece: 8.133 },
  { titulo: "Glass", num: "04", tipo: "cristal" as const, aparece: 8.2 },
  { titulo: "Data", num: "05", tipo: "barras" as const, aparece: 8.167 },
  { titulo: "Paths", num: "06", tipo: "trazo" as const, aparece: 8.233 },
];
const SPRINGS = { x: 157 + 520 + 34, y: 192, w: 520, h: 336 };
// el contador: «900» centrado donde el original (x 446–1011, centro de cifras y 543)
const VALORES: [number, number][] = [[11.2, 0], [11.267, 130], [11.3, 230], [11.333, 380], [11.367, 480], [11.4, 630], [11.433, 660], [11.467, 730], [11.5, 760], [11.533, 780],
  [11.567, 810], [11.6, 840], [11.633, 850], [11.667, 860], [11.7, 870], [11.733, 880], [11.8, 890], [12.033, 899], [12.067, 899]];
const LOGO = "Onda 5.5";

const MundoClaro: React.FC = () => {
  const t = useSeg();
  const kC = tramo(t, 7.9, 8.167, CURVAS.suave);
  const kCol = tramo(t, 11.067, 11.233, ACELERA);
  // contador y logo
  const anchoCifra = anchoTexto("0", INTER, 800, 314);
  const xCont = 728.5 - 1.5 * anchoCifra;
  const kSale = tramo(t, 12.967, 13.033, CURVAS.lineal);
  const kTar = tramo(t, 11.2, 11.333) * (1 - tramo(t, 12.967, 13.133, CURVAS.lineal));
  const tF = tamParaAncho("frames.", INTER, 700, 282), tH = tamParaAncho("One HTML file.", INTER, 400, 347);
  const kF = tramo(t, 11.667, 11.767), kH = tramo(t, 11.867, 12.0);
  const letras = Array.from(LOGO), adv = letras.map((ch) => anchoTexto(ch, INTER, 800, 240));
  const W = adv.reduce((s, a) => s + a, 0), xLogo = 961 - W / 2, yLogo = 440;
  const tSub = tamParaAncho("Motion designer. Every frame is code.", INTER, 400, 858);
  const kSub = tramo(t, 13.433, 13.783, CURVAS.lineal);
  return (
    <AbsoluteFill style={{ background: K.fondoClaro }}>
      {kCol < 1 && (
        <AbsoluteFill style={{ opacity: 1 - kCol, transform: kCol > 0 ? `scale(${1 - 0.4 * kCol})` : undefined, filter: kCol > 0 ? `blur(${16 * kCol}px)` : undefined }}>
          <ConDesenfoque ventanas={[]} muestras={5}>
            <Camara claves={CAM_MOSAICO}>
              <div style={{ position: "absolute", left: -960, top: -540, width: 1920, height: 1080 }}>
                <MosaicoVivo x={157} y={192} celdas={CELDAS} pulso={P} fuente={INTER} tamPeso={tamParaAncho("Type", INTER, 300, 401)} />
                {t < 8.2 && (
                  <div style={{ position: "absolute", left: lerp(-40, SPRINGS.x, kC), top: lerp(-40, SPRINGS.y, kC), width: lerp(2000, SPRINGS.w, kC), height: lerp(1160, SPRINGS.h, kC),
                    borderRadius: 24 * kC, background: kC < 1 ? mezclaColor(K.luz, K.acento, kC) : K.acento }} />
                )}
              </div>
            </Camara>
          </ConDesenfoque>
        </AbsoluteFill>
      )}
      {kTar > 0 && <div style={{ position: "absolute", left: 960 - 595, top: 553 - 220, width: 1190, height: 440, borderRadius: 28, background: "rgba(255,255,255,0.55)", opacity: kTar,
        transform: `scale(${lerp(0.96, 1, tramo(t, 11.2, 11.333))})`, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.06)" }} />}
      {t >= 11.2 && t < 13.1 && (
        <ContadorRodillo x={xCont} y={543} tam={314} anchoCifra={anchoCifra} valores={VALORES} rodillo={{ t0: 12.067, dur: 0.133, de: 899, a: 900 }}
          color={K.textoOscuro} colorAcento={K.acento} desenfoque={12} peso={800} fuente={INTER}
          estiloCifra={(i) => (i === 2 ? { opacity: t >= 12.967 ? 0 : 1 } : { opacity: 1 - kSale, filter: kSale > 0 ? `blur(${14 * kSale}px)` : undefined })} />
      )}
      {kF > 0 && kSale < 1 && <div style={{ position: "absolute", left: 1100, top: 505 - tF / 2, fontFamily: INTER, fontWeight: 700, fontSize: tF, lineHeight: 1, color: K.textoOscuro, opacity: kF * (1 - kSale), filter: kF < 0.99 ? `blur(${6 * (1 - kF)}px)` : undefined, whiteSpace: "pre" }}>frames.</div>}
      {kH > 0 && kSale < 1 && <div style={{ position: "absolute", left: 1100, top: 591 - tH / 2, fontFamily: INTER, fontWeight: 400, fontSize: tH, lineHeight: 1, color: K.gris, opacity: kH * (1 - kSale), whiteSpace: "pre" }}>One HTML file.</div>}
      <GlifoPuente aparece={12.967} t0={12.967} dur={0.533} de="0" a="O" desde={{ x: xCont + 2.5 * anchoCifra, y: 543, tam: 314 }} hasta={{ x: xLogo + adv[0] / 2, y: yLogo, tam: 240 }} color={K.acento} peso={800} fuente={INTER} />
      {t >= 13.1 && (
        <div style={{ position: "absolute", left: xLogo, top: yLogo - 120, display: "flex", fontFamily: INTER, fontWeight: 800, fontSize: 240, lineHeight: 1, color: K.textoOscuro, whiteSpace: "pre" }}>
          {letras.map((ch, i) => {
            if (i === 0) return <span key={i} style={{ width: adv[0] }} />;
            const k = tramo(t, 13.167 + (i - 1) * (4 / 60), 13.167 + (i - 1) * (4 / 60) + 0.2);
            return (
              <span key={i} style={{ display: "inline-block", width: adv[i], overflow: "hidden", height: 240 }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 100}%)`, filter: k < 0.99 ? `blur(${8 * (1 - k)}px)` : undefined }}>{ch}</span>
              </span>
            );
          })}
        </div>
      )}
      {kSub > 0 && (
        <div style={{ position: "absolute", left: 0, width: 1920, top: 656 - tSub / 2, textAlign: "center" }}>
          <span style={{ display: "inline-block", fontFamily: INTER, fontWeight: 400, fontSize: tSub, lineHeight: 1, color: K.gris, whiteSpace: "pre", clipPath: `inset(-10px ${(1 - kSub) * 100}% -10px 0)` }}>
            Motion designer. Every frame is <span style={{ color: K.acento }}>code.</span>
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Reel: React.FC = () => {
  const t = useSeg();
  return (
    <AbsoluteFill>
      {t < 7.92 && <EstiloProvider tokens={TALLER}><MundoOscuro /></EstiloProvider>}
      {t >= 7.9 && <EstiloProvider tokens={TALLER_CLARO}><MundoClaro /></EstiloProvider>}
    </AbsoluteFill>
  );
};

// ───────── sonido (tabla del §10, todo en la rejilla de pulsos) ─────────
const carraca = (() => {
  const out: Sfx[] = [];
  let tt = 11.133, d = 1 / 30;
  while (tt < 11.75) { out.push({ t: tt, f: "tic", v: 0.16 }); tt += d; d *= 1.12; }
  return out;
})();
const SFX: Sfx[] = [
  { t: 0.067, f: "subida", v: 0.22 },
  { t: 0.9, f: "tic", v: 0.12 }, { t: 1.1, f: "tic", v: 0.12 },
  { t: 1.35, f: "whoosh-rapido", v: 0.18 },
  { t: 1.633, f: "impacto", v: 0.5 },
  { t: 2.333, f: "pop", v: 0.22 }, { t: 2.8, f: "pop", v: 0.22 }, { t: 3.267, f: "pop", v: 0.22 }, { t: 3.5, f: "pop", v: 0.11 },
  { t: 3.733, f: "whoosh-suave", v: 0.18 },
  { t: 4.667, f: "click", v: 0.18 }, { t: 5.133, f: "click", v: 0.18 },
  { t: 6.033, f: "whoosh", v: 0.2 }, { t: 6.533, f: "click", v: 0.35 },
  { t: 6.733, f: "tic", v: 0.16 }, { t: 7.0, f: "tic", v: 0.16 }, { t: 7.233, f: "tic", v: 0.16 },
  { t: 7.4, f: "whoosh", v: 0.3 }, { t: 7.9, f: "whoosh-suave", v: 0.25 },
  ...[8.4, 8.867, 9.333, 9.8, 10.267].map((t) => ({ t, f: "tic", v: 0.1 })),
  ...carraca,
  { t: 12.067, f: "pop", v: 0.3 },
  { t: 12.967, f: "whoosh-suave", v: 0.12 },
  { t: 13.3, f: "impacto", v: 0.55 },
];

/** Espera a que las fuentes estén cargadas antes de medir y colocar letras (si no, se mediría la fuente de reserva). */
const useFuentesListas = () => {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("fuentes del reel"));
  useEffect(() => {
    let vivo = true;
    document.fonts.ready.then(() => { if (vivo) { setListo(true); continueRender(h); } });
    return () => { vivo = false; };
  }, [h]);
  return listo;
};

export const RecReelPantalla: React.FC = () => {
  const listo = useFuentesListas();
  if (!listo) return <AbsoluteFill style={{ background: K.grafito }} />;
  return (
    <AbsoluteFill style={{ background: K.grafitoAbajo }}>
      <Sequence durationInFrames={OFF_REEL}><Freeze frame={0}><Reel /></Freeze></Sequence>
      <Sequence from={OFF_REEL}>
        <Reel />
        <Sonido sfx={SFX} />
      </Sequence>
    </AbsoluteFill>
  );
};
