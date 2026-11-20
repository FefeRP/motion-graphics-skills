// Comprobación de fidelidad: captura REAL contra fotograma del render, al mismo tamaño.
//   node scripts/comparar-fidelidad.mjs <referencia.png> <render.png> <salida.jpg> [--recorte x,y,w,h] [--umbral 32]
// --recorte: zona del render (px) donde está la interfaz recreada (sin cámara: escala 1); se escala al tamaño de la
// referencia. Sale una hoja 2×2: referencia | render, diferencia (×3, lo blanco es lo que no coincide) | calco al 50 %.
// Imprime la diferencia media (0–255) y el % de píxeles que difieren más que el umbral. Orientativo para una interfaz
// recreada fiel: media < 6 y < 4 % de píxeles distintos (el texto antialiasado nunca da 0). Mira SIEMPRE la hoja.
import { execFileSync } from "node:child_process";
import path from "node:path";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = process.env.FFPROBE || (process.env.FFMPEG ? path.join(path.dirname(process.env.FFMPEG), path.basename(process.env.FFMPEG).replace("ffmpeg", "ffprobe")) : "ffprobe");
const [, , ref, render, salida, ...resto] = process.argv;
const opt = (n, d) => { const i = resto.indexOf(`--${n}`); return i < 0 ? d : resto[i + 1]; };
if (!ref || !render || !salida) { console.log("uso: node scripts/comparar-fidelidad.mjs <referencia.png> <render.png> <salida.jpg> [--recorte x,y,w,h] [--umbral 32]"); process.exit(1); }

const [W, H] = execFileSync(FFPROBE, ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", ref], { encoding: "utf8" }).trim().split(",").map(Number);
const rec = opt("recorte");
const [rx, ry, rw, rh] = rec ? rec.split(",").map(Number) : [];
const recorte = rec ? `crop=${rw}:${rh}:${rx}:${ry},` : ""; // ffmpeg: ancho:alto:x:y
const ajusta = `[1:v]${recorte}scale=${W}:${H}:flags=lanczos,format=rgb24[r];[0:v]scale=${W}:${H},format=rgb24[f]`;

// métrica: en gris a 480 px de ancho
const w = 480, h = Math.round((H / W) * 480);
const gris = (i, filtro) => execFileSync(FFMPEG, ["-v", "error", "-i", i, "-vf", `${filtro}scale=${w}:${h},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1e8 });
const a = gris(ref, ""), b = gris(render, recorte);
const umbral = Number(opt("umbral", 32));
let suma = 0, distintos = 0;
for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); suma += d; if (d > umbral) distintos++; }

execFileSync(FFMPEG, ["-v", "error", "-y", "-i", ref, "-i", render, "-filter_complex",
  `${ajusta};[f]split=3[f1][f2][f3];[r]split=3[r1][r2][r3];[f2][r2]blend=all_mode=difference,lutrgb=r=val*3:g=val*3:b=val*3[dif];[f3][r3]blend=all_mode=average[calco];[f1][r1]hstack[arriba];[dif][calco]hstack[abajo];[arriba][abajo]vstack,scale=1920:-2`,
  "-frames:v", "1", "-q:v", "3", salida], { stdio: "inherit" });
console.log(`${salida}\ndiferencia media ${(suma / a.length).toFixed(2)} · píxeles distintos (>${umbral}) ${((100 * distintos) / a.length).toFixed(1)} %`);
