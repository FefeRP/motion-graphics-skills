// Utilidades mínimas de los scripts del kit. ffmpeg: variable FFMPEG o el del PATH.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FFMPEG = process.env.FFMPEG || "ffmpeg";
export const ejecuta = (prog, args) => {
  const r = spawnSync(prog, args, { encoding: "utf8", maxBuffer: 1 << 28, cwd: RAIZ });
  if (r.status !== 0) { console.error((r.stderr || r.stdout || "").split("\n").slice(-25).join("\n")); throw new Error(`Falló: ${path.basename(prog)}`); }
  return r;
};
export const ffMide = (args) => ejecuta(FFMPEG, ["-hide_banner", "-nostats", "-y", ...args]).stderr;
/** El bloque JSON que imprime loudnorm (print_format=json) en medio del resto de mensajes de ffmpeg. */
export const jsonLoudnorm = (stderr) => { const m = stderr.match(/\{[^{}]*"input_i"[^{}]*\}/); if (!m) throw new Error("loudnorm no devolvió medidas"); return JSON.parse(m[0]); };
