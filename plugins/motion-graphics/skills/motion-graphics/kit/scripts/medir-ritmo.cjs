// Mide ritmo y fluidez de un vídeo: node scripts/medir-ritmo.cjs <video> [etiqueta]
// Ritmo (10 fps, 160x90 gris): dif media, % quieto, racha quieta, cortes duros por minuto.
// Fluidez (fps nativos, 320x180): picos aislados (un fotograma que cambia 3x más que sus dos vecinos con movimiento).
const { execFileSync } = require("child_process");
const F = process.env.FFMPEG || "ffmpeg";
const [video, et = video] = process.argv.slice(2);
const raw = (vf) => execFileSync(F, ["-v", "error", "-i", video, "-vf", vf, "-f", "rawvideo", "-"], { maxBuffer: 1e9 });
const difs = (b, N) => { const n = Math.floor(b.length / N), d = []; for (let i = 1; i < n; i++) { let s = 0; for (let k = 0; k < N; k++) s += Math.abs(b[i * N + k] - b[(i - 1) * N + k]); d.push(s / N); } return d; };
const a = difs(raw("fps=10,scale=160:90,format=gray"), 160 * 90);
const media = a.reduce((x, y) => x + y, 0) / a.length, quietos = a.filter((x) => x < 0.6).length / a.length, cortes = a.filter((x) => x > 25).length;
let r = 0, max = 0; for (const x of a) { r = x < 0.6 ? r + 1 : 0; max = Math.max(max, r); }
const b = difs(raw("scale=320:180,format=gray"), 320 * 180);
let picos = 0; for (let i = 1; i < b.length - 1; i++) { const v = (b[i - 1] + b[i + 1]) / 2; if (v > 1 && b[i] > 3 * v) picos++; }
const dur = a.length / 10;
console.log(`${et}: ${dur.toFixed(0)} s · dif media ${media.toFixed(2)} · quieto ${(100 * quietos).toFixed(0)} % · racha quieta ${(max / 10).toFixed(1)} s · cortes duros ${(cortes / dur * 60).toFixed(0)}/min · saltos de 1 fotograma ${picos} (${(picos / dur).toFixed(2)}/s)`);
