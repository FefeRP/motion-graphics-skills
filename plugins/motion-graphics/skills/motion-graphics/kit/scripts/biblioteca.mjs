#!/usr/bin/env node
// biblioteca.mjs · la librería de componentes (la misma de la skill biblioteca-componentes de NEW ERA) desde el kit.
//
//   node scripts/biblioteca.mjs buscar "shader agua" [--categoria fondos] [--sin three,ogl] [--limite 12]
//   node scripts/biblioteca.mjs categorias                     las que entran en vídeo y las que no
//   node scripts/biblioteca.mjs ver <fuente/slug>              ficha: licencia, autor, técnica, dependencias y ficheros
//   node scripts/biblioteca.mjs traer <fuente/slug> [carpeta]   copia el código a comun/biblioteca/<fuente>-<slug>/ + LICENCIA.md
//
// Dónde está la librería (variables del entorno, NUNCA en ficheros del vídeo ni en el comando):
//   BIBLIOTECA_COMPONENTES = carpeta con indice.json y c/<fuente>/<slug>.json, o la URL de la API (https://…/api)
//   BIBLIOTECA_TOKEN = token personal de la API (invitación de tipo «skills»), o BIBLIOTECA_TOKEN_FILE = fichero fuera del proyecto
// La API da el índice entero y un número de fichas con código al día por persona: busca en el índice y pide solo las que
// vayas a usar. Las de licencia «no redistribuir» llegan sin código (solo el enlace a su web original).
// Solo las categorías que sirven en vídeo (CATEGORIAS_VIDEO); la interfaz web pura (botones, formularios, navegación…)
// queda fuera para motion graphics.
// Sin dependencias: Node 18+.
import fs from "node:fs";
import path from "node:path";

const [orden, arg, destino, ...resto] = process.argv.slice(2);
const todos = process.argv.slice(2);
const opt = (n, d) => { const i = todos.indexOf(n); return i >= 0 ? todos[i + 1] : d; };
const ORIGEN = process.env.BIBLIOTECA_COMPONENTES;
// Categorías de la librería que usa el motion graphics (lo demás es interfaz web pura y queda fuera).
const CATEGORIAS_VIDEO = {
  fondos: "shaders, auroras, rejillas, partículas", texto: "texto animado", "3d": "objetos y escenas 3D", hero: "efectos de cabecera: focos, haces, bandas",
  tarjetas: "solo sus EFECTOS (meteoros, haces, brillos, revelados), no la tarjeta como interfaz", iconos: "solo elementos animados (brillos, bordes, confeti, números); los iconos de marca se generan",
  cursor: "estelas y halos (movidos por t)", carga: "loaders y brillos de carga: una app viva", scroll: "revelados, progresos y números que ruedan (pasados a t)",
  dispositivos: "marcos de móvil y navegador",
};
const FUERA = ["botones", "navegacion", "formularios", "carruseles", "testimonios", "precios", "overlays", "listas", "otros"];
if (!orden || !["buscar", "ver", "traer", "categorias"].includes(orden)) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 15).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(1);
}
if (orden === "categorias") {
  console.log("Entran en vídeo:"); for (const [k, v] of Object.entries(CATEGORIAS_VIDEO)) console.log(`  ${k.padEnd(13)} ${v}`);
  console.log(`Fuera (interfaz web pura): ${FUERA.join(", ")}`); process.exit(0);
}
if (!ORIGEN) { console.error("Falta BIBLIOTECA_COMPONENTES (carpeta o URL de la API). Sin librería, usa lo del kit (MG.Manchas, Aurora, Halo…)."); process.exit(2); }
const esURL = /^https?:\/\//.test(ORIGEN);
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function token() {
  if (process.env.BIBLIOTECA_TOKEN) return process.env.BIBLIOTECA_TOKEN.trim();
  const f = process.env.BIBLIOTECA_TOKEN_FILE; if (!f) return null;
  const txt = fs.readFileSync(f, "utf8");
  return txt.match(/ne_[A-Za-z0-9_-]{20,}/)?.[0] || txt.trim().split(/\s+/)[0] || null;
}
async function leer(rel) {
  if (!esURL) return JSON.parse(fs.readFileSync(path.join(ORIGEN, rel), "utf8"));
  const tk = token(), cab = tk ? { authorization: "Bearer " + tk } : {};
  const r = await fetch(ORIGEN.replace(/\/$/, "") + "/" + rel, { headers: cab });
  const motivo = async () => { try { return (await r.json()).error || ""; } catch { return ""; } };
  if (r.status === 401) throw new Error(tk ? `La API no acepta el token. ${await motivo()}` : "La API pide un token: BIBLIOTECA_TOKEN o BIBLIOTECA_TOKEN_FILE (invitación de tipo «skills»).");
  if (r.status === 429) throw new Error((await motivo()) || "Límite diario de fichas alcanzado: mañana más, o usa lo que ya trajiste.");
  if (!r.ok) throw new Error(`HTTP ${r.status} al leer ${rel}`);
  return r.json();
}

// sinónimos mínimos para buscar en español lo que el índice dice en inglés
const SIN = { fondo: "background", agua: "water caustics ripple", luz: "light glow", brillo: "glow shine", particulas: "particles", estrellas: "stars",
  humo: "smoke", nube: "cloud", malla: "mesh gradient", degradado: "gradient", ruido: "noise grain", onda: "wave ripple", rejilla: "grid",
  texto: "text", rayo: "beam", aurora: "aurora", cristal: "glass", lineas: "lines", puntos: "dots", espiral: "spiral", fuego: "fire" };

try {
  const indice = await leer("indice.json");
  if (orden === "buscar") {
    const pal = norm(arg).split(/\s+/).filter(Boolean).flatMap((w) => [w, ...(SIN[w] ? SIN[w].split(" ") : [])]);
    const cat = opt("--categoria");
    if (cat && !CATEGORIAS_VIDEO[cat]) throw new Error(`«${cat}» no entra en vídeo. Categorías: ${Object.keys(CATEGORIAS_VIDEO).join(", ")}.`);
    const sin = (opt("--sin") || "").split(",").filter(Boolean), lim = Number(opt("--limite", 12));
    const res = indice.componentes.filter((c) => c.tipo !== "referencia" && CATEGORIAS_VIDEO[c.categoria] && (!cat || c.categoria === cat) && !sin.some((d) => (c.deps || []).join(" ").includes(d)))
      .map((c) => { const nom = norm(c.nombre + " " + c.id), resto = norm([c.descripcion, c.categoria, ...(c.etiquetas || []), c.tecnica].join(" "));
        return { c, p: pal.reduce((s, w) => s + (nom.includes(w) ? 3 : 0) + (resto.includes(w) ? 1 : 0), 0) }; })
      .filter((x) => x.p > 0).sort((a, b) => b.p - a.p).slice(0, lim);
    for (const { c } of res) console.log(`- ${c.id}  ·  ${c.nombre}  [${c.categoria}]  ${c.licencia || "?"}${(c.deps || []).length ? "  · deps: " + c.deps.join(" ") : ""}\n    ${String(c.descripcion || "").slice(0, 150)}`);
    if (!res.length) console.log("Nada. Prueba con lo que HACE el efecto (glow, ripple, noise, grid…) o en inglés.");
  } else {
    const c = indice.componentes.find((x) => x.id === arg);
    if (!c) throw new Error(`No existe ${arg} en el índice (¿retirado? busca otro con «buscar»).`);
    if (!CATEGORIAS_VIDEO[c.categoria]) throw new Error(`${arg} es de «${c.categoria}», interfaz web pura: fuera del motion graphics (node scripts/biblioteca.mjs categorias).`);
    const [fuente, slug] = c.id.split("/");
    const f = await leer(`c/${fuente}/${slug}.json`);
    const ficheros = f.ficheros || [];
    console.log(`${c.nombre} (${c.id}) · ${c.licencia} · autor: ${c.autor || "?"}\nOriginal: ${c.url}\nDependencias: ${(f.deps || c.deps || []).join(" ") || "ninguna"}${c.tecnica ? "\nTécnica: " + c.tecnica : ""}`);
    if (!ficheros.length) console.log("Sin código (licencia que no deja redistribuirlo): cópialo de su web original, en el enlace de arriba.");
    if (orden === "ver") for (const x of ficheros) console.log(`  · ${x.ruta} (${x.codigo.split("\n").length} líneas)`);
    if (orden === "traer" && ficheros.length) {
      const dir = destino || path.join("comun", "biblioteca", `${fuente}-${slug}`);
      fs.mkdirSync(dir, { recursive: true });
      for (const x of ficheros) { const d = path.join(dir, path.basename(x.ruta)); fs.writeFileSync(d, x.codigo); console.log("  → " + d); }
      if (f.css) fs.writeFileSync(path.join(dir, "extra.css"), f.css);
      if (f.demo) fs.writeFileSync(path.join(dir, "demo.txt"), typeof f.demo === "string" ? f.demo : JSON.stringify(f.demo, null, 1));
      fs.writeFileSync(path.join(dir, "LICENCIA.md"), `# ${c.nombre}\n\n- Componente: ${c.id}\n- Autor: ${c.autor || "?"}\n- Licencia: ${c.licencia}\n- Original: ${c.url}\n\n` +
        "Copia el aviso de licencia y autor en un comentario dentro del <script> de la pieza. Si la licencia no deja redistribuir\n" +
        "(Commons Clause, «uso en productos»), úsalo en tus vídeos pero no lo publiques suelto (repos, plantillas a la venta).\n");
      console.log(`Listo en ${dir}. Siguiente: pásalo a la pieza haciéndolo determinista (references/recursos.md §1).`);
    }
  }
} catch (e) { console.error(e.message); process.exit(3); }
