// Mapas 3D en perspectiva, estilo navegador de mapas, dibujados por CPU en UN canvas 2D (sin WebGL ni GPU):
// ciudad (generada o con tus datos), cámara con inclinación/giro/distancia, edificios extruidos que crecen desde el
// suelo, parques y árboles, agua, capa de tráfico, rutas que se dibujan con su cabeza, niebla por distancia,
// desenfoque de movimiento por submuestras y proyección de puntos para poner etiquetas HTML encima.
//
// Coordenadas del mundo en METROS: x hacia el este, y hacia el norte, z hacia arriba. La cámara mira a un punto del
// suelo (x, y) desde `dist` metros, con `inclina` grados (0 = cenital, 60–70 = vista de navegación) y `giro` grados.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { pista, type Clave } from "./tiempo";

// ───────── tipos ─────────
export type RGB = [number, number, number];
export type P2 = [number, number];
export type CamMapa = { x: number; y: number; dist: number; inclina: number; giro: number; focal?: number };
export type Edificio = { pts: P2[]; h: number; cx: number; cy: number; id?: string };
export type Arbol = { x: number; y: number; r: number };
export type Ciudad = {
  ancho: number; alto: number; // extensión en metros (centrada en 0,0)
  manzanas: P2[][]; parques: P2[][]; agua: P2[][]; avenidas: { a: P2; b: P2; ancho: number }[];
  edificios: Edificio[]; arboles: Arbol[]; rotondas: { x: number; y: number; r: number }[];
  /** centro del cruce (i, j) de la rejilla de calles: sirve para trazar rutas por las calles */
  cruce: (i: number, j: number) => P2;
};
export type PaletaMapa = {
  fondo: RGB; calle: RGB; acera: RGB; parque: RGB; agua: RGB; arbol: RGB; arbolSombra: RGB;
  pared: RGB; techo: RGB; borde: RGB; niebla: RGB; ruta: RGB; rutaBorde: RGB; trafico: [RGB, RGB, RGB];
};
export type RutaMapa = {
  pts: P2[]; progreso: number; ancho?: number; color?: RGB; borde?: RGB; /** 0–1: halo suave bajo la línea */ halo?: number;
  /** punto que la recorre (en la cabeza): 0 = sin punto */ cabeza?: number;
};
export type ResaltaMapa = { id: string; color: RGB; k: number; /** multiplicador de altura al resaltar */ sube?: number };

// ───────── paletas de partida (cámbialas por las de la marca) ─────────
export const PALETAS_MAPA: Record<"claro" | "noche", PaletaMapa> = {
  claro: {
    fondo: [236, 238, 242], calle: [252, 252, 253], acera: [240, 242, 245], parque: [205, 233, 196], agua: [170, 211, 242],
    arbol: [140, 205, 128], arbolSombra: [96, 168, 92], pared: [224, 228, 235], techo: [253, 253, 254], borde: [200, 206, 215],
    niebla: [238, 240, 244], ruta: [47, 107, 255], rutaBorde: [24, 72, 196], trafico: [[86, 196, 120], [247, 168, 56], [226, 72, 72]],
  },
  noche: {
    fondo: [17, 21, 30], calle: [44, 51, 66], acera: [26, 31, 42], parque: [28, 52, 44], agua: [20, 38, 64],
    arbol: [52, 98, 78], arbolSombra: [30, 64, 52], pared: [48, 56, 74], techo: [70, 80, 102], borde: [86, 98, 124],
    niebla: [17, 21, 30], ruta: [90, 160, 255], rutaBorde: [40, 96, 210], trafico: [[70, 190, 120], [240, 170, 60], [230, 80, 80]],
  },
};

// ───────── azar determinista ─────────
const azar = (n: number, s = 1) => { const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/**
 * Ciudad de ejemplo generada (determinista por `semilla`): manzanas en rejilla con algo de variación, avenidas cada
 * `cadaAvenida` calles, parques, un río opcional y rotondas. Para un sitio REAL, construye un objeto `Ciudad` con tus
 * polígonos (p. ej. de un GeoJSON de OpenStreetMap pasado a metros) y usa el mismo `MapaCanvas`.
 */
export const generaCiudad = (o: {
  semilla?: number; cols?: number; filas?: number; manzana?: number; calle?: number; avenida?: number; cadaAvenida?: number;
  parques?: [number, number][]; rio?: boolean; rotondas?: [number, number][]; alturaMax?: number;
} = {}): Ciudad => {
  const s = o.semilla ?? 7, cols = o.cols ?? 16, filas = o.filas ?? 16, M = o.manzana ?? 80, C = o.calle ?? 14, AV = o.avenida ?? 26;
  const cadaAv = o.cadaAvenida ?? 4, hMax = o.alturaMax ?? 60;
  const parques = new Set((o.parques ?? [[5, 9], [6, 9], [5, 10], [6, 10], [11, 4]]).map(([i, j]) => `${i},${j}`));
  // posiciones de las calles (bordes de manzana) en x e y
  const anchoCalle = (k: number) => (k % cadaAv === 0 ? AV : C);
  const ejes = (n: number) => { const xs: number[] = []; let p = 0; for (let k = 0; k <= n; k++) { xs.push(p + anchoCalle(k) / 2); p += anchoCalle(k) + M * (0.85 + 0.3 * azar(k, s)); } return xs; };
  const ex = ejes(cols), ey = ejes(filas);
  const ox = ex[cols] / 2, oy = ey[filas] / 2;
  const X = ex.map((v) => v - ox), Y = ey.map((v) => v - oy);
  const rioJ = Math.floor(filas * 0.72);
  const manzanas: P2[][] = [], parquesP: P2[][] = [], agua: P2[][] = [], edificios: Edificio[] = [], arboles: Arbol[] = [];
  const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) {
    const x0 = X[i] + anchoCalle(i) / 2, x1 = X[i + 1] - anchoCalle(i + 1) / 2, y0 = Y[j] + anchoCalle(j) / 2, y1 = Y[j + 1] - anchoCalle(j + 1) / 2;
    if (o.rio && j === rioJ) { agua.push(rect(x0 - anchoCalle(i) / 2 - 1, y0 + 6, x1 + anchoCalle(i + 1) / 2 + 1, y1 - 6)); continue; }
    manzanas.push(rect(x0, y0, x1, y1));
    const id = i * 1000 + j;
    if (parques.has(`${i},${j}`)) {
      parquesP.push(rect(x0 + 2, y0 + 2, x1 - 2, y1 - 2));
      const n = Math.round(((x1 - x0) * (y1 - y0)) / 160);
      for (let k = 0; k < n; k++) arboles.push({ x: x0 + 5 + azar(id + k, s + 3) * (x1 - x0 - 10), y: y0 + 5 + azar(id + k, s + 4) * (y1 - y0 - 10), r: 3.2 + azar(id + k, s + 5) * 2.4 });
      continue;
    }
    // parcelas: 2–3 por lado, con patio a veces; altura más alta hacia el centro
    const nx = 2 + Math.floor(azar(id, s + 1) * 2), ny = 2 + Math.floor(azar(id, s + 2) * 2);
    const centro = 1 - Math.min(1, Math.hypot((x0 + x1) / 2, (y0 + y1) / 2) / (Math.min(ox, oy) * 1.1));
    for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) {
      const q = id * 16 + a * 4 + b;
      if (nx > 2 && ny > 2 && a === 1 && b === 1) continue; // patio interior
      if (azar(q, s + 6) < 0.06) continue; // solar vacío
      const px0 = x0 + ((x1 - x0) * a) / nx, px1 = x0 + ((x1 - x0) * (a + 1)) / nx, py0 = y0 + ((y1 - y0) * b) / ny, py1 = y0 + ((y1 - y0) * (b + 1)) / ny;
      const m = 2.2 + azar(q, s + 7) * 2.6;
      const h = 9 + (hMax - 9) * Math.pow(azar(q, s + 8), 2.2) * (0.35 + 0.65 * centro);
      const pts = rect(px0 + m, py0 + m, px1 - m, py1 - m);
      edificios.push({ pts, h, cx: (px0 + px1) / 2, cy: (py0 + py1) / 2, id: `e${q}` });
    }
    // árboles de alineación en las aceras
    for (let k = 0; k < 4; k++) if (azar(id + k, s + 9) < 0.55) arboles.push({ x: x0 + 3 + ((x1 - x0 - 6) * (k + 0.5)) / 4, y: y0 - 3, r: 2.6 + azar(id + k, s + 10) });
  }
  const avenidas: Ciudad["avenidas"] = [];
  for (let k = 0; k <= cols; k += cadaAv) avenidas.push({ a: [X[k], Y[0]], b: [X[k], Y[filas]], ancho: AV });
  for (let k = 0; k <= filas; k += cadaAv) avenidas.push({ a: [X[0], Y[k]], b: [X[cols], Y[k]], ancho: AV });
  const rotondas = (o.rotondas ?? [[cadaAv, cadaAv]]).map(([i, j]) => ({ x: X[i], y: Y[j], r: AV * 1.6 }));
  // quitar lo que pisa las rotondas
  const fuera = (x: number, y: number) => rotondas.every((r) => Math.hypot(x - r.x, y - r.y) > r.r + 8);
  return {
    ancho: X[cols] - X[0], alto: Y[filas] - Y[0], manzanas,
    parques: parquesP, agua, avenidas, rotondas,
    edificios: edificios.filter((e) => fuera(e.cx, e.cy)), arboles: arboles.filter((a) => fuera(a.x, a.y)),
    cruce: (i, j) => [X[Math.max(0, Math.min(cols, i))], Y[Math.max(0, Math.min(filas, j))]],
  };
};

// ───────── proyección ─────────
/** Cámara de mapa → función que lleva un punto del mundo (x, y, z) a pantalla. Devuelve null si queda detrás. */
export const proyectorMapa = (cam: CamMapa, w: number, h: number) => {
  const b = (cam.giro * Math.PI) / 180, f = (Math.max(0, Math.min(85, cam.inclina)) * Math.PI) / 180;
  const cb = Math.cos(b), sb = Math.sin(b), cf = Math.cos(f), sf = Math.sin(f), F = cam.focal ?? h * 1.15;
  const cerca = 2;
  const aCam = (x: number, y: number, z: number) => {
    const px = x - cam.x, py = y - cam.y;
    const x1 = px * cb + py * sb, y1 = -px * sb + py * cb;
    return { sx: x1, sy: y1 * cf + z * sf, d: y1 * sf - z * cf + cam.dist };
  };
  const aPant = (c: { sx: number; sy: number; d: number }) => ({ x: w / 2 + (F * c.sx) / c.d, y: h / 2 - (F * c.sy) / c.d, d: c.d, k: F / c.d });
  const punto = (x: number, y: number, z = 0) => { const c = aCam(x, y, z); return c.d < cerca ? null : aPant(c); };
  // posición de la cámara en el mundo (para saber qué paredes miran hacia ella): en el marco girado está en (0, −D·sen f)
  const ojoX = cam.x + sb * cam.dist * sf, ojoY = cam.y - cb * cam.dist * sf, ojoZ = cam.dist * cf;
  /** polígono del mundo → polígono de pantalla, recortado contra el plano cercano */
  const poligono = (pts: [number, number, number][]) => {
    const cs = pts.map(([x, y, z]) => aCam(x, y, z));
    let out: { sx: number; sy: number; d: number }[] = [];
    for (let i = 0; i < cs.length; i++) {
      const A = cs[i], B = cs[(i + 1) % cs.length];
      const ain = A.d >= cerca, bin = B.d >= cerca;
      if (ain) out.push(A);
      if (ain !== bin) { const u = (cerca - A.d) / (B.d - A.d); out.push({ sx: A.sx + (B.sx - A.sx) * u, sy: A.sy + (B.sy - A.sy) * u, d: cerca }); }
    }
    if (out.length < 3) out = [];
    return out.map(aPant);
  };
  return { punto, poligono, ojo: { x: ojoX, y: ojoY, z: ojoZ }, F };
};

/** Cámara de mapa por claves (PCHIP, como `pista`): {t, x, y, dist, inclina, giro}. */
export const camaraMapa = (claves: Clave[], t: number): CamMapa =>
  pista(claves, t, ["x", "y", "dist", "inclina", "giro"] as const, { x: 0, y: 0, dist: 600, inclina: 0, giro: 0 }) as CamMapa;

// ───────── utilidades de ruta ─────────
/** Longitud acumulada de una polilínea y punto a una distancia dada (para la cabeza de la ruta y el seguimiento de cámara). */
export const medirRuta = (pts: P2[]) => {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1];
  const en = (u: number): { x: number; y: number; ang: number } => {
    const L = Math.max(0, Math.min(1, u)) * total;
    let i = 1; while (i < acc.length - 1 && acc[i] < L) i++;
    const a = pts[i - 1], b = pts[i], k = (L - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]);
    return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
  };
  const hasta = (u: number): P2[] => {
    const L = Math.max(0, Math.min(1, u)) * total, out: P2[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) { if (acc[i] <= L) out.push(pts[i]); else { const p = en(u); out.push([p.x, p.y]); break; } }
    return out;
  };
  return { total, en, hasta };
};
/** Ruta por la rejilla de calles: lista de cruces (i, j) → polilínea en metros. */
export const rutaPorCruces = (ciudad: Ciudad, cruces: [number, number][]): P2[] => cruces.map(([i, j]) => ciudad.cruce(i, j));

// ───────── dibujo ─────────
const mezcla = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const suave = (a: number, b: number, x: number) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export type OpcionesMapa = {
  ciudad: Ciudad; cam: CamMapa; paleta?: PaletaMapa; ancho?: number; alto?: number;
  /** altura de cada edificio (0–1) en este instante: para que crezcan desde el suelo por olas */
  crece?: (e: Edificio) => number;
  rutas?: RutaMapa[]; resalta?: ResaltaMapa[]; trafico?: number; /** 0–1 */
  niebla?: [number, number]; /** distancias (m) donde empieza y termina la niebla */
  arboles?: boolean;
  /** flechas pintadas en el suelo que avanzan por una polilínea (giro siguiente, sentido de la marcha) */
  flechas?: { pts: P2[]; fase: number; color?: RGB; tam?: number; paso?: number; alfa?: number }[];
  /** ondas en el suelo (aro que se abre al caer un pin): radio en metros y alfa */
  ondas?: { x: number; y: number; r: number; alfa: number; color?: RGB; grosor?: number }[];
};

export const dibujaMapa = (ctx: CanvasRenderingContext2D, o: OpcionesMapa, alfa = 1) => {
  const W = o.ancho ?? 1920, H = o.alto ?? 1080, P = o.paleta ?? PALETAS_MAPA.claro, ci = o.ciudad;
  const pr = proyectorMapa(o.cam, W, H);
  const [n0, n1] = o.niebla ?? [o.cam.dist * 1.6, o.cam.dist * 4.5];
  const niebla = (c: RGB, d: number) => mezcla(c, P.niebla, suave(n0, n1, d) * 0.92);
  const lejos = n1 * 1.05;
  ctx.globalAlpha = alfa;
  ctx.fillStyle = css(P.niebla); ctx.fillRect(0, 0, W, H);
  const relleno = (poly: { x: number; y: number; d: number }[], c: RGB, a = 1) => {
    if (poly.length < 3) return;
    let dm = 0, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const p of poly) { dm += p.d; if (p.x < minx) minx = p.x; if (p.x > maxx) maxx = p.x; if (p.y < miny) miny = p.y; if (p.y > maxy) maxy = p.y; }
    if (maxx < 0 || minx > W || maxy < 0 || miny > H) return;
    dm /= poly.length; if (dm > lejos) return;
    ctx.fillStyle = css(niebla(c, dm), a); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath(); ctx.fill();
  };
  const suelo = (pts: P2[], c: RGB, z = 0, a = 1) => relleno(pr.poligono(pts.map(([x, y]) => [x, y, z] as [number, number, number])), c, a);
  // tira de suelo (calle, ruta, tráfico) de un segmento con su ancho real en metros: así la perspectiva la estrecha sola
  const tira = (a: P2, b: P2, ancho: number, c: RGB, z = 0.05) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * ancho / 2, ny = (dx / L) * ancho / 2;
    suelo([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], c, z);
  };
  const disco = (x: number, y: number, r: number, c: RGB, z = 0.06, n = 18) => {
    const pts: P2[] = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    suelo(pts, c, z);
  };
  // 1 · suelo: la calle es el fondo; encima, aceras/manzanas, agua y parques
  const mx = ci.ancho / 2 + 400, my = ci.alto / 2 + 400;
  suelo([[-mx, -my], [mx, -my], [mx, my], [-mx, my]], P.calle);
  for (const m of ci.manzanas) suelo(m, P.acera);
  for (const a of ci.agua) suelo(a, P.agua);
  for (const p of ci.parques) suelo(p, P.parque);
  for (const r of ci.rotondas) { disco(r.x, r.y, r.r, P.calle, 0.04, 28); disco(r.x, r.y, r.r * 0.55, P.parque, 0.08, 28); }
  // 2 · tráfico: líneas finas de color a los lados de las avenidas (verde / naranja / rojo por tramos)
  if ((o.trafico ?? 0) > 0.01) {
    for (let v = 0; v < ci.avenidas.length; v++) {
      const { a, b, ancho } = ci.avenidas[v];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 60));
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      for (const lado of [-1, 1]) for (let k = 0; k < n; k++) {
        const u0 = k / n, u1 = Math.min(1, (k + 0.92) / n) * Math.min(1, (o.trafico ?? 0) * 1.0001);
        if (u1 <= u0) continue;
        const nivel = azar(v * 100 + k + (lado > 0 ? 50 : 0), 9); const c = P.trafico[nivel < 0.6 ? 0 : nivel < 0.85 ? 1 : 2];
        const off = lado * ancho * 0.3;
        tira([a[0] + ux * L * u0 - uy * off, a[1] + uy * L * u0 + ux * off], [a[0] + ux * L * u1 - uy * off, a[1] + uy * L * u1 + ux * off], 2.2, c, 0.07);
      }
    }
  }
  // 3 · rutas: borde, núcleo y halo, hasta su progreso
  for (const r of o.rutas ?? []) {
    if (r.progreso <= 0) continue;
    const tramoPts = medirRuta(r.pts).hasta(r.progreso), A = r.ancho ?? 9;
    if (r.halo) for (let i = 1; i < tramoPts.length; i++) tira(tramoPts[i - 1], tramoPts[i], A * 2.6, mezcla(P.calle, r.color ?? P.ruta, 0.28 * r.halo), 0.09);
    for (let i = 1; i < tramoPts.length; i++) tira(tramoPts[i - 1], tramoPts[i], A * 1.35, r.borde ?? P.rutaBorde, 0.1);
    for (const p of tramoPts.slice(1, -1)) disco(p[0], p[1], A * 0.675, r.borde ?? P.rutaBorde, 0.1, 12);
    for (let i = 1; i < tramoPts.length; i++) tira(tramoPts[i - 1], tramoPts[i], A, r.color ?? P.ruta, 0.11);
    for (const p of tramoPts.slice(1, -1)) disco(p[0], p[1], A * 0.5, r.color ?? P.ruta, 0.11, 12);
  }
  // flechas en el suelo (chevrons) que corren por la polilínea: fase en metros recorridos
  for (const f of o.flechas ?? []) {
    const m = medirRuta(f.pts), s = f.tam ?? 7, paso = f.paso ?? s * 2.2, t2 = s * 0.42, c = f.color ?? P.ruta;
    for (let L = ((f.fase % paso) + paso) % paso; L < m.total; L += paso) {
      const p = m.en(L / m.total), a = (p.ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
      const loc: P2[] = [[-s, s], [0, 0], [-s, -s], [-s + t2, -s], [t2, 0], [-s + t2, s]];
      const vis = Math.min(1, L / (s * 2), (m.total - L) / (s * 2)) * (f.alfa ?? 1); // entran y salen por los extremos
      if (vis <= 0.02) continue;
      suelo(loc.map(([x, y]) => [p.x + x * ca - y * sa, p.y + x * sa + y * ca] as P2), c, 0.12, vis);
    }
  }
  // ondas en el suelo
  for (const w of o.ondas ?? []) {
    if (w.alfa <= 0.01 || w.r <= 0) continue;
    const g = w.grosor ?? Math.max(1.5, w.r * 0.12), n = 32, ext: P2[] = [], int: P2[] = [];
    for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI * 2; ext.push([w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r]); int.push([w.x + Math.cos(a) * Math.max(0, w.r - g), w.y + Math.sin(a) * Math.max(0, w.r - g)]); }
    for (let k = 0; k < n; k++) suelo([ext[k], ext[k + 1], int[k + 1], int[k]], w.color ?? P.trafico[2], 0.13, w.alfa);
  }
  // 4 · edificios y árboles, de lejos a cerca (pintor)
  type Obj = { d: number; pinta: () => void };
  const objs: Obj[] = [];
  const res = new Map((o.resalta ?? []).filter((r) => r.k > 0.001).map((r) => [r.id, r]));
  const luz: P2 = [-0.55, 0.83];
  for (const e of ci.edificios) {
    const c0 = pr.punto(e.cx, e.cy, 0); if (!c0 || c0.d > lejos) continue;
    if (c0.x < -W * 0.6 || c0.x > W * 1.6 || c0.y < -H * 0.8 || c0.y > H * 1.8) continue;
    const g = o.crece ? o.crece(e) : 1; const r = res.get(e.id ?? "");
    const h = e.h * g * (r ? 1 + (r.sube ?? 0) * r.k : 1);
    if (h < 0.3) continue;
    objs.push({ d: c0.d, pinta: () => {
      const pared = r ? mezcla(P.pared, r.color, r.k * 0.85) : P.pared, techo = r ? mezcla(P.techo, r.color, r.k) : P.techo;
      const n = e.pts.length;
      for (let i = 0; i < n; i++) {
        const a = e.pts[i], b = e.pts[(i + 1) % n];
        const ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L; // normal hacia fuera (polígono antihorario)
        const mx2 = (a[0] + b[0]) / 2, my2 = (a[1] + b[1]) / 2;
        if ((pr.ojo.x - mx2) * nx + (pr.ojo.y - my2) * ny <= 0) continue; // pared de espaldas
        const lum = 0.8 + 0.17 * (nx * luz[0] + ny * luz[1]);
        relleno(pr.poligono([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], h], [a[0], a[1], h]]), [pared[0] * lum, pared[1] * lum, pared[2] * lum]);
      }
      const tp = pr.poligono(e.pts.map(([x, y]) => [x, y, h] as [number, number, number]));
      relleno(tp, techo);
      const aA = 0.7 * Math.min(1, Math.max(0, (c0.k - 0.5) / 1)); // de lejos, sin arista (si no, el mapa parece una malla)
      if (tp.length > 2 && c0.d < lejos * 0.7 && aA > 0.02) { // arista del techo: da nitidez de maqueta
        ctx.strokeStyle = css(niebla(r ? mezcla(P.borde, r.color, r.k) : P.borde, c0.d), aA); ctx.lineWidth = Math.max(0.5, Math.min(1.6, c0.k * 0.35));
        ctx.beginPath(); ctx.moveTo(tp[0].x, tp[0].y); for (let i = 1; i < tp.length; i++) ctx.lineTo(tp[i].x, tp[i].y); ctx.closePath(); ctx.stroke();
      }
    } });
  }
  if (o.arboles !== false) for (const a of ci.arboles) {
    const c = pr.punto(a.x, a.y, a.r * 1.1); if (!c || c.d > lejos * 0.8) continue;
    const R = a.r * c.k; if (R < 0.6 || c.x < -R || c.x > W + R || c.y < -R || c.y > H + R) continue;
    objs.push({ d: c.d, pinta: () => {
      ctx.fillStyle = css(niebla(P.arbolSombra, c.d)); ctx.beginPath(); ctx.arc(c.x, c.y + R * 0.18, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css(niebla(P.arbol, c.d)); ctx.beginPath(); ctx.arc(c.x - R * 0.12, c.y - R * 0.1, R * 0.86, 0, Math.PI * 2); ctx.fill();
    } });
  }
  objs.sort((a, b) => b.d - a.d);
  for (const ob of objs) ob.pinta();
  // 5 · cabeza de las rutas (siempre encima): punto con aro blanco y pulso
  for (const r of o.rutas ?? []) {
    if (!r.cabeza || r.progreso <= 0) continue;
    const p = medirRuta(r.pts).en(r.progreso), c = pr.punto(p.x, p.y, 0.5); if (!c) continue;
    const R = Math.max(6, Math.min(22, (r.ancho ?? 9) * 0.9 * c.k)) * r.cabeza;
    ctx.fillStyle = css(r.color ?? P.ruta, 0.22); ctx.beginPath(); ctx.arc(c.x, c.y, R * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(c.x, c.y, R * 1.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(r.color ?? P.ruta); ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
};

/**
 * El mapa en un canvas. `submuestras` > 1 = desenfoque de movimiento real: se dibuja el mapa en N instantes del
 * fotograma (`opcionesEn(t)` con t repartido en `obturador` s) y se promedian. Úsalo SOLO en los barridos rápidos
 * (cuesta N veces más). Nada de `filter: blur` CSS a pantalla completa.
 */
export const MapaCanvas: React.FC<OpcionesMapa & {
  t: number; opcionesEn?: (t: number) => OpcionesMapa; submuestras?: number; obturador?: number; style?: React.CSSProperties;
}> = (p) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const aparte = useRef<HTMLCanvasElement | null>(null);
  const W = p.ancho ?? 1920, H = p.alto ?? 1080;
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d", { willReadFrequently: true })!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = Math.max(1, Math.round(p.submuestras ?? 1));
    if (n === 1 || !p.opcionesEn) { dibujaMapa(ctx, p); return; }
    // promedio progresivo de IMÁGENES: cada submuestra se pinta opaca en un canvas aparte y se suma con alfa 1/(k+1).
    // (Pintarla directamente con alfa transparenta las paredes tapadas: edificios fantasma y un salto al activarlo.)
    if (!aparte.current) { aparte.current = document.createElement("canvas"); aparte.current.width = W; aparte.current.height = H; }
    const cx2 = aparte.current.getContext("2d", { willReadFrequently: true })!;
    const obt = p.obturador ?? 1 / 60;
    for (let k = 0; k < n; k++) {
      dibujaMapa(cx2, p.opcionesEn(p.t - obt * (k / n)));
      ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(aparte.current, 0, 0);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, ...p.style }} />;
};

/** Para poner HTML (pines, etiquetas, tarjetas) pegado a un punto del mapa: misma cámara, misma proyección. */
export const enMapa = (cam: CamMapa, x: number, y: number, z = 0, ancho = 1920, alto = 1080) => proyectorMapa(cam, ancho, alto).punto(x, y, z);

/** Crecimiento por ola desde un centro: los edificios suben desde el suelo según su distancia (t0 + d/vel). */
export const olaCrece = (t: number, t0: number, cx: number, cy: number, vel = 500, dur = 0.55) => (e: Edificio) => {
  const u = Math.max(0, Math.min(1, (t - t0 - Math.hypot(e.cx - cx, e.cy - cy) / vel) / dur));
  return 1 - Math.pow(1 - u, 3) + Math.sin(u * Math.PI) * 0.06; // sale rápido y asienta con un pelo de sobrepaso
};
