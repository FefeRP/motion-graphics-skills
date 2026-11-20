// mg.js · motor de motion graphics para HyperFrames (HTML + CSS + GSAP → vídeo). Sin dependencias (usa el gsap global).
//
// Idea: una escena es una FUNCIÓN PURA del tiempo, `escena(t) → árbol` (h(etiqueta, props, ...hijos)). El motor aplica
// el árbol al DOM con un reconciliador mínimo (reutiliza los nodos, solo cambia estilos y textos), y una línea de tiempo
// de GSAP en pausa mueve el reloj: HyperFrames la recorre fotograma a fotograma. Así cada fotograma es exacto, se
// puede pedir cualquier instante (t = 3,217 s) y no hay relojes del navegador.
//
//   MG.montar({ id: "demo", duracion: 10, fps: 60, estilo: MG.ESTILOS.oscuro, escena: (t) => h("div", …) });
//
// Se puede mezclar con tweens de GSAP normales sobre elementos fijos del HTML (MG.linea es la misma línea de tiempo:
// MG.linea.to(...)). Prohibido: el reloj del navegador (animation frames, Date.now, performance.now), Math.random
// (usa MG.azar), transiciones CSS, repeat: -1 y red (todo en local).
(function () {
  "use strict";

  // ───────────────────────── árbol y reconciliador ─────────────────────────
  const plano = (a, out = []) => { for (const x of a) { if (Array.isArray(x)) plano(x, out); else if (x !== null && x !== undefined && x !== false && x !== true && x !== "") out.push(x); } return out; };
  /** h("div", { style: {...}, class: "x", key: "k" }, hijo, [hijos], "texto"). Números y cadenas son texto. */
  const h = (tag, props, ...kids) => ({ tag, props: props || {}, kids: plano(kids) });
  /** Fragmento: agrupa varios hijos sin envoltorio (se aplana). */
  const F = (...kids) => plano(kids);

  const SIN_UNIDAD = new Set(["opacity", "zIndex", "fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink", "order", "scale", "zoom", "fillOpacity", "strokeOpacity", "stopOpacity"]);
  const CAMEL_SVG = new Set(["viewBox", "pathLength", "gradientUnits", "gradientTransform", "stdDeviation", "baseFrequency", "numOctaves", "preserveAspectRatio", "patternUnits", "patternContentUnits", "spreadMethod", "maskUnits", "filterUnits", "primitiveUnits", "tableValues", "kernelMatrix", "markerWidth", "markerHeight", "refX", "refY", "startOffset", "textLength", "lengthAdjust"]);
  const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  const NS = "http://www.w3.org/2000/svg";
  const valorCss = (k, v) => (typeof v === "number" && !SIN_UNIDAD.has(k) ? v + "px" : v);

  function ponEstilo(el, nuevo, viejo) {
    const s = el.style;
    if (viejo) for (const k in viejo) if (!nuevo || !(k in nuevo)) { if (k.startsWith("--")) s.removeProperty(k); else s[k] = ""; }
    if (nuevo) for (const k in nuevo) {
      const v = nuevo[k];
      if (viejo && viejo[k] === v) continue;
      if (v === undefined || v === null || v === false) { if (k.startsWith("--")) s.removeProperty(k); else s[k] = ""; }
      else if (k.startsWith("--")) s.setProperty(k, String(v));
      else s[k] = valorCss(k, v);
    }
  }
  function ponProps(el, nuevo, viejo, svg) {
    const nom = (k) => (k === "className" ? "class" : svg && !CAMEL_SVG.has(k) && !k.startsWith("data-") ? kebab(k) : k);
    for (const k in viejo) if (!(k in nuevo) && k !== "style" && k !== "key") el.removeAttribute(nom(k));
    for (const k in nuevo) {
      if (k === "key") continue;
      const v = nuevo[k];
      if (k === "style") { ponEstilo(el, v, viejo.style); continue; }
      if (viejo[k] === v) continue;
      if (v === undefined || v === null || v === false) el.removeAttribute(nom(k)); else el.setAttribute(nom(k), v === true ? "" : String(v));
    }
  }
  function crea(v, svg) {
    if (typeof v !== "object") return document.createTextNode(String(v));
    const esSvg = svg || v.tag === "svg";
    const el = esSvg ? document.createElementNS(NS, v.tag) : document.createElement(v.tag);
    el.__mg = { tag: v.tag, key: v.props.key, props: {} };
    ponProps(el, v.props, {}, esSvg);
    el.__mg.props = v.props;
    hijos(el, v.kids, esSvg && v.tag !== "foreignObject");
    return el;
  }
  function parchea(padre, nodo, v, svg) {
    if (typeof v !== "object") {
      if (nodo && nodo.nodeType === 3) { const s = String(v); if (nodo.data !== s) nodo.data = s; return nodo; }
      const n = document.createTextNode(String(v)); nodo ? padre.replaceChild(n, nodo) : padre.appendChild(n); return n;
    }
    if (!nodo || !nodo.__mg || nodo.__mg.tag !== v.tag || nodo.__mg.key !== v.props.key) {
      const n = crea(v, svg); nodo ? padre.replaceChild(n, nodo) : padre.appendChild(n); return n;
    }
    const esSvg = svg || v.tag === "svg";
    ponProps(nodo, v.props, nodo.__mg.props, esSvg);
    nodo.__mg.props = v.props;
    hijos(nodo, v.kids, esSvg && v.tag !== "foreignObject");
    return nodo;
  }
  function hijos(el, kids, svg) {
    let n = el.firstChild;
    for (const k of kids) { const sig = n ? n.nextSibling : null; parchea(el, n, k, svg); n = sig; }
    while (n) { const sig = n.nextSibling; el.removeChild(n); n = sig; }
  }
  /** Aplica un árbol (o lista) dentro de `raiz`. */
  const aplica = (raiz, arbol) => hijos(raiz, plano([arbol]), raiz instanceof SVGElement);

  // ───────────────────────── tiempo y curvas ─────────────────────────
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (u) => ((ax * u + bx) * u + cx) * u, Y = (u) => ((ay * u + by) * u + cy) * u, dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 8; i++) { const e = X(u) - x; if (Math.abs(e) < 1e-7) break; const d = dX(u); if (Math.abs(d) < 1e-6) break; u -= e / d; }
      if (Math.abs(X(u) - x) > 1e-5 || u < 0 || u > 1) { let a = 0, b = 1; u = x; for (let i = 0; i < 40; i++) { const xu = X(u); if (Math.abs(xu - x) < 1e-7) break; if (x > xu) a = u; else b = u; u = (a + b) / 2; } }
      return Y(u);
    };
  };
  /** expo = entradas (arranca rápido, frena largo); inOut = viajes; acelera = salidas. */
  const CURVAS = {
    expo: bezier(0.16, 1, 0.3, 1), suave: bezier(0.25, 1, 0.5, 1), inOut: bezier(0.65, 0, 0.35, 1),
    inOutFuerte: bezier(0.83, 0, 0.17, 1), acelera: bezier(0.55, 0, 1, 0.45), lineal: (x) => x,
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  /** 0→1 entre a y b con la curva (por defecto expo). */
  const tramo = (t, a, b, e = CURVAS.expo) => e(clamp((t - a) / Math.max(1e-9, b - a)));
  /** Sube en [a, a+dentro], baja en [b, b+fuera]. */
  const ventana = (t, a, b, dentro = 0.3, fuera = 0.25) => Math.min(tramo(t, a, a + dentro), 1 - tramo(t, b, b + fuera, CURVAS.acelera));
  /** Interpolación por tramos con extremos fijos: interp(t, [0, 1, 2], [0, 100, 50], curva?). */
  const interp = (t, xs, ys, e = CURVAS.lineal) => {
    if (t <= xs[0]) return ys[0];
    for (let i = 0; i < xs.length - 1; i++) if (t <= xs[i + 1]) return ys[i] + (ys[i + 1] - ys[i]) * e((t - xs[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
    return ys[ys.length - 1];
  };
  /** PCHIP (Fritsch–Carlson): curva C1 que no se pasa entre claves y no frena en cada una (solo extremos, máximos y `para`). */
  const pchip = (ts, vs, t, para) => {
    const n = ts.length;
    if (n === 1 || t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0; while (i < n - 2 && t > ts[i + 1]) i++;
    const hh = (k) => ts[k + 1] - ts[k], d = (k) => (vs[k + 1] - vs[k]) / Math.max(1e-6, hh(k));
    const m = (k) => {
      if (k === 0 || k === n - 1 || (para && para[k])) return 0;
      const d0 = d(k - 1), d1 = d(k), h0 = hh(k - 1), h1 = hh(k);
      if (d0 * d1 <= 0) return 0;
      return (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
    };
    const H = hh(i), u = (t - ts[i]) / H, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * H * m(i) + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * H * m(i + 1);
  };
  /** Valor de cada campo en t. OJO: un campo que falta en una clave CONSERVA el de la anterior (tras o: 0, pon o: 1). */
  const pista = (claves, t, campos, def = {}) => {
    const ts = claves.map((c) => c.t), para = claves.map((c) => !!c.para), out = {};
    for (const k of campos) {
      let ultimo = def[k] ?? 0;
      const vs = claves.map((c) => { if (typeof c[k] === "number") ultimo = c[k]; return ultimo; });
      out[k] = pchip(ts, vs, t, para);
    }
    return out;
  };
  /** Segundos del golpe n a `bpm`. */
  const golpe = (n, bpm = 120, desde = 0) => desde + (n * 60) / bpm;
  /** Azar con semilla (cadena o número) → [0, 1). Igual en todos los fotogramas y procesos. */
  const azar = (semilla) => {
    // misma fórmula que random() de Remotion (mulberry32 sobre el hash de la cadena): mismas semillas, mismo resultado
    const t = String(semilla); let hs = 0;
    for (let i = 0; i < t.length; i++) { hs = (hs << 5) - hs + t.charCodeAt(i); hs |= 0; }
    let x = hs + 0x6d2b79f5;
    x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  /** Muelle amortiguado 0→1 desde t0 (forma cerrada; mismos parámetros que un spring de Remotion o Framer). */
  const muelle = (t, t0, { stiffness = 170, damping = 26, mass = 1 } = {}) => {
    const x = t - t0; if (x <= 0) return 0;
    const w0 = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass));
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + ((z * w0) / wd) * Math.sin(wd * x)); }
    if (z === 1) return 1 - Math.exp(-w0 * x) * (1 + w0 * x);
    const r1 = -w0 * (z - Math.sqrt(z * z - 1)), r2 = -w0 * (z + Math.sqrt(z * z - 1));
    return 1 - (r2 * Math.exp(r1 * x) - r1 * Math.exp(r2 * x)) / (r2 - r1);
  };

  // ───────────────────────── estilos (direcciones de partida) ─────────────────────────
  const INTER = "'Inter', system-ui, sans-serif", SYNE = "'Syne', 'Inter', sans-serif", SERIF = "'Instrument Serif', Georgia, serif",
    MONO = "'JetBrains Mono', ui-monospace, monospace", SORA = "'Sora', 'Inter', sans-serif";
  const BASE = {
    id: "base", fondo: "#050505", texto: "#FFFFFF", suave: "rgba(255,255,255,0.62)", acento: "#F7A01E",
    tarjeta: "#121214", borde: "rgba(255,255,255,0.10)", sombra: "0 30px 70px rgba(0,0,0,0.7)", radio: 24,
    fuente: INTER, fuenteTexto: INTER, peso: 800, tracking: "-0.045em", mayusculas: false,
    ritmo: { bpm: 120 }, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.65, 0, 0.35, 1] },
    entradaDur: 0.35, muelle: null, luz: { tipo: "liso", colores: ["#050505"] }, texturas: { vineta: 0.55 },
  };
  /** Mezcla estilos o ajustes: los posteriores pisan; los objetos (curvas, texturas, ritmo) se mezclan campo a campo. */
  const mezclar = (...partes) => {
    const out = { ...BASE };
    for (const p of partes) for (const [k, v] of Object.entries(p || {})) {
      if (v === undefined) continue;
      const prev = out[k];
      out[k] = v && typeof v === "object" && !Array.isArray(v) && prev && typeof prev === "object" && !Array.isArray(prev) && k !== "luz" ? { ...prev, ...v } : v;
    }
    return out;
  };
  const AG = { azul: "#2B2BF0", rojo: "#E8302A", lima: "#C6FF1A", crema: "#F2EDE2", negro: "#0F0F13", morado: "#140A2E", moradoLuz: "#3B1D7A" };
  const OSCURO = mezclar({
    id: "oscuro", fondo: "#080808", texto: "#F5F5F7", suave: "#8E8E93", acento: "#14E3E2", tarjeta: "#161616", borde: "rgba(255,255,255,0.07)",
    sombra: "0 40px 90px rgba(0,0,0,0.75)", radio: 36, fuente: INTER, fuenteTexto: INTER, peso: 600, tracking: "-0.02em",
    ritmo: { bpm: 120 }, entradaDur: 0.35, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.65, 0, 0.35, 1] },
    muelle: { stiffness: 760, damping: 23, mass: 0.5, sobrepaso: 0.1 }, luz: { tipo: "foco", colores: ["#332C3B", "#1A1720"] }, texturas: { vineta: 0.6, bokeh: 0 },
  });
  const CLARO = mezclar({
    id: "claro", fondo: "#E4E5EA", texto: "#1D1D1F", suave: "#6E6E73", acento: "#2B35E0", tarjeta: "#FFFFFF", borde: "rgba(0,0,0,0.06)",
    sombra: "0 2px 4px rgba(0,0,0,0.03), 0 12px 24px -4px rgba(0,0,0,0.07), 0 30px 60px -12px rgba(0,0,0,0.10)", radio: 28,
    fuente: INTER, fuenteTexto: INTER, peso: 650, tracking: "-0.015em", paleta: ["#2B35E0", "#7A2FD0", "#D0306E", "#E8571C", "#5DBB63"],
    ritmo: { bpm: 108 }, entradaDur: 0.16, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.7, 0, 0.84, 0], viaje: [0.33, 1, 0.68, 1] },
    muelle: null, luz: { tipo: "degradado", colores: ["#EEEEF2", "#E4E5EA", "#D9DBDF"] }, texturas: { vineta: 0 },
  });
  const AGENCIA = mezclar({
    id: "agencia", fondo: AG.negro, texto: AG.crema, suave: "rgba(242,237,226,0.6)", acento: AG.lima, tarjeta: AG.crema, textoTarjeta: AG.negro,
    borde: "rgba(255,255,255,0.25)", sombra: "0 30px 60px rgba(0,0,0,0.3)", radio: 18, fuente: SYNE, fuenteTexto: INTER, peso: 800,
    tracking: "-0.03em", mayusculas: true, fuente2: SERIF, paleta: [AG.azul, AG.rojo, AG.lima, AG.negro, AG.morado],
    ritmo: { bpm: 128 }, entradaDur: 0.37, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.32, 0, 0.67, 0], viaje: [0.83, 0, 0.17, 1] },
    muelle: { stiffness: 340, damping: 12, mass: 1, sobrepaso: 0.35 }, luz: { tipo: "liso", colores: [AG.negro] }, texturas: { vineta: 0.4, hud: true },
  });
  const ESTILOS = {
    oscuro: OSCURO, claro: CLARO, agencia: AGENCIA,
    "oscuro-halo": mezclar(OSCURO, { id: "oscuro-halo", acento: "#1ED760", luz: { tipo: "halo", colores: ["#1ED760"] }, texturas: { vineta: 0.6, bokeh: 0.5 } }),
    "oscuro-brasa": mezclar(OSCURO, { id: "oscuro-brasa", fondo: "#000000", acento: "#EF5023", luz: { tipo: "halo", colores: ["#DD5E27"] }, texturas: { vineta: 0.5 }, paleta: ["#DD5E27", "#A53F1C", "#FFFFE8", "#10AFDF"] }),
    "oscuro-turquesa": mezclar(OSCURO, { id: "oscuro-turquesa", fondo: "#000306", acento: "#18D9C9", luz: { tipo: "halo", colores: ["#0E6E6A"] }, texturas: { vineta: 0.6 }, paleta: ["#18D9C9", "#60AAE1", "#0433EC"] }),
    "claro-lima": mezclar(CLARO, { id: "claro-lima", fondo: "#FAF9FB", texto: "#183527", acento: "#86BA00", fuente: SORA, peso: 650, paleta: ["#9CD20A", "#C9E800", "#7EAE01"], luz: { tipo: "manchas", colores: ["#9CD20A", "#C9E800", "#7EAE01"] }, ritmo: { bpm: 124 } }),
  };
  // variantes medidas en referencias (rondas 4 y 5): mismos tokens que las del kit de Remotion
  const MONTSERRAT = "'Montserrat', 'Inter', sans-serif", SOURCE_SERIF = "'Source Serif 4', Georgia, serif", BARLOW = "'Barlow', 'Inter', sans-serif",
    GARAMOND = "'EB Garamond', Georgia, serif", URBANIST = "'Urbanist', 'Inter', sans-serif";
  ESTILOS["agencia-punto"] = mezclar(AGENCIA, {
    id: "agencia-punto", fondo: "#110E14", texto: "#F2EDE6", suave: "rgba(242,237,230,0.55)", acento: "#FA4C2E", tarjeta: "#E9E2DB", textoTarjeta: "#120E14",
    paleta: ["#FA4C2E", "#2B43F8", "#F5C139", "#E9E2DB", "#110E14"], fuente: MONTSERRAT, peso: 900, tracking: "-0.01em", mayusculas: true, fuente2: SOURCE_SERIF, fuenteTexto: BARLOW,
    ritmo: { bpm: 128 }, entradaDur: 0.2, muelle: { stiffness: 260, damping: 14, mass: 1, sobrepaso: 0.12 }, luz: { tipo: "liso", colores: ["#110E14"] }, texturas: { vineta: 0.12, hud: true },
  });
  ESTILOS["oscuro-cobre"] = mezclar(OSCURO, {
    id: "oscuro-cobre", fondo: "#0B080C", texto: "#F5F0EC", suave: "#B0AAAC", acento: "#D87457", tarjeta: "#261F1E", borde: "rgba(255,255,255,0.06)", sombra: "0 30px 80px rgba(0,0,0,0.6)", radio: 27,
    fuente: GARAMOND, fuenteTexto: INTER, peso: 500, tracking: "0em", mayusculas: false, paleta: ["#D87457", "#F5B694", "#E16726", "#6B3E2D"],
    ritmo: { bpm: 124 }, entradaDur: 0.2, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.85, 0, 0.15, 1] },
    muelle: { stiffness: 170, damping: 12, mass: 1, sobrepaso: 0.22 }, luz: { tipo: "halo", colores: ["#6B3E2D"] }, texturas: { vineta: 0.7, grano: 0.035 },
  });
  ESTILOS["oscuro-cristal"] = mezclar(OSCURO, {
    id: "oscuro-cristal", fondo: "#06070C", texto: "#F7F8FC", suave: "rgba(247,248,252,0.7)", acento: "#7998FD", tarjeta: "#14131C", borde: "rgba(233,233,242,0.9)", radio: 82,
    fuente: URBANIST, fuenteTexto: URBANIST, peso: 500, tracking: "-0.01em", mayusculas: false,
    ritmo: { bpm: 100 }, entradaDur: 0.4, curvas: { entrada: [0.25, 1, 0.5, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.45, 0, 0.1, 1] }, muelle: null,
    luz: { tipo: "manchas", colores: ["#455876", "#33284D", "#25334F"] }, texturas: { vineta: 0.3 }, paleta: ["#DB7B61", "#7998FD", "#4DB2FD", "#3BD16F", "#F2A541"],
  });
  ESTILOS.taller = mezclar(ESTILOS["oscuro-brasa"], {
    id: "taller", fondo: "#2A2A2C", texto: "#F7F5EE", suave: "#77787C", acento: "#FF4F2D", tarjeta: "#151617", borde: "rgba(255,255,255,0.10)", radio: 18,
    fuente: INTER, fuenteTexto: INTER, peso: 800, tracking: "-0.01em", mayusculas: false, fuente2: MONO, paleta: ["#FF4F2D", "#FF5A1F", "#F7F5EE", "#77787C"],
    ritmo: { bpm: 128.57 }, entradaDur: 0.2, curvas: { entrada: [0.16, 1, 0.3, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.5, 1, 0.89, 1] },
    muelle: { stiffness: 180, damping: 12, mass: 1, sobrepaso: 0.2 }, luz: { tipo: "halo", colores: ["#FF5A1F"] }, texturas: { vineta: 0.5 },
  });
  ESTILOS["taller-claro"] = mezclar(CLARO, {
    id: "taller-claro", fondo: "#F5F3EF", texto: "#1F1D24", suave: "#77787C", acento: "#FF4F2D", tarjeta: "#FFFFFF", radio: 24, fuente: INTER, fuenteTexto: INTER, peso: 800, tracking: "-0.01em", fuente2: MONO,
    ritmo: ESTILOS.taller.ritmo, muelle: ESTILOS.taller.muelle, curvas: ESTILOS.taller.curvas, entradaDur: 0.2, luz: { tipo: "liso", colores: ["#F5F3EF"] }, texturas: { vineta: 0 },
  });
  ESTILOS["claro-lavanda"] = mezclar(CLARO, {
    id: "claro-lavanda", fondo: "#F3F3EE", texto: "#1E161F", suave: "#9A93A8", acento: "#3B1A6F", tarjeta: "#FBFBFB", radio: 22, fuente: INTER, fuenteTexto: INTER, peso: 500, tracking: "-0.01em", mayusculas: false,
    paleta: ["#3B1A6F", "#5A33A6", "#7B6F9E", "#1A817B"], sombra: "0 2px 6px rgba(40,24,80,0.05), 0 18px 44px rgba(40,24,80,0.09)",
    ritmo: { bpm: 90 }, entradaDur: 0.4, curvas: { entrada: [0.22, 1, 0.36, 1], salida: [0.55, 0, 1, 0.45], viaje: [0.65, 0.1, 0.25, 0.95] },
    muelle: null, luz: { tipo: "liso", colores: ["#F3F3EE"] }, texturas: { vineta: 0 },
  });

  // ───────────────────────── estado del montaje ─────────────────────────
  const M = { fps: 60, ancho: 1920, alto: 1080, estilo: OSCURO };
  const est = () => M.estilo;
  const curva = (tipo = "entrada") => { const b = (est().curvas || BASE.curvas)[tipo]; return bezier(b[0], b[1], b[2], b[3]); };
  /** Muelle del estilo con el sobrepaso RECORTADO (nunca rebotes raros); sin muelle en el estilo → curva de entrada. */
  const muelleEstilo = (t, t0, ajuste) => {
    const e = est(), m = e.muelle ? { ...e.muelle, ...ajuste } : ajuste && ajuste.stiffness ? { stiffness: 170, damping: 14, mass: 1, sobrepaso: 0.1, ...ajuste } : null;
    if (!m) return curva("entrada")(clamp((t - t0) / (e.entradaDur || 0.35)));
    const v = muelle(t, t0, m);
    if (v <= 1) return v;
    return 1 + m.sobrepaso * (1 - Math.exp(-(v - 1) / Math.max(0.001, m.sobrepaso)));
  };
  const golpeEstilo = (n, desde = 0) => desde + (n * 60) / ((est().ritmo || {}).bpm || 120);
  const hex2 = (n) => Math.round(clamp(n) * 255).toString(16).padStart(2, "0");
  /** Mezcla dos colores #rrggbb (k 0→1). */
  const mezclaColor = (a, b, k) => { const p = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const [x, y] = [p(a), p(b)]; return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`; };
  const LLENO = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" };
  const capa = (style, ...kids) => h("div", { style: { ...LLENO, ...style } }, ...kids);
  /** Como AbsoluteFill de Remotion: capa que llena y coloca a sus hijos en columna (flex). */
  const lleno = (style, ...kids) => capa({ display: "flex", flexDirection: "column", ...style }, ...kids);
  const titular = (tam) => { const e = est(); return { fontFamily: e.fuente, fontWeight: e.peso, letterSpacing: e.tracking, color: e.texto, fontSize: tam, lineHeight: 1.02, textTransform: e.mayusculas ? "uppercase" : undefined }; };

  // ───────────────────────── piezas, cámara y desenfoque ─────────────────────────
  const CAMPOS_PIEZA = ["x", "y", "z", "rx", "ry", "rz", "s", "o", "b"];
  const piezaEn = (claves, t) => pista(claves, t, CAMPOS_PIEZA, { s: 1, o: 1 });
  /** Contenedor con trayectoria por claves {t,x,y,z,rx,ry,rz,s,o,b,para}. `estela` = desenfoque direccional por velocidad. */
  const Movil = (t, { claves, ancho, alto, queda, estela = 0, style, key } = {}, ...kids) => {
    const fin = claves[claves.length - 1].t;
    if (t < claves[0].t - 0.02 || (!queda && t > fin + 0.02)) return null;
    const e = piezaEn(claves, Math.min(t, fin));
    if (e.o <= 0.003) return null;
    let filtro = e.b > 0.2 ? `blur(${e.b.toFixed(2)}px)` : undefined, svgF = null;
    if (estela > 0 && t <= fin) {
      const q = piezaEn(claves, Math.max(claves[0].t, t - 1 / M.fps));
      const bx = Math.min(60, Math.abs(e.x - q.x) * estela * (60 / M.fps)), by = Math.min(60, Math.abs(e.y - q.y) * estela * (60 / M.fps));
      if (bx > 0.4 || by > 0.4) {
        const id = "est" + String(key || `${claves[0].t}_${claves[0].x}_${claves[0].y}`).replace(/[^a-zA-Z0-9]/g, "_");
        filtro = `url(#${id})${filtro ? " " + filtro : ""}`;
        svgF = h("svg", { width: 0, height: 0, style: { position: "absolute" } }, h("filter", { id, x: "-50%", y: "-50%", width: "200%", height: "200%" }, h("feGaussianBlur", { stdDeviation: `${bx.toFixed(1)} ${by.toFixed(1)}` })));
      }
    }
    return h("div", { key, style: { position: "absolute", left: 0, top: 0, opacity: Math.min(1, e.o), transformStyle: "preserve-3d", filter: filtro, width: ancho, height: alto,
      transform: `translate3d(${e.x}px, ${e.y}px, ${e.z}px) rotateX(${e.rx}deg) rotateY(${e.ry}deg) rotateZ(${e.rz}deg) scale(${e.s}) translate(-50%, -50%)`, ...style } }, svgF, ...kids);
  };
  /** Receta: entra desde `desde`, se coloca en (x, y) en `dur` y, si se da `sale`, se va hacia `hacia`. */
  const entraSale = (o) => {
    const dur = o.dur ?? 0.5, z = o.z ?? 0;
    const llega = { t: o.t0 + dur, x: o.x, y: o.y, z, o: 1, s: 1, rx: 0, ry: 0, rz: 0, b: 0 };
    const cl = [{ t: o.t0, x: o.x, y: o.y, z, o: 0, s: 1, rx: 0, ry: 0, rz: 0, b: 0, ...o.desde }, llega];
    if (o.sale !== undefined) { const [dx, dy] = o.deriva ?? [0, -14]; cl.push({ ...llega, t: o.sale, x: o.x + dx, y: o.y + dy }); cl.push({ ...llega, t: o.sale + (o.durSale ?? 0.35), x: o.x + dx, y: o.y + dy, o: 0, ...o.hacia }); }
    return cl;
  };
  /** Tarjeta con la superficie del estilo. */
  const Tarjeta = ({ ancho, alto, padding = 28, brillo = 0, style } = {}, ...kids) => {
    const e = est();
    return h("div", { style: { width: ancho, height: alto, padding, boxSizing: "border-box", borderRadius: e.radio, background: e.tarjeta, color: e.textoTarjeta || e.texto, fontFamily: e.fuenteTexto,
      boxShadow: `${e.sombra}, 0 0 0 1px ${e.borde}${brillo > 0 ? `, 0 0 0 ${2 * brillo}px ${e.acento}, 0 0 ${50 * brillo}px ${e.acento}80` : ""}`, ...style } }, ...kids);
  };
  /** Cámara 2D: mira a (x, y) con zoom s, giro rz y foco b. `ancla` = punto de pantalla donde se pinta (x, y). */
  const camara2DEn = (claves, t) => pista(claves, t, ["x", "y", "s", "rz", "b"], { x: M.ancho / 2, y: M.alto / 2, s: 1, b: 0 });
  const Camara2D = (t, { claves, ancla }, ...kids) => {
    const c = camara2DEn(claves, t), [ax, ay] = ancla || [M.ancho / 2, M.alto / 2];
    return capa({ overflow: "hidden" }, capa({ transformOrigin: "0 0", transform: `translate(${ax}px, ${ay}px) scale(${c.s}) rotate(${c.rz}deg) translate(${-c.x}px, ${-c.y}px)`, filter: c.b > 0.05 ? `blur(${c.b}px)` : undefined }, ...kids));
  };
  /** Cámara 3D: claves {t,x,y,z(zoom),rx,ry,rz}; el zoom se interpola en logaritmo. */
  const camaraEn = (claves, t) => { const c = pista(claves.map((k) => ({ ...k, lz: Math.log(k.z) })), t, ["x", "y", "lz", "rx", "ry", "rz"]); return { x: c.x, y: c.y, z: Math.exp(c.lz), rx: c.rx, ry: c.ry, rz: c.rz }; };
  const Camara = (t, { claves, perspectiva = 2200 }, ...kids) => {
    const c = camaraEn(claves, t);
    return capa({ perspective: perspectiva + "px", perspectiveOrigin: "50% 50%", overflow: "hidden" },
      h("div", { style: { position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d", transform: `translate(${M.ancho / 2}px, ${M.alto / 2}px) scale(${c.z}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) translate(${-c.x}px, ${-c.y}px)` } }, ...kids));
  };
  /**
   * Desenfoque de movimiento REAL por submuestras, solo dentro de las `ventanas` [[a, b], …] (barridos, zooms rápidos):
   * pinta la escena en `muestras` instantes repartidos en el obturador (grados) y los promedia por capas. Fuera de las
   * ventanas cuesta cero. `fn(t)` debe devolver la escena en el instante t.
   */
  const desenfoque = (t, { ventanas, muestras = 6, obturador = 270 }, fn) => {
    if (!ventanas.some(([a, b]) => t >= a && t <= b)) return capa({}, fn(t));
    // igual que CameraMotionBlur de Remotion: muestras en f + 1 − obturador·k/N (k = 1…N), mismo peso, suma plus-lighter
    const fr = obturador / 360, f = t * M.fps;
    return capa({ isolation: "isolate" }, ...Array.from({ length: muestras }, (_, i) => capa({ mixBlendMode: "plus-lighter", opacity: 1 / muestras }, fn((f + 1 - fr * ((i + 1) / muestras)) / M.fps))));
  };

  // ───────────────────────── texto cinético ─────────────────────────
  const GLIFOS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#%&";
  /** Texto que se descifra letra a letra (glifos que se asientan de izquierda a derecha). */
  const Descifra = (t, { texto, t0, dur = 0.6, style }) => {
    const k = (t - t0) / dur; if (k < 0) return null;
    const fr = Math.floor(t * 30);
    const out = Array.from(texto).map((ch, i) => { if (ch === " " || k >= 1) return ch; const u = i / texto.length; if (k > u + 0.25) return ch; if (k < u) return " "; return GLIFOS[(fr * 7 + i * 13) % GLIFOS.length]; }).join("");
    return h("span", { style: { whiteSpace: "pre", ...style } }, out);
  };
  /** Palabras que suben desde su máscara con escalón; salen subiendo en t1. `relleno` = degradado recortado al texto. */
  const Mascara = (t, { texto, t0, t1, escalon = 0.06, dur, style, acento = [], relleno }) => {
    const e = est(), ent = curva("entrada"), d = dur ?? Math.max(0.3, (e.entradaDur || 0.35) * 1.3);
    return h("span", { style: { display: "inline-flex", flexWrap: "wrap", gap: "0 0.26em", ...style } }, texto.split(" ").map((w, i) => {
      const k = tramo(t, t0 + i * escalon, t0 + i * escalon + d, ent), s = t1 === undefined ? 0 : tramo(t, t1 + i * escalon * 0.5, t1 + i * escalon * 0.5 + 0.35, CURVAS.acelera);
      return h("span", { style: { display: "inline-block", overflow: "hidden", padding: "0.04em 0 0.1em" } }, h("span", { style: { display: "inline-block", transform: `translateY(${(1 - k) * 105 - s * 105}%)`, color: acento.includes(w) ? e.acento : undefined,
        ...(relleno ? { background: relleno, webkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}) } }, w));
    }));
  };
  /** Líneas que suben desde su máscara (titulares de agencia). */
  const Lineas = (t, { lineas, t0, t1, escalon = 0.07, dur, style, estiloLinea }) => {
    const e = est(), ent = curva("entrada"), d = dur ?? Math.max(0.16, e.entradaDur || 0.35);
    return h("div", { style }, lineas.map((l, i) => {
      const k = tramo(t, t0 + i * escalon, t0 + i * escalon + d, ent), s = t1 === undefined ? 0 : tramo(t, t1 + i * escalon * 0.5, t1 + i * escalon * 0.5 + 0.3, CURVAS.acelera);
      return h("div", { style: { overflow: "hidden", paddingBottom: "0.06em" } }, h("div", { style: { transform: `translateY(${(1 - k) * 110 - s * 110}%)`, ...(estiloLinea ? estiloLinea(i) : {}) } }, l));
    }));
  };
  /** Letra a letra con escala, subida y desenfoque. */
  const PorLetra = (t, { texto, t0, escalon = 0.03, dur = 0.45, desde = {}, style }) => {
    const { y = 0.4, s = 0.6, blur = 10 } = desde;
    return h("span", { style: { display: "inline-block", whiteSpace: "pre", ...style } }, Array.from(texto).map((ch, i) => {
      const k = tramo(t, t0 + i * escalon, t0 + i * escalon + dur);
      return h("span", { style: { display: "inline-block", opacity: Math.min(1, k * 1.6), transform: `translateY(${(1 - k) * y}em) scale(${s + (1 - s) * k})`, filter: k < 0.98 ? `blur(${(1 - k) * blur}px)` : undefined } }, ch);
    }));
  };
  /** Palabra a palabra (como PorLetra, por palabras; `escalon` número o lista de huecos). */
  const PorPalabra = (t, { texto, t0, escalon = 0.08, dur = 0.5, desde = {}, style }) => {
    const { y = 0.3, s = 0.92, blur = 14 } = desde; let acc = t0;
    return h("span", { style: { display: "inline-flex", flexWrap: "wrap", gap: "0 0.26em", ...style } }, texto.split(" ").map((w, i) => {
      if (i > 0) acc += Array.isArray(escalon) ? escalon[i - 1] ?? escalon[escalon.length - 1] : escalon;
      const k = tramo(t, acc, acc + dur);
      return h("span", { style: { display: "inline-block", opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * y}em) scale(${s + (1 - s) * k})`, filter: k < 0.98 ? `blur(${(1 - k) * blur}px)` : undefined } }, w);
    }));
  };
  /** Palabra que golpea al ritmo: entra grande y desenfocada con estela, se clava y sale de golpe. */
  const Golpe = (t, { texto, t0, t1, desde = 1.6, estela = true, style }) => {
    const e = est(); if (t < t0 || t > t1 + 0.07) return null;
    const k = tramo(t, t0, t0 + 0.28), s = tramo(t, t1, t1 + 0.07, CURVAS.acelera), esc = (desde + (1 - desde) * k) * (1 + s * 0.5), es = estela ? (1 - k) * 0.5 : 0;
    return h("span", { style: { position: "relative", display: "inline-block" } },
      [0.18, 0.36].map((d, i) => es > 0.02 ? h("span", { style: { position: "absolute", left: 0, top: 0, display: "inline-block", whiteSpace: "nowrap", transform: `scale(${esc * (1 + d)})`, filter: `blur(${8 + i * 6}px)`, opacity: es * (0.6 - i * 0.25), color: e.acento, ...style } }, texto) : null),
      h("span", { style: { display: "inline-block", whiteSpace: "nowrap", transform: `scale(${esc})`, filter: k < 0.98 || s > 0 ? `blur(${(1 - k) * 14 + s * 10}px)` : undefined, opacity: Math.min(1, k * 2) * (1 - s), ...style } }, texto));
  };
  /** Cifra que cuenta (expo-out, cifras tabulares, separador de miles siempre: 4.280 y no 4280). */
  const fmt = (v, dec, loc) => new Intl.NumberFormat(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: "always" }).format(v);
  const Contador = (t, { hasta, desde = 0, t0, dur = 1.2, decimales = 0, prefijo = "", sufijo = "", idioma = "es-ES", style }) =>
    h("span", { style: { fontVariantNumeric: "tabular-nums", ...style } }, prefijo + fmt(desde + (hasta - desde) * tramo(t, t0, t0 + dur), decimales, idioma) + sufijo);
  /** Tecleo con cursor opcional. */
  const Teclea = (t, { texto, t0, letrasPorSeg = 30, cursor = false, style }) => {
    if (t < t0) return null;
    const n = Math.min(texto.length, Math.floor((t - t0) * letrasPorSeg)), parpadea = Math.floor(t * 2.2) % 2 === 0;
    return h("span", { style: { whiteSpace: "pre", ...style } }, texto.slice(0, n) + (cursor && (n < texto.length || parpadea) ? "▍" : ""));
  };
  /** Palabra gigante de desenfocada a nítida (intros): entra en 0,15 s, vive y sale seca. */
  const Palabra = (t, { texto, t0, dur = 0.3, color, tam = 280, style }) => {
    const e = est(); if (t < t0 || t > t0 + dur) return null;
    const f = (t - t0) * 60;
    const op = interp(f, [0, 4, dur * 60 - 3, dur * 60 - 1], [0, 1, 1, 0]), blur = interp(f, [0, 9], [14, 0], CURVAS.expo), s = interp(f, [0, 5, 10], [0.8, 1.06, 1]), ls = interp(f, [0, 9], [0.06, -0.015], CURVAS.expo);
    return capa({ display: "flex", alignItems: "center", justifyContent: "center" }, h("div", { style: { fontFamily: e.fuente, fontWeight: 650, fontSize: tam, letterSpacing: `${ls}em`, color: color || e.texto, opacity: op, transform: `scale(${s})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, whiteSpace: "nowrap", ...style } }, texto));
  };
  /** Rodillo: una palabra se va arriba y la siguiente sube (0,22 s). */
  const Rodillo = (t, { palabras, t0, cada = 0.6, style }) => {
    if (t < t0) return null;
    const i = clamp(Math.floor((t - t0) / cada), 0, palabras.length - 1), g = (t - t0 - i * cada) * 60, vieja = i > 0 ? palabras[i - 1] : "";
    const sal = interp(g, [0, 8], [0, -110], CURVAS.acelera), ent = interp(g, [3, 13], [110, 0], CURVAS.expo);
    return h("span", { style: { display: "inline-block", overflow: "hidden", height: "1.15em", verticalAlign: "bottom", ...style } },
      vieja ? h("span", { style: { display: "block", transform: `translateY(${sal}%)` } }, vieja) : null,
      h("span", { style: { display: "block", marginTop: vieja ? "-1.15em" : 0, transform: `translateY(${i === 0 && g > 13 ? 0 : ent}%)` } }, palabras[i]));
  };
  /** Texto en contorno que se dibuja y se rellena (neón). */
  const Neon = (t, { texto, t0, dibuja = 0.9, rellena = 0.4, tam, ancho, color, style }) => {
    const e = est(), c = color || e.acento, k = tramo(t, t0, t0 + dibuja, CURVAS.inOut), r = tramo(t, t0 + dibuja * 0.8, t0 + dibuja * 0.8 + rellena), L = ancho * 3;
    return h("svg", { width: ancho, height: tam * 1.25, style: { overflow: "visible", ...style } }, h("text", { x: "50%", y: tam, textAnchor: "middle", fontFamily: e.fuente, fontWeight: e.peso, fontSize: tam, letterSpacing: e.tracking,
      fill: c, fillOpacity: r, stroke: c, strokeWidth: 2, strokeDasharray: L, strokeDashoffset: L * (1 - k), style: { filter: `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 16px ${c}99)` } }, texto));
  };

  // ───────────────────────── objetos puente y efectos ─────────────────────────
  /** OBJETO PUENTE: forma que cambia de tamaño, radio, color, borde y brillo por claves {t,x,y,w,h,r,o,rz,luz,borde}. */
  const Forma = (t, { claves, fondo, colorBorde, colorLuz, style, key } = {}, ...kids) => {
    const e = est(), fin = claves[claves.length - 1].t;
    if (t < claves[0].t - 0.02 || t > fin + 0.02) return null;
    const p = pista(claves, t, ["x", "y", "w", "h", "r", "o", "rz", "luz", "borde"], { o: 1, w: 100, h: 100, r: 20 });
    if (p.o <= 0.003) return null;
    const bg = typeof fondo === "function" ? fondo(t) : fondo || e.tarjeta, luz = colorLuz || e.acento;
    return h("div", { key, style: { position: "absolute", left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h, borderRadius: Math.min(p.r, Math.min(p.w, p.h) / 2), background: bg, opacity: Math.min(1, p.o), transform: `rotate(${p.rz}deg)`, overflow: "hidden",
      boxShadow: `${p.borde > 0 ? `inset 0 0 0 ${p.borde}px ${colorBorde || e.borde}, ` : ""}0 0 ${60 * p.luz}px ${16 * p.luz}px ${luz}${hex2(Math.min(1, p.luz) * 0.784)}`, ...style } }, ...kids);
  };
  /** Onda de llegada: aro que se abre y se apaga. */
  const Onda = (t, { t0, x = M.ancho / 2, y = M.alto / 2, w, h: alto, radio, crece = 0.45, dur = 0.4, color = "rgba(255,255,255,0.7)", grosor = 2 }) => {
    if (t < t0 || t > t0 + dur) return null;
    const k = tramo(t, t0, t0 + dur), s = 1 + crece * k, H = alto ?? w;
    return h("div", { style: { position: "absolute", left: x - (w * s) / 2, top: y - (H * s) / 2, width: w * s, height: H * s, borderRadius: radio ?? "50%", border: `${grosor}px solid ${color}`, opacity: 0.8 * (1 - k) } });
  };
  /** Anillo de progreso (píldora o círculo) que se dibuja con la misma curva que un Contador. */
  const Progreso = (t, { t0, dur = 0.8, ancho, alto, color, grosor = 4, hasta = 1 }) => {
    const c = color || est().acento, p = hasta * tramo(t, t0, t0 + dur, CURVAS.inOut), r = { x: grosor / 2, y: grosor / 2, width: ancho - grosor, height: alto - grosor, rx: (alto - grosor) / 2, fill: "none" };
    return h("svg", { width: ancho, height: alto, style: { position: "absolute", left: 0, top: 0, overflow: "visible" } },
      h("rect", { ...r, stroke: c, strokeOpacity: 0.18, strokeWidth: grosor }),
      h("rect", { ...r, stroke: c, strokeWidth: grosor, pathLength: 1, strokeDasharray: "1", strokeDashoffset: 1 - p, strokeLinecap: "round", style: { filter: `drop-shadow(0 0 8px ${c})` } }));
  };
  /** Destello que sobreexpone y decae (tapa cortes). */
  const Flash = (t, { t0, dur = 0.25, color = "#FFFFFF", fuerza = 0.9 }) => (t < t0 || t > t0 + dur ? null : capa({ background: color, opacity: fuerza * (1 - tramo(t, t0 + 0.02, t0 + dur)), mixBlendMode: "screen", pointerEvents: "none" }));
  /** Deriva continua (nada queda quieto). */
  const Deriva = (t, { vx = -20, vy = -6, zoom = 0.02, desde = 0 }, ...kids) => { const u = Math.max(0, t - desde); return capa({ transform: `translate(${vx * u}px, ${vy * u}px) scale(${1 + zoom * u})` }, ...kids); };
  /** Zoom que ATRAVIESA un punto (match cut): escala exponencial con desenfoque y ecos. */
  const ZoomAtraves = (t, { t0, t1, ox, oy, hasta = 10, ecos = true }, ...kids) => {
    if (t < t0) return capa({}, ...kids);
    if (t > t1) return null;
    const p = (t - t0) / (t1 - t0), s = Math.pow(hasta, p * p);
    const c = (k, op) => capa({ transform: `scale(${s * (1 + k * 0.04 * p)})`, transformOrigin: `${ox}px ${oy}px`, opacity: op, filter: `blur(${p * 10}px)` }, ...kids);
    return capa({ opacity: 1 - tramo(t, t0 + (t1 - t0) * 0.85, t1, CURVAS.lineal) }, c(0, 1), ...(ecos ? [c(1.2, 0.3 * p), c(2.4, 0.18 * p)] : []));
  };
  /** Fuga de luz de película (crema y luego rojo) que tapa un cambio de escena. */
  const FugaLuz = (t, { t0, dur = 0.4, colores = ["#F3E2A0", "#8A2009"] }) => {
    if (t < t0 || t > t0 + dur) return null;
    const k = (t - t0) / dur, crema = interp(k, [0, 0.3, 0.55], [0, 1, 0]), rojo = interp(k, [0.3, 0.6, 1], [0, 1, 0]);
    return capa({ pointerEvents: "none" },
      capa({ mixBlendMode: "screen", opacity: crema, background: `radial-gradient(60% 80% at 70% 30%, ${colores[0]}, transparent 70%), ${colores[0]}AA` }),
      capa({ opacity: rojo * 0.9, background: `radial-gradient(70% 90% at 30% 70%, ${colores[1]}, ${colores[1]}CC 60%, #1A0505)` }));
  };
  /** Barrido radial de color desde un objeto puente (el fondo de la sección cambia en 0,13 s). */
  const BarridoRadial = (t, { t0, dur = 0.14, x, y, color, borde }) => { if (t < t0) return null; const r = tramo(t, t0, t0 + dur, CURVAS.inOut) * 2300; return capa({ background: `radial-gradient(circle at ${x}px ${y}px, ${color} ${r * 0.86}px, ${borde || color} ${r * 0.95}px, transparent ${r}px)` }); };
  /** Glitch RGB de 0,2 s sobre el contenido. */
  const Glitch = (t, { t0, dur = 0.2 }, ...kids) => {
    if (t < t0 || t > t0 + dur) return capa({}, ...kids);
    const g = Math.floor(((t - t0) * 60) / 2), r = (k) => azar(`gl-${g}-${k}`);
    return capa({},
      capa({ transform: `translateX(${(r(1) - 0.5) * 30}px)`, mixBlendMode: "screen", filter: "sepia(1) saturate(8) hue-rotate(-50deg)", opacity: 0.7 }, ...kids),
      capa({ transform: `translateX(${(r(2) - 0.5) * -30}px)`, mixBlendMode: "screen", filter: "sepia(1) saturate(8) hue-rotate(140deg)", opacity: 0.7 }, ...kids),
      ...Array.from({ length: 7 }, (_, i) => { const y0 = r(10 + i) * 95, hh = 1 + r(20 + i) * 4; return capa({ clipPath: `inset(${y0}% 0 ${100 - y0 - hh}% 0)`, transform: `translateX(${(r(30 + i) - 0.5) * 240}px)` }, ...kids); }));
  };
  /** Chispas que salen de un punto y frenan. */
  const Chispas = (t, { t0, x = M.ancho / 2, y = M.alto / 2, n = 60, colores }) => {
    if (t < t0 || t > t0 + 1.5) return null;
    const f = (t - t0) * 60, cs = colores || [est().acento, "#FFFFFF"];
    return capa({ pointerEvents: "none" }, Array.from({ length: n }, (_, i) => {
      const ang = azar(`ch-a${i}`) * Math.PI * 2, v = 15 + azar(`ch-v${i}`) * 12, d = v * 14 * (1 - Math.exp(-f / 14)), L = 20 + azar(`ch-l${i}`) * 20;
      return h("div", { style: { position: "absolute", left: x + Math.cos(ang) * d, top: y + Math.sin(ang) * d, width: L, height: 4, borderRadius: 2, background: cs[i % cs.length], transform: `rotate(${ang}rad)`, opacity: interp(f, [0, 60, 90], [1, 1, 0]) } });
    }));
  };
  /** Láser de escaneo que barre de x0 a x1 y revela `despues` sobre `antes`. */
  const Escaneo = (t, { t0, dur = 0.35, x0, x1, color, antes, despues }) => {
    const c = color || est().acento, x = x0 + (x1 - x0) * tramo(t, t0, t0 + dur), vis = t >= t0 - 0.07 && t <= t0 + dur + 0.1;
    return capa({}, capa({ clipPath: `inset(0 0 0 ${x}px)` }, antes), capa({ clipPath: `inset(0 ${M.ancho - x}px 0 0)` }, despues),
      vis ? h("div", { style: { position: "absolute", left: x - 2, top: 0, bottom: 0, width: 4, background: c, boxShadow: `0 0 18px ${c}, 0 0 60px ${c}` } }) : null);
  };

  // ───────────────────────── fondos y acabados ─────────────────────────
  const alfa = (n) => hex2(clamp(n));
  /** Halo radial que respira y deriva despacio. */
  const Halo = (t, { color, fuerza = 1, x = 50, y = 55, tam = 55 } = {}) => {
    const c = color || est().acento, cx = x + Math.sin(t * 0.4) * 6, cy = y + Math.cos(t * 0.33) * 5, r = tam * (1 + Math.sin(t * 1.6) * 0.04);
    return capa({ background: `radial-gradient(ellipse ${r}% ${r * 0.9}% at ${cx}% ${cy}%, ${c}${alfa(0.32 * fuerza)} 0%, ${c}${alfa(0.1 * fuerza)} 45%, transparent 75%)` });
  };
  /** Velo de color de esquina POR ENCIMA de todo (multiply): tiñe lo que pasa por debajo. Ponlo el último. */
  const VeloEsquina = (t, { color = "#614D8A", esquina = "abajo-derecha", alcance = 65, fuerza = 1, mezcla = "multiply" } = {}) => {
    const [x, y] = { "abajo-derecha": [100, 100], "abajo-izquierda": [0, 100], "arriba-derecha": [100, 0], "arriba-izquierda": [0, 0] }[esquina];
    const r = alcance * (1 + Math.sin(t * 0.7) * 0.04), hx = color.replace("#", ""), [cr, cg, cb] = [0, 2, 4].map((i) => parseInt(hx.slice(i, i + 2), 16));
    const a = (n) => `rgba(${cr},${cg},${cb},${clamp(n * fuerza).toFixed(3)})`;
    return capa({ pointerEvents: "none", mixBlendMode: mezcla, background: `radial-gradient(${r * 1.85}% ${r * 1.7}% at ${x}% ${y}%, ${a(0.9)} 0%, ${a(0.55)} 22%, ${a(0.28)} 42%, ${a(0.08)} 62%, ${a(0)} 80%)` });
  };
  const Vineta = (t, { fuerza = 0.55 } = {}) => capa({ pointerEvents: "none", background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,${fuerza}) 100%)` });
  /** Grano de película: 12 texturas de ruido con semilla (canvas 256 px, creadas una vez) que cambian cada 2 fotogramas. */
  let texGrano = null;
  const granos = () => {
    if (texGrano) return texGrano;
    texGrano = [];
    for (let k = 0; k < 12; k++) {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      const x = c.getContext("2d"), img = x.createImageData(256, 256);
      for (let i = 0; i < 256 * 256; i++) { const v = Math.floor(azar(`gr${k}-${i}`) * 255); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
      x.putImageData(img, 0, 0); texGrano.push(c.toDataURL("image/png"));
    }
    return texGrano;
  };
  const Grano = (t, { fuerza = 0.05 } = {}) => { const g = granos(), k = Math.floor((t * M.fps) / 2) % g.length; return capa({ pointerEvents: "none", opacity: fuerza, mixBlendMode: "overlay", backgroundImage: `url(${g[k]})`, backgroundSize: "256px 256px" }); };
  /** Luces desenfocadas que derivan. */
  const Bokeh = (t, { color, n = 6, fuerza = 1 } = {}) => {
    const c = color || est().acento, P = [[0.12, 0.2, 260], [0.82, 0.18, 200], [0.7, 0.82, 320], [0.25, 0.78, 180], [0.5, 0.1, 140], [0.93, 0.55, 240], [0.4, 0.6, 200], [0.6, 0.35, 160]].slice(0, n);
    return capa({ pointerEvents: "none" }, P.map(([x, y, r], i) => h("div", { style: { position: "absolute", left: `${(x + Math.sin(t * 0.25 + i) * 0.03) * 100}%`, top: `${(y + Math.cos(t * 0.2 + i * 2) * 0.03) * 100}%`, width: r, height: r, marginLeft: -r / 2, marginTop: -r / 2, borderRadius: r, background: `radial-gradient(circle, ${c}${alfa(0.14 * fuerza)} 0%, transparent 70%)` } })));
  };
  /** Raya de luz que cruza la pantalla. */
  const Destello = (t, { t0, dur = 0.45, y = 540, vertical, color = "255,214,150" }) => {
    const k = (t - t0) / dur; if (k < 0 || k > 1) return null;
    const pos = -400 + (vertical ? M.alto + 400 : M.ancho + 800) * CURVAS.expo(k), a = Math.sin(Math.PI * k);
    return vertical ? h("div", { style: { position: "absolute", top: pos, left: 0, right: 0, height: 360, background: `linear-gradient(180deg, transparent, rgba(${color},${0.5 * a}), transparent)`, mixBlendMode: "screen" } })
      : h("div", { style: { position: "absolute", left: pos, top: y - 3, width: 700, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, rgba(${color},${a}), transparent)`, boxShadow: `0 0 40px rgba(${color},${0.8 * a})` } });
  };
  /** Degradado lateral para leer rótulos aunque pasen piezas por debajo. */
  const Sombra = (t, { lado = "izquierda", fuerza = 1, color = "5,5,5" } = {}) => capa({ pointerEvents: "none", background: lado === "izquierda"
    ? `linear-gradient(90deg, rgba(${color},${0.95 * fuerza}) 0%, rgba(${color},${0.85 * fuerza}) 28%, rgba(${color},0) 45%)` : `linear-gradient(0deg, rgba(${color},${0.9 * fuerza}) 0%, rgba(${color},0) 40%)` });
  /** HUD de agencia: marcas de esquina finas y rótulos monoespaciados. */
  const Hud = (t, { izquierda, derecha, color = "rgba(255,255,255,0.75)", fuente } = {}) => {
    const m = 48, L = 34, esq = (s) => h("div", { style: { position: "absolute", width: L, height: L, borderColor: color, borderStyle: "solid", borderWidth: 0, ...s } });
    return capa({ pointerEvents: "none", fontFamily: fuente || MONO, fontSize: 22, letterSpacing: "0.08em", color },
      esq({ left: m, top: m, borderLeftWidth: 2, borderTopWidth: 2 }), esq({ right: m, top: m, borderRightWidth: 2, borderTopWidth: 2 }),
      esq({ left: m, bottom: m, borderLeftWidth: 2, borderBottomWidth: 2 }), esq({ right: m, bottom: m, borderRightWidth: 2, borderBottomWidth: 2 }),
      izquierda ? h("div", { style: { position: "absolute", left: m + 50, top: m + 4 } }, izquierda) : null,
      derecha ? h("div", { style: { position: "absolute", right: m + 50, top: m + 4 } }, derecha) : null);
  };
  /** Código de tiempo «00:03:12» a partir de t. */
  const timecode = (t) => { const f = Math.floor(t * 24), s = Math.floor(f / 24); return `00:${String(s).padStart(2, "0")}:${String(f % 24).padStart(2, "0")}`; };
  /** Manchas de color que fluyen (Lissajous). `tam` en % del alto del cuadro. */
  const Manchas = (t, { colores, fondo, vel = 1, tam = 70 }) => {
    const w = (t / 10) * Math.PI * 2 * vel;
    return capa({ background: fondo || colores[0], overflow: "hidden" }, colores.map((c, i) => {
      const x = 50 + 32 * Math.sin(w * (0.7 + i * 0.23) + i * 1.9), y = 50 + 28 * Math.cos(w * (0.5 + i * 0.17) + i * 2.7), r = (tam * (0.8 + 0.25 * Math.sin(w * 0.9 + i)) * M.alto) / 100;
      return capa({ background: `radial-gradient(circle ${r}px at ${x}% ${y}%, ${c} 0%, ${c}AA 35%, transparent 70%)` });
    }));
  };
  /** Aurora: cortinas de luz en su `zona` [x,y,w,h] en %. */
  const Aurora = (t, { colores, zona = [0, 0, 100, 60], brillo = 1, vel = 1, columnas = 16, mezcla = "screen", semilla = 0 } = {}) => {
    const e = est(), cs = colores || [e.acento, ...(e.paleta || [])].slice(0, 3), [zx, zy, zw, zh] = zona, tt = t * vel;
    return capa({ pointerEvents: "none", mixBlendMode: mezcla, overflow: "hidden" }, cs.map((c, k) => { const s = semilla + k * 1.7; return Array.from({ length: columnas }, (_, i) => {
      const u = i / (columnas - 1), ola = Math.sin(u * 5.2 + tt * 0.55 + s) * 0.55 + Math.sin(u * 11 - tt * 0.9 + s * 2) * 0.2;
      const x = zx + u * zw + Math.sin(tt * 0.3 + s + u * 3) * zw * 0.02, y = zy + zh * (0.42 + 0.22 * ola + 0.12 * (k - (cs.length - 1) / 2));
      const brilla = 0.55 + 0.45 * Math.sin(u * 7 - tt * 1.6 + s * 3) ** 2, alto = zh * (0.55 + 0.25 * Math.sin(u * 4 + tt * 0.7 + s)), ancho = (zw / columnas) * 2.6;
      const a = 0.34 * brillo * brilla * Math.sin(Math.PI * clamp(u * 1.08 - 0.04));
      return h("div", { style: { position: "absolute", left: `${x - ancho / 2}%`, top: `${y - alto * 0.75}%`, width: `${ancho}%`, height: `${alto}%`, background: `radial-gradient(ellipse 50% 50% at 50% 72%, ${c}${alfa(a)} 0%, ${c}${alfa(a * 0.55)} 32%, ${c}00 72%)`, transform: `skewX(${Math.sin(u * 3 + tt * 0.4 + s) * 12}deg)` } });
    }); }));
  };
  /** Fondo del estilo actual según su `luz` (foco, halo, liso, degradado, manchas, aurora) + bokeh/viñeta/grano. */
  const FondoEstilo = (t, { intensidad = 1, color } = {}) => {
    const e = est(), luz = e.luz || { tipo: "liso", colores: [e.fondo] }, tex = e.texturas || {};
    return capa({ background: e.fondo },
      luz.tipo === "foco" ? capa({ background: `radial-gradient(ellipse 58% 48% at 50% 0%, ${luz.colores[0]} 0%, ${luz.colores[1]} 45%, transparent 100%)`, opacity: intensidad }) : null,
      luz.tipo === "halo" ? Halo(t, { color: color || luz.colores[0], fuerza: 0.6 * intensidad, y: 50, tam: 50 }) : null,
      luz.tipo === "degradado" ? capa({ background: `radial-gradient(ellipse at 50% 45%, ${luz.colores[0]} 0%, ${luz.colores[1]} 60%, ${luz.colores[2]} 100%)` }) : null,
      luz.tipo === "manchas" ? Manchas(t, { colores: luz.colores, fondo: e.fondo }) : null,
      luz.tipo === "aurora" ? Aurora(t, { colores: luz.colores, brillo: intensidad, zona: [-5, -8, 110, 62], mezcla: tex.auroraMezcla || "screen" }) : null,
      tex.bokeh ? Bokeh(t, { color: color || e.acento, fuerza: tex.bokeh }) : null,
      tex.vineta ? Vineta(t, { fuerza: tex.vineta }) : null,
      tex.grano ? Grano(t, { fuerza: tex.grano }) : null);
  };

  // ───────────────────────── elementos externos (imágenes y clips, p. ej. de Higgsfield) ─────────────────────────
  /**
   * Imagen (PNG con alfa, WebP, JPG) integrada: recorte [x,y,w,h] en px de la fuente (como `object-view-box`),
   * ajuste cover/contain, máscara CSS (p. ej. "radial-gradient(...)" para fundir bordes), tinte de color (gradación
   * hacia la paleta: { color, fuerza, modo }), mezcla (screen para fuego/humo sobre negro) y radio.
   */
  const Elemento = (t, { src, ancho, alto, recorte, ajuste = "cover", mascara, color, mezcla, radio, filtro, style, key } = {}) => {
    const img = h("img", { src, key: key ? key + "-img" : undefined, style: { width: "100%", height: "100%", objectFit: ajuste, display: "block", objectViewBox: recorte ? `xywh(${recorte[0]}px ${recorte[1]}px ${recorte[2]}px ${recorte[3]}px)` : undefined, filter: filtro } });
    // el tinte se recorta con el alfa de la propia imagen (si no, tiñe también el hueco transparente y deja un aro)
    const mt = `url("${src}")`, ms = ajuste === "fill" ? "100% 100%" : ajuste === "none" ? "auto" : ajuste;
    const tinte = color && !recorte ? capa({ background: color.color, mixBlendMode: color.modo || "color", opacity: color.fuerza ?? 0.35, webkitMaskImage: mt, maskImage: mt, webkitMaskSize: ms, maskSize: ms, webkitMaskPosition: "center", maskPosition: "center", webkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" })
      : null; // con `recorte` no hay tinte: recorta el fichero (alfa.mjs --recortar) y tiñe sin recorte
    return h("div", { key, style: { position: "relative", width: ancho, height: alto, borderRadius: radio, overflow: radio ? "hidden" : undefined, mixBlendMode: mezcla, webkitMaskImage: mascara, maskImage: mascara, isolation: tinte ? "isolate" : undefined, ...style } }, img, tinte);
  };
  /**
   * Clip de vídeo: HyperFrames lo decodifica y lo sincroniza él (elemento `<video class="clip" data-start>` FIJO en
   * el HTML, fuera del árbol de la escena: si el reconciliador lo recrease, se perdería la sincronía). Esta función
   * solo lo coloca/estila en cada fotograma: colocaMedio("humo", { left: 0, top: 0, opacity: k, mixBlendMode: "screen" }).
   */
  const colocaMedio = (id, estilo) => { const el = document.getElementById(id); if (el) ponEstilo(el, estilo, el.__mgEstilo); if (el) el.__mgEstilo = estilo; };

  // ───────────────────────── sonido y variables ─────────────────────────
  // El render de HyperFrames solo mezcla los <audio class="clip"> ESCRITOS en el HTML (no los creados por JS). Declara
  // el sonido en un <script type="application/json" id="mg-sonido"> y `scripts/mg.mjs` lo convierte en etiquetas
  // <audio> al renderizar (formato en la cabecera de ese script). Los tiempos de los efectos salen de la misma tabla
  // que anima los planos: escríbelos una vez.
  /** Variables de la composición: `--variables '{...}'` del render, `?clave=valor` en la vista previa y los valores por defecto. */
  const variables = (def = {}) => {
    const mgv = window.__MG_VARS || {};
    const hf = window.__hyperframes && typeof window.__hyperframes.getVariables === "function" ? window.__hyperframes.getVariables() || {} : {};
    const q = {}; new URLSearchParams(location.search).forEach((v, k) => { if (k !== "t") { try { q[k] = JSON.parse(v); } catch (e) { q[k] = v; } } });
    return { ...def, ...mgv, ...hf, ...q };
  };

  // ───────────────────────── montar ─────────────────────────
  /**
   * Monta una composición: la escena se repinta en cada fotograma desde una línea de tiempo GSAP en pausa
   * (window.__timelines[id]) que HyperFrames recorre. Vista previa en el navegador: abrir el HTML con ?t=3.2.
   */
  const montar = ({ id, duracion, fps = 60, ancho = 1920, alto = 1080, estilo, escena, fuentes = [INTER] }) => {
    M.fps = fps; M.ancho = ancho; M.alto = alto; if (estilo) M.estilo = estilo;
    const raiz = Array.from(document.querySelectorAll("[data-composition-id]")).find((n) => n.getAttribute("data-composition-id") === id) || document.body;
    let lienzo = raiz.querySelector(":scope > .mg-escena");
    if (!lienzo) { lienzo = document.createElement("div"); lienzo.className = "mg-escena"; Object.assign(lienzo.style, { position: "absolute", left: "0px", top: "0px", width: ancho + "px", height: alto + "px", overflow: "hidden" }); raiz.insertBefore(lienzo, raiz.firstChild); }
    let ultimo = -1;
    const pintar = (t) => { t = clamp(t, 0, duracion); if (t === ultimo) return; ultimo = t; aplica(lienzo, escena(t)); };
    const reloj = { t: 0 };
    const tl = gsap.timeline({ paused: true });
    tl.to(reloj, { t: duracion, duration: duracion, ease: "none", onUpdate: () => pintar(reloj.t) }, 0);
    window.__timelines = window.__timelines || {}; window.__timelines[id] = tl;
    window.addEventListener("hf-seek", (e) => { const s = e && e.detail && typeof e.detail.time === "number" ? e.detail.time : null; if (s !== null) pintar(s); });
    // fuentes: el render espera a que estén cargadas antes de capturar
    window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
    const familias = [...new Set([INTER, ...fuentes].map((f) => String(f).split(",")[0].replace(/["']/g, "").trim()))];
    window.__hf.buildReady.fuentes = Promise.all(familias.flatMap((f) => ["400", "700"].map((p) => document.fonts.load(`${p} 40px "${f}"`)))).then(() => document.fonts.ready).then(() => { ultimo = -1; pintar(reloj.t); });
    const q = new URLSearchParams(location.search).get("t");
    pintar(q ? parseFloat(q) : 0);
    MG.linea = tl;
    return { tl, pintar };
  };

  const MG = {
    h, F, aplica, montar, M, est, titular, capa, lleno, LLENO, CURVAS, bezier, clamp, tramo, ventana, interp, pchip, pista, golpe, azar, muelle,
    curva, muelleEstilo, golpeEstilo, mezclaColor, hex2, BASE, mezclar, ESTILOS, COLORES_AGENCIA: AG, FUENTES: { INTER, SYNE, SERIF, MONO, SORA },
    piezaEn, Movil, entraSale, Tarjeta, Camara2D, camara2DEn, Camara, camaraEn, desenfoque,
    Descifra, Mascara, Lineas, PorLetra, PorPalabra, Golpe, Contador, Teclea, Palabra, Rodillo, Neon,
    Forma, Onda, Progreso, Flash, Deriva, ZoomAtraves, FugaLuz, BarridoRadial, Glitch, Chispas, Escaneo,
    Halo, Vineta, Grano, Bokeh, Destello, VeloEsquina, Sombra, Hud, timecode, Manchas, Aurora, FondoEstilo, Elemento, colocaMedio, variables,
  };
  window.MG = MG;
})();
