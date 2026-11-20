// Base común · TALLER: técnicas del «reel de principios de animación hecho en código» (análisis a-fondo-reel-pantalla).
// El vídeo enseña la herramienta con la que está hecho: letras con coreografía propia, tracking que respira, estallido
// que conserva una letra, bola con squash & stretch, la escena metida en su editor de curvas (la curva que se ve es la
// que mueve la pieza), cadena de morphs de interfaz, disco que llena la pantalla, mosaico de tarjetas vivas, contador
// con rodillo y una cifra que se convierte en la letra del logo. Todo en tiempo de la secuencia (useSeg).
import React, { useMemo } from "react";
import { spring, useVideoConfig } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, pchip, tramo, useSeg } from "./tiempo";
import { anchoTexto, mezclaColor } from "./efectos-2";

// ───────── ayudantes ─────────
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const cl01 = (x: number) => Math.max(0, Math.min(1, x));

/** Cuerpo de letra para que `texto` mida `ancho` px con esa fuente y peso. */
export const tamParaAncho = (texto: string, fuente: string, peso: number, ancho: number) => (ancho / Math.max(1, anchoTexto(texto, fuente, peso, 100))) * 100;

/** Valor de un muelle de Remotion (0 → 1, con su sobrepaso real) a los `s` segundos de soltarlo. */
export const valorMuelle = (s: number, fps: number, stiffness: number, damping: number, mass = 1) =>
  s <= 0 ? 0 : spring({ frame: s * fps, fps, config: { stiffness, damping, mass } });

/** Desenfoque direccional SVG (estela): úsalo con `filter: url(#id)`. */
const FiltroDir: React.FC<{ id: string; bx: number; by: number }> = ({ id, bx, by }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={`${bx.toFixed(1)} ${by.toFixed(1)}`} /></filter>
  </svg>
);
const idSeguro = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "");

// ───────── 1–3 · palabra de letras sueltas: coreografía, tracking que respira, estallido ─────────
export type EntradaLetra = "arriba" | "abajo" | "cae-girada" | "raya" | "punto" | "lateral" | "ninguna";
/** Clave del ancho de la palabra: `ancho` relativo al natural (0,7 = tracking cerrado; 1,23 = abierto). `curva` = la del tramo que acaba aquí. */
export type ClaveAncho = { t: number; ancho: number; curva?: (x: number) => number };
export type PropsPalabraLetras = {
  texto: string;
  /** centro de la palabra (y = centro de las mayúsculas) */
  x?: number; y?: number; tam: number; peso?: number; fuente?: string; color?: string;
  /** cada letra entra a su manera: `entradas[i]`, arranque `inicios[i]` (o t0 + i·escalon), duración `durs[i]` (o dur) */
  entrada?: { t0: number; entradas: EntradaLetra[]; escalon?: number; inicios?: number[]; dur?: number; durs?: number[]; sobrepaso?: number; estela?: boolean };
  /** tracking que respira: claves de ancho relativo (con estela horizontal proporcional a la velocidad) */
  respira?: ClaveAncho[];
  /** volteo en ola (rotateX) de izquierda a derecha */
  volteo?: { t0: number; escalon?: number; dur?: number; giro?: number };
  /** eco en contorno detrás, con el ancho multiplicado por `factor` */
  eco?: { t0: number; t1: number; grosor?: number; opacidad?: number; factor?: number; color?: string; letraAcento?: number; colorAcento?: string };
  /** todas las letras salen despedidas salvo `conserva`, que pasa a `colorConserva` y viaja a `hacia` */
  estallido?: { t0: number; conserva: number; dur?: number; colorConserva?: string; hacia?: { x: number; y: number }; durConserva?: number; desenfoque?: number; desvios?: { x: number; y: number; rz?: number }[]; fuerza?: number };
  /** a partir de aquí no se pinta (la letra conservada la sustituye el objeto siguiente) */
  ocultaEn?: number;
};

const anchoEn = (cl: ClaveAncho[] | undefined, t: number) => {
  if (!cl?.length) return 1;
  if (t <= cl[0].t) return cl[0].ancho;
  for (let i = 1; i < cl.length; i++) if (t < cl[i].t) return lerp(cl[i - 1].ancho, cl[i].ancho, (cl[i].curva ?? CURVAS.inOut)((t - cl[i - 1].t) / Math.max(1e-6, cl[i].t - cl[i - 1].t)));
  return cl[cl.length - 1].ancho;
};

/**
 * Palabra de letras sueltas con todas las técnicas del taller combinables (es la base de `LetrasCoreografia`,
 * `TrackingRespira` y `EstallidoLetras`). Las letras se colocan con su ancho real (`anchoTexto`).
 */
export const PalabraLetras: React.FC<PropsPalabraLetras> = (p) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const est = useEstilo();
  const base = idSeguro(React.useId());
  if (p.ocultaEn !== undefined && t >= p.ocultaEn) return null;
  const fuente = p.fuente ?? est.fuente, peso = p.peso ?? 900, color = p.color ?? est.texto;
  const letras = Array.from(p.texto);
  const n = letras.length;
  const adv = letras.map((ch) => anchoTexto(ch, fuente, peso, p.tam));
  const Wn = adv.reduce((s, a) => s + a, 0);
  const centros = (rel: number) => {
    const ls = n > 1 ? (rel * Wn - Wn) / (n - 1) : 0;
    let x = (p.x ?? 960) - (Wn + ls * (n - 1)) / 2;
    return adv.map((a) => { const c = x + a / 2; x += a + ls; return c; });
  };
  const cx = centros(anchoEn(p.respira, t)), cxPrev = centros(anchoEn(p.respira, t - 1 / fps));
  const y = p.y ?? 540;
  const e = p.entrada, v = p.volteo, x = p.estallido;

  const entradaDe = (i: number, tt: number) => {
    const out = { dx: 0, dy: 0, rz: 0, sx: 1, sy: 1, blur: 0, o: 1, origen: "50% 50%" };
    if (!e) return out;
    const tipo = e.entradas[i] ?? "ninguna";
    const ti = e.inicios?.[i] ?? e.t0 + i * (e.escalon ?? 0.05);
    const d = e.durs?.[i] ?? e.dur ?? 0.14;
    if (tipo === "ninguna") { out.o = tt >= ti ? 1 : 0; return out; }
    if (tt < ti) { out.o = 0; return out; }
    const k = tramo(tt, ti, ti + d, CURVAS.expo);
    out.o = Math.min(1, k * 4);
    if (tipo === "arriba") out.dy = -(1 - k) * 700;
    else if (tipo === "abajo") { out.dy = (1 - k) * 160; out.sx = out.sy = 0.4 + 0.6 * k; out.blur = (1 - k) * 10; }
    else if (tipo === "cae-girada") { out.dx = (1 - k) * 260; out.dy = -(1 - k) * 520; out.rz = -25 * (1 - k); }
    else if (tipo === "raya") { out.sy = Math.max(0.02, k); out.origen = "50% 86%"; out.o = 1; }
    else if (tipo === "punto") {
      const sp = spring({ frame: (tt - ti) * fps, fps, config: { stiffness: 300, damping: 17 } });
      const lim = e.sobrepaso ?? 0.15;
      const s = sp <= 1 ? sp : 1 + lim * (1 - Math.exp(-(sp - 1) / lim));
      out.sx = out.sy = Math.max(0.05, s); out.o = 1;
    } else if (tipo === "lateral") out.dx = (1 - k) * 700;
    return out;
  };

  const caja = (i: number) => {
    const a = entradaDe(i, t), b = entradaDe(i, t - 1 / fps);
    let bx = (e?.estela ?? true) ? Math.abs(a.dx - b.dx) * 0.5 : 0;
    let by = (e?.estela ?? true) ? Math.abs(a.dy - b.dy) * 0.5 : 0;
    bx += Math.abs(cx[i] - cxPrev[i]) * 0.5;
    let px = cx[i] + a.dx, py = y + a.dy, rz = a.rz, o = a.o, col = color;
    const rx = v ? (v.giro ?? 360) * tramo(t, v.t0 + i * (v.escalon ?? 0.05), v.t0 + i * (v.escalon ?? 0.05) + (v.dur ?? 0.2), CURVAS.inOut) : 0;
    if (x && t >= x.t0) {
      if (i === x.conserva) {
        col = mezclaColor(color, x.colorConserva ?? est.acento, tramo(t, x.t0, x.t0 + 0.067, CURVAS.lineal));
        if (x.hacia) { const kc = tramo(t, x.t0, x.t0 + (x.durConserva ?? 0.25)); px = lerp(px, x.hacia.x, kc); py = lerp(py, x.hacia.y, kc); }
      } else {
        const kE = tramo(t, x.t0, x.t0 + (x.dur ?? 0.17), CURVAS.acelera);
        const lado = Math.sign(i - x.conserva) || 1, f = x.fuerza ?? 900;
        const dv = x.desvios?.[i] ?? { x: lado * f * (0.6 + 0.2 * Math.abs(i - x.conserva)), y: -f * 0.25 * (((i * 37) % 5) / 5), rz: lado * 30 };
        px += dv.x * kE; py += dv.y * kE; rz += (dv.rz ?? 0) * kE; o *= 1 - kE;
        const L = Math.hypot(dv.x, dv.y) || 1, des = (x.desenfoque ?? 60) * kE;
        bx += (des * Math.abs(dv.x)) / L; by += (des * Math.abs(dv.y)) / L;
      }
    }
    return { px, py, rz, rx, o, col, bx: Math.min(60, bx), by: Math.min(60, by), a };
  };

  const ec = p.eco;
  const ecoO = ec ? (ec.opacidad ?? 0.5) * Math.min(tramo(t, ec.t0, ec.t0 + 0.1), 1 - tramo(t, ec.t1, ec.t1 + 0.12, CURVAS.acelera)) : 0;
  const cxEco = ec ? centros(anchoEn(p.respira, t) * (ec.factor ?? 1.25)) : [];
  const estiloLetra: React.CSSProperties = { position: "absolute", fontFamily: fuente, fontWeight: peso, fontSize: p.tam, lineHeight: 1, whiteSpace: "pre" };
  return (
    <>
      {ecoO > 0.003 && letras.map((ch, i) => (
        <span key={`e${i}`} style={{ ...estiloLetra, left: cxEco[i], top: y, transform: "translate(-50%, -50%)", color: "transparent", opacity: ecoO * (entradaDe(i, t).o),
          WebkitTextStroke: `${ec!.grosor ?? 2}px ${i === ec!.letraAcento ? (ec!.colorAcento ?? est.acento) : (ec!.color ?? "#FFFFFF")}` }}>{ch}</span>
      ))}
      {letras.map((ch, i) => {
        const c = caja(i);
        if (c.o <= 0.003) return null;
        const id = `${base}l${i}`;
        const dir = c.bx > 0.4 || c.by > 0.4;
        return (
          <span key={i} style={{ ...estiloLetra, left: c.px, top: c.py, color: c.col, opacity: Math.min(1, c.o), transformOrigin: c.a.origen,
            transform: `translate(-50%, -50%) perspective(900px) rotateX(${c.rx}deg) rotate(${c.rz}deg) scale(${c.a.sx}, ${c.a.sy})`,
            filter: [dir ? `url(#${id})` : "", c.a.blur > 0.2 ? `blur(${c.a.blur.toFixed(1)}px)` : ""].join(" ").trim() || undefined }}>
            {dir && <FiltroDir id={id} bx={c.bx} by={c.by} />}
            {ch}
          </span>
        );
      })}
    </>
  );
};

/** Cada letra con su propia entrada (cae, sube, cae girada, crece de una raya, crece de un punto con sobrepaso, llega lateral). */
export const LetrasCoreografia: React.FC<Omit<PropsPalabraLetras, "respira" | "volteo" | "eco" | "estallido"> & { entrada: NonNullable<PropsPalabraLetras["entrada"]> }> = (p) => <PalabraLetras {...p} />;
/** Tracking que se cierra y se abre (claves de ancho relativo), con volteo en ola y eco en contorno opcionales. */
export const TrackingRespira: React.FC<Omit<PropsPalabraLetras, "estallido"> & { respira: ClaveAncho[] }> = (p) => <PalabraLetras {...p} />;
/** Todas las letras salen despedidas con desenfoque salvo una, que cambia a acento y viaja a `hacia` (objeto puente). */
export const EstallidoLetras: React.FC<PropsPalabraLetras & { estallido: NonNullable<PropsPalabraLetras["estallido"]> }> = (p) => <PalabraLetras {...p} />;

// ───────── 4 · bola con squash & stretch ─────────
export type PropsBola = {
  /** posición de partida (centro) */
  desde: { x: number; y: number };
  /** nace de un anillo (la «O» de una palabra) que se rellena y encoge */
  nace?: { t0: number; dur?: number; diametro: number; grosor?: number };
  diametro: number; color?: string; suelo: number;
  anticipa?: { t0: number; dy: number; dur: number };
  caida: { t0: number; t1: number };
  /** instantes de contacto (s), uno por pulso; el primero = caida.t1 */
  contactos: number[];
  /** altura del ápice (px) y avance horizontal (px/s) */
  altura: number; avance: number;
  /** bote pequeño tras el último contacto grande */
  ultimo?: { t1: number; altura: number };
  /** rueda y frena hasta `hastaX` */
  rueda?: { t1: number; hastaX: number };
  /** después salta a `hastaX` con un muelle (stiffness/damping de Remotion) */
  despues?: { t0: number; hastaX: number; stiffness?: number; damping?: number };
  /** estiramiento al ir rápido [alto, ancho] y aplastamiento en el contacto [ancho, alto] */
  estira?: [number, number]; aplasta?: [number, number]; durAplasta?: number;
  rastro?: boolean; paso?: number; marca?: boolean; colorRastro?: string; colorMarca?: string;
  /** opacidad del rastro y marcas (para apagarlos) */
  opacidadRastro?: number;
  /** a partir de aquí la bola no se pinta (la sustituye otro objeto) */
  ocultaEn?: number;
  brillo?: string;
};

/** Trayectoria (centro) de `BolaRebote` en el instante t: úsala para encadenar otros objetos o mostrar el valor. */
export const trayectoriaBola = (p: PropsBola, fps: number) => {
  const yRest = p.suelo - p.diametro / 2;
  const x0 = p.desde.x, y0 = p.desde.y;
  const yTop = y0 - (p.anticipa?.dy ?? 0);
  const cs = p.contactos;
  const xc = (tc: number) => x0 + p.avance * (tc - cs[0]);
  const base = (t: number): { x: number; y: number } => {
    let x = x0, y = y0;
    if (p.anticipa && t >= p.anticipa.t0) y = y0 - p.anticipa.dy * tramo(t, p.anticipa.t0, p.anticipa.t0 + p.anticipa.dur, CURVAS.suave);
    if (t >= p.caida.t0) { const u = cl01((t - p.caida.t0) / (p.caida.t1 - p.caida.t0)); y = yTop + (yRest - yTop) * u * u; }
    for (let i = 0; i < cs.length; i++) {
      if (t < cs[i]) break;
      const sig = i + 1 < cs.length ? cs[i + 1] : p.ultimo?.t1;
      const h = i + 1 < cs.length ? p.altura : p.ultimo?.altura ?? 0;
      if (sig !== undefined && t < sig) { const u = (t - cs[i]) / (sig - cs[i]); return { x: xc(cs[i]) + p.avance * (t - cs[i]), y: yRest - 4 * h * u * (1 - u) }; }
      x = xc(sig ?? cs[i]); y = yRest;
    }
    if (p.rueda && p.ultimo && t >= p.ultimo.t1) x = lerp(xc(p.ultimo.t1), p.rueda.hastaX, tramo(t, p.ultimo.t1, p.rueda.t1, CURVAS.suave));
    return { x, y };
  };
  return (t: number) => {
    const d = p.despues;
    if (d && t >= d.t0) {
      const a = base(d.t0);
      return { x: lerp(a.x, d.hastaX, valorMuelle(t - d.t0, fps, d.stiffness ?? 180, d.damping ?? 12)), y: yRest };
    }
    return base(t);
  };
};

/**
 * Bola que bota al pulso con squash & stretch (estira con la velocidad, aplasta en el contacto), rastro de puntos que
 * se queda dibujado y un rombo en cada contacto. Coordenadas de pantalla (o de la escena que la contiene).
 */
export const BolaRebote: React.FC<PropsBola> = (p) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const est = useEstilo();
  const pos = useMemo(() => trayectoriaBola(p, fps), [JSON.stringify(p), fps]); // eslint-disable-line react-hooks/exhaustive-deps
  const color = p.color ?? est.acento;
  const t0 = p.nace?.t0 ?? p.caida.t0;
  const fin = (p.despues ? p.despues.t0 + 1.5 : (p.rueda?.t1 ?? p.contactos[p.contactos.length - 1]) + 0.2);
  // rastro: un punto cada `paso` px de recorrido (precalculado, determinista)
  const puntos = useMemo(() => {
    if (!p.rastro) return [] as { x: number; y: number; t: number }[];
    const out: { x: number; y: number; t: number }[] = [];
    const paso = p.paso ?? 15;
    let prev = pos(p.caida.t0), acum = 0;
    for (let tt = p.caida.t0; tt <= fin; tt += 1 / 480) {
      const q = pos(tt);
      acum += Math.hypot(q.x - prev.x, q.y - prev.y);
      if (acum >= paso) { out.push({ ...q, t: tt }); acum = 0; }
      prev = q;
    }
    return out;
  }, [pos, p.rastro, p.paso, p.caida.t0, fin]);
  if (t < t0) return null;
  const q = pos(t), qa = pos(t - 1 / fps);
  const vy = (q.y - qa.y) * fps;
  const contactos = [...p.contactos, ...(p.ultimo ? [p.ultimo.t1] : [])];
  let sx = 1, sy = 1;
  const [ea, eb] = p.estira ?? [1.3, 0.85];
  const s = cl01(Math.abs(vy) / 1800);
  sy = 1 + (ea - 1) * s; sx = 1 + (eb - 1) * s;
  const [ax, ay] = p.aplasta ?? [1.1, 0.9];
  for (const c of contactos) {
    const u = (t - c) / (p.durAplasta ?? 0.05);
    if (u >= 0 && u < 1) { const k = 1 - u; sx = lerp(1, ax, k); sy = lerp(1, ay, k); }
  }
  let d = p.diametro, relleno = 1;
  if (p.nace && t < p.nace.t0 + (p.nace.dur ?? 0.2)) {
    const k = tramo(t, p.nace.t0, p.nace.t0 + (p.nace.dur ?? 0.2));
    d = lerp(p.nace.diametro, p.diametro, k);
    relleno = lerp(p.nace.grosor ?? 0.27, 1, k);
  }
  const rin = Math.max(0, (1 - 2 * relleno) * 100);
  const oR = p.opacidadRastro ?? 1;
  const visible = p.ocultaEn === undefined || t < p.ocultaEn;
  return (
    <>
      {oR > 0.003 && puntos.filter((pt) => pt.t <= t).map((pt, i) => (
        <div key={i} style={{ position: "absolute", left: pt.x - 2, top: pt.y - 2, width: 4, height: 4, borderRadius: 2, background: p.colorRastro ?? "rgba(255,255,255,0.8)", opacity: oR }} />
      ))}
      {oR > 0.003 && p.marca && contactos.filter((c) => c <= t).map((c, i) => {
        const m = pos(c);
        return <div key={`m${i}`} style={{ position: "absolute", left: m.x - 10, top: m.y - 10, width: 20, height: 20, boxSizing: "border-box", border: `2.5px solid ${p.colorMarca ?? color}`, transform: "rotate(45deg)", opacity: oR }} />;
      })}
      {visible && (
        <div style={{ position: "absolute", left: q.x - d / 2, top: q.y - d / 2 + ((1 - sy) * d) / 2 * (sy < 1 ? 1 : 0), width: d, height: d, borderRadius: "50%",
          background: rin > 0.5 ? `radial-gradient(circle closest-side, transparent ${rin}%, ${color} ${rin + 1}%)` : color,
          boxShadow: relleno >= 0.99 ? `0 0 40px ${p.brillo ?? color}` : undefined, transform: `scale(${sx}, ${sy})` }} />
      )}
    </>
  );
};

// ───────── 5 · ventana de editor + editor de curvas ─────────
/**
 * Marco de una ventana de editor (borde, cabecera mono con archivo, pestañas y código de tiempo que corre).
 * `parte="fondo"` pinta el cuerpo (detrás del visor) y `parte="marco"` el borde y la cabecera (encima).
 */
export const VentanaEditor: React.FC<{ x: number; y: number; ancho: number; alto: number; parte: "fondo" | "marco"; archivo?: string; pestanas?: string[]; activa?: number;
  tiempo: number; fps?: number; total?: number; opacidad?: number; altoCabecera?: number; radio?: number; fuente?: string; acento?: string }> = (p) => {
  const est = useEstilo();
  const o = p.opacidad ?? 1;
  if (o <= 0.003) return null;
  const r = p.radio ?? 18, hc = p.altoCabecera ?? 44;
  const caja: React.CSSProperties = { position: "absolute", left: p.x, top: p.y, width: p.ancho, height: p.alto, borderRadius: r, opacity: o, boxSizing: "border-box" };
  if (p.parte === "fondo") return <div style={{ ...caja, background: "#1A1A1C", boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }} />;
  const fps = p.fps ?? 60, total = p.total ?? 900;
  const mono: React.CSSProperties = { fontFamily: p.fuente ?? est.fuente2 ?? "monospace", fontSize: 15, color: "rgba(255,255,255,0.55)", whiteSpace: "pre" };
  return (
    <div style={{ ...caja, border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: hc, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", boxSizing: "border-box" }}>
        <div style={mono}>
          <span style={{ color: p.acento ?? est.acento }}>● </span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>{p.archivo ?? "escena.html"}</span>
          {(p.pestanas ?? ["Viewport", "Graph"]).map((s, i) => <span key={i} style={{ marginLeft: 26, color: i === p.activa ? "rgba(255,255,255,0.9)" : undefined }}>{s}</span>)}
        </div>
        <div style={mono}>
          {`t ${Math.max(0, p.tiempo).toFixed(3)} s    frame ${Math.round(Math.max(0, p.tiempo) * fps)} / ${total}    `}
          <span style={{ color: "rgba(255,255,255,0.9)" }}>{fps} fps</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Editor de curvas: lista de propiedades (la activa con su valor en acento) y gráfica cuya curva se dibuja como recta
 * y se transforma en la del MUELLE (calculada con el mismo `spring()` que mueve la pieza), con claves en rombo,
 * tiradores huecos, cabezal de acento y etiqueta (`linear` → `spring(k, d)`). Coordenadas internas del panel.
 */
export const EditorCurvas: React.FC<{ x: number; y: number; ancho: number; alto: number; propiedades: string[]; activa?: number; valor?: string;
  muelle: { stiffness: number; damping: number; mass?: number; dur: number }; dibuja: { t0: number; dur: number }; cambio: { t0: number; dur: number };
  cabezal?: { t0: number; t1: number }; grafica?: { x: number; base: number; ancho: number; escala: number }; tiradoresMuelle?: [[number, number], [number, number]];
  opacidad?: number; transform?: string; filtro?: string; fuente?: string; acento?: string }> = (p) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const est = useEstilo();
  const o = p.opacidad ?? 1;
  if (o <= 0.003) return null;
  const ac = p.acento ?? est.acento;
  const g = p.grafica ?? { x: 290, base: 240, ancho: 695, escala: 161 };
  const kd = tramo(t, p.dibuja.t0, p.dibuja.t0 + p.dibuja.dur, CURVAS.inOut);
  const kc = tramo(t, p.cambio.t0, p.cambio.t0 + p.cambio.dur, CURVAS.expo);
  const m = p.muelle;
  const val = (u: number) => lerp(u, valorMuelle(u * m.dur, fps, m.stiffness, m.damping, m.mass ?? 1), kc);
  const P = (u: number, v: number) => [g.x + u * g.ancho, g.base - v * g.escala] as const;
  const N = 90, pts: string[] = [];
  for (let i = 0; i <= N; i++) { const u = (i / N) * kd; const [a, b] = P(u, val(u)); pts.push(`${a.toFixed(1)},${b.toFixed(1)}`); }
  const [tm1, tm2] = p.tiradoresMuelle ?? [[0.096, 1.28], [0.76, 1.01]];
  const h1 = P(lerp(1 / 3, tm1[0], kc), lerp(1 / 3, tm1[1], kc)), h2 = P(lerp(2 / 3, tm2[0], kc), lerp(2 / 3, tm2[1], kc));
  const ini = P(0, 0), fin = P(1, val(1));
  const kh = p.cabezal ? tramo(t, p.cabezal.t0, p.cabezal.t1, CURVAS.lineal) : 0;
  const hx = g.x + kh * g.ancho;
  const mono = p.fuente ?? est.fuente2 ?? "monospace";
  const rombo = (x: number, y: number, c: string, s = 13) => <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={c} transform={`rotate(45 ${x} ${y})`} />;
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, width: p.ancho, height: p.alto, borderRadius: 14, background: "#151617", border: "1px solid rgba(255,255,255,0.07)", boxSizing: "border-box",
      opacity: o, transform: p.transform, transformOrigin: "50% 0%", filter: p.filtro, overflow: "hidden" }}>
      {p.propiedades.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: 26, top: 30 + i * 44, fontFamily: mono, fontSize: 14, whiteSpace: "pre", color: i === (p.activa ?? 0) ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)" }}>
          <span style={{ color: i === (p.activa ?? 0) ? ac : undefined }}>{i === (p.activa ?? 0) ? "◆" : "◇"}</span> {s}
          {i === (p.activa ?? 0) && p.valor && <span style={{ color: ac, marginLeft: 14 }}>{p.valor}</span>}
        </div>
      ))}
      <svg width={p.ancho} height={p.alto} style={{ position: "absolute", left: 0, top: 0 }}>
        {[0, 1, 2, 3, 4].map((i) => <line key={`v${i}`} x1={g.x + (i * g.ancho) / 4} x2={g.x + (i * g.ancho) / 4} y1={20} y2={p.alto - 20} stroke="rgba(255,255,255,0.05)" />)}
        {[0, 1, 2].map((i) => <line key={`h${i}`} x1={g.x} x2={g.x + g.ancho} y1={g.base - (i * g.escala) / 1.5 - 4} y2={g.base - (i * g.escala) / 1.5 - 4} stroke="rgba(255,255,255,0.05)" />)}
        {kd > 0.98 && kh < 1 && <><rect x={hx - 16} y={14} width={16} height={p.alto - 28} fill={`${ac}22`} /><line x1={hx} x2={hx} y1={14} y2={p.alto - 14} stroke={ac} strokeWidth={2} /></>}
        {kd > 0 && <polyline points={pts.join(" ")} fill="none" stroke="#F7F5EE" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
        {kd > 0.98 && <>
          <line x1={ini[0]} y1={ini[1]} x2={h1[0]} y2={h1[1]} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
          <line x1={fin[0]} y1={fin[1]} x2={h2[0]} y2={h2[1]} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
          <circle cx={h1[0]} cy={h1[1]} r={6} fill="none" stroke="#FFFFFF" strokeWidth={2} />
          <circle cx={h2[0]} cy={h2[1]} r={6} fill="none" stroke="#FFFFFF" strokeWidth={2} />
          {rombo(fin[0], fin[1], "#FFFFFF")}
        </>}
        {kd > 0 && rombo(ini[0], ini[1], ac)}
      </svg>
      <div style={{ position: "absolute", left: g.x + g.ancho - 230, top: g.base + 4, width: 230, textAlign: "right", fontFamily: mono, fontSize: 15, whiteSpace: "pre" }}>
        <span style={{ position: "absolute", right: 0, color: "rgba(255,255,255,0.55)", opacity: (1 - kc) * kd }}>linear</span>
        <span style={{ position: "absolute", right: 0, color: ac, opacity: kc }}>{`spring(${m.stiffness}, ${m.damping})`}</span>
      </div>
    </div>
  );
};

// ───────── 6 · interruptor ─────────
/**
 * Interruptor que nace de una píldora (`desde`), hace clic (el botón corre estirándose y la pista pasa a `colorOn`) y
 * se recoge en un círculo de `diametroRecoge` con el botón convertido en un punto. Centro (x, y).
 */
export const Interruptor: React.FC<{ t0: number; x: number; y: number; desde?: { w: number; h: number; color: string }; durNace?: number; ancho?: number; alto?: number;
  colorOff?: string; colorOn?: string; colorBoton?: string; tClic: number; durClic?: number; estiraBoton?: number; tRecoge?: number; durRecoge?: number; diametroRecoge?: number; punto?: number; hasta?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < p.t0 || (p.hasta !== undefined && t > p.hasta)) return null;
  const W = p.ancho ?? 441, H = p.alto ?? 228, on = p.colorOn ?? est.acento, off = p.colorOff ?? "rgba(255,255,255,0.25)";
  const kn = tramo(t, p.t0, p.t0 + (p.durNace ?? 0.1));
  const kclic = tramo(t, p.tClic, p.tClic + (p.durClic ?? 0.133), CURVAS.inOut);
  const kcol = tramo(t, p.tClic, p.tClic + 0.1, CURVAS.lineal);
  const kr = p.tRecoge !== undefined ? tramo(t, p.tRecoge, p.tRecoge + (p.durRecoge ?? 0.167), CURVAS.inOut) : 0;
  const D = p.diametroRecoge ?? 292;
  const w0 = p.desde?.w ?? W, h0 = p.desde?.h ?? H;
  const w = lerp(lerp(w0, W, kn), D, kr), h = lerp(lerp(h0, H, kn), D, kr);
  const pad = (H - 180) / 2;
  const dB = lerp(lerp(40, H - 2 * pad, kn), p.punto ?? 30, kr);
  const xIzq = -w / 2 + pad + dB / 2, xDer = w / 2 - pad - dB / 2;
  const bx = lerp(lerp(xIzq, xDer, kclic), 0, kr);
  const estira = 1 + ((p.estiraBoton ?? 1.3) - 1) * Math.sin(Math.PI * kclic);
  // color: píldora (desde.color) → apagado → encendido (acento)
  const fondo = kcol > 0 ? (kcol >= 1 ? on : `color-mix(in srgb, ${on} ${Math.round(kcol * 100)}%, ${off})`) : kn < 1 ? `color-mix(in srgb, ${off} ${Math.round(kn * 100)}%, ${p.desde?.color ?? off})` : off;
  return (
    <div style={{ position: "absolute", left: p.x - w / 2, top: p.y - h / 2, width: w, height: h, borderRadius: Math.min(w, h) / 2, background: fondo,
      backdropFilter: kcol < 1 ? "blur(8px)" : undefined, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }}>
      <div style={{ position: "absolute", left: w / 2 + bx - (dB * estira) / 2, top: h / 2 - dB / 2, width: dB * estira, height: dB, borderRadius: dB / 2, background: p.colorBoton ?? "#FFFFFF",
        boxShadow: "0 6px 18px rgba(0,0,0,0.25)" }} />
    </div>
  );
};

// ───────── 7 · disco obturador ─────────
/**
 * Disco de cristal con `sectores` cuñas que giran despacio y un punto de acento en el centro; en `tLlena` el punto
 * crece (ease-in) hasta llenar la pantalla con un borde muy desenfocado. Nace de un círculo de acento que se encoge al punto.
 */
export const DiscoObturador: React.FC<{ t0: number; x: number; y: number; diametro?: number; sectores?: number; vel?: number; punto?: number; color?: string;
  tLlena: number; durLlena?: number; curvaLlena?: (x: number) => number; desenfoqueBorde?: number; colorLlena?: string; colorCentro?: string; hasta?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  if (t < p.t0 || (p.hasta !== undefined && t > p.hasta)) return null;
  const D = p.diametro ?? 292, n = p.sectores ?? 6, ac = p.color ?? est.acento, pd = p.punto ?? 30;
  const kn = tramo(t, p.t0, p.t0 + 0.12);
  const kAro = tramo(t, p.t0 + 0.1, p.t0 + 0.35, CURVAS.lineal);
  const giro = (t - p.t0) * (p.vel ?? 20);
  const cuñas = Array.from({ length: n }, (_, i) => `${i % 2 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0)"} ${(i * 360) / n}deg ${((i + 1) * 360) / n}deg`).join(", ");
  const kl = tramo(t, p.tLlena, p.tLlena + (p.durLlena ?? 0.133), p.curvaLlena ?? CURVAS.acelera);
  const rp = lerp(lerp(D / 2, pd / 2, kn), 1150, kl);
  const bb = (p.desenfoqueBorde ?? 60) * Math.min(1, kl * 3);
  const cl = p.colorLlena ?? "#FF5A1F", cc = p.colorCentro ?? "#FF7A2E";
  return (
    <>
      <div style={{ position: "absolute", left: p.x - D / 2, top: p.y - D / 2, width: D, height: D, borderRadius: "50%", boxSizing: "border-box",
        background: `conic-gradient(from ${giro}deg, ${cuñas}), rgba(255,255,255,0.22)`, backdropFilter: "blur(8px)",
        border: `3px solid ${kAro > 0 ? mezclaColor("#E8E6E0", ac, kAro) : "#E8E6E0"}` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: kl > 0
          ? `radial-gradient(circle at ${p.x}px ${p.y}px, ${cc} 0px, ${cl} ${Math.max(0, rp * 0.7)}px, ${cl} ${Math.max(0, rp - bb / 2)}px, ${cl}00 ${rp + bb / 2}px)`
          : `radial-gradient(circle at ${p.x}px ${p.y}px, ${ac} 0px, ${ac} ${rp - 0.8}px, ${ac}00 ${rp + 0.8}px)` }} />
    </>
  );
};

// ───────── 8 · mosaico vivo y sus piezas ─────────
/** Palabra que alterna de peso (p. ej. 300 ↔ 800) en cada pulso, con un fundido corto entre pesos. */
export const PesoVariable: React.FC<{ texto: string; pesos?: [number, number]; cada: number; fundido?: number; desde?: number; tam: number; color?: string; fuente?: string; style?: React.CSSProperties }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const [a, b] = p.pesos ?? [300, 800];
  const u = (t - (p.desde ?? 0)) / p.cada, n = Math.floor(u), f = u - n;
  const actual = n % 2 ? b : a, previo = n % 2 ? a : b;
  const k = cl01((f * p.cada) / (p.fundido ?? 0.07));
  const base: React.CSSProperties = { position: "absolute", left: 0, top: 0, fontFamily: p.fuente ?? est.fuente, fontSize: p.tam, lineHeight: 1, color: p.color ?? est.texto, whiteSpace: "pre", letterSpacing: "-0.01em" };
  return (
    <div style={{ position: "relative", ...p.style }}>
      <span style={{ ...base, position: "relative", fontWeight: actual, opacity: k }}>{p.texto}</span>
      {k < 1 && <span style={{ ...base, fontWeight: previo, opacity: 1 - k }}>{p.texto}</span>}
    </div>
  );
};

/** `n` puntos que saltan en ola con un muelle en cada pulso (alternan arriba/abajo). */
export const PuntosMuelle: React.FC<{ n?: number; diametro?: number; separacion?: number; altura?: number; cada: number; desfase?: number; color?: string; stiffness?: number; damping?: number }> = (p) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const n = p.n ?? 3, d = p.diametro ?? 40, sep = p.separacion ?? 70, h = p.altura ?? 50;
  return (
    <div style={{ position: "relative", width: (n - 1) * sep + d, height: h + d }}>
      {Array.from({ length: n }, (_, i) => {
        const tt = t - i * (p.desfase ?? 0.07);
        const k = Math.floor(tt / p.cada), f = tt - k * p.cada;
        const de = k % 2 ? 1 : 0, a = 1 - de;
        const v = lerp(de, a, valorMuelle(f, fps, p.stiffness ?? 180, p.damping ?? 12));
        const yy = h * (1 - v) - i * (h * 0.35) + h * 0.35;
        return <div key={i} style={{ position: "absolute", left: i * sep, top: yy, width: d, height: d, borderRadius: "50%", background: p.color ?? "#FFFFFF", boxShadow: "0 6px 14px rgba(0,0,0,0.15)" }} />;
      })}
    </div>
  );
};

/** Cubo de alambre (caras claras, aristas oscuras) con una cara de acento, girando continuo a `vel` °/s. */
export const CuboAlambre: React.FC<{ lado?: number; vel?: number; colorCara?: string; colorArista?: string; caraAcento?: string; inclinacion?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const L = p.lado ?? 110;
  const cara = (tr: string, c: string) => <div style={{ position: "absolute", left: 0, top: 0, width: L, height: L, boxSizing: "border-box", border: `2px solid ${p.colorArista ?? "#1F1D24"}`, background: c, transform: tr }} />;
  const b = p.colorCara ?? "#FFFFFF";
  return (
    <div style={{ width: L, height: L, perspective: 900 }}>
      <div style={{ position: "relative", width: L, height: L, transformStyle: "preserve-3d", transform: `rotateX(${p.inclinacion ?? -24}deg) rotateY(${t * (p.vel ?? 90)}deg)` }}>
        {cara(`translateZ(${L / 2}px)`, b)}
        {cara(`rotateY(180deg) translateZ(${L / 2}px)`, b)}
        {cara(`rotateY(90deg) translateZ(${L / 2}px)`, b)}
        {cara(`rotateY(-90deg) translateZ(${L / 2}px)`, b)}
        {cara(`rotateX(90deg) translateZ(${L / 2}px)`, p.caraAcento ?? est.acento)}
        {cara(`rotateX(-90deg) translateZ(${L / 2}px)`, b)}
      </div>
    </div>
  );
};

/** Rayas diagonales de dos colores con un cristal esmerilado que se desliza encima (ida y vuelta a `vel` px/s).
 *  El esmerilado es una copia desenfocada de las rayas recortada por el cristal (sin backdrop-filter: dentro de una
 *  cámara 3D Chrome deja de pintar capas enteras en fotogramas sueltos). */
export const RayasCristal: React.FC<{ ancho: number; alto: number; color1?: string; color2?: string; raya?: number; vel?: number; radio?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const r = p.raya ?? 26, c1 = p.color1 ?? "#1F1D24", c2 = p.color2 ?? est.acento;
  const gw = p.ancho * 0.48, gh = p.alto * 0.55;
  const rec = p.ancho - gw - 20, ida = ((t * (p.vel ?? 120)) % (2 * rec));
  const gx = 10 + (ida < rec ? ida : 2 * rec - ida), gy = (p.alto - gh) / 2;
  const rayas = `repeating-linear-gradient(-55deg, ${c1} 0 ${r}px, #FFFFFF ${r}px ${r + 7}px, ${c2} ${r + 7}px ${2 * r + 7}px, #FFFFFF ${2 * r + 7}px ${2 * r + 14}px)`;
  return (
    <div style={{ position: "relative", width: p.ancho, height: p.alto, borderRadius: p.radio ?? 14, overflow: "hidden", background: rayas }}>
      <div style={{ position: "absolute", left: gx, top: gy, width: gw, height: gh, borderRadius: gh / 2, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }}>
        <div style={{ position: "absolute", left: -gx, top: -gy, width: p.ancho, height: p.alto, background: rayas, filter: "blur(12px)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.35)" }} />
      </div>
    </div>
  );
};

/** `n` barras redondeadas que cambian de alto con muelle en cada pulso; la `acento` va en color. */
export const BarrasVivas: React.FC<{ n?: number; acento?: number; ancho?: number; separacion?: number; alto?: number; cada: number; color?: string; colorAcento?: string }> = (p) => {
  const t = useSeg();
  const { fps } = useVideoConfig();
  const est = useEstilo();
  const n = p.n ?? 8, w = p.ancho ?? 33, sep = p.separacion ?? 21, H = p.alto ?? 160;
  const k = Math.floor(t / p.cada), f = t - k * p.cada;
  const alto = (i: number, kk: number) => 0.2 + 0.8 * (((i * 7 + kk * 13 + i * kk * 3) % 11) / 10) * (i === (p.acento ?? 4) ? 0.4 + 0.6 : 1);
  return (
    <div style={{ position: "relative", width: n * w + (n - 1) * sep, height: H }}>
      {Array.from({ length: n }, (_, i) => {
        const h = H * lerp(alto(i, k - 1), alto(i, k), valorMuelle(f - i * 0.02, fps, 180, 12));
        return <div key={i} style={{ position: "absolute", left: i * (w + sep), bottom: 0, width: w, height: Math.max(w * 0.6, h), borderRadius: w / 3, background: i === (p.acento ?? 4) ? (p.colorAcento ?? est.acento) : (p.color ?? "#1F1D24") }} />;
      })}
    </div>
  );
};

/** Seno que se dibuja de izquierda a derecha en `ciclo` s (y vuelve a empezar) con un punto de acento en la punta. */
export const TrazoVivo: React.FC<{ ancho: number; alto: number; ciclo?: number; desde?: number; color?: string; colorPunto?: string; grosor?: number; vueltas?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const c = p.ciclo ?? 1;
  const k = CURVAS.inOut(cl01((((t - (p.desde ?? 0)) % (c * 1.4)) + c * 1.4) % (c * 1.4) / c));
  const pt = (u: number) => [u * p.ancho, p.alto / 2 - (p.alto / 2 - 6) * Math.sin(-Math.PI / 2 + u * Math.PI * 2 * (p.vueltas ?? 1.2))] as const;
  const N = 80, pts: string[] = [];
  for (let i = 0; i <= N; i++) { const [a, b] = pt((i / N) * k); pts.push(`${a.toFixed(1)},${b.toFixed(1)}`); }
  const [ex, ey] = pt(k);
  return (
    <svg width={p.ancho} height={p.alto} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={p.color ?? "#1F1D24"} strokeWidth={p.grosor ?? 3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r={9} fill={p.colorPunto ?? est.acento} />
    </svg>
  );
};

export type CeldaMosaico = { titulo: string; num: string; tipo: "peso" | "muelles" | "cubo" | "cristal" | "barras" | "trazo"; acento?: boolean; aparece?: number };
/**
 * Mosaico de tarjetas vivas (una técnica por tarjeta, todas en bucle a la vez). Esquina superior izquierda en (x, y);
 * cada celda entra en `aparece` (expo-out desde escala 0,9 y desenfocada). La cámara 3D va por fuera (`Camara`).
 */
export const MosaicoVivo: React.FC<{ x: number; y: number; celdas: CeldaMosaico[]; columnas?: number; ancho?: number; alto?: number; separacion?: number; radio?: number; pulso: number;
  colorTarjeta?: string; colorTexto?: string; tamPeso?: number; fuente?: string; fuenteMono?: string; opacidad?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const C = p.columnas ?? 3, W = p.ancho ?? 520, H = p.alto ?? 336, S = p.separacion ?? 34, R = p.radio ?? 24;
  const ac = est.acento, tx = p.colorTexto ?? "#1F1D24";
  const pieza = (c: CeldaMosaico) => {
    switch (c.tipo) {
      case "peso": return <div style={{ position: "absolute", left: 60, top: 202 - (p.tamPeso ?? 150) / 2 }}><PesoVariable texto="Type" cada={p.pulso} fundido={0.3} tam={p.tamPeso ?? 150} color={tx} fuente={p.fuente} /></div>;
      case "muelles": return <div style={{ position: "absolute", left: 175, top: 120 }}><PuntosMuelle cada={p.pulso} /></div>;
      case "cubo": return <div style={{ position: "absolute", left: W / 2 - 60, top: 140 }}><CuboAlambre lado={120} caraAcento={ac} colorArista={tx} /></div>;
      case "cristal": return <div style={{ position: "absolute", left: 25, top: 110 }}><RayasCristal ancho={W - 50} alto={190} color1={tx} color2={ac} /></div>;
      case "barras": return <div style={{ position: "absolute", left: (W - (8 * 33 + 7 * 21)) / 2, top: 133 }}><BarrasVivas cada={p.pulso} color={tx} colorAcento={ac} /></div>;
      case "trazo": return <div style={{ position: "absolute", left: 50, top: 120 }}><TrazoVivo ancho={W - 100} alto={140} color={tx} colorPunto={ac} /></div>;
    }
  };
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, opacity: p.opacidad ?? 1 }}>
      {p.celdas.map((c, i) => {
        const ta = c.aparece ?? 0;
        if (t < ta) return null;
        const k = tramo(t, ta, ta + 0.167);
        const col = i % C, fila = Math.floor(i / C);
        return (
          <div key={i} style={{ position: "absolute", left: col * (W + S), top: fila * (H + S), width: W, height: H, borderRadius: R, overflow: "hidden",
            background: c.acento ? ac : (p.colorTarjeta ?? "#FFFFFF"), boxShadow: c.acento ? undefined : "0 1px 2px rgba(0,0,0,0.03), 0 10px 30px -10px rgba(0,0,0,0.08)",
            opacity: k, transform: `scale(${lerp(0.9, 1, k)})`, filter: k < 0.98 ? `blur(${(1 - k) * 8}px)` : undefined }}>
            <div style={{ position: "absolute", left: 26, top: 18, fontFamily: p.fuenteMono ?? est.fuente2, fontSize: 11, color: c.acento ? "rgba(255,255,255,0.6)" : "rgba(31,29,36,0.35)" }}>{c.num}</div>
            <div style={{ position: "absolute", left: 26, top: 36, fontFamily: p.fuente ?? est.fuenteTexto, fontWeight: 500, fontSize: 22, color: c.acento ? "rgba(255,255,255,0.85)" : "rgba(31,29,36,0.75)" }}>{c.titulo}</div>
            {pieza(c)}
          </div>
        );
      })}
    </div>
  );
};

// ───────── 9 · contador con rodillo ─────────
/**
 * Contador por cifras en columnas fijas: el valor sigue `valores` ([t, v] con PCHIP) o una curva quint-out de `t0` a
 * `t0+dur`; la cifra `digitoAcento` va en acento y, mientras gira, con desenfoque vertical; `rodillo` hace rodar todas
 * las cifras a la vez de `de` a `a` para clavar el número redondo. (x = borde izquierdo, y = centro de las cifras.)
 */
export const ContadorRodillo: React.FC<{ x: number; y: number; tam: number; anchoCifra: number; digitos?: number; hasta?: number; t0?: number; dur?: number; valores?: [number, number][];
  rodillo?: { t0: number; dur?: number; de: number; a: number }; digitoAcento?: number; color?: string; colorAcento?: string; desenfoque?: number; peso?: number; fuente?: string;
  estiloCifra?: (i: number) => React.CSSProperties }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  const base = idSeguro(React.useId());
  const nd = p.digitos ?? 3;
  const valor = (tt: number) => p.valores ? pchip(p.valores.map((v) => v[0]), p.valores.map((v) => v[1]), tt) : (p.hasta ?? 0) * tramo(tt, p.t0 ?? 0, (p.t0 ?? 0) + (p.dur ?? 1), (x) => 1 - Math.pow(1 - x, 5));
  const v = Math.floor(valor(t) + 1e-6), vAntes = Math.floor(valor(t - 0.1) + 1e-6);
  const r = p.rodillo, kr = r ? tramo(t, r.t0, r.t0 + (r.dur ?? 0.133), CURVAS.suave) : 0;
  const cifras = (num: number) => String(Math.max(0, num)).padStart(nd, "0").slice(-nd).split("");
  const acI = p.digitoAcento === undefined ? nd - 1 : (p.digitoAcento + nd) % nd;
  const girando = v !== vAntes && kr === 0;
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y - p.tam / 2, height: p.tam, display: "flex", fontFamily: p.fuente ?? est.fuente, fontWeight: p.peso ?? 800, fontSize: p.tam, lineHeight: 1 }}>
      {Array.from({ length: nd }, (_, i) => {
        const col = i === acI ? (p.colorAcento ?? est.acento) : (p.color ?? est.texto);
        const id = `${base}c${i}`;
        const blur = i === acI && girando ? (p.desenfoque ?? 12) : 0;
        const enRodillo = r && kr > 0 && kr < 1;
        const caja: React.CSSProperties = { width: p.anchoCifra, height: p.tam, overflow: "hidden", position: "relative", color: col, textAlign: "center", ...p.estiloCifra?.(i) };
        if (enRodillo) {
          return (
            <div key={i} style={caja}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${-kr * 100}%)`, filter: "blur(1.5px)" }}>{cifras(r!.de)[i]}</div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${(1 - kr) * 100}%)`, filter: "blur(1.5px)" }}>{cifras(r!.a)[i]}</div>
            </div>
          );
        }
        const num = r && kr >= 1 ? r.a : v;
        return (
          <div key={i} style={{ ...caja, filter: blur ? `url(#${id})` : caja.filter }}>
            {blur > 0 && <FiltroDir id={id} bx={0} by={blur} />}
            {cifras(num)[i]}
          </div>
        );
      })}
    </div>
  );
};

// ───────── 10 · glifo puente ─────────
/**
 * Un carácter se convierte en otro (p. ej. la cifra «0» en la «O» del logo) mientras viaja a su sitio: cambia de
 * tamaño, funde un glifo en el otro y llega con `curva` (quad-out por defecto). x, y = centro de la caja del glifo.
 */
export const GlifoPuente: React.FC<{ t0: number; dur?: number; de: string; a: string; desde: { x: number; y: number; tam: number }; hasta: { x: number; y: number; tam: number };
  color?: string; peso?: number; fuente?: string; curva?: (x: number) => number; fundido?: number; aparece?: number }> = (p) => {
  const t = useSeg();
  const est = useEstilo();
  if (p.aparece !== undefined && t < p.aparece) return null;
  const dur = p.dur ?? 0.53;
  const k = tramo(t, p.t0, p.t0 + dur, p.curva ?? ((x) => 1 - (1 - x) * (1 - x)));
  const kf = tramo(t, p.t0, p.t0 + dur * (p.fundido ?? 0.35), CURVAS.lineal);
  const x = lerp(p.desde.x, p.hasta.x, k), y = lerp(p.desde.y, p.hasta.y, k), tam = lerp(p.desde.tam, p.hasta.tam, k);
  const st: React.CSSProperties = { position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", fontFamily: p.fuente ?? est.fuente, fontWeight: p.peso ?? 800, fontSize: tam, lineHeight: 1, color: p.color ?? est.acento, whiteSpace: "pre" };
  return (
    <>
      {kf < 1 && <span style={{ ...st, opacity: 1 - kf, transform: `translate(-50%, -50%) scaleX(${lerp(1, 1.2, kf)})` }}>{p.de}</span>}
      {kf > 0 && <span style={{ ...st, opacity: kf, transform: `translate(-50%, -50%) scaleX(${lerp(0.8, 1, kf)})` }}>{p.a}</span>}
    </>
  );
};
