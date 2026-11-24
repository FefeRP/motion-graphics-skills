#!/usr/bin/env node
// voz.mjs · locución de una pieza: revisa el texto, la genera DE UNA VEZ (misma entonación de principio a fin) y saca
// el tiempo de cada palabra para clavar subtítulos, cámara y efectos a la voz.
//
//   node scripts/voz.mjs revisar <guion-voz.json>
//   node scripts/voz.mjs generar <guion-voz.json> <carpeta-salida> [--velocidad 1.0]
//
// guion-voz.json:
//   { "motor": "elevenlabs" | "edge", "voz": "<id de voz de ElevenLabs o nombre de Edge, p. ej. es-ES-AlvaroNeural>",
//     "modelo": "eleven_multilingual_v2", "ajustes": { "stability": 0.45, "similarity_boost": 0.8, "style": 0.4, "speed": 0.97 },
//     "lineas": [ { "id": "P1", "texto": "como se DICE (cifras y siglas en letra)", "sub": "como se LEE en pantalla" } ] }
// revisar: avisa de «y» de sobra, frases que empiezan por «Y», cifras, símbolos (€ % / @), siglas y dominios que el TTS
//   puede leer mal, y frases largas. Corrígelo ANTES de generar (cada toma cuesta).
// generar: todas las líneas en UNA petición (separadas por línea en blanco), con los tiempos por carácter (ElevenLabs
//   /with-timestamps, clave en XI_API_KEY o en el fichero de ELEVENLABS_ENV, .env o la clave sola) o por palabra (Edge, gratis, para
//   pruebas: npm i msedge-tts). Escribe voz.wav (48 kHz mono) y voz-tiempos.json:
//   [ { id, texto, sub, inicio, fin, palabras: [ { p, i, f } ] } ] (segundos desde el principio de voz.wav).
// ffmpeg: variable FFMPEG o el PATH.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const [orden, guion, salida, ...resto] = process.argv.slice(2);
const opt = (n, d) => { const i = resto.indexOf(n); return i >= 0 ? resto[i + 1] : d; };
if (!orden || !guion) { console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 9).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(1); }
const G = JSON.parse(fs.readFileSync(guion, "utf8"));
if (!Array.isArray(G.lineas) || !G.lineas.length) { console.error("El guion no tiene «lineas»."); process.exit(2); }

// ───────── revisar ─────────
function revisar() {
  const avisos = [];
  let ys = 0;
  for (const l of G.lineas) {
    const t = l.texto, a = (m) => avisos.push(`${l.id}: ${m}`);
    const y = (t.match(/(^|[\s,;:¿¡(])[yY](?=\s)/g) || []).length; ys += y;
    if (/^[¿¡\s]*Y\s/.test(t)) a("empieza por «Y»: quítala o parte la frase");
    if (y > 1) a(`${y} «y» en una frase: enumera con comas o parte en dos`);
    if (/\d/.test(t)) a(`cifras «${t.match(/\d[\d.,:]*\d?\s?[%€$]?/g).map((x) => x.trim()).join(" ")}»: escríbelas como se dicen («trescientos sesenta y cinco», «cinco con noventa y nueve»)`);
    if (/[€%$£@#&/+=]/.test(t)) a("símbolos (€ % / @ & +): escríbelos en letra («euros», «por ciento», «arroba»)");
    if (/\b[\w-]+\.(com|org|net|io|es|app|dev|ai|co)\b/i.test(t)) a("dominio: deletréalo como suena («tumarca punto, ó, erre, ge»; la «ó» con tilde se dice como letra)");
    const siglas = t.match(/\b[A-ZÁÉÍÓÚÑ]{2,}\b/g); if (siglas) a(`siglas ${siglas.join(", ")}: decide cómo suenan («hache, te, te, pe, ese» o la palabra) y escríbelo así`);
    const n = t.split(/\s+/).filter(Boolean).length; if (n > 16) a(`${n} palabras: frase larga para una promo; parte en dos`);
    if (/\b(bueno|pues|o sea|vale|eh)\b/i.test(t)) a("muletilla (bueno, pues, o sea, vale, eh): quítala");
  }
  const tot = G.lineas.reduce((s, l) => s + l.texto.length, 0);
  if (ys > Math.max(2, G.lineas.length / 4)) avisos.push(`en total ${ys} «y» en ${G.lineas.length} frases: demasiadas (como mucho una de cada cuatro frases)`);
  console.log(`${G.lineas.length} frases, ${tot} caracteres por toma, ${ys} «y».`);
  console.log(avisos.length ? avisos.map((x) => "  · " + x).join("\n") : "  OK: sin avisos");
  return avisos.length;
}

// ───────── generar ─────────
const SR = 48000;
const ff = (args) => { const r = spawnSync(FFMPEG, ["-hide_banner", "-v", "error", "-y", ...args], { maxBuffer: 1 << 30 }); if (r.error || r.status !== 0) { console.error(r.error ? `No encuentro ffmpeg (${FFMPEG})` : String(r.stderr)); process.exit(3); } return r; };
const SEP = "\n\n";

/** palabras [{p, i, f}] del texto completo → por línea (las palabras de cada línea, en orden) */
function porLinea(palabras) {
  let k = 0;
  return G.lineas.map((l) => {
    const n = l.texto.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length, pal = palabras.slice(k, k + n); k += n;
    if (pal.length < n) console.warn(`ojo: ${l.id} tiene ${n} palabras y el motor devolvió ${pal.length}`);
    return { id: l.id, texto: l.texto, sub: l.sub || l.texto, inicio: pal[0]?.i ?? 0, fin: pal.at(-1)?.f ?? 0, palabras: pal };
  });
}

async function elevenlabs(texto, mp3) {
  let clave = process.env.XI_API_KEY;
  if (!clave && process.env.ELEVENLABS_ENV) { const s = fs.readFileSync(process.env.ELEVENLABS_ENV, "utf8"); clave = (s.match(/^\s*(?:XI|ELEVEN\w*)_API_KEY\s*=\s*(.+)$/m) || [null, s])[1].trim(); }
  if (!clave) { console.error("Falta la clave: XI_API_KEY o ELEVENLABS_ENV=<fichero .env o con la clave sola>. Nunca la escribas en el guion."); process.exit(2); }
  const ajustes = { stability: 0.45, similarity_boost: 0.8, style: 0.4, use_speaker_boost: true, speed: Number(opt("--velocidad", 0.97)), ...(G.ajustes || {}) };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${G.voz}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": clave, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto, model_id: G.modelo || "eleven_multilingual_v2", voice_settings: ajustes }) });
  if (!r.ok) { console.error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`); process.exit(3); }
  const j = await r.json(); fs.writeFileSync(mp3, Buffer.from(j.audio_base64, "base64"));
  const al = j.alignment, ch = al.characters, s = al.character_start_times_seconds, e = al.character_end_times_seconds, pal = [];
  for (let c = 0; c < ch.length; c++) { // de caracteres a palabras (lo que no es letra ni cifra no abre palabra)
    if (!/[\p{L}\p{N}]/u.test(ch[c])) continue;
    if (c === 0 || !/[\p{L}\p{N}'’-]/u.test(ch[c - 1])) pal.push({ p: "", i: s[c], f: e[c] });
    const u = pal.at(-1); u.p += ch[c]; u.f = e[c];
  }
  return pal;
}

async function edge(texto, dir) {
  let M; try { M = await import("msedge-tts"); } catch { console.error("Para el motor edge: npm i msedge-tts (en la carpeta del kit)."); process.exit(2); }
  const tts = new M.MsEdgeTTS();
  await tts.setMetadata(G.voz || "es-ES-AlvaroNeural", M.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
  fs.mkdirSync(dir, { recursive: true });
  const r = await tts.toFile(dir, texto, { rate: opt("--velocidad") ? `${Math.round((Number(opt("--velocidad")) - 1) * 100)}%` : "+0%" });
  tts.close?.();
  const meta = JSON.parse(fs.readFileSync(r.metadataFilePath, "utf8"));
  const pal = (meta.Metadata || []).filter((m) => m.Type === "WordBoundary").map((m) => ({ p: m.Data.text.Text, i: m.Data.Offset / 1e7, f: (m.Data.Offset + m.Data.Duration) / 1e7 }))
    .filter((w) => /[\p{L}\p{N}]/u.test(w.p));
  return { mp3: r.audioFilePath, pal };
}

async function generar() {
  if (!salida) { console.error("Falta la carpeta de salida."); process.exit(1); }
  if (revisar()) console.log("(hay avisos: genera igual solo si los has revisado)\n");
  fs.mkdirSync(salida, { recursive: true });
  const texto = G.lineas.map((l) => l.texto).join(SEP);
  let mp3, pal;
  if ((G.motor || "elevenlabs") === "edge") ({ mp3, pal } = await edge(texto, path.join(salida, "_edge")));
  else { mp3 = path.join(salida, "voz-original.mp3"); pal = await elevenlabs(texto, mp3); }
  ff(["-i", mp3, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", path.join(salida, "voz.wav")]);
  const tiempos = porLinea(pal.map((w) => ({ p: w.p, i: +w.i.toFixed(3), f: +w.f.toFixed(3) })));
  fs.writeFileSync(path.join(salida, "voz-tiempos.json"), JSON.stringify(tiempos, null, 1));
  if (fs.existsSync(path.join(salida, "_edge"))) fs.rmSync(path.join(salida, "_edge"), { recursive: true, force: true });
  for (let k = 0; k < tiempos.length; k++) { const t = tiempos[k], pausa = k ? (t.inicio - tiempos[k - 1].fin).toFixed(2) : "-"; console.log(`${t.id} ${t.inicio.toFixed(2)} → ${t.fin.toFixed(2)} (pausa antes ${pausa} s) ${t.texto}`); }
  console.log(`${texto.length} caracteres pedidos → ${path.join(salida, "voz.wav")}`);
}

if (orden === "revisar") process.exit(revisar() ? 4 : 0);
else if (orden === "generar") await generar();
else { console.error("Orden: revisar | generar"); process.exit(1); }
