// Pieza de técnicas de «tres motion de producto claros» (referencias/motion-graphics/analisis/a-fondo-tres-motion-*.md),
// hecha con la skill maestra sobre un producto FICTICIO: «ruta», app de seguimiento de pedidos. 12 s a 60 fps, 90 BPM.
// Hilo conductor: el ARO (chispas que orbitan → aro de carga de la app → símbolo de la marca, un aro con un punto).
// Guion por golpes (P = 0,667 s):
//   0,00  pregunta palabra a palabra que se enfoca + alejamiento ×1,9 → 1; chispas en órbita (0,67)
//   1,33  la pregunta se hunde (×0,35 acelerando) y sube el móvil 1; 1,67 el móvil 2 por delante (pila)
//   3,33  la pila se va desenfocándose; entra la línea de tiempo con la cámara bajando; nodos al entrar en cuadro
//   6,00  corte tapado por desenfoque: anillo de apps inclinado + «Sin apps de más»; 7,33 cambia a «Sin cuotas al mes»
//   8,93  remolino + foco morado de borde suave que cubre en 9,33 (golpe); el aro crece hasta ser el símbolo
//   9,33  la marca se teclea y se recentra; lema; 10,80 luz que sube desde las esquinas y deja ver la pregunta otra vez (bucle)
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  AnilloIconos, AroCarga, Camara2D, Chispa, CURVAS, CURVAS_ENFOQUE, EstiloProvider, FocoRadial, FraseCambia, Glifo, IconoApp, InundaLuz, LineaTiempo,
  MarcaTeclea, PilaMoviles, PorPalabra, Remolino, Sonido, VeloEsquina, entraEnCuadro, enOrbita, rellenoCentro, tramo, useSeg,
  type ClaveCamara2D, type NodoLinea, type Sfx,
} from "../base";
import { CLARO_LAVANDA, COLORES_LAVANDA as K, PULSO_LAVANDA as P } from "../capas/claro-lavanda";

export const duracionSeguimiento = 12;
const g = (n: number) => n * P; // tiempo del golpe n

// ───────── fondos ─────────
const FondoPapel: React.FC = () => (
  <AbsoluteFill style={{ background: K.papel }}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 60% at 0% 100%, ${K.neblina} 0%, rgba(207,198,223,0) 100%), radial-gradient(ellipse 45% 50% at 100% 100%, #E3DDEA 0%, rgba(227,221,234,0) 100%)` }} />
    <VeloEsquina color={K.velo} esquina="abajo-derecha" alcance={68} fuerza={0.85} />
  </AbsoluteFill>
);
const MallaMarca: React.FC = () => {
  const t = useSeg();
  const d = Math.sin(t * 0.7) * 3 + 2.5 * Math.max(0, t - 9.3); // la luz deriva despacio: el cierre nunca queda quieto
  return (
    <AbsoluteFill style={{ background: K.marcaCentro }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at ${28 + d}% ${22 - d}%, ${K.marcaClaro} 0%, rgba(90,51,166,0) 100%),
        radial-gradient(ellipse 45% 45% at 100% 0%, ${K.marcaOscuro} 0%, rgba(40,13,96,0) 100%),
        radial-gradient(ellipse 50% 50% at 0% 100%, ${K.marcaOscuro} 0%, rgba(40,13,96,0) 100%),
        radial-gradient(ellipse 40% 35% at ${82 - d}% 88%, #37294E 0%, rgba(55,41,78,0) 100%)` }} />
    </AbsoluteFill>
  );
};

/** Símbolo de «ruta»: un aro abierto con un punto en su extremo (el aro de carga que llega a destino). */
const SimboloRuta: React.FC<{ tam: number; color?: string; punto?: number }> = ({ tam, color = "#FFFFFF", punto = 1 }) => {
  const gr = tam * 0.16, r = tam / 2 - gr / 2, L = 2 * Math.PI * r;
  const a = (-90 + 0.75 * 360) * (Math.PI / 180); // final del trazo
  return (
    <svg width={tam} height={tam} style={{ overflow: "visible" }}>
      <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke={color} strokeWidth={gr} strokeLinecap="round" strokeDasharray={`${L * 0.75} ${L}`} transform={`rotate(-90 ${tam / 2} ${tam / 2})`} />
      <circle cx={tam / 2 + Math.cos(a) * r} cy={tam / 2 + Math.sin(a) * r} r={gr * 0.62 * punto} fill={color} />
    </svg>
  );
};

/** Plano con entrada y salida por enfoque (técnica del panel 1: entra σ 32 → 0 expo, sale σ 0 → 22 acelerando). */
const Plano: React.FC<{ desde: number; hasta: number; entra?: number; sale?: number; children: React.ReactNode }> = ({ desde, hasta, entra = 0.33, sale = 0.15, children }) => {
  const t = useSeg();
  if (t < desde || t >= hasta) return null;
  const ki = entra > 0 ? tramo(t, desde, desde + entra, CURVAS.expo) : 1;
  const ko = sale > 0 ? tramo(t, hasta - sale, hasta, CURVAS.acelera) : 0;
  const b = 32 * (1 - ki) + 22 * ko;
  return <AbsoluteFill style={{ filter: b > 0.1 ? `blur(${b.toFixed(2)}px)` : undefined, opacity: Math.min(1, ki * 2.5) * (1 - ko) }}>{children}</AbsoluteFill>;
};

// ───────── acto 1: la pregunta ─────────
const CAM_PREGUNTA: ClaveCamara2D[] = [
  { t: 0, s: 1.9 }, { t: 0.15, s: 1.75 }, { t: 0.62, s: 1.04 }, { t: 0.75, s: 1 }, { t: 1.25, s: 0.95 }, { t: 1.42, s: 0.8 }, { t: 1.6, s: 0.34, para: true },
];
const Pregunta: React.FC = () => {
  const t = useSeg();
  const bHundir = 10 * tramo(t, 1.3, 1.6, CURVAS.acelera);
  const o = 1 - tramo(t, 1.5, 1.64, CURVAS.lineal);
  return (
    <AbsoluteFill style={{ opacity: o, filter: bHundir > 0.1 ? `blur(${bHundir}px)` : undefined }}>
      <Camara2D claves={CAM_PREGUNTA}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <PorPalabra texto="¿Dónde está mi pedido?" t0={0.05} escalon={[0, 0.13, 0.28, 0.4]} relleno={rellenoCentro(K.titularCentro, K.titularMedio, K.titularBorde)}
            style={{ fontFamily: CLARO_LAVANDA.fuente, fontWeight: 500, fontSize: 118, letterSpacing: "-0.01em" }} />
        </AbsoluteFill>
        {[0, 180].map((fase, i) => {
          const p = enOrbita(t, { t0: 0.62 + i * 0.07, dur: 0.85, c: [960, 545], rx: 600, ry: 230, grados: 520, fase: 200 + fase });
          if (t < 0.62 + i * 0.07) return null;
          const tam = 34 - 14 * tramo(t, 1.1, 1.6, CURVAS.inOut);
          return <Chispa key={i} tam={tam} x={p.x} y={p.y} giro={t * 160} relleno={`radial-gradient(circle, ${K.chispaLuz} 0%, ${K.chispa} 70%)`} opacidad={1 - tramo(t, 1.45, 1.65, CURVAS.lineal)} />;
        })}
      </Camara2D>
    </AbsoluteFill>
  );
};

// ───────── acto 2: los móviles ─────────
const fuenteUI: React.CSSProperties = { fontFamily: CLARO_LAVANDA.fuente };
const PantallaMapa: React.FC = () => {
  const t = useSeg();
  const k = tramo(t, 1.45, 2.6, CURVAS.inOut);
  const ruta = "M 90 760 C 180 640, 330 690, 320 540 S 470 360, 520 260";
  return (
    <AbsoluteFill style={{ ...fuenteUI, background: "linear-gradient(180deg, #FBF7FB 0%, #F2EEF7 100%)" }}>
      <div style={{ padding: "18px 44px 0", fontSize: 36, fontWeight: 600, color: K.tinta }}>Tu pedido</div>
      <div style={{ padding: "6px 44px", fontSize: 22, color: K.gris }}>Ruta de entrega</div>
      <svg width={620} height={900} style={{ position: "absolute", left: 0, top: 120 }}>
        {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1={0} x2={620} y1={i * 105} y2={i * 105 + 40} stroke="#E4DEEC" strokeWidth={14} strokeLinecap="round" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={`v${i}`} y1={0} y2={900} x1={i * 130 - 20} x2={i * 130 + 60} stroke="#ECE7F2" strokeWidth={10} strokeLinecap="round" />)}
        <path d={ruta} fill="none" stroke="#D9CFEA" strokeWidth={12} strokeLinecap="round" />
        <path d={ruta} fill="none" stroke={K.final} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />
        <circle cx={90} cy={760} r={14} fill="#FFFFFF" stroke={K.final} strokeWidth={6} />
        <g transform={`translate(520 ${236 - 8 * Math.sin(t * 2.4)})`}>
          <path d="M0 26s-22-19-22-38a22 22 0 0 1 44 0c0 19-22 38-22 38z" fill={K.verde} />
          <circle cx={0} cy={-12} r={8} fill="#FFFFFF" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
const FilaEstado: React.FC<{ texto: string; sub: string; estado: "hecho" | "ahora" | "luego" }> = ({ texto, sub, estado }) => (
  <div style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "12px 0" }}>
    <div style={{ width: 34, height: 34, borderRadius: 17, flex: "none", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center",
      background: estado === "hecho" ? "#2B2433" : "#FFFFFF", border: estado === "hecho" ? "none" : `3px solid ${estado === "ahora" ? "#E7833B" : "#D6D0DE"}` }}>
      {estado === "hecho" && <div style={{ width: 18, height: 18 }}><Glifo nombre="check" color="#FFFFFF" trazo={3} /></div>}
      {estado === "ahora" && <div style={{ width: 12, height: 12, borderRadius: 6, background: "#E7833B" }} />}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 600, color: estado === "luego" ? K.gris : K.tinta }}>{texto}</div>
      <div style={{ fontSize: 20, color: K.gris, marginTop: 4 }}>{sub}</div>
    </div>
  </div>
);
const PantallaSeguimiento: React.FC = () => (
  <AbsoluteFill style={{ ...fuenteUI, background: "linear-gradient(180deg, #FBF0FA 0%, #F5F2F8 45%, #EFEAF6 100%)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "18px 0 10px", fontSize: 34, fontWeight: 600, color: K.tinta }}>
      <SimboloRuta tam={34} color={K.final} /> Seguimiento
    </div>
    <div style={{ margin: "18px 34px", padding: 28, borderRadius: 26, background: "rgba(255,255,255,0.82)", boxShadow: "0 10px 30px rgba(40,24,80,0.07)" }}>
      <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: 22, background: "#F1EDF5", display: "flex", alignItems: "center", justifyContent: "center", color: K.nodo }}>
          <div style={{ width: 50, height: 50 }}><Glifo nombre="caja" /></div>
        </div>
        <div>
          <div style={{ fontSize: 18, color: K.gris }}>Pedido 4F-20931</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: K.tinta, marginTop: 4 }}>Auriculares inalámbricos</div>
          <div style={{ display: "inline-block", marginTop: 10, padding: "6px 14px", borderRadius: 14, background: "#E3F1EF", color: K.verde, fontSize: 18, fontWeight: 600 }}>En camino</div>
        </div>
      </div>
      <div style={{ fontSize: 20, color: K.gris, marginTop: 22 }}>Llega el jueves, 14 de noviembre</div>
    </div>
    <div style={{ margin: "8px 48px" }}>
      <FilaEstado texto="Pedido realizado" sub="Lunes, 10:12" estado="hecho" />
      <FilaEstado texto="Preparado en almacén" sub="Lunes, 18:40" estado="hecho" />
      <FilaEstado texto="Salida hacia tu ciudad" sub="Ahora mismo" estado="ahora" />
      <FilaEstado texto="En reparto" sub="Pendiente" estado="luego" />
    </div>
  </AbsoluteFill>
);

// ───────── acto 3: la línea de tiempo ─────────
const ORIGEN_LINEA: [number, number] = [960, 640];
const CAM_LINEA: ClaveCamara2D[] = [
  { t: g(5), y: 470, s: 1.3 }, { t: g(5) + 0.7, y: 800 }, { t: g(6) + 0.25, y: 800 }, { t: g(8) + 0.1, y: 1520 }, { t: g(9) - 0.3, y: 1650 }, { t: g(9), y: 1980 },
];
const DATOS_LINEA: Omit<NodoLinea, "t">[] = [
  { titulo: "Pedido realizado", sub: "Lun 10 · 10:12", icono: <Glifo nombre="documento" /> },
  { titulo: "En el almacén", sub: "Lun 10 · 18:40", icono: <Glifo nombre="almacen" /> },
  { titulo: "En camino", sub: "Mar 11 · 07:05", icono: <Glifo nombre="avion" /> },
  { titulo: "En reparto", sub: "Jue 14 · 09:30", icono: <Glifo nombre="camion" /> },
  { titulo: "Entregado", sub: "Jue 14 · 12:02", icono: <Glifo nombre="caja" />, final: true },
];
// cada estado aparece cuando su nodo entra en cuadro (a 300 px del borde de abajo), no a mano
const NODOS_LINEA: NodoLinea[] = DATOS_LINEA.map((d, i) => ({ ...d, t: entraEnCuadro(CAM_LINEA, [ORIGEN_LINEA[0], ORIGEN_LINEA[1] + i * 310], { borde: 860, desde: g(5), hasta: g(9) }) }));
const Linea: React.FC = () => (
  <Camara2D claves={CAM_LINEA.map((c) => ({ ...c, x: 960 }))}>
    <LineaTiempo nodos={NODOS_LINEA} origen={ORIGEN_LINEA} colorEje={K.eje} colorNodo={K.nodo} colorFinal={K.final} fondoTarjeta={K.tarjeta} tinta={K.tinta} gris={K.gris} />
  </Camara2D>
);

// ───────── acto 4: el anillo ─────────
const APPS = [
  { glifo: "lupa", fondo: "linear-gradient(160deg, #6FA0F8, #2F5FD9)" },
  { glifo: "caja", fondo: "linear-gradient(160deg, #A9E3D7, #3FA796)" },
  { glifo: "pin", fondo: "linear-gradient(160deg, #F7A35C, #E0622A)" },
  { glifo: "rayo", fondo: "linear-gradient(160deg, #6B63E6, #3B2FBF)" },
  { glifo: "camion", fondo: "linear-gradient(160deg, #5A6CF0, #2238C9)" },
];
const PRECIOS = ["4,99 €/mes", "2,99 €/mes", "6,99 €/mes", "3,49 €/mes", "5,99 €/mes"];
const Anillo: React.FC = () => (
  <AbsoluteFill>
    <AnilloIconos t0={g(9) + 0.05} centro={[960, 540]} rx={580} ry={275} tam={104} vel={22} pulsos={[{ t: g(11), grados: 40 }]} tEtiquetas={g(11) + 0.1}
      iconos={APPS.map((a, i) => ({ nodo: <IconoApp tam={104} glifo={a.glifo} fondo={a.fondo} />, etiqueta: PRECIOS[i] }))} />
    <FraseCambia fijo="Sin" cambios={[{ t: g(9) + 0.2, texto: "apps de más" }, { t: g(11), texto: "cuotas al mes" }]} x={960} y={545} tam={84} peso={500}
      relleno={`linear-gradient(180deg, #3F2470 0%, #462A77 45%, rgba(122,96,170,0.55) 100%)`} />
  </AbsoluteFill>
);

// ───────── acto 5: la marca ─────────
const T_FOCO = g(14) - 0.4; // el foco cubre justo en el golpe 14
const T_LUZ = g(16) + 0.13; // la luz cubre en el golpe 16 + 0,35 y debajo vuelve a empezar la pregunta (bucle)
const PuenteSimbolo: React.FC = () => {
  // el aro crece en el centro mientras se abre el foco y llega al tamaño del símbolo del lockup
  const t = useSeg();
  if (t < T_FOCO || t >= g(14) + 0.02) return null;
  const k = tramo(t, T_FOCO, g(14), CURVAS.expo);
  const tam = 30 + (150 - 30) * k;
  return (
    <div style={{ position: "absolute", left: 960 - tam / 2, top: 540 - tam / 2, width: tam, height: tam, transform: `rotate(${-90 * (1 - k)}deg)` }}>
      <SimboloRuta tam={tam} punto={tramo(t, T_FOCO + 0.2, g(14), CURVAS.expo)} />
    </div>
  );
};

const SFX: Sfx[] = [
  { t: 0.05, f: "whoosh-suave", v: 0.25 },
  { t: 0.66, f: "tic", v: 0.18 },
  { t: g(2) + 0.05, f: "whoosh-suave", v: 0.35 },
  { t: g(2) + 0.36, f: "whoosh-suave", v: 0.25 },
  { t: g(5) - 0.05, f: "whoosh", v: 0.3 },
  ...NODOS_LINEA.map((n, i) => ({ t: n.t, f: i === NODOS_LINEA.length - 1 ? "pop" : "tic", v: i === NODOS_LINEA.length - 1 ? 0.4 : 0.22 })),
  { t: g(9), f: "whoosh-rapido", v: 0.35 },
  { t: g(9) + 0.08, f: "pop", v: 0.3 },
  { t: g(11), f: "click", v: 0.35 },
  { t: T_FOCO, f: "whoosh", v: 0.4 },
  { t: g(14), f: "impacto", v: 0.35 },
  { t: T_LUZ, f: "whoosh-suave", v: 0.3 },
];

export const RecSeguimiento: React.FC = () => {
  const t = useSeg();
  return (
    <EstiloProvider tokens={CLARO_LAVANDA}>
      <AbsoluteFill style={{ background: K.papel }}>
        {/* actos claros sobre el mismo papel (el remolino retuerce todo lo claro justo antes del foco) */}
        <Remolino t0={T_FOCO - 0.12} dur={0.3} x={960} y={540} giro={22} anillos={3.5} ondas={16}>
          <FondoPapel />
          {t < 1.8 && <Pregunta />}
          <Plano desde={1.25} hasta={g(5) + 0.05} entra={0} sale={0.08}>
            <AbsoluteFill style={{ transform: "scale(1.2)", transformOrigin: "960px 60px" }}>
            <PilaMoviles pantallas={[{ t0: 1.3, contenido: <PantallaMapa /> }, { t0: g(2) + 0.36, contenido: <PantallaSeguimiento />, scroll: 40 }]} centro={[960, 150]} ancho={620} alto={1300} deriva={0.09} sale={g(5) - 0.32} />
            {t > 2.7 && t < g(5) && (
              <div style={{ position: "absolute", left: 960 - 22, top: 865, opacity: tramo(t, 2.7, 2.9, CURVAS.lineal) }}><AroCarga tam={44} color={K.nodo} /></div>
            )}
            </AbsoluteFill>
          </Plano>
          <Plano desde={g(5)} hasta={g(9)} entra={0.33} sale={0.1}><Linea /></Plano>
          <Plano desde={g(9)} hasta={g(14) + 0.05} entra={0.3} sale={0}><Anillo /></Plano>
        </Remolino>
        <FocoRadial t0={T_FOCO} dur={0.4} x={960} y={540} hasta={g(14) + 0.05}><MallaMarca /></FocoRadial>
        {t >= g(14) && <MallaMarca />}
        <PuenteSimbolo />
        <AbsoluteFill style={{ transform: `scale(${1 + 0.028 * Math.max(0, t - g(14))})` }}>
        <MarcaTeclea t0={g(14)} x={960} y={540} logo={<SimboloRuta tam={150} />} logoTam={150} texto="ruta" tam={150} peso={700} hueco={14} escala={0.63}
          lema={{ texto: "Cada pedido, a la vista.", tam: 30, color: K.lema, dy: 46 }} />
        </AbsoluteFill>
        {/* la luz deja ver el principio desenfocado: el vídeo enlaza en bucle */}
        <InundaLuz t0={T_LUZ} dur={0.22} color="#F1EEF6" velo={0.35}><Sequence from={Math.round((T_LUZ + 0.1) * 60)}><FondoPapel /><Pregunta /></Sequence></InundaLuz>
        <Sonido sfx={SFX} musica="musica/seguimiento.wav" volumenMusica={0.55} volumen={0.75} />
      </AbsoluteFill>
    </EstiloProvider>
  );
};
