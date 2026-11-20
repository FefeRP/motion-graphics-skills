#!/usr/bin/env node
// alfa.mjs: saca el alfa de una imagen o un vídeo de IA y lo deja listo para la web.
// Sin dependencias: Node + ffmpeg (lo busca en FFMPEG/FFPROBE, rutas típicas o el PATH).
//
// Modos (cómo se saca el alfa):
//   croma        fondo liso de color (verde, azul, magenta…): clave lineal de diferencia de color con el color del sujeto
//                opaco cercano y desmezcla (quita el verde rebotado sin oscurecer el borde). --color auto|00b140
//   negro        elementos claros o que brillan sobre negro puro (humo, chispas, salpicadura blanca, polvo con luz):
//                alfa = canal máximo; mezcla igual que "screen" sin necesitar mix-blend-mode.
//   blanco       elementos oscuros sobre blanco puro (tinta, sombras, trazos): alfa = 1 - canal mínimo (como "multiply").
//   diferencia   (solo imagen) la MISMA imagen sobre negro y sobre blanco (--negro n.png --blanco b.png): alfa exacto
//                también en cristal, líquido o humo semitransparente. Las dos tienen que estar alineadas al píxel.
//   mascara      el proveedor ya dio la máscara (BiRefNet, VEED, Firefly): --mascara mate.mp4|png (blanco = sujeto).
//   ya-alfa      la entrada ya tiene alfa (PNG, WebM VP9 con alfa, ProRes 4444): solo convierte.
//
// Uso:
//   node alfa.mjs --entrada clip.mp4 --modo croma --salida alfa/splash [--color auto] [--limpiar 0.05] [--radio px]
//   node alfa.mjs --entrada humo.mp4 --modo negro --salida alfa/humo [--umbral 6]
//   node alfa.mjs --modo diferencia --negro splash-negro.png --blanco splash-blanco.png --salida alfa/splash
//   node alfa.mjs --entrada producto.png --modo croma --salida capas/producto --recortar
// Opciones: --ancho 1280 (tope del lado horizontal) · --fps 24 (se toma 1 de cada k fotogramas, k entero: si no divide
//   al vídeo, sale la cadencia uniforme más cercana; por defecto la más cercana a 30 sin pasarse) ·--formatos apilado,webm,frames,png,poster (por defecto en
//   vídeo: apilado,webm,poster; en imagen: recorte) · --scrub (keyframe cada 4 frames: currentTime exacto con el scroll) ·
//   --gop N · --crf 20 · --calidad 82 (WebP) · --movil (frames a la mitad para móvil) · --poster primero|ultimo|N ·
//   --recortar (imagen: recorta a la caja del sujeto + margen) · --conservar (deja la carpeta _rgba)
//
// Salida en --salida:
//   apilado.mp4        "stacked alpha": color premultiplicado arriba, alfa abajo (H.264 normal: va en TODOS los navegadores
//                      con video-alfa.js). Es la vía universal: VP9 con alfa no va en Safari y HEVC con alfa exige un Mac.
//   alfa.webm          VP9 con alfa (Chrome, Edge, Firefox) para <video> directo donde no haga falta Safari.
//   frames/            WebP con alfa + manifest.json compatible con frame-scrubber.js (opción transparente: true).
//   png/               la secuencia RGBA sin pérdida (máster).
//   poster.webp        un fotograma con alfa (respaldo, reduced-motion y LCP).
//   recorte.webp/.png  (imagen) el elemento con alfa.
//   hoja.png           revisión: fotogramas sobre cuadros, fondo oscuro y fondo claro (halos y restos de fondo a la vista).
//   alfa.json          tamaño, fps, ficheros, pesos, caja del sujeto y métricas (cobertura, borde, halo, fondo residual).

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

// ---------- ffmpeg ----------
function buscar(nombre) {
  const env = process.env[nombre.toUpperCase()];
  const exe = process.platform === 'win32' ? `${nombre}.exe` : nombre;
  const cand = [env, '/usr/bin/' + nombre, '/usr/local/bin/' + nombre, '/opt/homebrew/bin/' + nombre].filter(Boolean);
  return cand.find((c) => existsSync(c)) || nombre;
}
const FFMPEG = buscar('ffmpeg');
const FFPROBE = buscar('ffprobe');

function ff(args, etiqueta) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-v', 'error', '-y', ...args], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg (${etiqueta}) falló:\n${String(r.stderr).slice(-1500)}`);
  return r;
}

const ES_IMAGEN = /\.(png|jpe?g|webp|avif|bmp|tiff?)$/i;
const par = (n) => Math.max(2, Math.floor(n / 2) * 2);

export function sondear(entrada, decodVp9 = false) {
  const args = ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries',
    'stream=width,height,r_frame_rate,nb_read_packets,pix_fmt:stream_tags=alpha_mode', '-of', 'json', entrada];
  const r = spawnSync(FFPROBE, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffprobe no pudo leer ${entrada}: ${r.stderr}`);
  const s = JSON.parse(r.stdout).streams?.[0];
  if (!s) throw new Error(`${entrada} no tiene vídeo`);
  const [a, b] = String(s.r_frame_rate || '24/1').split('/').map(Number);
  return { ancho: s.width, alto: s.height, fps: b ? a / b : a, frames: Number(s.nb_read_packets) || 1, pixfmt: s.pix_fmt,
    alfaVp9: decodVp9 || s.tags?.alpha_mode === '1' || s.tags?.ALPHA_MODE === '1' };
}

// Lee un fotograma como RGBA crudo (para muestrear el color de fondo o la entrada de "diferencia")
export function leerRGBA(fichero, w, h, opcionesEntrada = []) {
  const r = spawnSync(FFMPEG, ['-v', 'error', ...opcionesEntrada, '-i', fichero, '-vf', `scale=${w}:${h}:flags=lanczos,format=rgba`,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0 || r.stdout.length !== w * h * 4) throw new Error(`no pude leer ${fichero}: ${r.stderr}`);
  return new Uint8Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length);
}

// ---------- color de fondo automático: media de las cuatro esquinas ----------
export function colorDeEsquinas(d, w, h) {
  const lado = Math.max(2, Math.round(Math.min(w, h) * 0.04));
  const muestras = [];
  for (const [x0, y0] of [[0, 0], [w - lado, 0], [0, h - lado], [w - lado, h - lado]]) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y0 + lado; y++) for (let x = x0; x < x0 + lado; x++) {
      const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
    muestras.push([r / n, g / n, b / n]);
  }
  const media = [0, 1, 2].map((c) => muestras.reduce((s, m) => s + m[c], 0) / 4);
  const dispersion = Math.max(...muestras.map((m) => Math.hypot(m[0] - media[0], m[1] - media[1], m[2] - media[2])));
  return { rgb: media.map(Math.round), dispersion };
}
const hex = ([r, g, b]) => [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// ---------- transformaciones por píxel (sobre RGBA sin premultiplicar) ----------
// negro: el fotograma ES el color premultiplicado; alfa = canal máximo (con suelo de ruido) → color = rgb / alfa
export function alfaDeNegro(d, umbral = 6) {
  const k = 255 / (255 - umbral);
  for (let i = 0; i < d.length; i += 4) {
    const m = Math.max(d[i], d[i + 1], d[i + 2]);
    const a = Math.max(0, Math.min(255, (m - umbral) * k));
    if (a < 1) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
    const f = 255 / a;
    d[i] = Math.min(255, d[i] * f); d[i + 1] = Math.min(255, d[i + 1] * f); d[i + 2] = Math.min(255, d[i + 2] * f); d[i + 3] = a;
  }
}
// blanco: alfa = 1 - canal mínimo; premultiplicado = rgb - mínimo → color = (rgb - mín) / alfa
export function alfaDeBlanco(d, umbral = 6) {
  const k = 255 / (255 - umbral);
  for (let i = 0; i < d.length; i += 4) {
    const mn = Math.min(d[i], d[i + 1], d[i + 2]);
    const a = Math.max(0, Math.min(255, (255 - mn - umbral) * k));
    if (a < 1) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
    const f = 255 / a;
    d[i] = Math.min(255, (d[i] - mn) * f); d[i + 1] = Math.min(255, (d[i + 1] - mn) * f); d[i + 2] = Math.min(255, (d[i + 2] - mn) * f); d[i + 3] = a;
  }
}
// diferencia: N = c·a, B = c·a + (1 - a) → a = 1 - (B - N); color = N / a. Los tres canales deben dar el mismo alfa: si
// no coinciden (más de 0,1 de diferencia) es que el editor de imagen movió el encuadre entre las dos versiones.
export function alfaDeDiferencia(negro, blanco) {
  const sal = new Uint8Array(negro.length);
  let imposibles = 0, n = 0;
  for (let i = 0; i < negro.length; i += 4) {
    let dif = 0, mn = 255, mx = -255;
    for (let c = 0; c < 3; c++) {
      const v = blanco[i + c] - negro[i + c];
      if (v < mn) mn = v;
      if (v > mx) mx = v;
      dif += v;
    }
    if (dif < 3 * 250) { n++; if (mx - mn > 26) imposibles++; } // solo cuenta donde hay sujeto
    const a = Math.max(0, Math.min(255, 255 - dif / 3));
    if (a < 1) continue;
    const f = 255 / a;
    sal[i] = Math.min(255, negro[i] * f); sal[i + 1] = Math.min(255, negro[i + 1] * f); sal[i + 2] = Math.min(255, negro[i + 2] * f); sal[i + 3] = a;
  }
  return { rgba: sal, imposibles: imposibles / Math.max(1, n) };
}

// desenfoque de caja separable, 3 pasadas ≈ gaussiano (para estimar el color del sujeto cerca del borde)
function desenfocar(src, w, h, radio) {
  const r = Math.max(1, Math.round(radio));
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  const pasada = (ent, sal, horizontal) => {
    const n = horizontal ? w : h, m = horizontal ? h : w;
    for (let j = 0; j < m; j++) {
      const idx = (i) => (horizontal ? j * w + i : i * w + j);
      let suma = 0;
      for (let i = -r; i <= r; i++) suma += ent[idx(Math.min(n - 1, Math.max(0, i)))];
      for (let i = 0; i < n; i++) {
        sal[idx(i)] = suma / (2 * r + 1);
        suma += ent[idx(Math.min(n - 1, i + r + 1))] - ent[idx(Math.max(0, i - r))];
      }
    }
  };
  for (let k = 0; k < 3; k++) { pasada(a, b, true); pasada(b, a, false); }
  return a;
}

// croma: fondo liso de color conocido (bg). Clave LINEAL de diferencia de color: k = bg − gris(bg), d(X) = k·X.
// Como la mezcla es lineal (C = a·F + (1−a)·bg), a = (d(bg) − d(C)) / (d(bg) − d(F)), exacto si se conoce F.
//  1) primera pasada suponiendo un sujeto neutro (d(F) = 0, como el keyer de Vlahos);
//  2) F se estima con el color medio del sujeto OPACO cercano (desenfoque normalizado) y se recalcula el alfa del borde;
//  3) el color se desmezcla: F = (C − (1−a)·bg) / a → quita el verde rebotado sin oscurecer el borde (sin despill aparte).
// limpiar: el ruido de compresión del fondo (≈ 3-5 %) se lleva a 0 y lo casi opaco a 1.
export function alfaDeCroma(d, w, h, bg, { limpiar = 0.05, radio = null } = {}) {
  const gris = (bg[0] + bg[1] + bg[2]) / 3;
  const k = [bg[0] - gris, bg[1] - gris, bg[2] - gris];
  const dBg = k[0] * bg[0] + k[1] * bg[1] + k[2] * bg[2];
  if (dBg < 300) throw new Error(`el fondo #${hex(bg)} es casi gris: no sirve como croma. Usa --modo negro/blanco o una máscara.`);
  const n = w * h, a0 = new Float32Array(n), nucleo = new Float32Array(n);
  const cr = new Float32Array(n), cg = new Float32Array(n), cb = new Float32Array(n);
  const ajusta = (a) => Math.max(0, Math.min(1, (a - limpiar) / (1 - 2 * limpiar)));
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const a = ajusta((dBg - (k[0] * d[i] + k[1] * d[i + 1] + k[2] * d[i + 2])) / dBg);
    a0[p] = a;
    if (a >= 0.999) { nucleo[p] = 1; cr[p] = d[i]; cg[p] = d[i + 1]; cb[p] = d[i + 2]; }
  }
  const rad = radio ?? Math.max(3, Math.round(Math.min(w, h) * 0.012));
  const pn = desenfocar(nucleo, w, h, rad), pr = desenfocar(cr, w, h, rad), pg = desenfocar(cg, w, h, rad), pb = desenfocar(cb, w, h, rad);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    let a = a0[p];
    if (a > 0 && a < 1 && pn[p] > 0.02) {
      const F = [pr[p] / pn[p], pg[p] / pn[p], pb[p] / pn[p]];
      const den = dBg - (k[0] * F[0] + k[1] * F[1] + k[2] * F[2]);
      if (den > dBg * 0.35) a = ajusta((dBg - (k[0] * d[i] + k[1] * d[i + 1] + k[2] * d[i + 2])) / den);
    }
    if (a <= 0) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
    if (a < 1) for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, (d[i + c] - (1 - a) * bg[c]) / a));
    d[i + 3] = Math.round(a * 255);
  }
}

// ---------- métricas de calidad de un fotograma ----------
export function medir(d, w, h, clave = null) {
  let cubierto = 0, borde = 0, halo = 0, nHalo = 0, fondoBorde = 0, nBanda = 0;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  const banda = Math.max(2, Math.round(Math.min(w, h) * 0.015));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, a = d[i + 3];
    if (a > 127) cubierto++;
    if (a > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (a > 5 && a < 250) {
      borde++;
      if (clave) { // halo: cuánto se parece el color del borde al color de la clave (0 = nada, 1 = igual)
        const dist = Math.hypot(d[i] - clave[0], d[i + 1] - clave[1], d[i + 2] - clave[2]) / 441.7;
        halo += Math.max(0, 1 - dist * 2.2); nHalo++;
      }
    }
    if (x < banda || y < banda || x >= w - banda || y >= h - banda) { nBanda++; if (a > 25) fondoBorde++; }
  }
  const total = w * h;
  return {
    cobertura: +(cubierto / total).toFixed(4),
    borde: +(borde / total).toFixed(4),
    halo: nHalo ? +(halo / nHalo).toFixed(3) : 0,
    fondo_residual: +(fondoBorde / Math.max(1, nBanda)).toFixed(4),
    caja: x1 < 0 ? null : { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 },
  };
}

// ---------- paso 1: entrada → secuencia RGBA (PNG) en <salida>/_rgba ----------
async function aRGBA({ entrada, modo, opc, w, h, fps, esImagen, info, dirRGBA }) {
  const entradaArgs = [];
  if (info.alfaVp9 && /\.webm$/i.test(entrada)) entradaArgs.push('-c:v', 'libvpx-vp9'); // el decodificador nativo tira el alfa
  if (entrada.includes('%')) entradaArgs.push('-framerate', String(fps));
  const filtros = [];
  // 1 de cada `paso` fotogramas (paso entero): con el filtro fps y una cadencia que no divide a la del vídeo, los frames
  // quedan a intervalos desiguales (1-1-1-2) y el scroll da tirones. Ver pruebas/scroll-frames.
  const selPaso = !esImagen && opc._paso > 1 ? `select='not(mod(n\\,${opc._paso}))',setpts=N/(${fps}*TB)` : null;
  if (selPaso) filtros.push(selPaso);
  filtros.push(`scale=${w}:${h}:flags=lanczos`);
  let complejo = null;
  const metricas = [];
  let clave = null;

  if (modo === 'croma') {
    let color = opc.color;
    if (!color || color === 'auto') {
      const muestra = leerRGBA(entrada, w, h, entradaArgs);
      const c = colorDeEsquinas(muestra, w, h);
      color = hex(c.rgb);
      if (c.dispersion > 40) console.warn(`  Aviso: las esquinas no son del mismo color (dispersión ${c.dispersion.toFixed(0)}): ¿fondo con degradado o viñeta? Pasa --color.`);
      console.log(`  Color de fondo detectado: #${color}`);
    }
    color = color.replace('#', '');
    clave = [0, 2, 4].map((k) => parseInt(color.slice(k, k + 2), 16));
    filtros.push('format=rgba');
  } else if (modo === 'mascara') {
    if (!opc.mascara) throw new Error('modo mascara: falta --mascara');
    complejo = `[0:v]${filtros.join(',')},format=rgba[c];[1:v]${selPaso && !opc.mascara.includes('%') && !ES_IMAGEN.test(opc.mascara) ? selPaso + ',' : ''}scale=${w}:${h}:flags=lanczos,format=gray[m];[c][m]alphamerge,format=rgba`;
  } else {
    filtros.push('format=rgba'); // negro, blanco, ya-alfa
  }

  const args = ['-hide_banner', '-v', 'error', ...entradaArgs, '-i', entrada];
  if (complejo) {
    const mascaraArgs = opc.mascara.includes('%') ? ['-framerate', String(fps)] : [];
    args.push(...mascaraArgs, '-i', opc.mascara, '-filter_complex', complejo);
  } else args.push('-vf', filtros.join(','));
  args.push('-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-');

  const transformar = modo === 'croma' ? (d) => alfaDeCroma(d, w, h, clave, { limpiar: Number(opc.limpiar ?? 0.05), radio: opc.radio ? Number(opc.radio) : null })
    : modo === 'negro' ? (d) => alfaDeNegro(d, Number(opc.umbral ?? 6))
    : modo === 'blanco' ? (d) => alfaDeBlanco(d, Number(opc.umbral ?? 6)) : null;

  const dec = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const enc = spawn(FFMPEG, ['-hide_banner', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`,
    '-framerate', String(fps), '-i', '-', '-start_number', '1', join(dirRGBA, '%04d.png')], { stdio: ['pipe', 'ignore', 'pipe'] });
  let errDec = '', errEnc = '';
  dec.stderr.on('data', (c) => (errDec += c));
  enc.stderr.on('data', (c) => (errEnc += c));
  const finDec = once(dec, 'close'), finEnc = once(enc, 'close');

  const tam = w * h * 4;
  const marco = Buffer.alloc(tam);
  let lleno = 0, n = 0;
  for await (const trozo of dec.stdout) {
    let off = 0;
    while (off < trozo.length) {
      const k = Math.min(tam - lleno, trozo.length - off);
      trozo.copy(marco, lleno, off, off + k);
      lleno += k; off += k;
      if (lleno === tam) {
        const d = new Uint8Array(marco.buffer, marco.byteOffset, tam);
        if (transformar) transformar(d);
        metricas.push(medir(d, w, h, clave));
        if (!enc.stdin.write(Buffer.from(marco))) await once(enc.stdin, 'drain');
        lleno = 0; n++;
      }
    }
  }
  enc.stdin.end();
  const [[cDec], [cEnc]] = await Promise.all([finDec, finEnc]);
  if (cDec !== 0) throw new Error(`ffmpeg (leer entrada) falló:\n${errDec.slice(-1500)}`);
  if (cEnc !== 0) throw new Error(`ffmpeg (escribir PNG) falló:\n${errEnc.slice(-1500)}`);
  if (!n) throw new Error('no salió ningún fotograma');
  return { frames: n, metricas, clave };
}

// ---------- hoja de revisión: fotogramas sobre cuadros, oscuro y claro ----------
function hojaRevision(dirRGBA, frames, w, h, destino) {
  const cols = Math.min(4, frames);
  const idx = Array.from({ length: cols }, (_, k) => 1 + Math.round((k * (frames - 1)) / Math.max(1, cols - 1)));
  const tw = Math.min(360, w), th = Math.max(2, Math.round((h * tw) / w));
  const fondos = [null, [29, 42, 51], [244, 239, 230]]; // cuadros, oscuro, claro
  const W = tw * cols, H = th * fondos.length;
  const hoja = new Uint8Array(W * H * 4);
  idx.forEach((f, c) => {
    const d = leerRGBA(join(dirRGBA, `${String(f).padStart(4, '0')}.png`), tw, th);
    fondos.forEach((fondo, r) => {
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
        const i = (y * tw + x) * 4, o = ((r * th + y) * W + c * tw + x) * 4;
        const bg = fondo ?? (((x >> 4) + (y >> 4)) & 1 ? [205, 205, 205] : [150, 150, 150]);
        const a = d[i + 3] / 255;
        for (let k = 0; k < 3; k++) hoja[o + k] = d[i + k] * a + bg[k] * (1 - a);
        hoja[o + 3] = 255;
      }
    });
  });
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', '-frames:v', '1', destino],
    { input: Buffer.from(hoja.buffer), maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`no pude escribir la hoja: ${r.stderr}`);
}

const kb = (f) => (existsSync(f) ? Math.round(statSync(f).size / 1024) : 0);
function kbCarpeta(dir) {
  if (!existsSync(dir)) return 0;
  return Math.round(readdirSync(dir).reduce((s, f) => s + statSync(join(dir, f)).size, 0) / 1024);
}

// ---------- programa ----------
function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2), sig = argv[i + 1];
    if (sig === undefined || sig.startsWith('--')) o[k] = true; else { o[k] = sig; i++; }
  }
  return o;
}

async function main() {
  const opc = args(process.argv.slice(2));
  if (opc.ayuda || opc.help || (!opc.entrada && opc.modo !== 'diferencia') || !opc.salida) {
    console.log('Uso: node alfa.mjs --entrada <vídeo|imagen|frames/%04d.png> --modo croma|negro|blanco|mascara|ya-alfa --salida <dir>\n' +
      '     node alfa.mjs --modo diferencia --negro <img> --blanco <img> --salida <dir>\n(ver la cabecera del script para todas las opciones)');
    process.exit(opc.ayuda || opc.help ? 0 : 1);
  }
  const modo = opc.modo || 'croma';
  if (!['croma', 'negro', 'blanco', 'diferencia', 'mascara', 'ya-alfa'].includes(modo)) throw new Error(`modo desconocido: ${modo}`);
  const salida = resolve(opc.salida);
  mkdirSync(salida, { recursive: true });
  const dirRGBA = join(salida, '_rgba');
  rmSync(dirRGBA, { recursive: true, force: true });
  mkdirSync(dirRGBA, { recursive: true });

  let w, h, fps, frames, metricas, clave = null, esImagen, avisos = [];
  if (modo === 'diferencia') {
    if (!opc.negro || !opc.blanco) throw new Error('modo diferencia: faltan --negro y --blanco');
    const info = sondear(opc.negro);
    w = par(Math.min(info.ancho, Number(opc.ancho) || 4096)); h = par((info.alto * w) / info.ancho);
    const N = leerRGBA(opc.negro, w, h), B = leerRGBA(opc.blanco, w, h);
    const { rgba, imposibles } = alfaDeDiferencia(N, B);
    if (imposibles > 0.03) avisos.push(`En el ${(imposibles * 100).toFixed(1)} % del sujeto los tres canales dan alfas distintos: las dos imágenes no están alineadas (el editor movió el encuadre o cambió el sujeto). Pide la segunda como edición "same image, only change the background to pure white" o alinéalas antes.`);
    const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`, '-i', '-', '-frames:v', '1', join(dirRGBA, '0001.png')],
      { input: Buffer.from(rgba.buffer), maxBuffer: 1 << 28 });
    if (r.status !== 0) throw new Error(`no pude escribir el PNG: ${r.stderr}`);
    fps = 1; frames = 1; esImagen = true;
    metricas = [medir(rgba, w, h)];
    metricas[0].imposibles = +imposibles.toFixed(4);
  } else {
    const entrada = opc.entrada;
    if (!entrada.includes('%') && !existsSync(entrada)) throw new Error(`No existe ${entrada}`);
    esImagen = ES_IMAGEN.test(entrada) && !entrada.includes('%');
    const info = sondear(entrada);
    if (entrada.includes('%') || !(info.fps > 0)) fps = Number(opc.fps) || 24;
    else {
      // cadencia de salida = la del vídeo / paso entero (por defecto, la más cercana a 30 sin pasarse)
      const objetivo = Number(opc.fps) || Math.min(30, info.fps);
      opc._paso = Math.max(1, Math.round(info.fps / objetivo));
      fps = Math.round((info.fps / opc._paso) * 1000) / 1000;
      if (opc.fps && Math.abs(fps - Number(opc.fps)) / Number(opc.fps) > 0.1)
        avisos.push(`--fps ${opc.fps} no divide a los ${info.fps} fps del vídeo: salen ${fps} fps (1 de cada ${opc._paso}), para que el intervalo sea uniforme.`);
    }
    const tope = Number(opc.ancho) || (esImagen ? 4096 : 1280);
    w = par(Math.min(info.ancho, tope)); h = par((info.alto * w) / info.ancho);
    if (modo === 'ya-alfa' && /\.webm$/i.test(entrada) && !info.alfaVp9) avisos.push('El WebM no declara alfa (alpha_mode): si sale opaco, la entrada no tenía transparencia.');
    console.log(`Entrada: ${basename(entrada)} · ${info.ancho}×${info.alto} → ${w}×${h} · ${esImagen ? 'imagen' : `${fps} fps`} · modo ${modo}`);
    ({ frames, metricas, clave } = await aRGBA({ entrada, modo, opc, w, h, fps, esImagen, info, dirRGBA }));
  }

  const formatos = String(opc.formatos || (esImagen ? 'recorte' : 'apilado,webm,poster')).split(',').map((s) => s.trim());
  const patron = join(dirRGBA, '%04d.png');
  const entradaSec = ['-framerate', String(fps), '-i', patron];
  const res = { version: 1, generado: new Date().toISOString(), modo, ancho: w, alto: h, fps, frames, duracion: +(frames / fps).toFixed(3), ficheros: {}, pesos_kb: {} };
  if (clave) res.color_clave = '#' + hex(clave);

  // caja del sujeto en todo el clip (unión) para posicionar la capa
  const cajas = metricas.map((m) => m.caja).filter(Boolean);
  if (cajas.length) {
    const x0 = Math.min(...cajas.map((c) => c.x)), y0 = Math.min(...cajas.map((c) => c.y));
    const x1 = Math.max(...cajas.map((c) => c.x + c.ancho)), y1 = Math.max(...cajas.map((c) => c.y + c.alto));
    res.caja = { x: x0, y: y0, ancho: x1 - x0, alto: y1 - y0,
      pct: { x: +(x0 / w * 100).toFixed(2), y: +(y0 / h * 100).toFixed(2), ancho: +((x1 - x0) / w * 100).toFixed(2), alto: +((y1 - y0) / h * 100).toFixed(2) } };
  }

  if (esImagen || formatos.includes('recorte')) {
    let crop = '';
    if (opc.recortar && res.caja) {
      const m = Math.round(Math.max(res.caja.ancho, res.caja.alto) * 0.02) + 2;
      const x = Math.max(0, res.caja.x - m), y = Math.max(0, res.caja.y - m);
      const cw = Math.min(w - x, res.caja.ancho + 2 * m), ch = Math.min(h - y, res.caja.alto + 2 * m);
      crop = `crop=${cw}:${ch}:${x}:${y},`;
      res.recorte = { x, y, ancho: cw, alto: ch };
    }
    ff(['-i', join(dirRGBA, '0001.png'), '-vf', `${crop}format=rgba`, join(salida, 'recorte.png')], 'recorte png');
    ff(['-i', join(dirRGBA, '0001.png'), '-vf', `${crop}format=yuva420p`, '-c:v', 'libwebp', '-quality', String(opc.calidad || 85), '-compression_level', '6', join(salida, 'recorte.webp')], 'recorte webp');
    res.ficheros.recorte = 'recorte.webp'; res.ficheros.recorte_png = 'recorte.png';
    res.pesos_kb.recorte = kb(join(salida, 'recorte.webp'));
  }
  if (!esImagen) {
    const gop = Number(opc.gop) || (opc.scrub ? 4 : Math.round(fps * 2));
    if (formatos.includes('apilado')) {
      ff([...entradaSec, '-filter_complex', '[0:v]format=rgba,split[a][b];[a]premultiply=inplace=1,format=yuv420p[c];[b]alphaextract,format=yuv420p[m];[c][m]vstack,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', String(opc.crf || 20), '-g', String(gop), '-keyint_min', String(Math.min(gop, 4)), '-sc_threshold', '0',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(salida, 'apilado.mp4')], 'apilado');
      res.ficheros.apilado = 'apilado.mp4'; res.pesos_kb.apilado = kb(join(salida, 'apilado.mp4')); res.gop = gop;
    }
    if (formatos.includes('webm')) {
      ff([...entradaSec, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-crf', String(Number(opc.crf || 20) + 12), '-b:v', '0', '-auto-alt-ref', '0',
        '-row-mt', '1', '-g', String(gop), '-an', join(salida, 'alfa.webm')], 'webm');
      res.ficheros.webm = 'alfa.webm'; res.pesos_kb.webm = kb(join(salida, 'alfa.webm'));
    }
    if (formatos.includes('frames')) {
      const variantes = [['escritorio', w, h]];
      if (opc.movil) variantes.push(['movil', par(w / 2), par(h / 2)]);
      const man = { version: 1, generado: res.generado, fuente: basename(opc.entrada), frames, fps, alfa: true, pad: 4, formatos: ['webp'], variantes: {} };
      for (const [nombre, vw, vh] of variantes) {
        const dir = join(salida, 'frames', nombre);
        rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
        ff([...entradaSec, '-vf', `scale=${vw}:${vh}:flags=lanczos,format=yuva420p`, '-c:v', 'libwebp', '-quality', String(opc.calidad || 82),
          '-compression_level', '5', '-start_number', '1', join(dir, '%04d.webp')], `frames ${nombre}`);
        ff(['-i', join(dir, '0001.webp'), '-c:v', 'libwebp', '-quality', '82', join(salida, 'frames', `poster-${nombre}.webp`)], 'póster frames');
        man.variantes[nombre] = { ancho: vw, alto: vh, ruta: `${nombre}/{i}.{ext}`, poster: `poster-${nombre}.webp`, bytes: { webp: kbCarpeta(dir) * 1024 } };
      }
      writeFileSync(join(salida, 'frames', 'manifest.json'), JSON.stringify(man, null, 2));
      res.ficheros.frames = 'frames/manifest.json';
      res.pesos_kb.frames = kbCarpeta(join(salida, 'frames', 'escritorio'));
    }
    if (formatos.includes('poster') || formatos.includes('apilado')) {
      const p = opc.poster === 'ultimo' ? frames : Math.min(frames, Math.max(1, Number(opc.poster) || 1));
      ff(['-i', join(dirRGBA, `${String(p).padStart(4, '0')}.png`), '-vf', 'format=yuva420p', '-c:v', 'libwebp', '-quality', '85', join(salida, 'poster.webp')], 'póster');
      res.ficheros.poster = 'poster.webp'; res.pesos_kb.poster = kb(join(salida, 'poster.webp'));
    }
  }
  hojaRevision(dirRGBA, frames, w, h, join(salida, 'hoja.png'));
  res.ficheros.hoja = 'hoja.png';

  // resumen de métricas
  const prom = (k) => +(metricas.reduce((s, m) => s + m[k], 0) / metricas.length).toFixed(4);
  res.metricas = { cobertura_media: prom('cobertura'), borde_medio: prom('borde'), halo_medio: prom('halo'), fondo_residual_medio: prom('fondo_residual') };
  if (metricas[0].imposibles !== undefined) res.metricas.imposibles = metricas[0].imposibles;
  const saltos = [];
  for (let i = 1; i < metricas.length - 1; i++) {
    const a = metricas[i - 1].cobertura, b = metricas[i].cobertura, c = metricas[i + 1].cobertura;
    const ref = (a + c) / 2;
    if (ref > 0.002 && Math.abs(b - ref) / ref > 0.3) saltos.push(i + 1);
  }
  if (saltos.length) { res.metricas.fotogramas_dudosos = saltos.slice(0, 50); avisos.push(`${saltos.length} fotograma(s) con la cobertura del sujeto muy distinta a sus vecinos (el recorte parpadea): ${saltos.slice(0, 10).join(', ')}${saltos.length > 10 ? '…' : ''}.`); }
  if (res.metricas.fondo_residual_medio > 0.05) avisos.push(`Queda fondo sin quitar en el borde del encuadre (${(res.metricas.fondo_residual_medio * 100).toFixed(1)} %): fondo con degradado o viñeta (revisa --color, sube --limpiar) o el sujeto toca el borde.`);
  if (res.metricas.halo_medio > 0.25) avisos.push(`Halo del color de fondo en el borde (${res.metricas.halo_medio}): sube --limpiar un poco o pide el asset con más separación entre sujeto y fondo.`);
  if (res.metricas.cobertura_media < 0.002) avisos.push('Casi no queda sujeto: el fondo y el sujeto se parecen demasiado o el modo no es el adecuado.');
  if (res.metricas.cobertura_media > 0.97) avisos.push('Casi no se ha quitado nada: ¿el color de fondo es el correcto?');
  res.avisos = avisos;
  writeFileSync(join(salida, 'alfa.json'), JSON.stringify(res, null, 2));

  if (formatos.includes('png')) {
    const dirPng = join(salida, 'png');
    rmSync(dirPng, { recursive: true, force: true });
    renameSync(dirRGBA, dirPng); // la secuencia sin pérdida se queda como máster
    res.ficheros.png = 'png/%04d.png';
    writeFileSync(join(salida, 'alfa.json'), JSON.stringify(res, null, 2));
  } else if (!opc.conservar) rmSync(dirRGBA, { recursive: true, force: true });

  console.log(`Listo en ${salida}: ${frames} fotograma(s) ${w}×${h}`);
  for (const [k, v] of Object.entries(res.pesos_kb)) console.log(`  ${k.padEnd(9)} ${v} KB`);
  console.log(`  métricas  cobertura ${res.metricas.cobertura_media} · borde ${res.metricas.borde_medio} · halo ${res.metricas.halo_medio} · fondo residual ${res.metricas.fondo_residual_medio}`);
  for (const a of avisos) console.warn('  Aviso: ' + a);
  console.log('  Revisa hoja.png (cuadros, oscuro y claro) antes de montarlo.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('Error: ' + e.message); process.exit(1); });
}
