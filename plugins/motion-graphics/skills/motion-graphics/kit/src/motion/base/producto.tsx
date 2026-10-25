// Base común · enseñar un PRODUCTO (análisis a fondo de tres motion de producto claros, 2026-10-25:
// referencias/motion-graphics/analisis/a-fondo-tres-motion-panel{1,2,3}.md). Cifras medidas a 30 fps, en segundos.
//  · MarcoMovil     pantalla de móvil genérica (sin marca): isla, hora, iconos, radio, base disuelta en el fondo
//  · PilaMoviles    pantallas que suben por delante (quint-out 1,1–1,3 s) y empujan a la anterior al fondo (×0,82, −82 px)
//  · LineaTiempo    estados de un pedido/proceso: eje que se dibuja, nodos que brotan, tarjetas que suben enfocándose,
//                   nodo final relleno; vertical (cámara que baja) u horizontal (cámara que barre)
//  · entraEnCuadro  cuándo un punto del mundo entra en cuadro con una Camara2D (para sincronizar apariciones con la cámara)
//  · AnilloIconos   iconos en un anillo inclinado (arriba hacia cámara, siempre de frente) que estalla desde una pila,
//                   gira despacio con pulsos en los golpes y sale disparado
//  · IconoApp, Pastilla  icono de app genérico (glifos propios) y etiqueta pequeña (precio, estado)
// Coordenadas: px de 1920×1080 (o del mundo, dentro de Camara2D). Nada de `filter` en contenedores `preserve-3d`.
import React from "react";
import { Easing } from "remotion";
import { useEstilo } from "./estilo";
import { CURVAS, tramo, useSeg } from "./tiempo";
import { camara2DEn, type ClaveCamara2D } from "./camara";
import { CURVAS_ENFOQUE } from "./enfoque";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
/** Brote con sobrepaso pequeño (≈ 10–12 %, medido en los nodos). */
const BROTE = Easing.bezier(0.34, 1.45, 0.64, 1);

// ═════════ MARCO DE MÓVIL ═════════
/**
 * Pantalla de móvil genérica. Sin marco físico por defecto (solo la pantalla con su radio), con barra de estado
 * (`hora`, isla, cobertura/batería) y la base disuelta en el fondo (`disuelve`: % del alto donde empieza a desaparecer;
 * medido 55 → 92 %). `borde`: "ninguno" | "fino" (filo claro) | "iridiscente" (filo de colores muy suave).
 * `children` = el contenido de la app (recrea la UI REAL del producto: ver la skill motion-interfaz, §3 fidelidad).
 */
export const MarcoMovil: React.FC<{ ancho?: number; alto?: number; radio?: number; fondo?: string; hora?: string; tinta?: string; isla?: boolean;
  borde?: "ninguno" | "fino" | "iridiscente"; disuelve?: [number, number] | false; sombra?: boolean; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  ancho = 740, alto = 1520, radio, fondo = "#FFFFFF", hora = "9:41", tinta = "#110E12", isla = true, borde = "fino", disuelve = [55, 92], sombra = true, children, style }) => {
  const r = radio ?? ancho * 0.103;
  const e = ancho / 740; // escala de los detalles (medidos sobre una pantalla de 740 px)
  const mascara = disuelve ? `linear-gradient(to bottom, #000 ${disuelve[0]}%, transparent ${disuelve[1]}%)` : undefined;
  const filo = borde === "iridiscente"
    ? "conic-gradient(from 210deg, rgba(255,255,255,0.9), rgba(196,170,255,0.7), rgba(255,214,236,0.7), rgba(170,226,255,0.7), rgba(255,255,255,0.9))"
    : borde === "fino" ? "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))" : undefined;
  return (
    <div style={{ position: "relative", width: ancho, height: alto, WebkitMaskImage: mascara, maskImage: mascara, ...style }}>
      {sombra && <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: `0 ${24 * e}px ${70 * e}px rgba(40,24,80,0.10), 0 ${4 * e}px ${14 * e}px rgba(40,24,80,0.05)` }} />}
      {filo && <div style={{ position: "absolute", inset: -2.5 * e, borderRadius: r + 2.5 * e, background: filo }} />}
      <div style={{ position: "absolute", inset: 0, borderRadius: r, overflow: "hidden", background: fondo }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 * e, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `0 ${64 * e}px`, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 30 * e, color: tinta, zIndex: 2 }}>
          <span>{hora}</span>
          <svg width={92 * e} height={24 * e} viewBox="0 0 92 24" fill={tinta}>
            {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 7} y={16 - i * 4} width={5} height={8 + i * 4} rx={1.2} />)}
            <path d="M40 9a14 14 0 0 1 18 0l-2.2 2.4a10.5 10.5 0 0 0-13.6 0zM44 13.5a8 8 0 0 1 10 0L49 19z" />
            <rect x={63} y={4} width={24} height={14} rx={4} fill="none" stroke={tinta} strokeWidth={1.6} opacity={0.5} />
            <rect x={65.5} y={6.5} width={19} height={9} rx={2} />
            <rect x={88.5} y={8.5} width={2} height={5} rx={1} opacity={0.5} />
          </svg>
        </div>
        {isla && <div style={{ position: "absolute", left: "50%", top: 30 * e, width: 210 * e, height: 60 * e, marginLeft: -105 * e, borderRadius: 30 * e, background: "#110E12", zIndex: 3 }} />}
        <div style={{ position: "absolute", left: 0, right: 0, top: 120 * e, bottom: 0 }}>{children}</div>
      </div>
    </div>
  );
};

// ═════════ PILA DE MÓVILES ═════════
export type PantallaPila = { t0: number; contenido: React.ReactNode; fondo?: string; scroll?: number };
/**
 * Pila vertical en profundidad: cada pantalla SUBE `sube` px desde abajo en `dur` s (quint-out: la mitad del recorrido
 * al 14 % del tiempo), enfocándose en los primeros 0,2 s (`desenfoque` px → 0). Cuando llega la siguiente, la anterior
 * retrocede a ×`atras.s` y `atras.y` px (asoma por arriba) con la misma curva, y se aclara un poco. Toda la pila se aleja
 * despacio (`deriva` = escala perdida por segundo, medido 0,06). `scroll` = px que el contenido sube DENTRO de la
 * pantalla mientras llega (paralaje). La base de cada pantalla se disuelve en el fondo (`MarcoMovil disuelve`).
 * `centro` = dónde queda la barra de estado de la pantalla delantera (x centro, y arriba).
 */
export const PilaMoviles: React.FC<{ pantallas: PantallaPila[]; centro?: [number, number]; ancho?: number; alto?: number; sube?: number; dur?: number;
  atras?: { s: number; y: number }; desenfoque?: number; deriva?: number; borde?: "ninguno" | "fino" | "iridiscente"; sale?: number }> = ({
  pantallas, centro = [960, 150], ancho = 740, alto = 1520, sube = 620, dur = 1.15, atras = { s: 0.82, y: -82 }, desenfoque = 10, deriva = 0.06, borde = "iridiscente", sale }) => {
  const t = useSeg();
  if (!pantallas.length || t < pantallas[0].t0) return null;
  const s0 = 1 - deriva * Math.max(0, t - pantallas[0].t0);
  const fuera = sale !== undefined ? tramo(t, sale, sale + 0.37, CURVAS.acelera) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${centro[0]}px ${centro[1] + 300}px`,
      transform: `scale(${s0 * (1 - 0.63 * fuera)})`, filter: fuera > 0.01 ? `blur(${fuera * 10}px)` : undefined }}>
      {pantallas.map((p, i) => {
        if (t < p.t0) return null;
        const k = tramo(t, p.t0, p.t0 + dur, CURVAS_ENFOQUE.quint);
        const b = (1 - tramo(t, p.t0, p.t0 + 0.2, CURVAS.lineal)) * desenfoque;
        // cuántas pantallas han llegado por delante (fraccional mientras llegan)
        let d = 0;
        for (let j = i + 1; j < pantallas.length; j++) d += tramo(t, pantallas[j].t0, pantallas[j].t0 + dur, CURVAS_ENFOQUE.quint);
        const s = Math.pow(atras.s, d), dy = atras.y * d * (1 + (d - 1) * 0.2);
        return (
          <div key={i} style={{ position: "absolute", left: centro[0] - ancho / 2, top: centro[1] + (1 - k) * sube + dy, transformOrigin: "50% 0%", transform: `scale(${s})`,
            filter: b > 0.1 ? `blur(${b.toFixed(2)}px)` : undefined }}>
            <MarcoMovil ancho={ancho} alto={alto} fondo={p.fondo} borde={borde}>
              <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - k) * (p.scroll ?? 25)}px)` }}>{p.contenido}</div>
              {d > 0.01 && <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: Math.min(0.45, 0.22 * d) }} />}
            </MarcoMovil>
          </div>
        );
      })}
    </div>
  );
};

// ═════════ CUÁNDO ENTRA EN CUADRO ═════════
/**
 * Primer t (entre `desde` y `hasta`, cada 1/60 s) en que el punto del mundo `p` [x, y] queda en pantalla por debajo
 * (`modo: "menor"`) o por encima (`"mayor"`) de `borde` en el eje `eje`, con la cámara 2D `claves` (y su `ancla`).
 * Así las piezas aparecen cuando la cámara llega a ellas y no a tiempos puestos a mano (medido: las tarjetas de una línea
 * horizontal suben cuando su nodo llega a x ≈ 1700 de pantalla). Devuelve `hasta` si no entra.
 */
export const entraEnCuadro = (claves: ClaveCamara2D[], p: [number, number], o: { eje?: "x" | "y"; borde: number; modo?: "menor" | "mayor"; desde?: number; hasta?: number; ancla?: [number, number] }) => {
  const { eje = "y", borde, modo = "menor", desde = 0, hasta = 60, ancla = [960, 540] } = o;
  for (let t = desde; t <= hasta; t += 1 / 60) {
    const c = camara2DEn(claves, t);
    const v = eje === "x" ? ancla[0] + c.s * (p[0] - c.x) : ancla[1] + c.s * (p[1] - c.y);
    if (modo === "menor" ? v < borde : v > borde) return t;
  }
  return hasta;
};

// ═════════ LÍNEA DE TIEMPO ═════════
export type NodoLinea = { titulo: string; sub?: string; icono?: React.ReactNode; t: number; final?: boolean; lado?: "a" | "b" };
/**
 * Estados de un proceso en el MUNDO (ponla dentro de una `Camara2D` que la recorre). Nodo i en `origen` + i·`paso` a lo
 * largo del eje. En `nodos[i].t`: el tramo del eje desde el nodo anterior se dibuja (`durEje`), el nodo brota (sobrepaso
 * ≈ 12 %) y su tarjeta sube `sube` px enfocándose (`desenfoque` px → 0 en `durTarjeta`), con el título un instante
 * después de la fecha. Vertical: tarjetas alternas a izquierda (`a`) y derecha (`b`). Horizontal: tarjeta encima, rótulo
 * debajo. El nodo `final` va relleno del color de marca y brota más grande.
 * Medido: vertical nodos 130 px cada 310 px, un paso cada 0,43 s, tarjeta +140 px, blur 16 → 0 en 0,37 s;
 * horizontal nodos cada 540 px, tarjeta +110 px, blur 10 → 0 en 0,27 s, conector en 0,27 s.
 * Calcula los `t` con `entraEnCuadro` para que cada estado aparezca cuando la cámara llega.
 */
export const LineaTiempo: React.FC<{ nodos: NodoLinea[]; eje?: "vertical" | "horizontal"; origen?: [number, number]; paso?: number; tamNodo?: number;
  sube?: number; desenfoque?: number; durTarjeta?: number; durEje?: number; separacion?: number; anchoTarjeta?: number;
  colorEje?: string; colorNodo?: string; colorFinal?: string; fondoTarjeta?: string; tinta?: string; gris?: string; fuente?: string }> = ({
  nodos, eje = "vertical", origen = [960, 300], paso, tamNodo, sube, desenfoque, durTarjeta, durEje = 0.27, separacion, anchoTarjeta = 330,
  colorEje = "#7B6F9E", colorNodo = "#5B4D86", colorFinal = "#3B1A6F", fondoTarjeta = "#FBFBFB", tinta = "#1E161F", gris = "#9A93A8", fuente }) => {
  const t = useSeg();
  const est = useEstilo();
  const v = eje === "vertical";
  const P = paso ?? (v ? 310 : 540), N = tamNodo ?? (v ? 130 : 96), S = sube ?? (v ? 140 : 110), B = desenfoque ?? (v ? 16 : 10), DT = durTarjeta ?? (v ? 0.37 : 0.27);
  const sep = separacion ?? (v ? 70 : 60);
  const fam = fuente ?? est.fuente;
  const pos = (i: number): [number, number] => (v ? [origen[0], origen[1] + i * P] : [origen[0] + i * P, origen[1]]);
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {/* eje */}
      {nodos.map((n, i) => {
        if (i === 0) return null;
        const k = tramo(t, n.t - durEje, n.t, CURVAS.inOut);
        if (k <= 0) return null;
        const [x0, y0] = pos(i - 1), L = P - N * 0.62;
        const ini = N * 0.31;
        return <div key={`e${i}`} style={{ position: "absolute", background: colorEje, borderRadius: 2,
          ...(v ? { left: x0 - 1.5, top: y0 + ini, width: 3, height: L * k } : { left: x0 + ini, top: y0 - 1.5, height: 3, width: L * k }) }} />;
      })}
      {nodos.map((n, i) => {
        const kn = tramo(t, n.t - 0.05, n.t + 0.3, BROTE);
        if (kn <= 0) return null;
        const [x, y] = pos(i);
        const tn = n.final ? N * 1.18 : N * 0.62;
        const lado = n.lado ?? (i % 2 === 0 ? "a" : "b");
        const kt = tramo(t, n.t + 0.03, n.t + 0.03 + DT, CURVAS.expo);
        const kTit = tramo(t, n.t + 0.09, n.t + 0.09 + DT * 0.6, CURVAS.expo);
        const b = (1 - kt) * B;
        const tarjeta: React.CSSProperties = v
          ? { left: lado === "a" ? x - tn / 2 - sep - anchoTarjeta : x + tn / 2 + sep, top: y - 58 }
          : { left: x - anchoTarjeta / 2, top: y - N / 2 - sep - 128 };
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x - tn / 2, top: y - tn / 2, width: tn, height: tn, borderRadius: "50%", transform: `scale(${kn})`,
              background: n.final ? colorFinal : "#FFFFFF", border: n.final ? "none" : `3px solid ${colorEje}`, boxShadow: "0 6px 18px rgba(40,24,80,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center", color: n.final ? "#FFFFFF" : colorNodo }}>
              {n.icono && <div style={{ width: tn * 0.46, height: tn * 0.46, display: "flex" }}>{n.icono}</div>}
            </div>
            {kt > 0 && (
              <div style={{ position: "absolute", ...tarjeta, width: anchoTarjeta, opacity: Math.min(1, kt * 1.5), transform: `translateY(${(1 - kt) * S}px)`,
                filter: b > 0.1 ? `blur(${b.toFixed(2)}px)` : undefined, background: fondoTarjeta, borderRadius: 22, padding: "24px 30px",
                boxShadow: "0 18px 44px rgba(40,24,80,0.09), 0 2px 6px rgba(40,24,80,0.05)", fontFamily: fam }}>
                <div style={{ fontSize: 30, fontWeight: 600, color: tinta, lineHeight: 1.15, transform: `translateY(${(1 - kTit) * 28}px)`, opacity: kTit }}>{n.titulo}</div>
                {n.sub && <div style={{ fontSize: 22, fontWeight: 400, color: gris, marginTop: 8, lineHeight: 1.2 }}>{n.sub}</div>}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ═════════ ICONO DE APP Y PASTILLA ═════════
/** Glifos propios (trazo 24×24) para iconos de demo. Para un producto real, usa SUS iconos (motion-interfaz §3). */
export const GLIFOS_APP: Record<string, string> = {
  lupa: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 20 20",
  caja: "M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10",
  pin: "M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  camion: "M3 6h11v10H3zM14 9h4l3 3.5V16h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  avion: "M21 4 3 11l7 2.5L12.5 20 21 4zM10 13.5 21 4",
  fabrica: "M3 20V10l5 3V10l5 3V6h4l1 14zM3 20h18",
  almacen: "M3 9l9-5 9 5v11H3zM7 20v-7h10v7M7 16h10",
  documento: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  rayo: "M13 3 5 13h6l-1 8 8-10h-6z",
  check: "M5 12.5 10 17.5 19 7",
};
/** Icono de app: cuadrado redondeado (`radio` 22 % del tamaño) con degradado `fondo` y un glifo de trazo blanco. */
export const IconoApp: React.FC<{ tam?: number; fondo?: string; glifo?: keyof typeof GLIFOS_APP | string; color?: string; trazo?: number; style?: React.CSSProperties }> = ({
  tam = 96, fondo = "linear-gradient(160deg, #5C8DF6, #2E5BD8)", glifo = "lupa", color = "#FFFFFF", trazo = 2.2, style }) => (
  <div style={{ width: tam, height: tam, borderRadius: tam * 0.22, background: fondo, display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 ${tam * 0.12}px ${tam * 0.3}px rgba(30,20,70,0.18), inset 0 1px 0 rgba(255,255,255,0.35)`, ...style }}>
    <svg width={tam * 0.56} height={tam * 0.56} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={trazo} strokeLinecap="round" strokeLinejoin="round">
      <path d={GLIFOS_APP[glifo] ?? glifo} />
    </svg>
  </div>
);
/** Glifo suelto (trazo) para nodos e interfaces. */
export const Glifo: React.FC<{ nombre: keyof typeof GLIFOS_APP | string; color?: string; trazo?: number }> = ({ nombre, color = "currentColor", trazo = 2 }) => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={trazo} strokeLinecap="round" strokeLinejoin="round"><path d={GLIFOS_APP[nombre] ?? nombre} /></svg>
);
/** Etiqueta pequeña (precio, estado). `k` 0–1 = aparición (escala desde la esquina + fundido). */
export const Pastilla: React.FC<{ texto: string; k?: number; fondo?: string; tinta?: string; tam?: number; tachado?: number; style?: React.CSSProperties }> = ({
  texto, k = 1, fondo = "#FFFFFF", tinta = "#4A3F66", tam = 18, tachado = 0, style }) => (
  <div style={{ position: "relative", display: "inline-block", padding: `${tam * 0.3}px ${tam * 0.6}px`, borderRadius: tam, background: fondo, color: tinta,
    fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: tam, lineHeight: 1, whiteSpace: "pre", opacity: c01(k * 1.4),
    transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: "0% 0%", boxShadow: "0 4px 12px rgba(40,24,80,0.12)", ...style }}>
    {texto}
    {tachado > 0 && <div style={{ position: "absolute", left: "12%", top: "50%", height: 2, width: `${76 * tachado}%`, background: tinta }} />}
  </div>
);

// ═════════ ANILLO DE ICONOS ═════════
export type IconoAnillo = { nodo: React.ReactNode; etiqueta?: string };
/**
 * Iconos en un anillo inclinado alrededor de una frase: elipse de semiejes `rx`·`ry` con el borde de ARRIBA hacia la
 * cámara (los de arriba ×`profundidad` más grandes, los de abajo más pequeños y algo más claros), siempre de frente.
 * Entrada: salen de una pila en el centro y estallan al anillo en `estalla` s (sobrepaso leve). Giro horario `vel`°/s
 * con `pulsos` (t, grados extra en 0,2 s, para los golpes). En `tEtiquetas` cada icono enseña su `etiqueta` (Pastilla).
 * `sale`: el radio pasa a ×1,9 en 0,13 s acelerando (salen disparados por los bordes).
 * Medido: elipse ≈ 500 × 270 (semiejes 460 × 250 a 1080p en el original), 20°/s, pulso hasta 123°/s, arriba ×1,27.
 */
export const AnilloIconos: React.FC<{ iconos: IconoAnillo[]; t0: number; centro?: [number, number]; rx?: number; ry?: number; tam?: number; profundidad?: number;
  vel?: number; pulsos?: { t: number; grados: number }[]; estalla?: number; tEtiquetas?: number; tamEtiqueta?: number; sale?: number; fase?: number }> = ({
  iconos, t0, centro = [960, 540], rx = 460, ry = 250, tam = 92, profundidad = 1.27, vel = 20, pulsos = [], estalla = 0.2, tEtiquetas, tamEtiqueta = 24, sale, fase = 90 }) => {
  const t = useSeg();
  if (t < t0) return null;
  const n = iconos.length;
  const ke = tramo(t, t0, t0 + estalla, BROTE);
  const giro = vel * (t - t0) + pulsos.reduce((a, p) => a + p.grados * tramo(t, p.t, p.t + 0.2, CURVAS.inOut), 0);
  const ks = sale !== undefined ? tramo(t, sale, sale + 0.13, CURVAS.acelera) : 0;
  if (ks >= 1) return null;
  const R = ke * (1 + 0.9 * ks);
  const items = iconos.map((ic, i) => {
    const a = ((fase + (360 / n) * i - giro) * Math.PI) / 180; // horario en pantalla
    const sy = Math.sin(a); // +1 arriba (cerca de cámara)
    const x = centro[0] + Math.cos(a) * rx * R, y = centro[1] - sy * ry * R;
    const esc = 1 + (profundidad - 1) * sy; // arriba más grande
    // en la pila del principio, los de detrás asoman escalonados
    const pila = 1 - ke;
    return { ic, i, x: x + pila * i * 6, y: y - pila * i * 10, esc: esc * (0.7 + 0.3 * ke), z: sy };
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, filter: ks > 0.01 ? `blur(${ks * 18}px)` : undefined }}>
      {items.sort((a, b) => a.z - b.z).map(({ ic, i, x, y, esc, z }) => {
        const ket = tEtiquetas !== undefined ? tramo(t, tEtiquetas + i * 0.05, tEtiquetas + i * 0.05 + 0.3, CURVAS.expo) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${esc})`, opacity: (ke > 0.02 || i === 0 ? 1 : 0) * (1 - 0.15 * Math.max(0, -z)) }}>
            <div style={{ width: tam, height: tam }}>{ic.nodo}</div>
            {ic.etiqueta && ket > 0 && <div style={{ position: "absolute", left: tam * 0.78, top: tam * 0.9 }}><Pastilla texto={ic.etiqueta} k={ket} tam={tamEtiqueta} /></div>}
          </div>
        );
      })}
    </div>
  );
};
