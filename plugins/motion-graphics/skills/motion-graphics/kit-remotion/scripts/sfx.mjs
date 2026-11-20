// Sintetiza los efectos de sonido (sin ficheros de terceros ni licencias) → assets/sfx/*.wav.
// Síntesis propia de efectos, suave: aquí acompañan a una voz, no a una promo.
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./lib.mjs";

const SR = 48000;
const muestras = (s) => Math.max(1, Math.round(s * SR));
const curva = (k, p) => Math.pow(Math.min(1, Math.max(0, k)), p);
const lerp = (a, b, k) => a + (b - a) * k;
const rng = (semilla) => { let a = semilla >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1; }; };
class Filtro {
  constructor(tipo) { this.tipo = tipo; this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(f, q) {
    const w = (2 * Math.PI * Math.min(Math.max(f, 20), SR * 0.45)) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    const [b0, b1, b2] = this.tipo === "lp" ? [(1 - cs) / 2, 1 - cs, (1 - cs) / 2] : [al, 0, -al];
    const a0 = 1 + al; Object.assign(this, { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cs) / a0, a2: (1 - al) / a0 });
  }
  run(x) { const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
const normaliza = (b, pico) => { let m = 0; for (const x of b) m = Math.max(m, Math.abs(x)); return b.map((x) => (m ? (x * pico) / m : 0)); };

/** Aire que pasa: ruido filtrado con barrido de frecuencia, sube y baja, y se mueve de un lado a otro. */
const whoosh = ({ dur, f, pico = 0.55, semilla = 7, dir = 1 }) => {
  const n = muestras(dur), r = rng(semilla), bp = new Filtro("bp"), lp = new Filtro("lp");
  const env = (t) => (t / dur < pico ? curva(t / dur / pico, 2.2) : curva(1 - (t / dur - pico) / (1 - pico), 1.6));
  const fr = (t) => (t / dur < pico ? lerp(f[0], f[1], curva(t / dur / pico, 1.5)) : lerp(f[1], f[2], curva((t / dur - pico) / (1 - pico), 0.7)));
  const m = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; if (i % 16 === 0) { bp.set(fr(t), 0.9); lp.set(fr(t) * 0.25, 0.7); } const x = r() * env(t); m[i] = bp.run(x) + 0.6 * lp.run(x); }
  const mono = normaliza(m, 0.8);
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = dir * lerp(-0.6, 0.6, i / n); L[i] = mono[i] * Math.cos(((p + 1) * Math.PI) / 4); R[i] = mono[i] * Math.sin(((p + 1) * Math.PI) / 4); }
  return [L, R];
};
/** "Pop" redondo y corto (cambio de escena dentro del modo técnico). */
const pop = () => {
  const n = muestras(0.16), o = new Float32Array(n); let fase = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; fase += (2 * Math.PI * lerp(380, 820, curva(t / 0.03, 0.6))) / SR; o[i] = Math.sin(fase) * Math.exp(-t / 0.04) * Math.min(1, t / 0.002); }
  const m = normaliza(o, 0.7);
  return [m, m];
};

// ── Efectos para los motion graphics (skill motion-graphics): clic de interfaz, golpe grave, subida, tic y base rítmica.
/** Clic seco de interfaz (botón, tarjeta que aterriza): ruido muy corto + tono agudo amortiguado. */
const click = ({ f = 2400, semilla = 3 } = {}) => {
  const n = muestras(0.06), r = rng(semilla), bp = new Filtro("bp"); bp.set(f, 1.4);
  const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = bp.run(r()) * Math.exp(-t / 0.006) + 0.35 * Math.sin(2 * Math.PI * f * 0.5 * t) * Math.exp(-t / 0.012); }
  const m = normaliza(o, 0.6);
  return [m, m];
};
/** Golpe grave (sub que cae de 110 a 42 Hz) para el plano fuerte o el logo final. */
const impacto = () => {
  const n = muestras(0.9), o = new Float32Array(n), r = rng(5), lp = new Filtro("lp"); lp.set(900, 0.7); let fase = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; fase += (2 * Math.PI * lerp(110, 42, curva(t / 0.25, 0.5))) / SR; o[i] = Math.sin(fase) * Math.exp(-t / 0.32) + 0.25 * lp.run(r()) * Math.exp(-t / 0.03); }
  const m = normaliza(o, 0.85);
  return [m, m];
};
/** Subida (riser) de ruido filtrado que crece 1,2 s y corta seco: anticipa el golpe. */
const subida = () => {
  const dur = 1.2, n = muestras(dur), r = rng(9), bp = new Filtro("bp"), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; if (i % 16 === 0) bp.set(lerp(300, 5000, curva(t / dur, 2)), 1.2); o[i] = bp.run(r()) * curva(t / dur, 2.5); }
  const m = normaliza(o, 0.6);
  return [m, m];
};
/** Tic de contador (cifra que sube), muy corto y suave. */
const tic = () => {
  const n = muestras(0.03), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t / 0.004); }
  const m = normaliza(o, 0.4);
  return [m, m];
};
/** Glitch digital (estrobo, fallo de señal): ráfagas de 20–45 ms de zumbido cuadrado y ruido retenido, cortadas en seco. */
const glitch = () => {
  const dur = 0.28, n = muestras(dur), L = new Float32Array(n), R = new Float32Array(n), r = rng(29);
  let i = 0;
  while (i < n) {
    const largo = muestras(0.02 + 0.025 * Math.abs(r())), tipo = r(), fq = 180 + 900 * Math.abs(r()), paso = 2 + Math.floor(Math.abs(r()) * 30), pan = r() * 0.8;
    let hold = 0;
    for (let k = 0; k < largo && i < n; k++, i++) {
      const t = k / SR;
      let x = tipo > 0.2 ? Math.sign(Math.sin(2 * Math.PI * fq * t)) * 0.7 : tipo > -0.5 ? (k % paso === 0 ? (hold = r()) : hold) : 0;
      x *= Math.min(1, k / 24) * Math.min(1, (largo - k) / 24) * (1 - 0.5 * (i / n));
      L[i] = x * (1 - pan) * 0.5; R[i] = x * (1 + pan) * 0.5;
    }
  }
  return [normaliza(L, 0.45), normaliza(R, 0.45)];
};
/** Base rítmica sobria de 8 compases a `bpm`: bombo suave en cada pulso y charles en las corcheas a contratiempo. */
const base = ({ bpm = 120, compases = 8 } = {}) => {
  const pulso = 60 / bpm, dur = compases * 4 * pulso, n = muestras(dur), L = new Float32Array(n), r = rng(13), hp = new Filtro("bp"); hp.set(8000, 0.8);
  for (let k = 0; k < compases * 4; k++) {
    const i0 = muestras(k * pulso); let fase = 0;
    for (let i = 0; i < muestras(0.35) && i0 + i < n; i++) { const t = i / SR; fase += (2 * Math.PI * lerp(120, 48, curva(t / 0.08, 0.6))) / SR; L[i0 + i] += 0.9 * Math.sin(fase) * Math.exp(-t / 0.12); }
    const j0 = muestras((k + 0.5) * pulso);
    for (let i = 0; i < muestras(0.05) && j0 + i < n; i++) L[j0 + i] += 0.25 * hp.run(r()) * Math.exp(-(i / SR) / 0.012);
  }
  const m = normaliza(L, 0.5);
  return [m, m];
};

const escribeWav = (f, [L, R]) => {
  const n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 4, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4); }
  fs.writeFileSync(f, b);
};

const dir = path.join(RAIZ, "public", "sfx");
fs.mkdirSync(dir, { recursive: true });
escribeWav(path.join(dir, "whoosh.wav"), whoosh({ dur: 0.55, f: [300, 2200, 600], pico: 0.5, dir: 1 }));
escribeWav(path.join(dir, "whoosh-suave.wav"), whoosh({ dur: 0.5, f: [700, 1400, 300], pico: 0.4, semilla: 11, dir: -1 }));
escribeWav(path.join(dir, "pop.wav"), pop());
escribeWav(path.join(dir, "click.wav"), click());
escribeWav(path.join(dir, "impacto.wav"), impacto());
escribeWav(path.join(dir, "subida.wav"), subida());
escribeWav(path.join(dir, "tic.wav"), tic());
escribeWav(path.join(dir, "whoosh-rapido.wav"), whoosh({ dur: 0.3, f: [600, 3500, 900], pico: 0.5, semilla: 21, dir: 1 }));
escribeWav(path.join(dir, "glitch.wav"), glitch());
escribeWav(path.join(dir, "base-120.wav"), base({ bpm: 120, compases: 8 }));
console.log("Efectos en", dir, fs.readdirSync(dir));
