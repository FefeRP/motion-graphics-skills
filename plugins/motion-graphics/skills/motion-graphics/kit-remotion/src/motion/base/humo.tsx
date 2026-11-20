// Humo / gas / aurora fina con un shader WebGL propio. Sustituye a las cortinas de degradados cuando se quiere luz
// que parezca materia (humo, niebla, gas iluminado) y no bloques difusos.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender, useVideoConfig } from "remotion";
import { useSeg } from "./tiempo";

/**
 * Cómo está hecho (todo en el fragment shader, sin texturas):
 *   · ruido de gradiente 2D suave (sin las rejillas que da el ruido de valor) → fbm de `octavas` octavas con rotación
 *     entre octavas, para que no se vean direcciones preferidas;
 *   · *domain warping* doble: el fbm se evalúa en un dominio deformado por otros dos fbm que se mueven con el tiempo.
 *     Es lo que da las volutas y los filamentos del humo;
 *   · el color sale de mezclar los `colores` según los propios campos de deformación (las capas del gas cambian de
 *     tono) y se recorta con una `zona` de bordes muy suaves;
 *   · dithering triangular de ±1 nivel sobre la salida de 8 bits: sin él, un degradado oscuro y lento se ve en
 *     escalones (banding) y el H.264 lo empeora;
 *   · el lienzo se pinta a la resolución real del vídeo × `calidad` (1 = píxel a píxel; 2 = supermuestreo; 0,5 = la
 *     mitad, ampliado de forma suave: el humo es de baja frecuencia y no se nota).
 *
 * Es determinista: cada fotograma depende solo de su tiempo, así que se puede renderizar en paralelo y por tramos.
 * Se compone sobre lo de abajo con `mezcla` (por defecto `screen`, luz sobre un fondo liso oscuro).
 *
 * Props: `colores` (2–4, hex), `zona` [x, y, ancho, alto] en % del cuadro (la luz vive ahí y se desvanece hacia los
 * bordes), `brillo` 0–1+ (anímalo con los golpes), `vel` velocidad, `escala` tamaño de las volutas (más = más
 * pequeñas), `densidad` cuánto cubre (0–1), `semilla` para que dos capas no sean iguales.
 */
export type HumoProps = {
  colores: string[];
  zona?: [number, number, number, number];
  brillo?: number;
  vel?: number;
  escala?: number;
  densidad?: number;
  semilla?: number;
  octavas?: number;
  /** Cuánto se retuercen las volutas (domain warping). 1–1,6 = gas suave; 3+ = mármol. */
  torsion?: number;
  /** >1 alarga el gas en horizontal (velos de aurora); 1 = sin dirección. */
  estira?: number;
  calidad?: number;
  mezcla?: "screen" | "normal" | "plus-lighter" | "lighten";
};

const VERTICES = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAGMENTO = (octavas: number) => `
precision highp float;
uniform vec2 res;
uniform float t;
uniform float semilla;
uniform float escala;
uniform float densidad;
uniform float brillo;
uniform float torsion;
uniform float estira;
uniform vec4 zona;      // x, y, ancho, alto en 0–1 (y desde arriba)
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform float nColores;

// Gradiente pseudoaleatorio por celda (hash sin seno: estable entre GPU y SwiftShader).
vec2 grad(vec2 i) {
  vec3 q = fract(vec3(i.xyx) * vec3(0.1031, 0.1030, 0.0973) + semilla * 0.017);
  q += dot(q, q.yzx + 33.33);
  vec2 h = fract((q.xx + q.yz) * q.zy);
  float a = h.x * 6.2831853;
  return vec2(cos(a), sin(a));
}

// Ruido de gradiente con interpolación quíntica: continuo en valor y derivada, sin aristas de rejilla.
float ruido(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(grad(i), f);
  float b = dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 GIRO = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 x) {
  float s = 0.0, amp = 0.5;
  for (int k = 0; k < ${octavas}; k++) {
    s += amp * ruido(x);
    x = GIRO * x * 2.03 + vec2(17.3, 9.1);
    amp *= 0.5;
  }
  return s;
}

float suave(float a, float b, float x) { return smoothstep(a, b, x); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / res;
  uv.y = 1.0 - uv.y;                       // 0 arriba, como CSS
  float aspecto = res.x / res.y;
  vec2 p = vec2(uv.x * aspecto, uv.y * estira) * escala + semilla * 3.1;

  // domain warping doble (las volutas)
  float tt = t * 0.11;
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + tt * vec2(0.6, -0.2)),
                fbm(p + vec2(5.2, 1.3) - tt * vec2(0.3, 0.5)));
  vec2 r = vec2(fbm(p + torsion * q + vec2(1.7, 9.2) + tt * 0.9),
                fbm(p + torsion * q + vec2(8.3, 2.8) - tt * 0.7));
  float n = fbm(p + torsion * 0.9 * r + tt * vec2(0.25, 0.1));

  // densidad: el fbm va de ~-0.6 a 0.6; se abre poco a poco para que el borde del humo sea gas, no recorte
  // transición ancha: el borde del humo es gas que se deshace, no un recorte
  float gas = suave(-0.35 - densidad * 0.4, 0.75, n * 1.15 + 0.1);
  gas = gas * gas * (0.8 + 0.2 * suave(-0.5, 0.7, r.x + q.y));   // velos algo más claros, sin vetas

  // zona con bordes muy suaves
  vec2 z = (uv - zona.xy) / zona.zw;
  float enX = suave(0.0, 0.22, z.x) * (1.0 - suave(0.78, 1.0, z.x));
  float enY = suave(0.0, 0.30, z.y) * (1.0 - suave(0.45, 1.0, z.y));
  gas *= enX * enY;

  // color: las capas del gas toman tonos distintos según la deformación
  float m1 = clamp(0.5 + 0.9 * q.x, 0.0, 1.0);
  float m2 = clamp(0.5 + 1.1 * r.y, 0.0, 1.0);
  vec3 col = mix(c0, c1, m1);
  if (nColores > 2.5) col = mix(col, c2, m2 * 0.7);
  if (nColores > 3.5) col = mix(col, c3, clamp(n + 0.3, 0.0, 1.0) * 0.5);

  vec3 luz = col * gas * brillo;

  // dithering triangular (±1 nivel de 8 bits) para que el degradado no se escalone
  vec2 sem = frag + fract(t * 7.13) * 91.7;
  float r1 = fract(sin(dot(sem, vec2(12.9898, 78.233))) * 43758.5453);
  float r2 = fract(sin(dot(sem + 17.17, vec2(39.3468, 11.135))) * 24634.6345);
  luz += (r1 + r2 - 1.0) / 255.0;

  gl_FragColor = vec4(max(luz, 0.0), 1.0);
}
`;

const aRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [parseInt(n.slice(0, 2), 16) / 255, parseInt(n.slice(2, 4), 16) / 255, parseInt(n.slice(4, 6), 16) / 255];
};

type Estado = { gl: WebGLRenderingContext; prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

export const Humo: React.FC<HumoProps> = ({
  colores, zona = [0, 0, 100, 60], brillo = 1, vel = 1, escala = 2.2, densidad = 0.55, semilla = 0, octavas = 4, torsion = 1.4, estira = 1.6, calidad = 1, mezcla = "screen",
}) => {
  const t = useSeg() * vel;
  const { width, height } = useVideoConfig();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const estado = useRef<Estado | null>(null);
  const W = Math.round(width * calidad), H = Math.round(height * calidad);

  useLayoutEffect(() => {
    const cv = lienzo.current;
    if (!cv) return;
    // Un aviso por dibujo: Remotion no hace la captura hasta que el lienzo de ESTE fotograma está pintado.
    const aviso = delayRender("Humo: pintando el fotograma");
    if (!estado.current) {
      const gl = cv.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
      if (!gl) throw new Error("Humo: este navegador no da WebGL (en render, chromiumOptions.gl = 'swangle' o 'angle').");
      const compila = (tipo: number, src: string) => {
        const s = gl.createShader(tipo)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`Humo: ${gl.getShaderInfoLog(s)}`);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compila(gl.VERTEX_SHADER, VERTICES));
      gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, FRAGMENTO(Math.max(2, Math.min(8, Math.round(octavas))))));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`Humo: ${gl.getProgramInfoLog(prog)}`);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      // un triángulo que cubre todo el cuadro
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u: Estado["u"] = {};
      for (const n of ["res", "t", "semilla", "escala", "densidad", "brillo", "torsion", "estira", "zona", "c0", "c1", "c2", "c3", "nColores"]) {
        u[n] = gl.getUniformLocation(prog, n);
      }
      estado.current = { gl, prog, u };
    }
    const { gl, u } = estado.current;
    const cs = (colores.length ? colores : ["#7FCBFF"]).slice(0, 4).map(aRgb);
    while (cs.length < 2) cs.push(cs[0]);
    gl.viewport(0, 0, W, H);
    gl.uniform2f(u.res, W, H);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.semilla, semilla);
    gl.uniform1f(u.escala, escala);
    gl.uniform1f(u.densidad, densidad);
    gl.uniform1f(u.brillo, brillo);
    gl.uniform1f(u.torsion, torsion);
    gl.uniform1f(u.estira, estira);
    gl.uniform4f(u.zona, zona[0] / 100, zona[1] / 100, zona[2] / 100, zona[3] / 100);
    gl.uniform3fv(u.c0, cs[0]);
    gl.uniform3fv(u.c1, cs[1]);
    gl.uniform3fv(u.c2, cs[2] ?? cs[1]);
    gl.uniform3fv(u.c3, cs[3] ?? cs[2] ?? cs[1]);
    gl.uniform1f(u.nColores, cs.length);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    continueRender(aviso);
  }, [t, W, H, semilla, escala, densidad, brillo, torsion, estira, zona, colores, octavas]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: mezcla }}>
      <canvas ref={lienzo} width={W} height={H} style={{ width: "100%", height: "100%", display: "block" }} />
    </AbsoluteFill>
  );
};
