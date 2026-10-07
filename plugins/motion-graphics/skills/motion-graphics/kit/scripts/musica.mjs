// Sintetiza una pista de música electrónica (120 BPM, La menor) entera en local: sin APIs, sin muestras, sin dependencias.
// Uso: node scripts/musica.mjs <salida.wav> [--config <fichero.json>] [--buses]   (--buses: RMS de cada bus antes de mezclar)
// Sin --config sale la pista de siempre (36 s, 120 BPM). Con --config, el JSON sobreescribe lo que traiga:
//   duracion (s, 36) · bpm (120) · fundido (s de fundido final, 0.8) · transponer (semitonos sobre todas las notas, 0)
//   progresion (["Am","F","C","G"], un acorde por compás desde inicioProgresion) · progresionIntro (["Am","G"], antes de esa hora)
//   inicioProgresion (s, 4; múltiplo del compás) · acordesDef ({ "Dm": { raiz, acorde: [...], arp: [3 notas] } }, MIDI; se suman a AC)
//   melodia ({ acorde: [[semicorchea, semicorcheas, MIDI], ...] }; acorde sin melodía = el lead calla) · patrones ({ "C": [8 índices] })
//   secciones: [{ nombre, desde, hasta, groove?: true (= bombo+palmas+charles+bajo+acordes 1 a 2600 Hz), bombo, palmas: true|"filtradas",
//               charles, bajo, acordes: 0–1, acordesCorte: Hz, acordesTransp: semitonos (−12 = pad grave), arp: "A"|"B", arpCorte: [Hz, Hz],
//               lead, fase: s (desplaza la rejilla de semicorcheas de la sección; 0 por defecto) }]  (ordenadas y sin solaparse)
//   eventos: [{ t, tipo, ... }] con tipo = "golpe" {fuerza, grave (×sub, 1)} · "crash" {nivel} · "subida" {hasta, nivel} · "redoble" {hasta}
//            "final" {fuerza (1), grave (1), acorde (true), raiz, notas} (impacto + crash + bombo + bajo + acorde que decae)
//            "tics" {hasta, paso (s), nivel} (tic-tac agudo de tensión) · "acentos" {tiempos: [s...], fuerza, palma (true), acorde (true)}
//            "silencio" {hasta, nivel (0.02)} (baja TODA la mezcla, colas incluidas; rampa de 15 ms antes de t, vuelve de golpe en hasta)
//   mezcla: { bus: [volumen, bombeo 0–1] } (solo los buses que cambien: bombo palmas charles bajo acordes arp lead fx eco reverb)
//   caracter: { brillo (×cortes de acordes/arp/lead, 1), pegadaBombo (×clic de ataque del bombo, 1), acordes/arp/lead (×volumen, 1) }
// Ejemplos: motion/musica/*.json. Con --config, el informe da además el RMS 50 ms antes/después de cada golpe.
// Flujo: notas → buses (con bombeo, eco y reverb) → limitador propio → loudnorm de ffmpeg en dos pasadas → WAV 44,1 kHz 16 bits.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ejecuta, ffMide, jsonLoudnorm, FFMPEG } from "./lib.mjs";

const ARGS = process.argv.slice(2), I_CFG = ARGS.indexOf("--config");
const CFG = I_CFG >= 0 ? JSON.parse(fs.readFileSync(ARGS[I_CFG + 1], "utf8")) : {};
const SR = 44100, DUR = CFG.duracion ?? 36, N = Math.round(DUR * SR);
const BPM = CFG.bpm ?? 120, PULSO = 60 / BPM, SEMI = PULSO / 4, COMPAS = 4 * PULSO; // pulso 0,5 s · semicorchea 0,125 s · compás 2 s
const LUFS = -14, TECHO_TP = -1, TECHO_LIMITADOR = -1.8; // dBFS de muestra; deja margen para los picos entre muestras
const FUNDIDO = CFG.fundido ?? 0.8; // s de fundido al final (la cola del golpe final muere justo en DUR)
const TRANSP = CFG.transponer ?? 0, tr = (m) => m + TRANSP;
const CAR = { brillo: 1, pegadaBombo: 1, acordes: 1, arp: 1, lead: 1, ...CFG.caracter };

// ── Estructura (segundos). Cada sección dice qué capas suenan; los golpes, crashes, subidas y redobles van en EVENTOS.
// palmas: true | "filtradas" · acordes: nivel 0–1 · arp: "A" (sube) | "B" (variación, más aguda) · arpCorte: [Hz al empezar, Hz al acabar]
const GROOVE = { bombo: true, palmas: true, charles: true, bajo: true, acordes: 1, acordesCorte: 2600 };
const SECCIONES_36 = [
  { nombre: "intro",     desde: 0,    hasta: 4,    arp: "A", arpCorte: [280, 4500], acordes: 0.3, acordesCorte: 700 }, // tensión: el arpegio se abre
  { nombre: "drop",      desde: 4,    hasta: 10,   ...GROOVE, arp: "A", arpCorte: [4500, 4500] },
  { nombre: "groove",    desde: 10,   hasta: 16,   ...GROOVE, arp: "A", arpCorte: [5500, 5500] },
  { nombre: "variacion", desde: 16,   hasta: 23,   ...GROOVE, arp: "B", arpCorte: [6000, 6000], lead: true },
  { nombre: "corte",     desde: 23,   hasta: 24,   bajo: true, palmas: "filtradas" },                                  // mini corte
  { nombre: "vuelta",    desde: 24,   hasta: 28,   ...GROOVE, arp: "A", arpCorte: [5500, 5500] },
  { nombre: "cumbre",    desde: 28,   hasta: 32,   ...GROOVE, arp: "B", arpCorte: [6500, 6500], lead: true },
  { nombre: "subida",    desde: 32,   hasta: 34.5, ...GROOVE, acordesCorte: 3400, arp: "A", arpCorte: [5000, 8000] },
  { nombre: "tension",   desde: 34.5, hasta: 35,   acordes: 0.3, acordesCorte: 900 },                                 // hueco antes del golpe
  { nombre: "final",     desde: 35,   hasta: 36 },                                                                     // solo el golpe final y su cola
];
const SECCIONES = CFG.secciones ? CFG.secciones.map(({ groove, ...s }) => (groove ? { ...GROOVE, ...s } : s)) : SECCIONES_36;
const EVENTOS_36 = [
  { t: 0, tipo: "subida", hasta: 4, nivel: 0.3 },
  { t: 0, tipo: "redoble", hasta: 4 },
  { t: 4, tipo: "golpe", fuerza: 1 }, { t: 4, tipo: "crash", nivel: 1 },          // DROP
  { t: 10, tipo: "golpe", fuerza: 0.55 }, { t: 10, tipo: "crash", nivel: 0.8 },   // cambio de sección en el vídeo
  { t: 16, tipo: "golpe", fuerza: 0.7 }, { t: 16, tipo: "crash", nivel: 0.9 },
  { t: 23, tipo: "subida", hasta: 24, nivel: 0.4 },
  { t: 24, tipo: "golpe", fuerza: 0.5 }, { t: 24, tipo: "crash", nivel: 0.8 },
  { t: 26, tipo: "redoble", hasta: 28 },
  { t: 28, tipo: "golpe", fuerza: 0.6 }, { t: 28, tipo: "crash", nivel: 0.9 },
  { t: 32, tipo: "subida", hasta: 35, nivel: 0.42 },
  { t: 35, tipo: "final" },                                                        // impacto grave + acorde completo
];
const EVENTOS = CFG.eventos ?? EVENTOS_36;
// Progresión menor (un acorde por compás desde el drop): Am–F–C–G. raiz = bajo, acorde = supersierra, arp = tríada aguda.
const AC = {
  Am: { raiz: 33, acorde: [57, 60, 64, 69], arp: [69, 72, 76] },
  F:  { raiz: 29, acorde: [57, 60, 65, 69], arp: [65, 69, 72] },
  C:  { raiz: 36, acorde: [55, 60, 64, 67], arp: [67, 72, 76] },
  G:  { raiz: 31, acorde: [55, 59, 62, 67], arp: [67, 71, 74] },
  ...CFG.acordesDef,
};
const PROG = CFG.progresion ?? ["Am", "F", "C", "G"], PROG_INTRO = CFG.progresionIntro ?? ["Am", "G"], INICIO_PROG = CFG.inicioProgresion ?? 4;
// Patrones del arpegio (índices sobre la tríada y su octava: 0,1,2 = tríada · 3,4,5 = una octava más).
const PATRON = { A: [0, 1, 2, 3, 1, 2, 3, 4], B: [3, 5, 4, 2, 3, 1, 2, 0], ...CFG.patrones };
// Melodía del lead por acorde: [semicorchea de inicio, semicorcheas de duración, nota MIDI].
const MELODIA = {
  C:  [[0, 3, 76], [3, 3, 79], [6, 2, 76], [8, 2, 74], [10, 2, 72], [12, 4, 74]],
  G:  [[0, 3, 74], [3, 3, 79], [6, 2, 81], [8, 2, 79], [10, 6, 74]],
  Am: [[0, 3, 76], [3, 3, 81], [6, 2, 84], [8, 2, 83], [10, 2, 81], [12, 4, 76]],
  F:  [[0, 3, 81], [3, 3, 79], [6, 2, 77], [8, 4, 76], [12, 4, 72]],
  ...CFG.melodia,
};
if (TRANSP) { // transporta todo (las notas del golpe final se transportan al usarlas)
  for (const a of Object.values(AC)) Object.assign(a, { raiz: tr(a.raiz), acorde: a.acorde.map(tr), arp: a.arp.map(tr) });
  for (const k of Object.keys(MELODIA)) MELODIA[k] = MELODIA[k].map(([i, d, m]) => [i, d, tr(m)]);
}
// Mezcla: [volumen, profundidad del bombeo (sidechain) 0–1]. Bombo y bajo al centro; acordes y arpegio abiertos.
const MEZCLA = {
  bombo: [1.0, 0], palmas: [1.5, 0], charles: [0.9, 0], bajo: [0.62, 0.85], acordes: [0.62, 0.65],
  arp: [0.36, 0.35], lead: [0.36, 0.3], fx: [0.75, 0], eco: [0.45, 0.4], reverb: [1.3, 0.4],
  ...CFG.mezcla,
};
for (const k of ["acordes", "arp", "lead"]) if (CAR[k] !== 1) MEZCLA[k] = [MEZCLA[k][0] * CAR[k], MEZCLA[k][1]];

// ── Utilidades
const muestras = (s) => Math.max(1, Math.round(s * SR));
const curva = (k, p) => Math.pow(Math.min(1, Math.max(0, k)), p);
const lerp = (a, b, k) => a + (b - a) * k;
const lerpExp = (a, b, k) => a * Math.pow(b / a, Math.min(1, Math.max(0, k)));
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const paneo = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
const rng = (semilla) => { let a = semilla >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1; }; };
let semillas = 100;
class Filtro {
  constructor(tipo) { this.tipo = tipo; this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(f, q) {
    const w = (2 * Math.PI * Math.min(Math.max(f, 20), SR * 0.45)) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    const [b0, b1, b2] = this.tipo === "lp" ? [(1 - cs) / 2, 1 - cs, (1 - cs) / 2] : this.tipo === "hp" ? [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2] : [al, 0, -al];
    const a0 = 1 + al; Object.assign(this, { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cs) / a0, a2: (1 - al) / a0 });
    return this;
  }
  run(x) { const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
/** Envolvente ADSR (s). Sube en `a`, cae a `s` en `d`, se mantiene hasta `dur` y se apaga en `r` desde donde esté: sin saltos, sin clics. */
const adsr = (t, dur, a, d, s, r) => {
  const nivel = (u) => (u < a ? u / a : u < a + d ? 1 - (1 - s) * ((u - a) / d) : s);
  if (t < dur) return nivel(t);
  const k = (t - dur) / r;
  return k >= 1 ? 0 : nivel(dur) * (1 - k) * (1 - k);
};
/** Rampa de entrada y salida (s) para sonidos de duración fija. */
const bordes = (t, len, ent = 0.001, sal = 0.02) => Math.min(1, t / ent, (len - t) / sal);
// Osciladores con PolyBLEP (suaviza el salto de la sierra/cuadrada: sin aliasing fuerte).
const blep = (p, dt) => { if (p < dt) { p /= dt; return p + p - p * p - 1; } if (p > 1 - dt) { p = (p - 1) / dt; return p * p + p + p + 1; } return 0; };
class Sierra {
  constructor(f, fase = 0) { this.f = f; this.p = fase; }
  next() { const dt = this.f / SR, y = 2 * this.p - 1 - blep(this.p, dt); this.p += dt; if (this.p >= 1) this.p -= 1; return y; }
}
class Cuadrada {
  constructor(f, fase = 0) { this.f = f; this.p = fase; }
  next() { const dt = this.f / SR, p = this.p, y = (p < 0.5 ? 1 : -1) + blep(p, dt) - blep((p + 0.5) % 1, dt); this.p += dt; if (this.p >= 1) this.p -= 1; return y; }
}

// ── Buses (estéreo) y envíos a eco y reverb
const bus = () => [new Float32Array(N), new Float32Array(N)];
const B = { bombo: bus(), palmas: bus(), charles: bus(), bajo: bus(), acordes: bus(), arp: bus(), lead: bus(), fx: bus() };
const ENVIO_REV = bus(), ENVIO_ECO = bus();
/** Suma un sonido ya hecho (L, R) al bus desde `ini` (s), con su envío a reverb y eco. */
const pon = (b, ini, L, R, rev = 0, eco = 0) => {
  const i0 = Math.round(ini * SR);
  for (let i = 0; i < L.length; i++) {
    const j = i0 + i; if (j < 0) continue; if (j >= N) break;
    b[0][j] += L[i]; b[1][j] += R[i];
    if (rev) { ENVIO_REV[0][j] += L[i] * rev; ENVIO_REV[1][j] += R[i] * rev; }
    if (eco) { ENVIO_ECO[0][j] += L[i] * eco; ENVIO_ECO[1][j] += R[i] * eco; }
  }
};
const ponMono = (b, ini, o, pan = 0, rev = 0, eco = 0) => {
  const [gl, gr] = paneo(pan), L = new Float32Array(o.length), R = new Float32Array(o.length);
  for (let i = 0; i < o.length; i++) { L[i] = o[i] * gl; R[i] = o[i] * gr; }
  pon(b, ini, L, R, rev, eco);
};

// ── Instrumentos
/** Bombo: seno que cae de 168 a 48 Hz, con un clic corto de ataque para la pegada. */
const bombo = (ini, fuerza = 1) => {
  const len = 0.42, n = muestras(len), r = rng(semillas++), bp = new Filtro("bp").set(3200, 0.9), o = new Float32Array(n); let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; fase += (2 * Math.PI * (48 + 120 * Math.exp(-t / 0.028))) / SR;
    const cuerpo = (Math.tanh(1.6 * Math.sin(fase)) / Math.tanh(1.6)) * Math.exp(-t / 0.17);
    o[i] = (cuerpo + 0.3 * CAR.pegadaBombo * bp.run(r()) * Math.exp(-t / 0.004)) * bordes(t, len, 0.0008, 0.03) * fuerza;
  }
  ponMono(B.bombo, ini, o);
};
/** Palmas: tres ráfagas de ruido muy seguidas y una cola; algo de anchura (ruido distinto en cada canal). */
const palma = (ini, filtrada = false) => {
  const len = 0.32, n = muestras(len), L = new Float32Array(n), R = new Float32Array(n);
  [[L, rng(semillas++)], [R, rng(semillas++)]].forEach(([o, r]) => {
    const bp = new Filtro("bp").set(1250, 1.3), lp = new Filtro("lp").set(filtrada ? 700 : 9000, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR; let e = 0;
      for (const b of [0, 0.01, 0.021]) if (t >= b) e += Math.min(1, (t - b) / 0.0005) * Math.exp(-(t - b) / 0.006);
      if (t >= 0.028) e += 0.55 * Math.min(1, (t - 0.028) / 0.001) * Math.exp(-(t - 0.028) / 0.075);
      o[i] = lp.run(bp.run(r())) * e * bordes(t, len, 0.0005, 0.03) * 2.2;
    }
  });
  pon(B.palmas, ini, L, R, 0.18);
};
/** Charles: ruido + 6 cuadradas metálicas por un paso alto. Abierto (contratiempo) o cerrado (semicorcheas). */
const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];
const charles = (ini, abierto) => {
  const len = abierto ? 0.3 : 0.07, n = muestras(len), r = rng(semillas++), hp = new Filtro("hp").set(7200, 0.7), osc = METAL.map((f, k) => new Cuadrada(f * 1.7, k / 7)), o = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR; let m = 0; for (const c of osc) m += c.next();
    o[i] = hp.run(0.6 * r() + 0.08 * m) * Math.exp(-t / (abierto ? 0.11 : 0.016)) * bordes(t, len, 0.0005, 0.02) * (abierto ? 1 : 0.4);
  }
  ponMono(B.charles, ini, o, abierto ? 0.25 : -0.25, abierto ? 0.08 : 0);
};
/** Caja (para los redobles): ruido en banda + tono que sube con la tensión. */
const caja = (ini, nivel, tono) => {
  const len = 0.2, n = muestras(len), r = rng(semillas++), bp = new Filtro("bp").set(2300, 0.6), o = new Float32Array(n); let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; fase += (2 * Math.PI * tono) / SR;
    o[i] = (bp.run(r()) * 1.6 * Math.exp(-t / 0.055) + 0.5 * Math.sin(fase) * Math.exp(-t / 0.035)) * bordes(t, len, 0.0006, 0.03) * nivel;
  }
  ponMono(B.fx, ini, o, 0, 0.12);
};
/** Crash: ruido brillante + metal, estéreo, cola larga. */
const crash = (ini, nivel = 1, len = 2.6) => {
  const n = muestras(len), L = new Float32Array(n), R = new Float32Array(n);
  [[L, rng(semillas++)], [R, rng(semillas++)]].forEach(([o, r], c) => {
    const hp = new Filtro("hp").set(3800, 0.6), osc = METAL.map((f, k) => new Cuadrada(f * (3.1 + c * 0.03), k / 6));
    for (let i = 0; i < n; i++) {
      const t = i / SR; let m = 0; for (const s of osc) m += s.next();
      o[i] = hp.run(r() + 0.12 * m) * Math.exp(-t / 0.6) * bordes(t, len, 0.001, 0.3) * 0.5 * nivel;
    }
  });
  pon(B.fx, ini, L, R, 0.2);
};
/** Golpe grave (sub que cae de 120 a 30 Hz) con un chasquido filtrado encima. */
const golpe = (ini, fuerza = 1, grave = 1) => {
  const len = 1.9, n = muestras(len), r = rng(semillas++), lp = new Filtro("lp").set(1400, 0.7), o = new Float32Array(n); let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; fase += (2 * Math.PI * (30 + 90 * Math.exp(-t / 0.12))) / SR;
    o[i] = (grave * Math.sin(fase) * Math.exp(-t / 0.42) + 0.5 * lp.run(r()) * Math.exp(-t / 0.045)) * bordes(t, len, 0.001, 0.4) * fuerza;
  }
  ponMono(B.fx, ini, o, 0, 0.1);
};
/** Subida (riser) de ruido blanco: banda que sube de 500 Hz a 9 kHz y volumen que crece; corta con una rampa de 8 ms. */
const subida = (ini, fin, nivel) => {
  const dur = fin - ini, n = muestras(dur), L = new Float32Array(n), R = new Float32Array(n);
  [[L, rng(semillas++)], [R, rng(semillas++)]].forEach(([o, r]) => {
    const bp = new Filtro("bp"), hp = new Filtro("hp").set(300, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR, k = t / dur; if (i % 32 === 0) bp.set(lerpExp(500, 9000, curva(k, 1.3)), 1.1);
      o[i] = hp.run(bp.run(r())) * curva(k, 2.2) * bordes(t, dur, 0.01, 0.008) * nivel * 2.5;
    }
  });
  pon(B.fx, ini, L, R, 0.25);
};
/** Redoble que acelera hacia `fin` (negras → corcheas → semicorcheas → fusas) y crece en volumen y tono. */
const redoble = (ini, fin) => {
  const dur = fin - ini, fases = dur >= 4 ? [[0.5, PULSO], [0.25, PULSO / 2], [0.125, SEMI], [0.125, SEMI / 2]] : [[0.5, PULSO / 2], [0.25, SEMI], [0.25, SEMI / 2]];
  let t = ini;
  for (const [frac, paso] of fases) { const hasta = t + frac * dur; for (; t < hasta - 1e-9; t += paso) { const k = (t - ini) / dur; caja(t, 0.15 + 0.45 * curva(k, 1.5), lerp(180, 300, k)); } }
};
/** Bajo: sierra con filtro que se cierra rápido + sub senoidal en la raíz. Al centro. */
const bajo = (ini, dur, m, sub, { nivel = 1, r = 0.03, corte = 1500 } = {}) => {
  const n = muestras(dur + r), s = new Sierra(hz(m)), f = new Filtro("lp"), o = new Float32Array(n); let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; if (i % 16 === 0) f.set(160 + corte * Math.exp(-t / 0.05), 1.0); fase += (2 * Math.PI * hz(sub)) / SR;
    o[i] = (f.run(s.next()) * 0.7 + Math.sin(fase) * 0.6) * adsr(t, dur, 0.003, 0.06, 0.75, r) * nivel;
  }
  ponMono(B.bajo, ini, o);
};
/** Supersierra: varias sierras desafinadas por nota, repartidas en estéreo, con paso bajo (que puede barrer de corte a corteFin). */
const supersierra = (ini, dur, notas, { nivel = 1, corte = 2600, corteFin = corte, voces = 7, desafino = 0.18, ancho = 0.85, a = 0.012, r = 0.18, b = B.acordes, rev = 0.3 } = {}) => {
  const n = muestras(dur + r), L = new Float32Array(n), R = new Float32Array(n), azar = rng(semillas++), amp = (0.5 * nivel) / Math.sqrt(voces * notas.length);
  for (const m of notas) for (let v = 0; v < voces; v++) {
    const d = (v / (voces - 1)) * 2 - 1, osc = new Sierra(hz(m + d * desafino), (azar() + 1) / 2), [gl, gr] = paneo(d * ancho * (v % 2 ? 1 : -1));
    for (let i = 0; i < n; i++) { const y = osc.next() * amp; L[i] += y * gl; R[i] += y * gr; }
  }
  const fl = new Filtro("lp"), fr = new Filtro("lp");
  for (let i = 0; i < n; i++) {
    if (i % 32 === 0) { const c = lerpExp(corte, corteFin, i / n); fl.set(c, 0.8); fr.set(c, 0.8); }
    const e = adsr(i / SR, dur, a, 0.3, 0.85, r); L[i] = fl.run(L[i]) * e; R[i] = fr.run(R[i]) * e;
  }
  pon(b, ini, L, R, rev);
};
/** Nota de arpegio: sierra + cuadrada desafinada, filtro con golpe de envolvente; corta y brillante. */
const arpNota = (ini, m, corte, pan, nivel) => {
  const dur = 0.09, r = 0.1, n = muestras(dur + r), s1 = new Sierra(hz(m)), s2 = new Cuadrada(hz(m + 0.07), 0.3), f = new Filtro("lp"), o = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR; if (i % 16 === 0) f.set(corte * (1 + 2.5 * Math.exp(-t / 0.035)), 1.1);
    o[i] = f.run(0.6 * s1.next() + 0.35 * s2.next()) * adsr(t, dur, 0.002, 0.08, 0.35, r) * nivel;
  }
  ponMono(B.arp, ini, o, pan, 0.3, 0.4);
};
/** Lead: tres sierras desafinadas con vibrato que entra poco a poco. */
const leadNota = (ini, dur, m) => {
  const r = 0.12, n = muestras(dur + r), L = new Float32Array(n), R = new Float32Array(n), det = [-0.1, 0, 0.1], osc = det.map((d, k) => new Sierra(hz(m + d), k / 3));
  const fl = new Filtro("lp").set(3800 * CAR.brillo, 0.7), fr = new Filtro("lp").set(3800 * CAR.brillo, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR, vib = 0.12 * curva((t - 0.15) / 0.2, 1) * Math.sin(2 * Math.PI * 5.5 * t), e = adsr(t, dur, 0.006, 0.15, 0.75, r);
    let l = 0, rr = 0;
    osc.forEach((o, k) => { o.f = hz(m + det[k] + vib); const y = o.next(); const [gl, gr] = paneo((k - 1) * 0.35); l += y * gl; rr += y * gr; });
    L[i] = fl.run(l) * e * 0.35; R[i] = fr.run(rr) * e * 0.35;
  }
  pon(B.lead, ini, L, R, 0.3, 0.2);
};
/** Golpe final: impacto grave, crash, bombo, bajo largo y el acorde de Am completo, que decae en la cola. */
const final = (t, { fuerza = 1, grave = 1, acorde = true, raiz = 33, notas = [45, 57, 60, 64, 69, 72, 76] } = {}) => {
  golpe(t, 1.5 * fuerza, grave); crash(t, 1.1 * fuerza); bombo(t, 1.1 * fuerza);
  bajo(t, 0.6, tr(raiz), tr(raiz), { nivel: 1.1 * fuerza, r: 0.4, corte: 2500 });
  if (acorde) supersierra(t, 0.5, notas.map(tr), { nivel: 1.5 * fuerza, corte: 6500, corteFin: 1400, a: 0.004, r: 0.6, rev: 0.5 });
};
/** Tic agudo (reloj, tensión): seno de 3,2 kHz y un soplo de ruido, muy cortos. */
const tic = (ini, nivel, pan) => {
  const len = 0.04, n = muestras(len), r = rng(semillas++), hp = new Filtro("hp").set(5000, 0.7), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = (0.6 * Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t / 0.005) + 0.5 * hp.run(r()) * Math.exp(-t / 0.002)) * bordes(t, len, 0.0003, 0.01) * nivel; }
  ponMono(B.fx, ini, o, pan, 0.25);
};

// ── Partitura: recorre la rejilla de semicorcheas y las secciones
const acordeEn = (t) => (t < INICIO_PROG ? PROG_INTRO[Math.floor(t / COMPAS) % PROG_INTRO.length] : PROG[Math.floor((t - INICIO_PROG) / COMPAS) % PROG.length]);
const bombeo = new Float32Array(N).fill(1); // ganancia del sidechain a profundidad 1 (0 justo en el golpe, 1 recuperado)
const bombea = (t0) => {
  const i0 = Math.round(t0 * SR);
  for (let i = 0; i < muestras(0.3) && i0 + i < N; i++) {
    const t = i / SR, g = t < 0.005 ? 1 - t / 0.005 : 0.5 * (1 - Math.cos(Math.PI * Math.min(1, (t - 0.005) / 0.27)));
    bombeo[i0 + i] = Math.min(bombeo[i0 + i], g);
  }
};

// Sección a sección (en orden, como la rejilla): las semillas del azar salen en el mismo orden que siempre.
for (const sec of SECCIONES) for (let s = Math.ceil((sec.desde - (sec.fase ?? 0)) / SEMI - 1e-9); ; s++) {
  const t = (sec.fase ?? 0) + s * SEMI; if (t >= sec.hasta - 1e-9 || t >= DUR) break; if (t < 0) continue;
  const ac = AC[acordeEn(t)], pos = ((s % 4) + 4) % 4, pulso = ((Math.floor(s / 4) % 4) + 4) % 4, k = (t - sec.desde) / (sec.hasta - sec.desde);
  if (pos === 0 && (sec.bombo || sec.bajo)) bombea(t);
  if (sec.bombo && pos === 0) bombo(t);
  if (sec.palmas && pos === 0 && (pulso === 1 || pulso === 3)) palma(t, sec.palmas === "filtradas");
  if (sec.charles) { if (pos === 2) charles(t, true); else if (pos % 2 === 1) charles(t, false); }
  if (sec.bajo && pos !== 0) bajo(t, SEMI * 0.85, ac.raiz + (pos === 2 ? 12 : 0), ac.raiz);
  if (sec.arp) {
    const tonos = [...ac.arp, ...ac.arp.map((m) => m + 12)], i = PATRON[sec.arp][((s % 8) + 8) % 8];
    const intro = sec.nombre === "intro" ? lerp(0.55, 1, k) : 1;
    arpNota(t, tonos[i], lerpExp(sec.arpCorte[0], sec.arpCorte[1], k) * CAR.brillo, s % 2 ? 0.45 : -0.45, (pos === 0 ? 1 : 0.75) * intro);
  }
}
// Acordes: uno por compás, recortado a cada sección.
for (const sec of SECCIONES) {
  if (!sec.acordes) continue;
  for (let c = Math.floor(sec.desde / COMPAS) * COMPAS; c < sec.hasta; c += COMPAS) {
    const ini = Math.max(c, sec.desde), fin = Math.min(c + COMPAS, sec.hasta), notas = AC[acordeEn(ini)].acorde;
    supersierra(ini, fin - ini, sec.acordesTransp ? notas.map((m) => m + sec.acordesTransp) : notas, { nivel: sec.acordes, corte: (sec.acordesCorte ?? 2600) * CAR.brillo });
  }
  // Lead: la melodía del acorde de cada compás (alineada al compás), recortada a la sección.
  if (sec.lead) for (let c = Math.floor(sec.desde / COMPAS + 1e-9) * COMPAS; c < sec.hasta; c += COMPAS)
    for (const [i0, d, m] of MELODIA[acordeEn(c)] ?? []) { const ini = c + i0 * SEMI; if (ini >= sec.desde - 1e-9 && ini < sec.hasta) leadNota(ini, Math.min(d * SEMI, sec.hasta - ini) * 0.92, m); }
}
const SIL = EVENTOS.some((e) => e.tipo === "silencio") ? new Float32Array(N).fill(1) : null; // ganancia de los silencios (sobre la mezcla)
for (const e of EVENTOS) {
  if (e.tipo === "subida") subida(e.t, e.hasta, e.nivel);
  else if (e.tipo === "redoble") redoble(e.t, e.hasta);
  else if (e.tipo === "golpe") golpe(e.t, e.fuerza, e.grave);
  else if (e.tipo === "crash") crash(e.t, e.nivel);
  else if (e.tipo === "final") final(e.t, e);
  else if (e.tipo === "tics") for (let t = e.t, j = 0; t < e.hasta - 1e-9; t += e.paso ?? SEMI, j++) tic(t, (e.nivel ?? 1) * lerp(0.5, 1, (t - e.t) / (e.hasta - e.t)), j % 2 ? 0.3 : -0.3);
  else if (e.tipo === "acentos") for (const t of e.tiempos) {
    const f = e.fuerza ?? 1; bombo(t, f); if (e.palma !== false) palma(t);
    if (e.acorde !== false) supersierra(t, 0.12, AC[acordeEn(t)].acorde.map((m) => m + 12), { nivel: 0.9 * f, corte: 7000 * CAR.brillo, corteFin: 2500, a: 0.002, r: 0.18, b: B.arp, rev: 0.35 });
  }
  else if (e.tipo === "silencio") {
    const nv = e.nivel ?? 0.02, i0 = Math.round(e.t * SR), ir = muestras(0.015), i1 = Math.min(N, Math.round(e.hasta * SR));
    for (let i = Math.max(0, i0 - ir); i < i1; i++) SIL[i] = Math.min(SIL[i], i < i0 ? lerp(1, nv, 0.5 - 0.5 * Math.cos((Math.PI * (i - i0 + ir)) / ir)) : nv);
  }
  else throw new Error(`Evento desconocido: ${e.tipo}`);
}

// ── Efectos: eco ping-pong (corchea con puntillo) y reverb tipo Freeverb (peines + pasa-todos), con paso alto a la entrada.
const eco = (() => {
  const d = muestras(PULSO * 0.75), bl = new Float32Array(d), br = new Float32Array(d), lp = new Filtro("lp").set(4000, 0.7), hp = new Filtro("hp").set(400, 0.7), out = bus(); let j = 0;
  for (let i = 0; i < N; i++) {
    const x = hp.run(0.5 * (ENVIO_ECO[0][i] + ENVIO_ECO[1][i])), yl = bl[j], yr = br[j];
    bl[j] = x + 0.38 * lp.run(yr); br[j] = 0.38 * yl; out[0][i] = yl; out[1][i] = yr; j = (j + 1) % d;
  }
  return out;
})();
const reverb = (() => {
  const PEINES = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], PASA = [556, 441, 341, 225], out = bus();
  [0, 1].forEach((c) => {
    const peines = PEINES.map((n) => ({ b: new Float32Array(n + c * 23), i: 0, f: 0 })), pasa = PASA.map((n) => ({ b: new Float32Array(n + c * 23), i: 0 })), hp = new Filtro("hp").set(280, 0.7);
    for (let i = 0; i < N; i++) {
      const x = hp.run(ENVIO_REV[c][i]) * 0.015; let y = 0;
      for (const p of peines) { const v = p.b[p.i]; p.f = v * 0.7 + p.f * 0.3; p.b[p.i] = x + p.f * 0.84; if (++p.i >= p.b.length) p.i = 0; y += v; }
      for (const p of pasa) { const v = p.b[p.i]; p.b[p.i] = y + v * 0.5; if (++p.i >= p.b.length) p.i = 0; y = v - y; }
      out[c][i] = y;
    }
  });
  return out;
})();

// ── Mezcla
const rms = (a, i0 = 0, i1 = a.length) => { let s = 0; for (let i = i0; i < i1; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, i1 - i0)); };
const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const todos = { ...B, eco, reverb };
const [B0, B1] = DUR >= 23 ? [16, 23] : [0, DUR];
if (process.argv.includes("--buses")) for (const [k, b] of Object.entries(todos)) console.log(`bus ${k.padEnd(8)} RMS ${db(MEZCLA[k][0] * rms(b[0], Math.round(B0 * SR), Math.round(B1 * SR))).toFixed(1)} dB (${B0}–${B1} s)`);
const L = new Float32Array(N), R = new Float32Array(N);
for (const [k, b] of Object.entries(todos)) {
  const [vol, prof] = MEZCLA[k];
  for (let i = 0; i < N; i++) { const g = vol * (1 - prof * (1 - bombeo[i])); L[i] += b[0][i] * g; R[i] += b[1][i] * g; }
}
{ // paso alto a 30 Hz, entrada de 3 ms y fundido final (coseno) que llega a cero justo en DUR
  const hl = new Filtro("hp").set(30, 0.707), hr = new Filtro("hp").set(30, 0.707), f0 = DUR - FUNDIDO;
  for (let i = 0; i < N; i++) {
    const t = i / SR, g = Math.min(1, t / 0.003) * (t > f0 ? Math.cos((Math.PI / 2) * Math.min(1, (t - f0) / FUNDIDO)) ** 2 : 1) * (SIL ? SIL[i] : 1);
    L[i] = hl.run(L[i]) * g; R[i] = hr.run(R[i]) * g;
  }
}

// ── Máster: limitador con anticipación (la ganancia nunca supera la necesaria, sin saltos) + loudnorm lineal de ffmpeg
const limita = (L, R, gan, techo) => {
  const la = muestras(0.004), M = N + la, g = new Float32Array(M).fill(1), lib = 1 - Math.exp(-1 / (0.08 * SR));
  for (let i = 0; i < N; i++) { const p = Math.max(Math.abs(L[i]), Math.abs(R[i])) * gan; if (p > techo) g[i] = techo / p; }
  const r = new Float32Array(M); let prev = 1;
  for (let i = 0; i < M; i++) { let m = 1; for (let j = Math.max(0, i - la); j <= i; j++) if (g[j] < m) m = g[j]; prev = Math.min(m, prev + (1 - prev) * lib); r[i] = prev; }
  const oL = new Float32Array(N), oR = new Float32Array(N); let suma = 0, minG = 1;
  for (let i = 0; i < M; i++) {
    suma += r[i]; if (i > la) suma -= r[i - la - 1];
    const k = i - la; if (k < 0) continue; const a = (suma / (la + 1)) * gan; minG = Math.min(minG, a / gan);
    oL[k] = L[k] * a; oR[k] = R[k] * a;
  }
  return { oL, oR, reduccion: -db(minG) };
};
const escribeWavFloat = (f, A, Z) => {
  const n = A.length, b = Buffer.alloc(44 + n * 8);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 8, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write("data", 36); b.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { b.writeFloatLE(A[i], 44 + i * 8); b.writeFloatLE(Z[i], 48 + i * 8); }
  fs.writeFileSync(f, b);
};
const leeWav16 = (f) => { // devuelve [L, R] de un WAV PCM 16 bits estéreo (busca el bloque "data")
  const b = fs.readFileSync(f); let p = 12;
  while (b.toString("ascii", p, p + 4) !== "data") p += 8 + b.readUInt32LE(p + 4);
  const n = b.readUInt32LE(p + 4) / 4, A = new Float32Array(n), Z = new Float32Array(n);
  for (let i = 0; i < n; i++) { A[i] = b.readInt16LE(p + 8 + i * 4) / 32768; Z[i] = b.readInt16LE(p + 10 + i * 4) / 32768; }
  return [A, Z];
};
const LOUDNORM = `loudnorm=I=${LUFS}:TP=${TECHO_TP}:LRA=20`;
const mide = (f) => jsonLoudnorm(ffMide(["-i", f, "-af", `${LOUDNORM}:print_format=json`, "-f", "null", "-"]));

const salida = path.resolve(ARGS.find((a, i) => !a.startsWith("--") && (I_CFG < 0 || i !== I_CFG + 1)) || "musica.wav");
fs.mkdirSync(path.dirname(salida), { recursive: true });
const tmp = path.join(os.tmpdir(), `musica-${process.pid}.wav`);
try {
  let pico = 0; for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  let gan = 0.5 / pico, lim, med;
  for (let vuelta = 0; vuelta < 6; vuelta++) { // ajusta la ganancia hasta que, ya limitado, quede en ~−14 LUFS
    lim = limita(L, R, gan, Math.pow(10, TECHO_LIMITADOR / 20)); escribeWavFloat(tmp, lim.oL, lim.oR); med = mide(tmp);
    const err = LUFS - Number(med.input_i); if (Math.abs(err) < 0.1) break; gan *= Math.pow(10, err / 20);
  }
  console.log(`Limitador: reducción máxima ${lim.reduccion.toFixed(1)} dB · antes de loudnorm ${med.input_i} LUFS, ${med.input_tp} dBTP`);
  const m = `measured_I=${med.input_i}:measured_TP=${med.input_tp}:measured_LRA=${med.input_lra}:measured_thresh=${med.input_thresh}:offset=${med.target_offset}:linear=true`;
  const r = ejecuta(FFMPEG, ["-hide_banner", "-nostats", "-y", "-i", tmp, "-af", `${LOUDNORM}:${m}:print_format=json,aresample=${SR}:osf=s16:dither_method=triangular,apad=whole_len=${N},atrim=end_sample=${N}`,
    "-map_metadata", "-1", "-bitexact", "-c:a", "pcm_s16le", "-ar", String(SR), "-ac", "2", salida]);
  const ln = jsonLoudnorm(r.stderr);
  if (ln.normalization_type !== "linear") console.warn("Aviso: loudnorm no pudo ir en lineal:", ln.normalization_type);
} finally { fs.rmSync(tmp, { force: true }); }

// ── Informe: duración, loudness final y RMS por sección
const [A, Z] = leeWav16(salida);
const fin = mide(salida);
console.log(`\n${salida}\n${A.length} muestras = ${(A.length / SR).toFixed(3)} s · ${fin.input_i} LUFS · ${fin.input_tp} dBTP · LRA ${fin.input_lra}`);
const tramo = (nombre, d, h) => { const i0 = Math.round(d * SR), i1 = Math.round(h * SR); let p = 0; for (let i = i0; i < i1; i++) p = Math.max(p, Math.abs(A[i]), Math.abs(Z[i])); console.log(`${nombre.padEnd(12)} ${d.toFixed(2).padStart(5)}–${h.toFixed(2).padEnd(5)}  RMS ${db(Math.hypot(rms(A, i0, i1), rms(Z, i0, i1)) / Math.SQRT2).toFixed(1).padStart(6)} dBFS  pico ${db(p).toFixed(1)}`); };
for (const s of SECCIONES) tramo(s.nombre, s.desde, s.hasta);
if (!CFG.eventos) { tramo("antes drop", 3.5, 4); tramo("drop", 4, 4.5); tramo("antes final", 34.5, 35); tramo("golpe final", 35, 35.5); tramo("cola", 35.5, 36); }
else { // RMS 50 ms antes y después de cada golpe, crash, impacto final y acento: el golpe tiene que notarse justo en su hora
  const rmsDb = (d, h) => { const i0 = Math.max(0, Math.round(d * SR)), i1 = Math.min(A.length, Math.round(h * SR)); return db(Math.hypot(rms(A, i0, i1), rms(Z, i0, i1)) / Math.SQRT2); };
  const marcas = [...new Set(EVENTOS.flatMap((e) => (e.tipo === "acentos" ? e.tiempos : ["golpe", "crash", "final"].includes(e.tipo) ? [e.t] : [])))].sort((a, b) => a - b);
  for (const t of marcas) console.log(`marca ${t.toFixed(3).padStart(7)} s   antes ${rmsDb(t - 0.05, t).toFixed(1).padStart(6)} dBFS  después ${rmsDb(t, t + 0.05).toFixed(1).padStart(6)} dBFS`);
}
