#!/usr/bin/env node
// audio.mjs · sonido de una pieza con voz en off: ducking, medir la mezcla y cambiar la música SIN volver a renderizar.
//
//   node scripts/audio.mjs ducking <musica.wav> <voz.wav> <salida.wav> [--golpes 16.92,80.84] [--hueco 0.15]
//        [--bajadas '[[a,b,g],…]'] [--llave 3] [--duracion s] [--voz-inicio s]
//   node scripts/audio.mjs medir <voz.wav> <musica-con-ducking.wav> [--volumen-musica 0.62] [--frases tiempos.json]
//   node scripts/audio.mjs remezclar <pieza.html> <video.mp4> <salida.mp4> [--musica otra.wav] [--voz otra.wav] [--voz-inicio s]
//
// ducking: la voz hace de llave (sidechaincompress, umbral 0,012, ratio 12, ataque 15 ms, suelta 300 ms, unos −14 dB bajo
//   la voz); --golpes deja --hueco s de silencio ANTES de cada golpe, muestra a muestra con rampas de 3 ms (con
//   volume=enable de ffmpeg el silencio se come el ataque); --bajadas añade [desde, hasta, ganancia] con rampas de
//   0,1 s / 0,25 s bajo frases que quedan tapadas. Cerca del golpe no bajes la música (apaga el drop).
// medir: voz − música en dB solo en ventanas de 100 ms con voz (M > −30 LUFS); objetivo mediana ≥ 8 dB y p10 ≥ 3 dB.
//   Con --frases (JSON [{id, inicio, fin}]) lo da por frase; sin él, por tramos de voz continua.
// remezclar: rehace el audio con el bloque mg-sonido de la pieza (voz + música × volumenMusica + efectos, igual que
//   mg.mjs) y lo pone sobre el vídeo copiando la imagen (-c:v copy); loudnorm −14 LUFS / −1,5 dBTP, AAC 256k.
// ffmpeg: variable FFMPEG o el PATH. Sin dependencias.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const [orden, ...args] = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const ayuda = () => { console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 8).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(1); };
const ff = (a, opts = {}) => {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-v", "error", "-y", ...a], { maxBuffer: 1 << 30, ...opts });
  if (r.error) { console.error(`No encuentro ffmpeg (${FFMPEG}): ponlo en el PATH o en la variable FFMPEG.`); process.exit(2); }
  if (r.status !== 0) { console.error(String(r.stderr).slice(-1500)); process.exit(3); }
  return r;
};
const SR = 48000;
function leePcm(f) {
  const r = ff(["-i", f, "-f", "f32le", "-ac", "2", "-ar", String(SR), "-"]);
  const b = r.stdout; return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}
function durWav(f) { // cabecera RIFF, como mg.mjs
  try {
    const b = Buffer.alloc(4096), fd = fs.openSync(f, "r"); fs.readSync(fd, b, 0, 4096, 0); fs.closeSync(fd);
    let p = 12, br = 0, datos = 0;
    while (p < 4088) { const id = b.toString("ascii", p, p + 4), tam = b.readUInt32LE(p + 4); if (id === "fmt ") br = b.readUInt32LE(p + 16); if (id === "data") { datos = tam; break; } p += 8 + tam + (tam % 2); }
    return br && datos ? datos / br : 1.5;
  } catch { return 1.5; }
}

function ducking() {
  const [musica, voz, salida] = pos; if (!salida) ayuda();
  const llave = Number(opt("--llave", 3)), hueco = Number(opt("--hueco", 0.15));
  const golpes = opt("--golpes", "") ? opt("--golpes").split(",").map(Number) : [];
  const bajadas = JSON.parse(opt("--bajadas", "[]"));
  const rampa = ([a, b, g]) => `(1-${(1 - g).toFixed(3)}*min(1,max(0,(t-${a})/0.1))*min(1,max(0,(${b}-t)/0.25)))`;
  const vol = bajadas.length ? `,volume=eval=frame:volume='${bajadas.map(rampa).join("*")}'` : "";
  const dur = opt("--duracion") ? `,atrim=0:${opt("--duracion")}` : "";
  const tmp = salida.replace(/\.wav$/i, "") + "-tmp.wav";
  ff(["-i", musica, "-i", voz, "-filter_complex",
    `[1:a]aformat=channel_layouts=stereo,aresample=${SR},adelay=${Math.round(Number(opt("--voz-inicio", 0)) * 1000)}:all=1,apad,volume=${llave}[k];[0:a]aformat=channel_layouts=stereo,aresample=${SR}${dur}[m];` +
    `[m][k]sidechaincompress=threshold=0.012:ratio=12:attack=15:release=300:makeup=1${vol}[o]`, "-map", "[o]", "-c:a", "pcm_f32le", tmp]);
  const x = leePcm(tmp); fs.unlinkSync(tmp);
  const R3 = Math.round(0.003 * SR), n = x.length / 2;
  for (const g of golpes) { // silencio antes del golpe, muestra a muestra
    const i0 = Math.round((g - hueco) * SR), i1 = Math.round(g * SR);
    for (let i = i0 - R3; i < i1 + R3; i++) {
      if (i < 0 || i >= n) continue;
      const k = Math.min(1, i < i0 ? (i0 - i) / R3 : i >= i1 ? (i - i1 + 1) / R3 : 0);
      x[2 * i] *= k; x[2 * i + 1] *= k;
    }
  }
  const raw = salida + ".f32"; fs.writeFileSync(raw, Buffer.from(x.buffer));
  ff(["-f", "f32le", "-ac", "2", "-ar", String(SR), "-i", raw, "-c:a", "pcm_s16le", salida]); fs.unlinkSync(raw);
  console.log(`ok ${salida} (${golpes.length} golpes con ${hueco * 1000} ms de silencio antes, ${bajadas.length} bajadas)`);
}

function momentanea(f, extra = "") { // M cada 100 ms
  const r = spawnSync(FFMPEG, ["-hide_banner", "-nostats", "-v", "verbose", "-i", f, "-af", `${extra}ebur128=framelog=verbose`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
  const m = new Map();
  for (const l of String(r.stderr).split("\n")) { const a = l.match(/t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+|-inf|nan)/); if (a) m.set(Math.round(+a[1] * 10), /inf|nan/.test(a[2]) ? -120 : +a[2]); }
  if (m.size < 10) { console.error(`ebur128 no dio datos de ${f}`); process.exit(3); }
  return m;
}
function medir() {
  const [voz, musica] = pos; if (!musica) ayuda();
  const V = momentanea(voz), M = momentanea(musica, `volume=${opt("--volumen-musica", 0.62)},`);
  let tramos;
  if (opt("--frases")) tramos = JSON.parse(fs.readFileSync(opt("--frases"), "utf8")).map((l, i) => ({ id: l.id ?? i + 1, a: Math.ceil(l.inicio * 10), b: Math.floor(l.fin * 10) }));
  else { // tramos de voz continua (huecos < 0,4 s se unen)
    tramos = []; let ini = null, ult = -9;
    for (const k of [...V.keys()].sort((a, b) => a - b)) if (V.get(k) > -30) { if (ini === null || k - ult > 4) { if (ini !== null) tramos.push({ a: ini, b: ult }); ini = k; } ult = k; }
    if (ini !== null) tramos.push({ a: ini, b: ult });
    tramos = tramos.filter((t) => t.b - t.a >= 3).map((t, i) => ({ ...t, id: `${(t.a / 10).toFixed(1)}s` }));
  }
  const filas = tramos.map((t) => {
    const d = []; for (let k = t.a; k <= t.b; k++) { const v = V.get(k), m = M.get(k); if (v !== undefined && m !== undefined && v > -30) d.push(v - m); }
    d.sort((p, q) => p - q); return { id: t.id, corta: t.b - t.a < 8, med: d[Math.floor(d.length / 2)] ?? NaN, p10: d[Math.floor(d.length * 0.1)] ?? NaN };
  });
  console.log(filas.map((f) => `${f.id} ${f.med.toFixed(1)}/${f.p10.toFixed(1)}${f.corta ? "*" : ""}`).join(" · "));
  if (filas.some((f) => f.corta)) console.log("* frase de menos de 0,8 s: la sonoridad momentánea (ventana de 400 ms) mezcla silencio y lo que suena antes; no es fiable, escúchala (y si cae en un golpe o drop, decide cuánto bajar el drop)");
  const malas = filas.filter((f) => !f.corta && !(f.med >= 8 && f.p10 >= 3));
  console.log(malas.length ? "OJO (voz tapada; añade --bajadas en esas frases): " + malas.map((f) => `${f.id} (${f.med.toFixed(1)}/${f.p10.toFixed(1)})`).join(", ") : "OK: voz con mediana ≥ 8 dB y p10 ≥ 3 dB sobre la música en todas las frases");
}

function remezclar() {
  const [pieza, video, salida] = pos; if (!salida) ayuda();
  const ruta = fs.existsSync(pieza) ? pieza : path.join(KIT, "piezas", pieza.endsWith(".html") ? pieza : pieza + ".html");
  const html = fs.readFileSync(ruta, "utf8");
  const m = html.match(/<script type="application\/json" id="mg-sonido">([\s\S]*?)<\/script>/);
  if (!m) { console.error("La pieza no tiene bloque mg-sonido."); process.exit(2); }
  const son = JSON.parse(m[1]);
  const DUR = parseFloat((html.match(/data-composition-id="[^"]+"[^>]*data-duration="([\d.]+)"/) || html.match(/data-duration="([\d.]+)"[^>]*data-composition-id/) || [])[1]);
  if (!DUR) { console.error("No encuentro data-duration en la raíz de la pieza."); process.exit(2); }
  const C = (r) => path.join(KIT, "comun", r);
  const voz = opt("--voz") ? path.resolve(opt("--voz")) : son.voz ? C(son.voz) : null;
  const musica = opt("--musica") ? path.resolve(opt("--musica")) : son.musica ? C(son.musica) : null;
  const entradas = [], filtros = [], et = [];
  const fmt = `aformat=sample_rates=${SR}:channel_layouts=stereo`;
  if (voz) { const k = entradas.push(voz) - 1; filtros.push(`[${k}:a]${fmt},volume=${son.volumenVoz ?? 1},adelay=${Math.round(Number(opt("--voz-inicio", son.vozInicio ?? 0)) * 1000)}:all=1[v]`); et.push("[v]"); }
  if (musica) { const k = entradas.push(musica) - 1; filtros.push(`[${k}:a]${fmt},atrim=0:${DUR},volume=${son.volumenMusica ?? 0.6}${son.fundido ? `,afade=t=out:st=${(DUR - son.fundido).toFixed(3)}:d=${son.fundido}` : ""}[m]`); et.push("[m]"); }
  const vol = son.volumen ?? 1;
  (son.sfx || []).forEach((s, i) => {
    if (s.t >= DUR) return;
    const f = C(`sfx/${s.n}.wav`), d = Math.min(durWav(f), s.dur ?? 1.4, Math.max(0.05, DUR - s.t));
    const k = entradas.push(f) - 1;
    filtros.push(`[${k}:a]${fmt},atrim=0:${d.toFixed(3)},volume=${((s.vol ?? 0.4) * vol).toFixed(3)},adelay=${Math.round(Math.max(0, s.t) * 1000)}:all=1[s${i}]`); et.push(`[s${i}]`);
  });
  if (!et.length) { console.error("mg-sonido no tiene voz, música ni efectos."); process.exit(2); }
  filtros.push(`${et.join("")}amix=inputs=${et.length}:normalize=0:duration=longest,apad=whole_dur=${DUR},atrim=0:${DUR}[mez]`);
  const crudo = salida.replace(/\.mp4$/i, "") + "-audio.wav", guion = crudo + ".filtro.txt";
  fs.writeFileSync(guion, filtros.join(";\n"));
  ff([...entradas.flatMap((e) => ["-i", e]), "-filter_complex_script", guion, "-map", "[mez]", "-c:a", "pcm_f32le", crudo]);
  fs.unlinkSync(guion);
  ff(["-i", video, "-i", crudo, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", String(SR), "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", salida]);
  fs.unlinkSync(crudo);
  console.log(`ok ${salida} (imagen copiada; voz ${voz ? "sí" : "no"}, música ${musica ? path.basename(musica) : "no"}, ${(son.sfx || []).length} efectos)`);
}

({ ducking, medir, remezclar }[orden] || ayuda)();
