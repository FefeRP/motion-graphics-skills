// Revisa la tabla de ritmo de un GUION.md con la checklist anti-aburrimiento (references/checklist-promo.md, bloque A).
//   node scripts/revisar-guion.mjs GUION.md [--hueco 1.8] [--producto 3.5]
// Lee la primera tabla Markdown cuya cabecera tenga una columna «t» y, si existen, «escala», «transición» y «texto»
// (o la tabla de texto plano con «|» de la plantilla). En «texto» basta con el número de palabras o con las propias palabras.
// Marca de producto: una fila con «producto» o «UI» en la columna «qué» (o «*» en la columna «producto»).
import fs from "node:fs";

const args = process.argv.slice(2);
const fichero = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? Number(args[i + 1]) : d; };
const HUECO = opt("--hueco", 1.8), PRODUCTO = opt("--producto", 3.5);
if (!fichero) { console.error("Uso: node scripts/revisar-guion.mjs GUION.md [--hueco 1.8] [--producto 3.5]"); process.exit(2); }

const lineas = fs.readFileSync(fichero, "utf8").split(/\r?\n/);
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const celdas = (l) => l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
let cab = null, filas = [];
for (const l of lineas) {
  if (!l.includes("|")) { if (cab && filas.length) break; continue; }
  const c = celdas(l);
  if (!cab) { if (c.some((x) => /^t( \(s\))?$/.test(norm(x)))) cab = c.map(norm); continue; }
  if (c.every((x) => /^:?-+:?$/.test(x) || x === "")) continue;
  filas.push(c);
}
if (!cab) { console.error("No encuentro una tabla con columna «t»."); process.exit(2); }
const col = (...nombres) => cab.findIndex((h) => nombres.some((n) => h.startsWith(n)));
const iT = col("t"), iE = col("escala"), iTr = col("transicion"), iTx = col("texto"), iQ = col("que"), iP = col("producto");
const ev = filas.map((c) => ({
  t: Number(String(c[iT]).replace(",", ".")), escala: iE >= 0 ? norm(c[iE] || "") : "", trans: iTr >= 0 ? norm(c[iTr] || "") : "",
  texto: iTx >= 0 ? c[iTx] || "" : "", que: iQ >= 0 ? norm(c[iQ] || "") : "", prod: iP >= 0 ? (c[iP] || "").includes("*") : false, raw: c,
})).filter((e) => Number.isFinite(e.t)).sort((a, b) => a.t - b.t);

const fallos = [], ok = [];
const chk = (cond, okMsg, malMsg) => (cond ? ok : fallos).push(cond ? okMsg : malMsg);
chk(ev.length && ev[0].t <= 0.05, "A1a evento en t=0", `A1a el primer evento está en ${ev[0]?.t ?? "?"} s (debe ser 0)`);
const p = ev.find((e) => e.prod || /producto|\bui\b|interfaz|componente|pantalla/.test(e.que));
chk(p && p.t <= PRODUCTO, `A1b producto en ${p?.t} s`, `A1b el producto aparece en ${p ? p.t + " s" : "ninguna fila marcada"} (≤ ${PRODUCTO} s)`);
const huecos = ev.slice(1).map((e, i) => ({ d: e.t - ev[i].t, en: ev[i].t }));
const ultimo = huecos.length ? huecos[huecos.length - 1] : null;
const grandes = huecos.filter((h) => h.d > HUECO + 1e-6 && h !== ultimo);
chk(!grandes.length, `A2 hueco máximo ${Math.max(0, ...huecos.filter((h) => h !== ultimo).map((h) => h.d)).toFixed(2)} s`, `A2 huecos > ${HUECO} s: ${grandes.map((h) => `${h.en.toFixed(2)} (+${h.d.toFixed(2)})`).join(", ")}`);
if (iE >= 0) {
  const rep = [];
  for (let i = 2; i < ev.length; i++) if (ev[i].escala && ev[i].escala === ev[i - 1].escala && ev[i].escala === ev[i - 2].escala) rep.push(ev[i].t);
  chk(!rep.length, "A3 escalas variadas", `A3 la misma escala 3 filas seguidas en ${rep.join(", ")} s`);
} else fallos.push("A3 falta la columna «escala»");
if (iTr >= 0) {
  const usos = {};
  for (const e of ev) { const k = e.trans.replace(/\(.*\)/, "").trim(); if (k && !/^(—|-|ninguna|corte)$/.test(k)) usos[k] = (usos[k] || 0) + 1; }
  const mas = Object.entries(usos).filter(([, n]) => n > 2);
  chk(!mas.length, `A4 transiciones: ${Object.entries(usos).map(([k, n]) => `${k}×${n}`).join(", ")}`, `A4 transiciones repetidas más de 2 veces: ${mas.map(([k, n]) => `${k}×${n}`).join(", ")}`);
} else fallos.push("A4 falta la columna «transición»");
if (iTx >= 0) {
  const largos = ev.filter((e) => { const n = /^\d+$/.test(e.texto) ? Number(e.texto) : e.texto.replace(/[«»"“”]/g, "").split(/\s+/).filter((w) => w && !/^[—-]$/.test(w)).length; return n > 4 && !/cta|\.(org|com|es|io|app|net)\b/i.test(e.texto); });
  chk(!largos.length, "A7 textos de ≤ 4 palabras", `A7 textos de más de 4 palabras en ${largos.map((e) => e.t).join(", ")} s`);
}
console.log(`${fichero}: ${ev.length} eventos, ${ev.length ? (ev[ev.length - 1].t - ev[0].t).toFixed(1) : 0} s`);
for (const m of ok) console.log("  OK   " + m);
for (const m of fallos) console.log("  FALLA " + m);
console.log(fallos.length ? `\n${fallos.length} fallo(s): corrige el guion antes de animar.` : "\nGuion OK (bloque A automático). A5, A6 y A8 se revisan a mano.");
process.exit(fallos.length ? 1 : 0);
