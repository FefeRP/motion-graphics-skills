#!/usr/bin/env node
// bucle.mjs · cierra un clip en BUCLE PERFECTO (fondos, humo, agua, texturas animadas generadas con IA o grabadas).
// Funde los últimos `--cruce` segundos sobre los primeros: el clip resultante dura (duración − cruce) y el fotograma
// que vendría después del último es exactamente el primero. Comprueba la costura con medir-bucle.mjs al acabar.
//
//   node scripts/bucle.mjs <entrada.mp4> <salida.mp4> [--cruce 1] [--fps 30] [--ancho 1920] [--crf 16]
//
// Funciona bien con material de movimiento suave y sin cámara que viaje (deriva, humo, partículas, luz). Si la cámara
// avanza, el cruce se ve como un doble: genera el clip con un movimiento circular o pide al modelo un plano fijo.
// Sin dependencias: Node + ffmpeg (FFMPEG/FFPROBE o el PATH).
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const [ent, sal] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
if (!ent || !sal) { console.error("Uso: node scripts/bucle.mjs <entrada> <salida.mp4> [--cruce 1] [--fps 30] [--ancho 1920] [--crf 16]"); process.exit(2); }
const FF = process.env.FFMPEG || "ffmpeg", FP = process.env.FFPROBE || (process.env.FFMPEG ? join(dirname(process.env.FFMPEG), "ffprobe" + (process.platform === "win32" ? ".exe" : "")) : "ffprobe");
const pr = spawnSync(FP, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ent], { encoding: "utf8" });
const dur = parseFloat(pr.stdout);
if (!(dur > 0)) { console.error("No puedo leer la duración de", ent, pr.stderr); process.exit(2); }
const c = Math.min(parseFloat(opt("--cruce", "1")), dur / 3), fps = opt("--fps", "30"), ancho = opt("--ancho", "1920"), L = dur - c;
// cuerpo = [c, dur) ; la cola [dur-c, dur) se funde con la cabeza [0, c): salida = cabeza fundida + resto
const fc = `[0:v]fps=${fps},scale=${ancho}:-2:flags=lanczos,setsar=1,format=yuv420p,split=3[a][b][d];` +
  `[a]trim=start=${L}:end=${dur},setpts=PTS-STARTPTS[cola];` +
  `[b]trim=start=0:end=${c},setpts=PTS-STARTPTS[cabeza];` +
  `[d]trim=start=${c}:end=${L},setpts=PTS-STARTPTS[medio];` +
  `[cola][cabeza]blend=all_expr='A*(1-T/${c})+B*(T/${c})'[cruce];` +
  `[cruce][medio]concat=n=2:v=1:a=0[v]`;
const r = spawnSync(FF, ["-v", "error", "-y", "-i", ent, "-filter_complex", fc, "-map", "[v]", "-an", "-c:v", "libx264", "-crf", opt("--crf", "16"), "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", sal], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`Bucle: ${sal} (${L.toFixed(2)} s, cruce ${c} s)`);
const m = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), "medir-bucle.mjs"), resolve(sal)], { stdio: "inherit", env: process.env });
process.exit(m.status ?? 0);
