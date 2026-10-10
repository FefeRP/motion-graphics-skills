// Captura de REFERENCIA de una interfaz real (web, app en local, o un .html), para recrearla fiel y comparar luego.
// Las capturas son solo referencia: nunca se incrustan en el vídeo cuando la vía es «recrear la interfaz».
//   node scripts/capturar.mjs <url | fichero.html> <salida.png> [--ancho 1440] [--alto 900] [--escala 1] [--espera 4000]
// Usa el Chrome sin cabeza que descarga Remotion (o el de la variable CHROME). Para pantallas con sesión iniciada,
// banners o menús abiertos, captura tú desde el navegador a ese mismo tamaño y escala: lo importante es el tamaño.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ } from "./lib.mjs";

const [, , origen, salida, ...resto] = process.argv;
const opt = (n, d) => { const i = resto.indexOf(`--${n}`); return i < 0 ? d : resto[i + 1]; };
if (!origen || !salida) { console.log("uso: node scripts/capturar.mjs <url | fichero.html> <salida.png> [--ancho 1440] [--alto 900] [--escala 1] [--espera 4000]"); process.exit(1); }

const busca = (dir) => {
  if (!fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const r = busca(p); if (r) return r; }
    else if (/^chrome-headless-shell(\.exe)?$/.test(e.name)) return p;
  }
  return null;
};
const chrome = process.env.CHROME || busca(path.join(RAIZ, "node_modules", ".remotion"));
if (!chrome) { console.error("No encuentro Chrome: renderiza algo con Remotion una vez (lo descarga) o pon CHROME=<ruta>."); process.exit(1); }

const url = /^https?:|^file:/.test(origen) ? origen : pathToFileURL(path.resolve(origen)).href;
const ancho = Number(opt("ancho", 1440)), alto = Number(opt("alto", 900)), escala = Number(opt("escala", 1));
const out = path.resolve(salida);
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync(chrome, ["--headless", "--hide-scrollbars", "--disable-gpu", `--window-size=${ancho},${alto}`, `--force-device-scale-factor=${escala}`,
  `--virtual-time-budget=${Number(opt("espera", 4000))}`, `--screenshot=${out}`, url], { stdio: "ignore" });
console.log(`${out} (${ancho}×${alto} a escala ${escala})`);
