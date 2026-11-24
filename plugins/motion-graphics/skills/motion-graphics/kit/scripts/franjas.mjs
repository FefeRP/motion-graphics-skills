#!/usr/bin/env node
// franjas.mjs · busca franjas o velos que aparecen y desaparecen en el fondo (típico: un degradado detrás de los
// subtítulos, un fondo que se funde por abajo o que entra con fundido/clip-path y deja el lienzo al descubierto).
//
//   node scripts/franjas.mjs <video.mp4> [--umbral 10] [--zona abajo|arriba] [--hoja salida/franjas.jpg]
//
// Reduce el vídeo a 64×36 en gris a 10 fps y, por columna, compara la banda del borde (7 filas) con las 7 filas vecinas.
// Franja = la banda es > umbral niveles más clara en ≥ 80 % del ancho (una píldora o una pantalla no ocupan todo el
// ancho). Son candidatos: confirma cada tramo con fotogramas cada 0,1 s (--hoja hace una hoja del primero). Un revisor
// de vídeo con IA a 4 fps no las ve (o las inventa): mide.
// ffmpeg: variable FFMPEG o el PATH. Sin dependencias.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const video = args[0];
if (!video || !fs.existsSync(video)) { console.log("Uso: node scripts/franjas.mjs <video.mp4> [--umbral 10] [--zona abajo|arriba] [--hoja f.jpg]"); process.exit(1); }
const W = 64, H = 36, FPS = 10, umbral = Number(opt("--umbral", 10)), arriba = opt("--zona", "abajo") === "arriba";
const r = spawnSync(FFMPEG, ["-hide_banner", "-v", "error", "-i", video, "-vf", `fps=${FPS},scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 30 });
if (r.error || r.status !== 0) { console.error(r.error ? `No encuentro ffmpeg (${FFMPEG})` : String(r.stderr)); process.exit(2); }
const px = r.stdout, n = Math.floor(px.length / (W * H));
// por columna: banda (7 filas del borde) − las 7 filas de justo encima/debajo; franja = más clara en ≥ 80 % del ancho
const col = (f, x, y0, y1) => { let s = 0; for (let y = y0; y < y1; y++) s += px[f * W * H + y * W + x]; return s / (y1 - y0); };
const [b0, b1, v0, v1] = arriba ? [0, 7, 7, 14] : [H - 7, H, H - 14, H - 7];
const frac = [], dif = [];
for (let f = 0; f < n; f++) {
  let k = 0, s = 0;
  for (let x = 0; x < W; x++) { const d = col(f, x, b0, b1) - col(f, x, v0, v1); s += d; if (d > umbral) k++; }
  frac.push(k / W); dif.push(s / W);
}
const tramos = []; let ini = null;
for (let f = 0; f <= n; f++) {
  const sos = f < n && frac[f] >= 0.8;
  if (sos && ini === null) ini = f;
  if (!sos && ini !== null) { tramos.push([ini / FPS, f / FPS, Math.max(...dif.slice(ini, f))]); ini = null; }
}
const med = [...dif].sort((p, q) => p - q)[Math.floor(n / 2)] ?? 0;
console.log(`${n} fotogramas a ${FPS} fps · banda ${arriba ? "de arriba" : "de abajo"} − vecina: mediana ${med.toFixed(1)} niveles`);
if (!tramos.length) { console.log("OK: sin franjas candidatas"); process.exit(0); }
for (const [a, b, m] of tramos) console.log(`  candidato ${a.toFixed(1)}–${b.toFixed(1)} s (hasta ${m.toFixed(0)} niveles más claro)`);
if (opt("--hoja")) {
  const [a, b] = tramos[0];
  spawnSync(FFMPEG, ["-hide_banner", "-v", "error", "-y", "-ss", String(Math.max(0, a - 0.2)), "-t", String(Math.min(1.6, b - a + 0.4)), "-i", video, "-vf", "fps=10,scale=480:-2,tile=4x4", "-frames:v", "1", "-update", "1", opt("--hoja")]);
  console.log(`hoja del primer tramo: ${opt("--hoja")}`);
}
console.log("Confirma cada candidato con fotogramas cada 0,1 s antes de tocar nada.");
process.exit(3);
