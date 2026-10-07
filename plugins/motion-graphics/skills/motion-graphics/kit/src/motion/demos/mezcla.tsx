// Demo del UNIVERSO mezclable: la misma escena (8 s) con cualquier estilo, variante o mezcla. Lo único que cambia
// entre renders son los ajustes del estilo (paleta, tipografía, ritmo, curvas, muelle, luz); la escena no se toca.
// Props: { estilo: "oscuro" | "claro" | "agencia" | variantes…, ajustes?: Partial<TokensEstilo> }.
// Marca ficticia «pulso» (app de métricas).
import React from "react";
import { AbsoluteFill } from "remotion";
import { Camara2D, Contador, EstiloProvider, Flash, FondoEstilo, Forma, Golpe, Mascara, Movil, Onda, PorLetra, Progreso, Tarjeta, mezclar, tramo, useCurva, useEstilo, useGolpe, useMuelle, useSeg, Sonido, type TokensEstilo } from "../base";
import { ESTILOS, type NombreEstilo } from "../capas";

export type PropsMezcla = { estilo: NombreEstilo; ajustes?: Partial<TokensEstilo> };
/** 18 pulsos del ritmo del estilo (la escena entera está medida en pulsos). */
export const duracionMezcla = (p: PropsMezcla) => (18 * 60) / (mezclar(ESTILOS[p.estilo] ?? ESTILOS.oscuro, p.ajustes ?? {}).ritmo?.bpm ?? 120);

const Escena: React.FC = () => {
  const t = useSeg();
  const est = useEstilo();
  const g = useGolpe(); // tiempos clavados al pulso del estilo
  const ent = useCurva("entrada");
  const aterriza = useMuelle(t, g(4)); // tarjeta: rebote SOLO si el estilo lo permite, con sobrepaso limitado
  const sale = tramo(t, g(12), g(12) + 0.25, useCurva("salida"));
  const tit = { fontFamily: est.fuente, fontWeight: est.peso, letterSpacing: est.tracking, color: est.texto, textTransform: est.mayusculas ? "uppercase" : undefined } as React.CSSProperties;
  const color2 = est.paleta?.[1] ?? est.acento;
  const titT = { ...({ fontFamily: est.fuente, fontWeight: est.peso, letterSpacing: est.tracking, textTransform: est.mayusculas ? "uppercase" : undefined } as React.CSSProperties), color: est.textoTarjeta ?? est.texto };
  return (
    <>
      {/* 1 · punto de luz → píldora → tarjeta (objeto puente) */}
      <Forma fondo={(tt) => (tt < g(2) ? est.acento : est.tarjeta)} colorLuz={est.acento} claves={[
        { t: 0.05, x: 960, y: 300, w: 28, h: 28, r: 14, luz: 1.4, o: 0 }, { t: 0.2, x: 960, y: 520, w: 28, h: 28, o: 1 },
        { t: g(1), x: 960, y: 540, w: 300, h: 70, r: 35, luz: 0.8 }, { t: g(2), x: 960, y: 540, w: 300, h: 70, luz: 0.4 },
        { t: g(3), x: 960, y: 540, w: 40, h: 40, r: 20, luz: 1.4 }, { t: g(3) + 0.08, x: 960, y: 540, w: 40, h: 40, o: 0 },
      ]}>
        {t > g(1) && t < g(2.8) && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: est.fuenteTexto, fontWeight: 600, fontSize: 28, color: est.fondo, opacity: tramo(t, g(1), g(1) + 0.15) }}>Nuevo</div>}
      </Forma>
      {t > g(1) && t < g(1.9) && <Onda t0={g(1)} x={960} y={540} w={300} h={70} radio={35} color={est.acento} />}
      {/* 2 · tarjeta con contador y anillo (misma curva) */}
      {t > g(3) && t < g(12) + 0.3 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `scale(${(0.6 + 0.4 * aterriza) * 1.25}) translateY(${-200 * sale}px)`, opacity: Math.min(1, aterriza * 3) * (1 - sale) }}>
            <Tarjeta ancho={980} alto={360} padding={44}>
              <div style={{ display: "flex", gap: 40, alignItems: "center", height: "100%" }}>
                <div style={{ position: "relative", width: 200, height: 200 }}>
                  <Progreso t0={g(4.5)} dur={g(4) - g(0)} ancho={200} alto={200} color={est.acento} grosor={10} hasta={0.86} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...titT, fontSize: 52 }}><Contador hasta={86} t0={g(4.5)} dur={g(4)} sufijo="%" /></div>
                </div>
                <div>
                  <div style={{ fontFamily: est.fuenteTexto, fontSize: 30, color: est.textoTarjeta ?? est.suave, opacity: est.textoTarjeta ? 0.6 : 1 }}>Usuarios activos</div>
                  <div style={{ ...titT, fontSize: 92, lineHeight: 1 }}><Contador hasta={1284} t0={g(5)} dur={g(4)} /></div>
                  <div style={{ fontFamily: est.fuenteTexto, fontSize: 28, color: color2, marginTop: 8, opacity: tramo(t, g(7), g(7) + 0.2, ent), transform: `scale(${0.8 + 0.2 * tramo(t, g(7), g(7) + 0.25, ent)})`, transformOrigin: "left" }}>+18 % esta semana</div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200, marginLeft: "auto" }}>
                  {[0.45, 0.7, 0.55, 0.85, 1].map((h, i) => {
                    const k = tramo(t, g(6 + i), g(6 + i) + 0.3, ent);
                    return <div key={i} style={{ width: 26, height: 200 * h * k, borderRadius: 8, background: i === 4 ? est.acento : est.textoTarjeta ?? est.suave, opacity: i === 4 ? 1 : 0.5, boxShadow: i === 4 && k > 0.9 ? `0 0 24px ${est.acento}` : undefined }} />;
                  })}
                </div>
              </div>
            </Tarjeta>
          </div>
        </AbsoluteFill>
      )}
      {/* titular por máscara con la curva y la duración de entrada del estilo */}
      <div style={{ position: "absolute", left: 120, top: 110, ...tit, fontSize: 84, opacity: 1 - sale }}>
        {t > g(4) && <Mascara texto="Tus datos, en vivo." t0={g(4)} acento={["vivo."]} />}
      </div>
      {/* 3 · palabras al pulso y marca */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", ...tit, fontSize: 180 }}>
        {["Claro.", "Rápido.", "Tuyo."].map((w, i) => <div key={w} style={{ position: "absolute", transform: `scale(${1 + 0.14 * Math.max(0, Math.min(1, (t - g(12.5 + i)) / (g(13.4 + i) - g(12.5 + i))))})` }}><Golpe texto={w} t0={g(12.5 + i)} t1={g(13.4 + i)} /></div>)}
      </AbsoluteFill>
      {t > g(15.6) && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ width: 96, height: 96, borderRadius: 48, border: `14px solid ${est.acento}`, boxSizing: "border-box", transform: `scale(${tramo(t, g(15.6), g(15.6) + 0.3, ent)})` }} />
            <div style={{ ...tit, fontSize: 140 }}><PorLetra texto="pulso" t0={g(15.8)} escalon={0.035} dur={0.25} /></div>
          </div>
        </AbsoluteFill>
      )}
      <Flash t0={g(15.6)} dur={0.25} color={est.acento} fuerza={0.35} />
    </>
  );
};

export const DemoMezcla: React.FC<PropsMezcla> = ({ estilo, ajustes }) => {
  const tokens = mezclar(ESTILOS[estilo] ?? ESTILOS.oscuro, ajustes ?? {});
  const bpm = tokens.ritmo?.bpm ?? 120, p = 60 / bpm;
  return (
    <EstiloProvider tokens={tokens}>
      <AbsoluteFill>
        <FondoEstilo />
        <Camara2D claves={[
          { t: 0, x: 960, y: 540, s: 1.08 }, { t: 4 * p, x: 960, y: 540, s: 1.0 }, { t: 6 * p, x: 1010, y: 560, s: 1.12, rz: -1 }, { t: 8 * p, x: 1060, y: 590, s: 1.28 },
          { t: 9 * p, x: 960, y: 540, s: 1.05 }, { t: 11 * p, x: 900, y: 520, s: 1.18, rz: 1 }, { t: 12 * p, x: 960, y: 540, s: 1.0 }, { t: 13 * p, x: 930, y: 530, s: 1.08, rz: -1 }, { t: 14 * p, x: 990, y: 550, s: 1.02, rz: 1 },
          { t: 15 * p, x: 940, y: 535, s: 1.1, rz: -0.5 }, { t: 15.6 * p, x: 960, y: 540, s: 0.96 }, { t: 18 * p, x: 975, y: 545, s: 1.2 },
        ]}>
          <Escena />
        </Camara2D>
        <Sonido volumen={0.7} sfx={[
          { t: 0.18, f: "tic", v: 0.3 }, { t: p, f: "pop", v: 0.4 }, { t: 3 * p, f: "whoosh-suave", v: 0.3 }, { t: 4 * p, f: "impacto", v: 0.45 },
          { t: 7 * p, f: "pop", v: 0.3 }, { t: 12 * p, f: "whoosh-rapido", v: 0.4 }, ...[0, 1, 2].map((i) => ({ t: (12.5 + i) * p, f: "impacto", v: 0.4 })), { t: 15.6 * p, f: "impacto", v: 0.55 },
        ]} />
      </AbsoluteFill>
    </EstiloProvider>
  );
};
