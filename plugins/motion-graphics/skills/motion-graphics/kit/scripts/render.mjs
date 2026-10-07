// Render y fotogramas de cualquier composición del kit (60 fps, sin GPU).
//   node scripts/render.mjs render <Composicion> [props.json] [--salida out] [--escala 0.5]
//   node scripts/render.mjs stills <Composicion> [props.json] 0.5 1.2 3 … [--salida out]
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./lib.mjs";

const [, , paso, comp, ...resto] = process.argv;
const opt = (n, d) => { const i = resto.indexOf(`--${n}`); return i < 0 ? d : resto[i + 1]; };
const pos = resto.filter((a, i) => !a.startsWith("--") && !(i > 0 && resto[i - 1].startsWith("--")));
const json = pos[0] && pos[0].endsWith(".json") ? pos.shift() : null;
if (!paso || !comp) { console.log("uso: node scripts/render.mjs render|stills <Composicion> [props.json] [tiempos…] [--salida out]"); process.exit(1); }
const inputProps = json ? JSON.parse(fs.readFileSync(path.resolve(json), "utf8")) : {};
const nombre = json ? path.basename(json, ".json") : comp;
const chromiumOptions = { gl: "swangle" }, timeoutInMilliseconds = 180000;
const { bundle } = await import("@remotion/bundler");
const { selectComposition, renderMedia, renderStill } = await import("@remotion/renderer");
const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts"), publicDir: path.join(RAIZ, "public"), enableCaching: false });
// Remotion leaves the bundle (100–400 MB) in the temp folder: remove it on exit so repeated renders don't fill the disk
process.on("exit", () => fs.rmSync(serveUrl, { recursive: true, force: true }));
const composition = await selectComposition({ serveUrl, id: comp, inputProps, chromiumOptions, timeoutInMilliseconds });
const dir = path.resolve(opt("salida", path.join(RAIZ, "out")));
fs.mkdirSync(dir, { recursive: true });
if (paso === "render") {
  const out = path.join(dir, `${nombre}.mp4`);
  const t0 = Date.now();
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, inputProps, chromiumOptions, timeoutInMilliseconds,
    imageFormat: "jpeg", jpegQuality: 95, crf: 16, scale: Number(opt("escala", 1)), audioCodec: "aac", audioBitrate: "256k", concurrency: Number(opt("concurrencia", 3)),
    onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)} %  `) });
  console.log(`\nListo en ${Math.round((Date.now() - t0) / 1000)} s → ${out}`);
} else {
  for (const s of pos.map(Number)) {
    const out = path.join(dir, `${nombre}-${s.toFixed(1)}.png`);
    await renderStill({ composition, serveUrl, output: out, frame: Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps)), scale: Number(opt("escala", 0.5)), inputProps, chromiumOptions, timeoutInMilliseconds });
    console.log(out);
  }
}
