#!/usr/bin/env node
// mg.mjs · lanzador del kit de motion graphics sobre HyperFrames (HTML + CSS + GSAP → vídeo).
//
//   node scripts/mg.mjs render <pieza.html> [-o salida/x.mp4] [-w 3] [--variables '{"estilo":"claro"}'] [--desde a --hasta b] [--mudo] [--calidad draft|looks|delivery]
//   node scripts/mg.mjs stills <pieza.html> 0.5,1.2,3 [-o salida/stills-x] [--variables '{...}']
//   node scripts/mg.mjs lint <pieza.html>
//   node scripts/mg.mjs preview <pieza.html>          (estudio de HyperFrames en el navegador)
//
// Qué hace:
// 1. Escribe `index.html` (generado, no lo edites) a partir de la pieza, y convierte su bloque de sonido en etiquetas
//    <audio class="clip"> (el render de HyperFrames solo mezcla el audio escrito en el HTML):
//      <script type="application/json" id="mg-sonido">
//        { "musica": "musica/musica-oscuro.wav", "volumenMusica": 0.55, "fundido": 0.6, "volumen": 0.75,
//          "sfx": [ { "t": 0.2, "n": "whoosh" }, { "t": 2.5, "n": "impacto", "vol": 0.8 } ] }
//      </script>
//    Rutas relativas a `comun/`. La duración de cada efecto se lee del WAV. Con `--variables` que traigan "sonido"
//    (un objeto como el de arriba), ese manda: así una misma pieza cambia de música por dirección.
// 2. Lanza el CLI de HyperFrames instalado (versión fijada en package.json) sin telemetría, sin instalar skills en
//    global, con el Chrome del sistema si lo hay y con FFMPEG en el PATH si se da la variable.
// Sin dependencias.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync, readSync, closeSync, symlinkSync, unlinkSync, rmdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, delimiter, basename } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BIN = join(KIT, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
const [orden, pieza, ...resto] = process.argv.slice(2);

const ayuda = () => { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 6).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(1); };
if (!orden || !pieza) ayuda();
if (!existsSync(BIN)) { console.error("Falta HyperFrames: en la carpeta del kit, npm install --ignore-scripts (la versión va fijada en package.json)."); process.exit(2); }

const opt = (n, def) => { const i = resto.indexOf(n); return i >= 0 ? resto[i + 1] : def; };
const tiene = (n) => resto.includes(n);

// ───── duración de un WAV (cabecera RIFF) ─────
function durWav(fich) {
  try {
    const fd = openSync(fich, "r"), b = Buffer.alloc(4096); readSync(fd, b, 0, 4096, 0); closeSync(fd);
    let p = 12, br = 0, datos = 0;
    while (p < 4088) { const id = b.toString("ascii", p, p + 4), tam = b.readUInt32LE(p + 4); if (id === "fmt ") br = b.readUInt32LE(p + 16); if (id === "data") { datos = tam; break; } p += 8 + tam + (tam % 2); }
    return br && datos ? datos / br : 1.5;
  } catch { return 1.5; }
}

// ───── index.html con el sonido convertido en <audio> ─────
// Cada ejecución trabaja en su carpeta .obras/<pieza>-<pid>/ (index.html + enlace a comun/): así se pueden sacar
// fotogramas de varias piezas a la vez sin pisarse. Se borra al acabar (el enlace primero: nunca toca comun/).
const OBRA = join(KIT, ".obras", basename(pieza, ".html") + "-" + process.pid);
function limpiaObra() { try { unlinkSync(join(OBRA, "comun")); } catch { try { rmdirSync(join(OBRA, "comun")); } catch {} } try { rmSync(OBRA, { recursive: true, force: true }); } catch {} }
process.on("exit", limpiaObra);
// obras de ejecuciones anteriores que no se pudieron borrar (Chrome aún tenía ficheros abiertos): fuera si tienen > 1 h
try { for (const d of readdirSync(join(KIT, ".obras"))) { const p = join(KIT, ".obras", d); if (Date.now() - statSync(p).mtimeMs > 3600e3) { try { unlinkSync(join(p, "comun")); } catch { try { rmdirSync(join(p, "comun")); } catch {} } if (!existsSync(join(p, "comun"))) rmSync(p, { recursive: true, force: true }); } } } catch {}
function generaIndex(variables) {
  mkdirSync(OBRA, { recursive: true });
  if (!existsSync(join(OBRA, "comun"))) symlinkSync(join(KIT, "comun"), join(OBRA, "comun"), "junction");
  const ruta = existsSync(resolve(KIT, pieza)) ? resolve(KIT, pieza) : resolve(KIT, "piezas", pieza.endsWith(".html") ? pieza : pieza + ".html");
  if (!existsSync(ruta)) { console.error("No existe", ruta); process.exit(2); }
  
  let html = readFileSync(ruta, "utf8");
  const m = html.match(/<script type="application\/json" id="mg-sonido">([\s\S]*?)<\/script>/);
  let son = m ? JSON.parse(m[1]) : null;
  if (variables && variables.sonido) son = { ...(son || {}), ...variables.sonido };
  const raiz = html.match(/<([a-z]+)[^>]*data-composition-id="[^"]+"[^>]*>/);
  if (!raiz) { console.error("La pieza no tiene un elemento con data-composition-id."); process.exit(2); }
  const dur = parseFloat((raiz[0].match(/data-duration="([\d.]+)"/) || [])[1] || "0");
  if (son && !tiene("--mudo")) {
    const tags = [];
    const vol = son.volumen ?? 1; // mismos valores por defecto que el Sonido del kit de Remotion
    if (son.musica) tags.push(`<audio id="mg-musica" class="clip" src="comun/${son.musica}" data-start="0" data-duration="${dur}" data-volume="${son.volumenMusica ?? 0.6}"${son.fundido ? ` data-fade-out="${son.fundido}"` : ""} data-track-index="20"></audio>`);
    (son.sfx || []).forEach((s, i) => {
      const src = `comun/sfx/${s.n}.wav`, d = Math.min(durWav(join(KIT, src)), s.dur ?? 1.4, Math.max(0.05, dur - s.t));
      if (s.t < dur) tags.push(`<audio id="mg-sfx-${i}" class="clip" src="${src}" data-start="${Math.max(0, s.t).toFixed(3)}" data-duration="${d.toFixed(3)}" data-volume="${((s.vol ?? 0.4) * vol).toFixed(3)}" data-track-index="${21 + (i % 16)}"></audio>`);
    });
    html = html.replace(raiz[0], raiz[0] + "\n    <!-- generado por scripts/mg.mjs desde mg-sonido -->\n    " + tags.join("\n    "));
  }
  // variables también para stills y vista previa (snapshot no acepta --variables): MG.variables() lee window.__MG_VARS
  if (variables) html = html.replace(/<head>/i, "<head>\n  <script>window.__MG_VARS = " + JSON.stringify(Object.fromEntries(Object.entries(variables).filter(([k]) => k !== "sonido"))).replace(/</g, "\\u003c") + ";</script>");
  writeFileSync(join(OBRA, "index.html"), html.replace(/<head>/i, "<head>\n  <!-- GENERADO por scripts/mg.mjs desde piezas/" + basename(ruta) + ": no lo edites. -->"));
  return dur;
}

// ───── entorno seguro para el CLI ─────
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1", HYPERFRAMES_SKIP_SKILLS: "1" };
if (!env.HYPERFRAMES_BROWSER_PATH) {
  const c = process.platform === "win32" ? [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA].filter(Boolean).map((b) => join(b, "Google", "Chrome", "Application", "chrome.exe"))
    : process.platform === "darwin" ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"] : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  const chrome = c.find((x) => existsSync(x)); if (chrome) env.HYPERFRAMES_BROWSER_PATH = chrome;
}
if (env.FFMPEG && existsSync(env.FFMPEG)) { const k = Object.keys(env).find((x) => x.toUpperCase() === "PATH") || "PATH"; env[k] = dirname(resolve(env.FFMPEG)) + delimiter + (env[k] || ""); }
const hf = (args) => { const r = spawnSync(process.execPath, [BIN, ...args], { stdio: "inherit", env, cwd: OBRA }); return r.status ?? 1; };

const varsTxt = opt("--variables");
const vars = varsTxt ? JSON.parse(varsTxt) : null;
const nombre = basename(pieza, ".html");

if (orden === "lint") { generaIndex(vars); process.exit(hf(["lint", "."])); }
if (orden === "preview") { generaIndex(vars); process.exit(hf(["preview", "."])); }
if (orden === "stills") {
  const tiempos = resto[0] && !resto[0].startsWith("-") ? resto[0] : "1";
  generaIndex(vars);
  const out = resolve(KIT, opt("-o", join("salida", "stills-" + nombre)));
  mkdirSync(out, { recursive: true });
  const a = ["snapshot", ".", "--at", tiempos, "--no-end", "-o", out];
  process.exit(hf(a));
}
if (orden === "render") {
  generaIndex(vars);
  const out = resolve(KIT, opt("-o", join("salida", nombre + ".mp4")));
  mkdirSync(dirname(out), { recursive: true });
  const a = ["render", ".", "-o", out, "-w", opt("-w", "3"), "--quality", opt("--calidad", "looks"), "--quiet"];
  if (varsTxt) a.push("--variables", JSON.stringify(Object.fromEntries(Object.entries(vars).filter(([k]) => k !== "sonido"))));
  if (opt("--desde")) a.push("--start", opt("--desde"));
  if (opt("--hasta")) a.push("--end", opt("--hasta"));
  if (opt("--crf")) a.push("--crf", opt("--crf"));
  const t0 = Date.now(), st = hf(a);
  console.log(st === 0 ? `Listo: ${out} (${((Date.now() - t0) / 1000).toFixed(0)} s)` : "El render ha fallado.");
  process.exit(st);
}
ayuda();
