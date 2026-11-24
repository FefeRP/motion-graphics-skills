#!/usr/bin/env node
// marca.mjs · recursos de MARCA del usuario (iconos, iconos animados, elementos, fondos, texturas, logos, música) guardados
// fuera del kit para reutilizarlos en los vídeos siguientes de esa marca. No hay librería común: cada marca, lo suyo.
//
//   node scripts/marca.mjs crear <marca> [--acento #hex] [--fondo #hex] [--texto #hex] [--fuente "Familia"] [--direccion oscuro]
//   node scripts/marca.mjs guardar <marca> <fichero> --tipo <tipo> [--nombre n] [--modelo m] [--prompt "..."] [--coste c] [--notas "..."]
//   node scripts/marca.mjs listar [<marca>] [--tipo <tipo>]
//   node scripts/marca.mjs usar <marca> [--kit <carpeta del kit>]
//
// Dónde: MG_MARCAS (variable de entorno) o ~/.motion-graphics/marcas/<marca>/ con marca.json (colores, letra, dirección),
// recursos/<tipo>/ (ficheros), recursos.json (índice) y REGISTRO.md (modelo, prompt y coste de cada uno, para repetirlo).
// Tipos: icono, icono-animado, elemento, fondo, textura, logo, musica, otro.
// `usar` copia la marca a <kit>/comun/marca/<marca>/ y escribe marca.js (window.MARCA = { nombre, estilo, recursos })
// para que la pieza la cargue con <script src="comun/marca/<marca>/marca.js"></script> y use
// MG.mezclar(MG.ESTILOS[MARCA.direccion], MARCA.estilo) y MARCA.recursos.icono.<nombre> como ruta.
// Sin dependencias.
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, appendFileSync, statSync } from "node:fs";
import { join, resolve, basename, extname, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const KIT_DEF = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.MG_MARCAS ? resolve(process.env.MG_MARCAS) : join(homedir(), ".motion-graphics", "marcas");
const TIPOS = ["icono", "icono-animado", "elemento", "fondo", "textura", "logo", "musica", "otro"];
const [orden, ...args] = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const slug = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fallo = (m) => { console.error(m); process.exit(1); };
const ayuda = () => { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 15).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(1); };
const leer = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : d);
const dirMarca = (m) => join(BASE, slug(m));
const hex = (v) => (v && !/^#[0-9a-f]{3,8}$/i.test(v) ? fallo(`Color no válido: ${v} (usa #rrggbb)`) : v);

function crear(m) {
  if (!m) ayuda();
  const d = dirMarca(m); mkdirSync(join(d, "recursos"), { recursive: true });
  const f = join(d, "marca.json"), prev = leer(f, {});
  const estilo = { ...(prev.estilo || {}) };
  if (opt("--acento")) estilo.acento = hex(opt("--acento"));
  if (opt("--fondo")) estilo.fondo = hex(opt("--fondo"));
  if (opt("--texto")) estilo.texto = hex(opt("--texto"));
  if (opt("--fuente")) estilo.fuente = estilo.fuenteTexto = `'${opt("--fuente")}', system-ui, sans-serif`;
  const marca = { nombre: prev.nombre || m, direccion: opt("--direccion", prev.direccion || "oscuro"), estilo, creada: prev.creada || new Date().toISOString().slice(0, 10) };
  writeFileSync(f, JSON.stringify(marca, null, 2) + "\n");
  if (!existsSync(join(d, "recursos.json"))) writeFileSync(join(d, "recursos.json"), "[]\n");
  if (!existsSync(join(d, "REGISTRO.md"))) writeFileSync(join(d, "REGISTRO.md"), `# Recursos de ${marca.nombre}\n\nUna entrada por recurso guardado (lo más reciente abajo): tipo, modelo, prompt exacto y coste, para poder repetirlo o hacer variantes coherentes.\n`);
  console.log(`Marca «${marca.nombre}» en ${d}`);
  return d;
}

function guardar(m, fich) {
  if (!m || !fich) ayuda();
  if (!existsSync(fich)) fallo(`No existe ${fich}`);
  const tipo = opt("--tipo"); if (!TIPOS.includes(tipo)) fallo(`--tipo debe ser uno de: ${TIPOS.join(", ")}`);
  const d = existsSync(join(dirMarca(m), "marca.json")) ? dirMarca(m) : crear(m);
  const nombre = slug(opt("--nombre", basename(fich, extname(fich))));
  const destDir = join(d, "recursos", tipo); mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, nombre + extname(fich).toLowerCase());
  copyFileSync(fich, dest);
  const idx = leer(join(d, "recursos.json"), []).filter((r) => !(r.tipo === tipo && r.nombre === nombre));
  const r = { tipo, nombre, fichero: `recursos/${tipo}/${basename(dest)}`, modelo: opt("--modelo", ""), prompt: opt("--prompt", ""), coste: opt("--coste", ""), notas: opt("--notas", ""), fecha: new Date().toISOString().slice(0, 10), bytes: statSync(dest).size };
  idx.push(r); writeFileSync(join(d, "recursos.json"), JSON.stringify(idx, null, 2) + "\n");
  appendFileSync(join(d, "REGISTRO.md"), `\n### ${tipo} · ${nombre} · ${r.fecha}\n- Fichero: ${r.fichero}\n- Modelo: ${r.modelo || "(código o propio)"} · coste: ${r.coste || "-"}\n- Prompt: ${r.prompt || "-"}\n- Notas: ${r.notas || "-"}\n`);
  console.log(`Guardado ${r.fichero} en la marca «${m}»`);
}

function listar(m) {
  if (!m) {
    if (!existsSync(BASE)) return console.log(`Sin marcas todavía (${BASE}).`);
    for (const n of readdirSync(BASE)) { const j = leer(join(BASE, n, "marca.json"), null); if (j) console.log(`${n}\t${j.direccion}\t${leer(join(BASE, n, "recursos.json"), []).length} recursos`); }
    return;
  }
  const d = dirMarca(m); if (!existsSync(join(d, "marca.json"))) fallo(`No hay marca «${m}» en ${BASE}`);
  const j = leer(join(d, "marca.json")); console.log(`${j.nombre} · dirección ${j.direccion} · ${JSON.stringify(j.estilo)}`);
  for (const r of leer(join(d, "recursos.json"), []).filter((r) => !opt("--tipo") || r.tipo === opt("--tipo"))) console.log(`  ${r.tipo.padEnd(13)} ${r.nombre.padEnd(22)} ${r.modelo || "-"}  ${r.fichero}`);
}

function usar(m) {
  if (!m) ayuda();
  const d = dirMarca(m); if (!existsSync(join(d, "marca.json"))) fallo(`No hay marca «${m}» en ${BASE}`);
  const kit = resolve(opt("--kit", KIT_DEF)); if (!existsSync(join(kit, "comun", "mg.js"))) fallo(`${kit} no parece el kit (falta comun/mg.js)`);
  const s = slug(m), dest = join(kit, "comun", "marca", s);
  const j = leer(join(d, "marca.json")), idx = leer(join(d, "recursos.json"), []);
  const recursos = {};
  for (const r of idx) {
    mkdirSync(join(dest, dirname(r.fichero)), { recursive: true });
    copyFileSync(join(d, r.fichero), join(dest, r.fichero));
    (recursos[r.tipo] ||= {})[r.nombre.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())] = `comun/marca/${s}/${r.fichero}`;
  }
  mkdirSync(dest, { recursive: true });
  writeFileSync(join(dest, "marca.js"), `window.MARCA = ${JSON.stringify({ nombre: j.nombre, direccion: j.direccion, estilo: j.estilo, recursos }, null, 2)};\n`);
  console.log(`Marca «${j.nombre}» lista en ${dest} (${idx.length} recursos).\nEn la pieza: <script src="comun/marca/${s}/marca.js"></script> después de mg.js, y\n  const EST = MG.mezclar(MG.ESTILOS[MARCA.direccion] || MG.ESTILOS.oscuro, MARCA.estilo);`);
}

({ crear: () => crear(pos[0]), guardar: () => guardar(pos[0], pos[1]), listar: () => listar(pos[0]), usar: () => usar(pos[0]) }[orden] || ayuda)();
