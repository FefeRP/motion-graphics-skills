// Empalma tramos re-renderizados dentro de un vídeo ya renderizado, sin rehacerlo entero.
//   node scripts/empalmar.mjs <base.mp4> <salida.mp4> <tramo.mp4>@<inicio s> [<tramo2.mp4>@<inicio s> …]
// Cada tramo (p. ej. de `render.mjs render … --desde 11.5 --hasta 13 --mudo`) sustituye la imagen de la base desde su
// inicio y durante lo que dure; el audio de la base se copia tal cual (los efectos van al fotograma, no cambian).
// Inicios en múltiplos del fotograma (a 60 fps: 11.5, 20.8…). Necesita ffmpeg/ffprobe (variables FFMPEG y FFPROBE o en el PATH).
import { execFileSync } from "node:child_process";
import path from "node:path";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = process.env.FFPROBE || (process.env.FFMPEG ? path.join(path.dirname(process.env.FFMPEG), path.basename(process.env.FFMPEG).replace("ffmpeg", "ffprobe")) : "ffprobe");
const [, , base, salida, ...args] = process.argv;
if (!base || !salida || !args.length) { console.log("uso: node scripts/empalmar.mjs <base.mp4> <salida.mp4> <tramo.mp4>@<inicio s> …"); process.exit(1); }

const sonda = (f, campos) => execFileSync(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", campos, "-of", "csv=p=0", f], { encoding: "utf8" }).trim();
const [num, den] = sonda(base, "stream=r_frame_rate").split("/").map(Number);
const fps = num / (den || 1);
const fotogramas = (f) => Number(sonda(f, "stream=nb_frames")) || Math.round(Number(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" })) * fps);
const total = fotogramas(base);
const tramos = args.map((a) => { const [f, ini] = a.split("@"); const f0 = Math.round(Number(ini) * fps); return { f, f0, f1: f0 + fotogramas(f) }; }).sort((a, b) => a.f0 - b.f0);

// trozos alternos: base [0, f0) · tramo · base [f1, f0 siguiente) · … · base [f1 último, fin)
const filtros = [], etiquetas = [];
let cursor = 0, n = 0;
const trozoBase = (a, b) => { if (b <= a) return; filtros.push(`[0:v]trim=start_frame=${a}:end_frame=${b},setpts=PTS-STARTPTS[b${n}]`); etiquetas.push(`[b${n++}]`); };
tramos.forEach((t, i) => {
  trozoBase(cursor, t.f0);
  filtros.push(`[${i + 1}:v]setpts=PTS-STARTPTS[t${i}]`); etiquetas.push(`[t${i}]`);
  cursor = t.f1;
  console.log(`tramo ${path.basename(t.f)}: fotogramas ${t.f0}–${t.f1 - 1} (${(t.f0 / fps).toFixed(2)}–${(t.f1 / fps).toFixed(2)} s)`);
});
trozoBase(cursor, total);
filtros.push(`${etiquetas.join("")}concat=n=${etiquetas.length}:v=1:a=0[v]`);
execFileSync(FFMPEG, ["-v", "error", "-y", "-i", base, ...tramos.flatMap((t) => ["-i", t.f]), "-filter_complex", filtros.join(";"),
  "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", String(fps), "-c:a", "copy", "-movflags", "+faststart", salida], { stdio: "inherit" });
const fin = fotogramas(salida);
console.log(`Listo: ${salida} · ${fin} fotogramas (base ${total})${fin !== total ? " · ¡OJO: no coincide!" : ""}`);
