// Base común · piezas de «cristal» (análisis en referencias/motion-graphics/analisis/a-fondo-prompt-cristal.md):
// tecleo con luz, chispa de 4 puntas como objeto puente, guías de construcción, barra de prompt de cristal con extremo
// líquido, cursor, estallido de rayos, mosaico de paneles con canales, red de nodos con conectores en codo, rosetón de
// contorno y fondo de manchas por escena. Todo genérico: los textos, colores e iconos llegan por props.
import React from "react";
import { AbsoluteFill, interpolateColors, useVideoConfig } from "remotion";
import { Camara2D, type ClaveCamara2D } from "./camara";
import { useEstilo } from "./estilo";
import { CURVAS, tramo, useSeg } from "./tiempo";

const GLIFOS = "/\\|-_=+*<>:;~^!?";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Color hex #RRGGBB con alfa 0–1 (#RRGGBBAA). */
export const conAlfa = (hex: string, a: number) => `${hex.slice(0, 7)}${Math.round(clamp01(a) * 255).toString(16).padStart(2, "0")}`;

// ───────────────────────── TecleaLuz ─────────────────────────
export type BorradoLuz = {
  /** segundo en que empieza a borrarse */ t: number;
  /** "fin" = de derecha a izquierda; "inicio" = desde la primera letra */ desde: "fin" | "inicio";
  /** letras por segundo del borrado (por defecto, las del tecleo) */ cps?: number;
  /** cuántas letras borra (por defecto todas) */ n?: number;
};
/**
 * Tecleo letra a letra con LUZ: cada letra nace descifrada (`descifra` s de glifos borrosos desplazados) y con un halo
 * del color `brillo` que se enfría en `enfria` s (un «cometa» que recorre la palabra). Borrado con el mismo efecto al
 * revés, desde el final o desde el principio.
 * Props: `texto`, `t0`, `cps` (30), `borra?`, `brillo` (#6E8EFF), `enfria` (0,33), `descifra` (0,08), `negrita?: [desde, hasta)`
 * (índices de letra a 700), `colapsa` (las letras aún no escritas o ya borradas no ocupan sitio: un texto centrado
 * crece hacia los dos lados), `cursor` (barra fija tras la última letra escrita), `style`, y `dur` + `curva` para un
 * ritmo no lineal (las letras salen según la curva en `dur` s; con `CURVAS.expo`, ráfaga que frena; ignora `cps`).
 */
export const TecleaLuz: React.FC<{
  texto: string; t0: number; cps?: number; borra?: BorradoLuz; brillo?: string; enfria?: number; descifra?: number;
  negrita?: [number, number]; colapsa?: boolean; cursor?: boolean; style?: React.CSSProperties; dur?: number; curva?: (x: number) => number;
}> = ({ texto, t0, cps = 30, borra, brillo = "#6E8EFF", enfria = 0.33, descifra = 0.08, negrita, colapsa, cursor, style, dur, curva }) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const est = useEstilo();
  const chars = Array.from(texto), n = chars.length;
  const fr = Math.floor((t * fps) / 2);
  const nb = borra?.n ?? n;
  // instante de entrada de la letra i (lineal a `cps`, o invirtiendo la curva por bisección)
  const entrada = (i: number) => {
    if (!dur || !curva) return t0 + i / cps;
    let a = 0, b = 1;
    for (let k = 0; k < 18; k++) { const m = (a + b) / 2; if (curva(m) < i / n) a = m; else b = m; }
    return t0 + dur * b;
  };
  let ultima = -1;
  for (let i = 0; i < n; i++) if (t >= entrada(i)) ultima = i;
  const barra = <span style={{ fontWeight: 300, opacity: 0.9 }}>|</span>;
  return (
    <span style={{ whiteSpace: "pre", fontFamily: est.fuenteTexto, color: est.texto, ...style }}>
      {chars.map((ch, i) => {
        const tIn = entrada(i);
        let tOut = Infinity;
        if (borra) { const k = borra.desde === "fin" ? n - 1 - i : i; if (k < nb) tOut = borra.t + k / (borra.cps ?? cps); }
        if (t < tIn || t > tOut + descifra) return colapsa ? null : <React.Fragment key={i}>{cursor && i === ultima + 1 ? barra : null}<span style={{ opacity: 0 }}>{ch}</span></React.Fragment>;
        const edad = t - tIn, rotoIn = edad < descifra, rotoOut = t > tOut;
        const roto = (rotoIn || rotoOut) && ch !== " ";
        const g = roto ? GLIFOS[(fr * 7 + i * 13) % GLIFOS.length] : ch;
        const k = Math.max(0, 1 - edad / enfria);
        const peso = negrita && i >= negrita[0] && i < negrita[1] ? 700 : undefined;
        return (
          <span key={i} style={{ fontWeight: peso, opacity: rotoOut ? 1 - (t - tOut) / descifra * 0.6 : 1,
            filter: roto ? "blur(3px)" : undefined,
            textShadow: k > 0.02 ? `0 0 ${3 + 6 * k}px ${conAlfa("#FFFFFF", 0.9 * k)}, 0 0 ${8 + 14 * k}px ${conAlfa(brillo, k)}` : undefined,
            display: roto ? "inline-block" : undefined, transform: rotoIn ? `translateX(${(1 - edad / descifra) * 6}px)` : undefined }}>{g}</span>
        );
      })}
      {cursor && t >= t0 && ultima === n - 1 ? barra : null}
    </span>
  );
};

// ───────────────────────── Chispa ─────────────────────────
/** Contorno de la estrella de 4 puntas cóncavas, centrada en (c, c) con radio r (`curva` 0,02 = casi «+», 0,3 = rombo). */
export const caminoChispa = (r: number, curva = 0.12, c = r) => {
  const k = curva * r, P = (x: number, y: number) => `${(c + x).toFixed(2)},${(c + y).toFixed(2)}`;
  return `M${P(0, -r)} C${P(k, -k)} ${P(k, -k)} ${P(r, 0)} C${P(k, k)} ${P(k, k)} ${P(0, r)} C${P(-k, k)} ${P(-k, k)} ${P(-r, 0)} C${P(-k, -k)} ${P(-k, -k)} ${P(0, -r)}Z`;
};
/**
 * La CHISPA: estrella de 4 puntas cóncavas, el objeto puente del estilo (nodo, «+» de la barra, centro del aro, marca).
 * Props: `tam` (punta a punta, px), `x`/`y` (centro; sin ellos va en línea), `color` o `relleno` (cualquier fondo CSS:
 * degradado cónico para una marca de colores), `curva` (0,12), `halo` (0–1) y `colorHalo`, `giro` (grados), `escala`,
 * `mas` (0–1: se encoge y se convierte en un «+» de trazo `grosorMas`), `opacidad`.
 */
export const Chispa: React.FC<{
  tam: number; x?: number; y?: number; color?: string; relleno?: string; curva?: number; halo?: number; colorHalo?: string;
  giro?: number; escala?: number; mas?: number; grosorMas?: number; opacidad?: number; style?: React.CSSProperties;
}> = ({ tam, x, y, color = "#F7F8FC", relleno, curva = 0.12, halo = 0, colorHalo, giro = 0, escala = 1, mas = 0, grosorMas, opacidad = 1, style }) => {
  const r = tam / 2;
  const gm = grosorMas ?? Math.max(2, tam * 0.06);
  const pos: React.CSSProperties = x !== undefined && y !== undefined ? { position: "absolute", left: x - r, top: y - r } : { position: "relative", display: "inline-block", flex: "none" };
  if (opacidad <= 0.003 || escala <= 0.001) return <div style={{ ...pos, width: tam, height: tam }} />;
  const ch = colorHalo ?? color;
  return (
    <div style={{ ...pos, width: tam, height: tam, opacity: opacidad, transform: `rotate(${giro}deg) scale(${escala})`,
      filter: halo > 0.01 ? `drop-shadow(0 0 ${tam * 0.12 * halo}px ${conAlfa(ch.startsWith("#") ? ch : "#FFFFFF", 0.85 * halo)})` : undefined, ...style }}>
      {mas < 1 && <div style={{ position: "absolute", inset: 0, background: relleno ?? color, clipPath: `path("${caminoChispa(r, curva)}")`,
        transform: `scale(${1 - 0.55 * mas})`, opacity: 1 - mas }} />}
      {mas > 0 && <>
        <div style={{ position: "absolute", left: r - tam * 0.3, top: r - gm / 2, width: tam * 0.6, height: gm, borderRadius: gm, background: color, opacity: mas, transform: `scale(${0.6 + 0.4 * mas})` }} />
        <div style={{ position: "absolute", top: r - tam * 0.3, left: r - gm / 2, height: tam * 0.6, width: gm, borderRadius: gm, background: color, opacity: mas, transform: `scale(${0.6 + 0.4 * mas})` }} />
      </>}
    </div>
  );
};

// ───────────────────────── Guias ─────────────────────────
/** Una guía de construcción: línea de `eje` "h" (en y = pos) o "v" (en x = pos) entre `a` y `b`, que entra deslizándose
 *  desde el lado `desde` ("inicio" = izquierda/arriba, "fin" = derecha/abajo) `recorrido` px en `dur` s desde `t0`. */
export type Guia = { eje: "h" | "v"; pos: number; a: number; b: number; t0: number; dur?: number; desde: "inicio" | "fin"; recorrido?: number };
/**
 * Guías de plano de 1 px (construcción visible): entran deslizándose, se cruzan donde se va a dibujar la forma y se
 * apagan en `apaga` [t0, t1]. Coordenadas del contenedor. Props: `lineas`, `apaga?`, `color`, `grosor`.
 */
export const Guias: React.FC<{ lineas: Guia[]; apaga?: [number, number]; color?: string; grosor?: number }> = ({ lineas, apaga, color = "rgba(255,255,255,0.75)", grosor = 1 }) => {
  const t = useSeg();
  const op = apaga ? 1 - tramo(t, apaga[0], apaga[1], CURVAS.lineal) : 1;
  if (op <= 0) return null;
  return (
    <>
      {lineas.map((l, i) => {
        if (t < l.t0) return null;
        const k = tramo(t, l.t0, l.t0 + (l.dur ?? 0.25), CURVAS.expo);
        const d = (1 - k) * (l.recorrido ?? 1600) * (l.desde === "inicio" ? -1 : 1);
        const s: React.CSSProperties = l.eje === "h"
          ? { left: l.a + d, top: l.pos - grosor / 2, width: l.b - l.a, height: grosor }
          : { top: l.a + d, left: l.pos - grosor / 2, height: l.b - l.a, width: grosor };
        return <div key={i} style={{ position: "absolute", background: color, opacity: op * Math.min(1, k * 3), ...s }} />;
      })}
    </>
  );
};

// ───────────────────────── BarraPrompt ─────────────────────────
/** Contorno de una píldora w×h como polígono; `gota` (0–1, con signo) hincha y ondula el extremo derecho como un líquido. */
const contornoPildora = (w: number, h: number, gota = 0, fase = 0) => {
  const r = h / 2, pts: [number, number][] = [], N = 36;
  const ola = (x: number) => gota * h * 0.05 * Math.sin(x / w * 18 + fase) * clamp01((x - w * 0.45) / (w * 0.4));
  for (let i = 0; i <= N; i++) { const x = r + ((w - 2 * r) * i) / N; pts.push([x, ola(x)]); }
  for (let i = 1; i < N; i++) { const a = -Math.PI / 2 + (Math.PI * i) / N; const rr = r * (1 + gota * (0.06 + 0.04 * Math.sin(5 * a + fase * 1.3))); pts.push([w - r + rr * Math.cos(a), r + rr * Math.sin(a)]); }
  for (let i = 0; i <= N; i++) { const x = w - r - ((w - 2 * r) * i) / N; pts.push([x, h - ola(x + 37)]); }
  for (let i = 1; i < N; i++) { const a = Math.PI / 2 + (Math.PI * i) / N; pts.push([r + r * Math.cos(a), r + r * Math.sin(a)]); }
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") + "Z";
};
export type ChipPrompt = { icono?: React.ReactNode; nombre: string; halo?: string | ((t: number) => string) };
/**
 * BARRA DE PROMPT de cristal (demo de IA / buscador), en coordenadas propias (w×h, posición relativa):
 * guías de 1 px que entran y en cuyo cruce se dibuja el casquete izquierdo (`t0` + 0,44–0,67 s), chips en cascada
 * desde arriba-derecha (inclinados −4° → 0, uno cada `cadaChip` s desde `t0` + 0,17), chispa que se convierte en el «+»
 * (`tMas`), texto con `TecleaLuz` desde `tEscribe`, botón circular de enviar, EXTREMO LÍQUIDO tras `tClic` (el casquete
 * derecho se hincha y ondula amortiguado ~0,5 s) y ENCENDIDO del cristal (`tEnciende`, barrido de luz izq. → der.).
 * Props: `w` (1141), `h` (164), `t0`, `texto`, `tEscribe`, `cps` (21), `chips`, `tMas`, `tClic`, `tEnciende`,
 * `vidrio` (4 colores del degradado izq. → der.), `encendido` (2 colores), `borde`, `guias` (true), `tamTexto`.
 */
export const BarraPrompt: React.FC<{
  t0: number; texto: string; tEscribe: number; chips?: ChipPrompt[]; w?: number; h?: number; cps?: number; tMas?: number; tClic?: number; tEnciende?: number;
  vidrio?: [string, string, string, string]; encendido?: [string, string]; borde?: string; guias?: boolean; tamTexto?: number; cadaChip?: number;
  /** opacidad del cristal (0,6: deja ver la luz del fondo) */ opacidadVidrio?: number;
}> = ({ t0, texto, tEscribe, chips = [], w = 1141, h = 164, cps = 21, tMas, tClic = 1e9, tEnciende = 1e9,
  vidrio = ["#262542", "#333250", "#464768", "#54577A"], encendido = ["#445C7E", "#4A6281"], borde = "#E9E9F2", guias = true, tamTexto, cadaChip = 0.11, opacidadVidrio = 0.6 }) => {
  const t = useSeg();
  const est = useEstilo();
  const r = h / 2;
  const dib = tramo(t, t0 + 0.44, t0 + 0.67, CURVAS.suave);           // casquete izquierdo que se dibuja
  const cuerpo = tramo(t, t0 + 0.6, t0 + 0.9, CURVAS.suave);           // el cristal se rellena
  const enc = tramo(t, tEnciende, tEnciende + 0.27, CURVAS.suave);
  const dc = t - tClic;
  const gota = dc > 0.1 ? Math.exp(-(dc - 0.1) / 0.2) * Math.sin((dc - 0.1) * 22) * Math.min(1, (dc - 0.1) / 0.06) : 0;
  const camino = contornoPildora(w, h, gota, dc * 9);
  const tm = tMas ?? t0 + 0.67;
  const mas = tramo(t, tm, tm + 0.23, CURVAS.suave);
  const col = (i: number) => interpolateColors(enc, [0, 1], [vidrio[i], i < 2 ? encendido[0] : encendido[1]]);
  const barrido = enc > 0 && enc < 1 ? `linear-gradient(90deg, transparent ${enc * 100 - 30}%, rgba(170,200,255,0.35) ${enc * 100}%, transparent ${enc * 100 + 8}%), ` : "";
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {guias && <Guias apaga={[t0 + 0.67, t0 + 0.9]} lineas={[
        { eje: "h", pos: 0, a: h * 0.67, b: w + 2400, t0: t0 + 0.07, desde: "fin" },
        { eje: "h", pos: h, a: -2400, b: h * 3, t0: t0 + 0.13, desde: "inicio" },
        { eje: "v", pos: 0, a: -1600, b: h + 1200, t0: t0 + 0.23, desde: "inicio", recorrido: 1200 },
      ]} />}
      {/* cuerpo de cristal */}
      <div style={{ position: "absolute", inset: 0, clipPath: `path("${camino}")`, opacity: cuerpo,
        background: `${barrido}linear-gradient(90deg, ${conAlfa(col(0), opacidadVidrio + 0.25 + 0.1 * enc)}, ${conAlfa(col(1), opacidadVidrio + 0.15 + 0.2 * enc)} 40%, ${conAlfa(col(2), opacidadVidrio + 0.3 * enc)} 75%, ${conAlfa(col(3), opacidadVidrio - 0.15 + 0.45 * enc)})`,
        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18)" }} />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* casquete izq. que se dibuja de arriba a abajo; después, el contorno entero */}
        <path d={`M${r},0 A${r},${r} 0 0 0 ${r},${h}`} fill="none" stroke={borde} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dib} opacity={1 - cuerpo} />
        <path d={camino} fill="none" stroke={borde} strokeWidth={2} opacity={cuerpo} />
      </svg>
      {/* chips en cascada */}
      <div style={{ position: "absolute", left: h * 0.52, bottom: h + 18, display: "flex", gap: 15 }}>
        {chips.map((c, i) => {
          const k = tramo(t, t0 + 0.17 + i * cadaChip, t0 + 0.47 + i * cadaChip, CURVAS.expo);
          if (k <= 0) return <div key={i} />;
          const halo = typeof c.halo === "function" ? c.halo(t) : c.halo;
          return (
            <div key={i} style={{ height: 43, padding: "0 18px 0 14px", borderRadius: 22, display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap",
              border: `1.5px solid ${halo ?? "rgba(191,191,200,0.7)"}`, background: "rgba(20,19,28,0.8)", fontFamily: est.fuenteTexto, fontWeight: 400, fontSize: 20, color: "#E6E6EE",
              opacity: k, filter: k < 0.98 ? `blur(${(1 - k) * 8}px)` : undefined, transform: `translate(${(1 - k) * 60}px, ${-(1 - k) * 80}px) rotate(${-(1 - k) * 4}deg)`,
              boxShadow: halo ? `0 0 14px ${halo}, inset 0 0 6px ${halo}88` : undefined }}>{c.icono}{c.nombre}</div>
          );
        })}
      </div>
      {/* chispa → «+», texto y botón */}
      <Chispa tam={h * 0.34} x={h * 0.51} y={r} mas={mas} halo={1 - mas} escala={tramo(t, t0, t0 + 0.2)} grosorMas={3} />
      <div style={{ position: "absolute", left: h * 0.88, top: 0, height: h, display: "flex", alignItems: "center" }}>
        <TecleaLuz texto={texto} t0={tEscribe} cps={cps} style={{ fontSize: tamTexto ?? h * 0.435, fontWeight: 400, color: "#F7F8FC" }} />
      </div>
      <div style={{ position: "absolute", left: w - h * 0.54 - h * 0.2 + gota * h * 0.02, top: r - h * 0.2, width: h * 0.4, height: h * 0.4, borderRadius: h, background: "#F7F8FC",
        display: "grid", placeItems: "center", opacity: cuerpo }}>
        <svg width={h * 0.17} height={h * 0.17} viewBox="0 0 24 24"><path d="M12 20V4M5 11l7-7 7 7" stroke="#1A1A24" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};

// ───────────────────────── Cursor ─────────────────────────
/**
 * Flecha de ratón blanca con borde oscuro; la PUNTA va en (x, y). `ruta` = claves {t, x, y}: cada tramo con `curva`
 * (expo-out: entra y frena). `tClic` = se encoge un 12 % 0,08 s. Props: `ruta`, `tClic?`, `tam` (45), `curva`.
 */
export const Cursor: React.FC<{ ruta: { t: number; x: number; y: number }[]; tClic?: number; tam?: number; curva?: (x: number) => number }> = ({ ruta, tClic, tam = 45, curva = CURVAS.expo }) => {
  const t = useSeg();
  if (t < ruta[0].t) return null;
  let p = ruta[ruta.length - 1];
  for (let i = 0; i < ruta.length - 1; i++) {
    const a = ruta[i], b = ruta[i + 1];
    if (t <= b.t) { const k = curva(clamp01((t - a.t) / (b.t - a.t))); p = { t, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; break; }
  }
  const press = tClic !== undefined ? 1 - 0.12 * Math.max(0, 1 - Math.abs(t - tClic) / 0.08) : 1;
  const u = tam / 20;
  return (
    <svg style={{ position: "absolute", left: p.x - u, top: p.y - u, transformOrigin: `${u}px ${u}px`, transform: `scale(${press})`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))", overflow: "visible" }}
      width={tam} height={tam * 1.3} viewBox="0 0 20 26">
      <path d="M1 1 L1 20 L6 15.5 L9.5 24 L13 22.5 L9.6 14.2 L16 14.2 Z" fill="#F7F8FC" stroke="#2A2A33" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
};

// ───────────────────────── Estallido ─────────────────────────
/**
 * ESTALLIDO: asterisco de `rayos` rayos con puntas en chaflán, largos irregulares (±15 %) y cada rayo girando a su
 * ritmo (`respira` ± grados) sobre un giro medio de `giro` °/s. Color plano (bloque de color «golpe»).
 * Props: `x`, `y` (centro), `rayos` (12), `R` (630, punta más larga), `grosor` (75), `nucleo` (142), `color`, `giro` (12),
 * `respira` (3), `semilla` (3), `t0` (referencia del giro).
 */
export const Estallido: React.FC<{ x: number; y: number; rayos?: number; R?: number; grosor?: number; nucleo?: number; color?: string; giro?: number; respira?: number; semilla?: number; t0?: number }> = ({
  x, y, rayos = 12, R = 630, grosor = 75, nucleo = 142, color = "#DB7B61", giro = 12, respira = 3, semilla = 3, t0 = 0,
}) => {
  const t = useSeg() - t0;
  const rnd = (i: number, k: number) => { const v = Math.sin((i + 1) * 12.9898 * (k + semilla)) * 43758.5453; return v - Math.floor(v); };
  return (
    <svg width={2 * R} height={2 * R} viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} style={{ position: "absolute", left: x - R, top: y - R, overflow: "visible" }}>
      <circle r={nucleo} fill={color} />
      {Array.from({ length: rayos }, (_, i) => {
        const a0 = (i * 360) / rayos + (rnd(i, 1) - 0.5) * 10;
        const a = a0 + giro * t + respira * Math.sin(t * (1.1 + rnd(i, 2)) + i);
        const L = R * (0.85 + 0.15 * rnd(i, 3)), g = grosor * (0.9 + 0.2 * rnd(i, 4)), ch = g * 0.35;
        return <path key={i} transform={`rotate(${a.toFixed(2)})`} fill={color} d={`M0,${-g / 2} L${L - ch},${-g / 2} L${L},${-g / 2 + ch} L${L},${g / 2} L0,${g / 2} Z`} />;
      })}
    </svg>
  );
};

// ───────────────────────── Mosaico ─────────────────────────
export type PanelMosaico = { x: number; y: number; w: number; h: number; fondo: string; contenido?: React.ReactNode };
/**
 * MOSAICO: lienzo de paneles de tamaños libres separados por CANALES sólidos (el color de fondo, blanco por defecto,
 * es el canal: deja huecos de 30–50 px entre paneles) recorrido por la cámara (subida + paneo). Cada panel recorta su
 * contenido (coordenadas del panel). `camara` = claves de `Camara2D` o una función t → {x, y, s} (pistas separadas).
 * Props: `paneles`, `camara`, `colorHueco` ("#FFFFFF").
 */
export const Mosaico: React.FC<{ paneles: PanelMosaico[]; camara: ClaveCamara2D[] | ((t: number) => { x: number; y: number; s: number }); colorHueco?: string }> = ({ paneles, camara, colorHueco = "#FFFFFF" }) => {
  const t = useSeg();
  const contenido = paneles.map((p, i) => (
    <div key={i} style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, background: p.fondo, overflow: "hidden" }}>{p.contenido}</div>
  ));
  if (typeof camara === "function") {
    const c = camara(t);
    return (
      <AbsoluteFill style={{ background: colorHueco, overflow: "hidden" }}>
        <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${c.s}) translate(${-c.x}px, ${-c.y}px)` }}>{contenido}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ background: colorHueco }}><Camara2D claves={camara}>{contenido}</Camara2D></AbsoluteFill>;
};

// ───────────────────────── RedNodos ─────────────────────────
export type NodoRed = { x: number; y: number; icono: React.ReactNode };
/**
 * RED DE NODOS («se conecta con todas tus apps»): desde una pieza central de `w`×`h` centrada en (`x`, `y`) salen
 * conectores que SE DIBUJAN hacia fuera (`t0`, `durLinea`): los nodos de arriba/abajo con un CODO EN S que sale
 * vertical de la pieza; los laterales con un tronco horizontal de 45 px que se BIFURCA EN Y. Cada nodo: aro fino con
 * un hueco donde entra el conector (se dibuja primero) y el icono que entra desenfocado → nítido con escala 0,8 → 1
 * (`tIconos`, escalonados `cada` s). Posiciones de los nodos relativas al centro.
 * Props: `x`, `y`, `w`, `h`, `nodos`, `t0`, `durLinea` (0,25), `tIconos`, `cada` (0,03), `aro` (Ø 170), `colorLinea`,
 * `colorAro`, `fondoAro`, `grosor` (2), `escalaIcono` (1).
 */
export const RedNodos: React.FC<{
  x: number; y: number; w: number; h: number; nodos: NodoRed[]; t0: number; durLinea?: number; tIconos?: number; cada?: number;
  aro?: number; colorLinea?: string; colorAro?: string; fondoAro?: string; grosor?: number; escalaIcono?: number;
}> = ({ x, y, w, h, nodos, t0, durLinea = 0.25, tIconos, cada = 0.03, aro = 170, colorLinea = "#4A4A55", colorAro = "#5A5A66", fondoAro = "#0B0B10", grosor = 2, escalaIcono = 1 }) => {
  const t = useSeg();
  if (t < t0) return null;
  const k = tramo(t, t0, t0 + durLinea, CURVAS.expo);
  const ti = tIconos ?? t0 + durLinea + 0.05;
  const ra = aro / 2;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        {nodos.map((n, i) => {
          const vertical = Math.abs(n.y) > h / 2 + ra * 0.6 && Math.abs(n.x) < w / 2;
          let d: string, ang: number;
          if (vertical) {
            const s = Math.sign(n.y), x0 = n.x * 0.73, y0 = (s * h) / 2, yE = n.y - s * ra, y1 = y0 + s * 0.2 * Math.abs(yE - y0), y2 = yE - s * 0.2 * Math.abs(yE - y0), ym = (y1 + y2) / 2;
            d = `M${x0},${y0} L${x0},${y1} C${x0},${ym} ${n.x},${ym} ${n.x},${y2} L${n.x},${yE}`;
            ang = s > 0 ? -90 : 90;
          } else {
            const s = Math.sign(n.x) || 1, x0 = (s * w) / 2, xh = x0 + s * 45, xE = n.x - s * ra, dx = Math.abs(xE - xh);
            d = `M${x0},0 L${xh},0 C${xh + s * dx * 0.5},0 ${xE - s * dx * 0.5},${n.y} ${xE},${n.y}`;
            ang = s > 0 ? 180 : 0;
          }
          // aro con un hueco de ±14° donde entra el conector
          const kA = tramo(t, t0 + 0.05 + i * 0.01, t0 + 0.3 + i * 0.01, CURVAS.expo);
          const a0 = ((ang + 14) * Math.PI) / 180, span = (332 * kA * Math.PI) / 180, a1 = a0 + span;
          const arco = kA > 0 ? `M${n.x + ra * Math.cos(a0)},${n.y + ra * Math.sin(a0)} A${ra},${ra} 0 ${span > Math.PI ? 1 : 0} 1 ${n.x + ra * Math.cos(a1)},${n.y + ra * Math.sin(a1)}` : "";
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={colorLinea} strokeWidth={grosor} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
              <circle cx={n.x} cy={n.y} r={ra} fill={fondoAro} opacity={kA} />
              {arco && <path d={arco} fill="none" stroke={colorAro} strokeWidth={grosor * 0.9} />}
            </g>
          );
        })}
      </svg>
      {nodos.map((n, i) => {
        const ki = tramo(t, ti + i * cada, ti + i * cada + 0.2, CURVAS.expo);
        if (ki <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: n.x - ra * 0.55, top: n.y - ra * 0.55, width: ra * 1.1, height: ra * 1.1, display: "grid", placeItems: "center",
            opacity: ki, transform: `scale(${(0.8 + 0.2 * ki) * escalaIcono})`, filter: ki < 0.98 ? `blur(${(1 - ki) * 10}px)` : undefined }}>{n.icono}</div>
        );
      })}
    </div>
  );
};

// ───────────────────────── Roseton ─────────────────────────
/** Marca genérica de contorno grueso: `lobulos` bucles redondeados entrelazados alrededor de un centro (x, y), radio
 *  `R`, trazo `grosor`, `color` del trazo y `fondo` (el del panel: tapa los cruces y da el entrelazado), `giro`. */
export const Roseton: React.FC<{ x: number; y: number; R: number; grosor?: number; color?: string; fondo?: string; lobulos?: number; giro?: number }> = ({ x, y, R, grosor = 30, color = "#FFFFFF", fondo = "#000000", lobulos = 6, giro = 0 }) => {
  const L = R * 1.05, A = R * 0.46;
  return (
    <svg width={2 * R} height={2 * R} viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} style={{ position: "absolute", left: x - R, top: y - R, overflow: "visible" }}>
      {Array.from({ length: lobulos }, (_, i) => (
        <rect key={i} x={-A * 0.15} y={-A - R * 0.08} width={L - grosor / 2} height={A} rx={A / 2} transform={`rotate(${giro + (i * 360) / lobulos})`}
          fill={fondo} stroke={color} strokeWidth={grosor} />
      ))}
    </svg>
  );
};

// ───────────────────────── FondoCristal ─────────────────────────
/** Mancha de luz: centro (x, y) y radio r en px de pantalla; `a` opacidad; deriva `vx`/`vy` (px/s) + vaivén `amp` px. */
export type ManchaCristal = { x: number; y: number; r: number; color: string; a?: number; vx?: number; vy?: number; amp?: number };
/** Escena de fondo: desde `t`, color `fondo` y sus manchas; `fundido` s de mezcla con la anterior (0 = cambia al corte). */
export type EscenaFondo = { t: number; fondo: string; manchas: ManchaCristal[]; fundido?: number };
/**
 * Fondo de MANCHAS DE COLOR POR ESCENA: luces enormes y suaves (degradados radiales, sin `filter`) que derivan siempre
 * (≈100–200 px/s) y cambian de color en cada corte. Permite planos y logos quietos sin «diapositiva».
 * Props: `escenas` (ordenadas por t), `vaiven` (velocidad del vaivén, rad/s, 1,1).
 */
export const FondoCristal: React.FC<{ escenas: EscenaFondo[]; vaiven?: number }> = ({ escenas, vaiven = 1.1 }) => {
  const t = useSeg();
  let i = 0;
  while (i < escenas.length - 1 && t >= escenas[i + 1].t) i++;
  const capa = (e: EscenaFondo, op: number, key: string) => {
    const dt = t - e.t;
    const bg = e.manchas.map((m, j) => {
      const amp = m.amp ?? 50;
      const mx = m.x + (m.vx ?? 0) * dt + amp * Math.sin(t * vaiven * (0.7 + 0.13 * j) + j * 1.9);
      const my = m.y + (m.vy ?? 0) * dt + amp * 0.8 * Math.cos(t * vaiven * (0.55 + 0.11 * j) + j * 2.7);
      const a = m.a ?? 1;
      return `radial-gradient(circle ${m.r.toFixed(0)}px at ${mx.toFixed(1)}px ${my.toFixed(1)}px, ${conAlfa(m.color, a)} 0%, ${conAlfa(m.color, a * 0.55)} 40%, ${conAlfa(m.color, 0)} 100%)`;
    });
    return <AbsoluteFill key={key} style={{ background: [...bg, e.fondo].join(", "), opacity: op }} />;
  };
  const e = escenas[i];
  const f = e.fundido ? tramo(t, e.t, e.t + e.fundido, CURVAS.inOut) : 1;
  return (
    <AbsoluteFill>
      {f < 1 && i > 0 ? capa(escenas[i - 1], 1, "a") : null}
      {capa(e, f, "b")}
    </AbsoluteFill>
  );
};
