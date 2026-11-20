// Recreación contra ORIGINAL a lo largo del tiempo (no solo un fotograma): verifica imagen, color y TIMING.
//   node scripts/comparar-video.mjs <original.mp4> <recreacion.mp4> <salida.mp4> [--recorte-orig x,y,w,h] [--desfase s] [--fps 30]
// Sale un vídeo de comprobación: original | recreación arriba y, abajo, el mapa de diferencias (×3) y el calco al 50 %.
// Y tres cifras por tramo de 1 s y en total:
//  - imagen: diferencia media de luminancia (0–255; < 15 = muy parecido, < 30 = parecido; el grano y el texto suben algo);
//  - color: diferencia media de crominancia (0–255; < 6 = misma paleta);
//  - timing: correlación entre las «curvas de movimiento» de los dos vídeos (cuánto cambia la imagen de un fotograma
//    al siguiente). 1 = los eventos caen en los mismos instantes; < 0,6 = el ritmo no coincide. Prueba --desfase si la
//    recreación empieza antes o después: el script te dice el desfase que mejor encaja.
import { execFileSync } from "node:child_process";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const [, , orig, rec, salida, ...resto] = process.argv;
const opt = (n, d) => { const i = resto.indexOf(`--${n}`); return i < 0 ? d : resto[i + 1]; };
if (!orig || !rec || !salida) { console.log("uso: node scripts/comparar-video.mjs <original.mp4> <recreacion.mp4> <salida.mp4> [--recorte-orig x,y,w,h] [--desfase s] [--fps 30]"); process.exit(1); }
const fps = Number(opt("fps", 30)), desfase = Number(opt("desfase", 0));
const ro = opt("recorte-orig");
const cropO = ro ? (() => { const [x, y, w, h] = ro.split(",").map(Number); return `crop=${w}:${h}:${x}:${y},`; })() : "";
const W = 640, H = 360;
const prep = (crop) => `${crop}fps=${fps},scale=${W}:${H}:flags=bicubic,setsar=1`;
const recIn = desfase >= 0 ? ["-i", rec] : ["-ss", String(-desfase), "-i", rec];
const origIn = desfase > 0 ? ["-ss", String(desfase), "-i", orig] : ["-i", orig];

// 1 · vídeo de comprobación
execFileSync(FFMPEG, ["-v", "error", "-y", ...origIn, ...recIn, "-filter_complex",
  `[0:v]${prep(cropO)},format=rgb24,split=3[o1][o2][o3];[1:v]${prep("")},format=rgb24,split=3[r1][r2][r3];` +
  `[o2][r2]blend=all_mode=difference,lutrgb=r=val*3:g=val*3:b=val*3[d];[o3][r3]blend=all_mode=average[c];` +
  `[o1][r1]hstack[a];[d][c]hstack[b];[a][b]vstack,format=yuv420p[v]`,
  "-map", "[v]", "-shortest", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", salida], { stdio: "inherit" });

// 2 · cifras: YUV a 160×90
const w = 160, h = 90, N = w * h;
const crudo = (args, crop) => execFileSync(FFMPEG, ["-v", "error", ...args, "-vf", `${crop}fps=${fps},scale=${w}:${h},format=yuv444p`, "-f", "rawvideo", "-"], { maxBuffer: 2e9 });
const A = crudo(origIn, cropO), B = crudo(recIn, "");
const n = Math.min(Math.floor(A.length / (3 * N)), Math.floor(B.length / (3 * N)));
const lum = [], cro = [], movA = [], movB = [];
for (let f = 0; f < n; f++) {
  let l = 0, c = 0, ma = 0, mb = 0;
  const o = f * 3 * N, p = (f - 1) * 3 * N;
  for (let i = 0; i < N; i++) {
    l += Math.abs(A[o + i] - B[o + i]);
    c += (Math.abs(A[o + N + i] - B[o + N + i]) + Math.abs(A[o + 2 * N + i] - B[o + 2 * N + i])) / 2;
    if (f) { ma += Math.abs(A[o + i] - A[p + i]); mb += Math.abs(B[o + i] - B[p + i]); }
  }
  lum.push(l / N); cro.push(c / N); if (f) { movA.push(ma / N); movB.push(mb / N); }
}
const media = (v) => v.reduce((s, x) => s + x, 0) / Math.max(1, v.length);
const corr = (x, y) => { const k = Math.min(x.length, y.length); if (k < 3) return 0; const mx = media(x.slice(0, k)), my = media(y.slice(0, k)); let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < k; i++) { sxy += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sx * sy || 1); };
// mejor desfase (±1 s) para el timing
let mejor = { d: 0, c: corr(movA, movB) };
for (let d = -fps; d <= fps; d++) { const c = d >= 0 ? corr(movA.slice(d), movB) : corr(movA, movB.slice(-d)); if (c > mejor.c) mejor = { d, c }; }
console.log(`${salida}\n${n} fotogramas a ${fps} fps comparados`);
console.log("s     imagen  color  timing");
for (let s = 0; s * fps < n; s++) {
  const a = s * fps, b = Math.min(n, a + fps);
  console.log(`${String(s).padStart(3)}  ${media(lum.slice(a, b)).toFixed(1).padStart(6)}  ${media(cro.slice(a, b)).toFixed(1).padStart(5)}  ${corr(movA.slice(a, b - 1), movB.slice(a, b - 1)).toFixed(2).padStart(6)}`);
}
console.log(`TOTAL imagen ${media(lum).toFixed(1)} · color ${media(cro).toFixed(1)} · timing ${corr(movA, movB).toFixed(2)} (mejor desfase ${(mejor.d / fps).toFixed(2)} s → ${mejor.c.toFixed(2)})`);
