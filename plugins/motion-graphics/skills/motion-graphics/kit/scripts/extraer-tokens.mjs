// Fuente de verdad de una interfaz: recorre el código del producto y saca lo que la recreación tiene que copiar TAL
// CUAL (con su fichero:línea): variables CSS, colores, radios, sombras, familias y tamaños de letra, config de Tailwind,
// librería de iconos y ficheros de logo/SVG.
//   node scripts/extraer-tokens.mjs <carpeta-del-producto> [--salida fidelidad/tokens.md] [--max 40]
// No sustituye a leer los componentes: dice DÓNDE mirar y qué valores se repiten (los repetidos son los tokens reales).
import fs from "node:fs";
import path from "node:path";

const [, , raiz, ...resto] = process.argv;
const opt = (n, d) => { const i = resto.indexOf(`--${n}`); return i < 0 ? d : resto[i + 1]; };
if (!raiz) { console.log("uso: node scripts/extraer-tokens.mjs <carpeta-del-producto> [--salida tokens.md] [--max 40]"); process.exit(1); }
const MAX = Number(opt("max", 40));
const FUERA = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", ".cache", "coverage", "vendor", ".remotion"]);
const EXT = /\.(css|scss|sass|less|ts|tsx|js|jsx|mjs|cjs|json|html|vue|svelte|astro)$/i;

const ficheros = [], svgs = [];
const recorre = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (FUERA.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) recorre(p);
    else if (/\.svg$/i.test(e.name)) svgs.push(p);
    else if (EXT.test(e.name) && fs.statSync(p).size < 600_000 && !/\.min\.|lock\.json$/.test(e.name)) ficheros.push(p);
  }
};
recorre(path.resolve(raiz));

const cuenta = new Map(); // tipo → valor → [ubicaciones]
const anota = (tipo, valor, donde) => {
  const v = valor.trim().replace(/\s+/g, " ");
  if (!cuenta.has(tipo)) cuenta.set(tipo, new Map());
  const m = cuenta.get(tipo);
  if (!m.has(v)) m.set(v, []);
  m.get(v).push(donde);
};
const PATRONES = [
  ["Variables CSS", /(--[a-z0-9-_]+)\s*:\s*([^;{}]+);/gi, (m) => `${m[1]}: ${m[2]}`],
  ["Colores", /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/gi, (m) => m[0].toLowerCase()],
  ["Radios", /border-radius\s*:\s*([^;}"']+)|borderRadius\s*:\s*['"]?([^,}'"]+)|(?<![\w-])rounded(-[a-z0-9[\]-]+)?(?=[\s"'`])/g, (m) => (m[1] || m[2] || m[0]).trim()],
  ["Sombras", /box-shadow\s*:\s*([^;}]+)|boxShadow\s*:\s*['"`]([^'"`]+)|(?<![\w-])shadow(-[a-z0-9[\]-]+)?(?=[\s"'`])/g, (m) => (m[1] || m[2] || m[0]).trim()],
  ["Familias de letra", /font-family\s*:\s*([^;}]+)|fontFamily\s*:\s*['"`]?([^,}\n]+)|next\/font\/(google|local)[^\n]*|@import url\([^)]*fonts[^)]*\)|fonts\.googleapis\.com\/css2\?family=[^"'&)]+/g, (m) => (m[1] || m[2] || m[0]).trim()],
  ["Tamaños de letra", /font-size\s*:\s*([^;}]+)|fontSize\s*:\s*['"]?([^,}'"]+)|(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])(?=[\s"'`])/g, (m) => (m[1] || m[2] || m[0]).trim()],
  ["Pesos", /font-weight\s*:\s*([^;}]+)|fontWeight\s*:\s*['"]?([^,}'"]+)|(?<![\w-])font-(thin|light|normal|medium|semibold|bold|extrabold|black)(?=[\s"'`])/g, (m) => (m[1] || m[2] || m[0]).trim()],
];
for (const f of ficheros) {
  const txt = fs.readFileSync(f, "utf8"), lineas = txt.split(/\r?\n/);
  const rel = path.relative(path.resolve(raiz), f).replace(/\\/g, "/");
  lineas.forEach((l, i) => {
    if (l.length > 2000) return;
    for (const [tipo, re, val] of PATRONES) for (const m of l.matchAll(re)) anota(tipo, val(m), `${rel}:${i + 1}`);
  });
}

// librería de iconos y Tailwind
const pkgs = ficheros.filter((f) => path.basename(f) === "package.json");
const LIBS = /lucide|heroicons|tabler|bootstrap-icons|font-?awesome|phosphor|material-(icons|symbols)|remixicon|feather|iconify|radix-ui\/react-icons/i;
const iconos = new Set();
for (const p of pkgs) { try { const j = JSON.parse(fs.readFileSync(p, "utf8")); for (const d of Object.keys({ ...j.dependencies, ...j.devDependencies })) if (LIBS.test(d)) iconos.add(`${d} (${path.relative(raiz, p).replace(/\\/g, "/")})`); } catch { /* json raro */ } }
const usosIconos = new Map();
for (const f of ficheros) { for (const m of fs.readFileSync(f, "utf8").matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](lucide-react|@heroicons[^'"]*|@tabler\/icons-react|react-icons[^'"]*|@phosphor-icons\/react)['"]/g)) for (const n of m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)) usosIconos.set(n, (usosIconos.get(n) ?? 0) + 1); for (const m of fs.readFileSync(f, "utf8").matchAll(/\bbi-[a-z0-9-]+/g)) usosIconos.set(m[0], (usosIconos.get(m[0]) ?? 0) + 1); }
const tailwind = ficheros.filter((f) => /tailwind\.config\.|theme\.(ts|js|css)$|tokens?\.(css|ts|js|json)$|variables\.(s?css)$/i.test(path.basename(f)));

const md = [`# Fuente de verdad de la interfaz · ${path.resolve(raiz)}`, "", `${ficheros.length} ficheros de código y ${svgs.length} SVG revisados (sin node_modules ni compilados).`, ""];
// ficheros que más variables CSS definen: ahí suelen vivir los tokens de verdad (globals.css, panel.css, theme.css…)
const porFichero = new Map();
for (const donde of [...(cuenta.get("Variables CSS") ?? new Map()).values()].flat()) { const f = donde.replace(/:\d+$/, ""); porFichero.set(f, (porFichero.get(f) ?? 0) + 1); }
const conVariables = [...porFichero].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([f, n]) => `${f} (${n} variables)`);
const lugares = [...conVariables, ...tailwind.map((f) => path.relative(raiz, f).replace(/\\/g, "/")).filter((f) => !conVariables.some((c) => c.startsWith(`${f} (`)))];
md.push("## Dónde están los tokens (léelos enteros)", ...(lugares.length ? lugares.map((f) => `- ${f}`) : ["- (no hay ficheros de tema ni CSS con variables: los valores están sueltos en los componentes)"]), "");
md.push("## Iconos", `- Librerías: ${[...iconos].join(", ") || "ninguna en package.json (SVG propios o inline)"}`,
  `- Los más usados: ${[...usosIconos].sort((a, b) => b[1] - a[1]).slice(0, MAX).map(([n, c]) => `${n} ×${c}`).join(", ") || "—"}`, "");
md.push("## Logos y SVG", ...svgs.filter((s) => /logo|isotipo|brand|marca|icon/i.test(s)).slice(0, MAX).map((s) => `- ${path.relative(raiz, s).replace(/\\/g, "/")}`), `(${svgs.length} SVG en total)`, "");
for (const [tipo, m] of cuenta) {
  md.push(`## ${tipo} (los más repetidos primero)`);
  for (const [v, donde] of [...m].sort((a, b) => b[1].length - a[1].length).slice(0, MAX)) md.push(`- \`${v.slice(0, 140)}\` ×${donde.length} · ${donde.slice(0, 3).join(", ")}${donde.length > 3 ? " …" : ""}`);
  md.push("");
}
const salida = opt("salida");
if (salida) { fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true }); fs.writeFileSync(salida, md.join("\n")); console.log(`Informe: ${path.resolve(salida)}`); }
else console.log(md.join("\n"));
