// Vía 3 · recortar una PARTE de una captura (un botón, una tarjeta, una gráfica) como pieza suelta en PNG, lista para
// animarla con <Pieza> o <Img> dentro de <Movil>. Usa ffmpeg (variable FFMPEG o `ffmpeg` del PATH).
//
// Uso:
//   node scripts/recortar.mjs <captura.png> <x> <y> <w> <h> <salida.png> [opciones]
//     x y w h: en píxeles de la captura, o en fracciones 0–1 si todos son ≤ 1.
//   --quitar-fondo <#rrggbb>  vuelve transparente ese color plano (fondo de la tarjeta o de la página)
//   --tolerancia <0–1>        cuánto se parece un color para quitarlo (por defecto 0,08)
//   --ajustar                 recorta al contenido no transparente (tras quitar el fondo)
//   --margen <px>             añade margen transparente alrededor (para sombras y brillos en Remotion)
//   --escala <n>              reescala (p. ej. 2 si la captura se hizo a 1× y la pieza se verá grande)
// Ejemplo: node scripts/recortar.mjs public/panel.png 0.79 0.29 0.1 0.07 public/piezas/cpu.png --quitar-fondo #12151B --ajustar --margen 24
//
// Consejos de limpieza (en la skill base, §3 vía 3): recorta con 4–8 px de aire para no comerte el borde; si la pieza
// tiene sombra propia en la captura, recórtala SIN sombra y pon la sombra en Remotion; esquinas redondeadas y bordes
// suaves con `radio`/`mascara` de <Pieza>, no en el PNG.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/, (m) => m.replace("ffmpeg", "ffprobe"));
const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--"));
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1] ?? true; };
const flag = (n) => args.includes(`--${n}`);
if (pos.length < 6) { console.log("uso: node scripts/recortar.mjs <captura> <x> <y> <w> <h> <salida.png> [--quitar-fondo #rrggbb] [--tolerancia 0.08] [--ajustar] [--margen px] [--escala n]"); process.exit(1); }
const [img, xs, ys, ws, hs, salida] = pos;
const [W, H] = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", img]).toString().trim().split(",").map(Number);
let [x, y, w, h] = [xs, ys, ws, hs].map(Number);
if ([x, y, w, h].every((v) => v <= 1)) { x = Math.round(x * W); y = Math.round(y * H); w = Math.round(w * W); h = Math.round(h * H); }
const filtros = [`crop=${w}:${h}:${x}:${y}`, "format=rgba"];
const fondo = opt("quitar-fondo", null);
if (fondo) filtros.push(`colorkey=0x${String(fondo).replace("#", "")}:${opt("tolerancia", "0.08")}:0.04`);
const escala = Number(opt("escala", 1));
if (escala !== 1) filtros.push(`scale=iw*${escala}:ih*${escala}:flags=lanczos`);
fs.mkdirSync(path.dirname(salida), { recursive: true });
const tmp = salida.replace(/\.png$/i, ".tmp.png");
execFileSync(FFMPEG, ["-v", "error", "-y", "-i", img, "-vf", filtros.join(","), "-frames:v", "1", tmp]);
let actual = tmp;
if (flag("ajustar")) {
  // recorta al contenido: busca el rectángulo con alfa > 0
  const salidaDet = execFileSync(FFMPEG, ["-v", "info", "-i", actual, "-vf", "alphaextract,cropdetect=limit=1:round=2:reset=0", "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] }).toString();
  const m = [...salidaDet.matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)].pop();
  if (m) { const t2 = salida.replace(/\.png$/i, ".tmp2.png"); execFileSync(FFMPEG, ["-v", "error", "-y", "-i", actual, "-vf", `crop=${m[1]}:${m[2]}:${m[3]}:${m[4]}`, t2]); fs.rmSync(actual); actual = t2; }
}
const margen = Number(opt("margen", 0));
if (margen > 0) {
  const t3 = salida.replace(/\.png$/i, ".tmp3.png");
  execFileSync(FFMPEG, ["-v", "error", "-y", "-i", actual, "-vf", `format=rgba,pad=iw+${2 * margen}:ih+${2 * margen}:${margen}:${margen}:color=0x00000000`, t3]);
  fs.rmSync(actual); actual = t3;
}
fs.renameSync(actual, salida);
const [w2, h2] = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", salida]).toString().trim().split(",");
console.log(`${salida}: ${w2}×${h2} px (de ${img} ${x},${y} ${w}×${h})`);
