// Demo de FIDELIDAD (antes / después) con un producto ficticio, «pulso», cuyo «código real» está en
// ejemplos/fidelidad/pulso (tokens.css, iconos.js, panel.html) y cuya captura real es public/fidelidad/pulso-referencia.png.
// - ANTES: recreada «a ojo» (lo que sale sin el proceso): letra genérica, azul inventado, radios y sombras de plantilla,
//   textos en inglés, cifras inventadas, iconos parecidos.
// - DESPUÉS: copiada de la fuente de verdad: los MISMOS tokens, la misma estructura (grid/flex), los mismos trazos de
//   iconos, los mismos textos y datos. Se comprueba con el calco en modo diferencia (negro = coincide) y con
//   `node scripts/comparar-fidelidad.mjs`.
// Pantalla a escala 1:1 (1440×900) en (240, 150) para poder compararla al píxel; la cámara solo se mueve al final.
import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as dmSans } from "@remotion/google-fonts/DMSans";
import { Calco, Contador, CURVAS, INTER, Mascara, tramo, useSeg, Camara2D, Sonido } from "../base";

const DM = dmSans("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"], ignoreTooManyRequestsWarning: true }).fontFamily;
export const duracionFidelidad = 8;
const PX = 240, PY = 150, PW = 1440, PH = 900;

/** Tokens de una versión de la pantalla. FIEL = copiados de tokens.css (con su nombre de variable al lado). */
type Tokens = {
  fuente: string; bg: string; surface: string; sidebar: string; sidebarText: string; sidebarActive: string; text: string; muted: string; border: string;
  primary: string; success: string; successBg: string; danger: string; dangerBg: string; warning: string; warningBg: string; barra: string;
  rCard: number; rBtn: number; shadow: string; h1: number; kpi: number; label: number; sidebarW: number; claroLateral: boolean;
  textos: { titulo: string; menu: string[]; rango: string; exportar: string; kpis: [string, string, string][]; grafica: string; tabla: string; filas: [string, string, string][]; usuario: [string, string] };
  iconos: "producto" | "parecidos";
};
const FIEL: Tokens = {
  fuente: DM, // --pl-font: "DM Sans"
  bg: "#f6f5f2", surface: "#ffffff", sidebar: "#14161b", sidebarText: "#a9aeb8", sidebarActive: "#22252c", // --pl-bg, --pl-surface, --pl-sidebar…
  text: "#1b1d22", muted: "#6b7079", border: "#e6e3dd", primary: "#e5484d", success: "#2f9e66", successBg: "#e6f4ec",
  danger: "#d23b3f", dangerBg: "#fbe7e7", warning: "#a8681a", warningBg: "#fbf0dc", barra: "#f8d1d2",
  rCard: 10, rBtn: 8, shadow: "0 1px 2px rgba(20, 22, 27, 0.06), 0 4px 12px rgba(20, 22, 27, 0.05)", // --pl-radius-*, --pl-shadow-card
  h1: 26, kpi: 30, label: 12, sidebarW: 232, claroLateral: false,
  textos: {
    titulo: "Resumen", menu: ["Resumen", "Embudos", "Audiencias", "Informes", "Ajustes"], rango: "Últimos 30 días", exportar: "Exportar",
    kpis: [["Visitantes", "48.210", "+12,4 %"], ["Conversión", "3,8 %", "+0,6 pp"], ["Ingresos", "21.940 €", "−2,1 %"]],
    grafica: "Visitantes por semana", tabla: "Campañas principales",
    filas: [["Lanzamiento otoño", "12.480", "Activa"], ["Newsletter semanal", "8.932", "Activa"], ["Webinar de producto", "4.115", "En pausa"], ["Prueba gratuita", "3.870", "Activa"]],
    usuario: ["Equipo demo", "Plan Pro"],
  },
  iconos: "producto",
};
const A_OJO: Tokens = {
  fuente: INTER, bg: "#f8fafc", surface: "#ffffff", sidebar: "#ffffff", sidebarText: "#64748b", sidebarActive: "#eff6ff", text: "#0f172a", muted: "#64748b", border: "#e2e8f0",
  primary: "#3b82f6", success: "#16a34a", successBg: "#dcfce7", danger: "#dc2626", dangerBg: "#fee2e2", warning: "#ca8a04", warningBg: "#fef9c3", barra: "#3b82f6",
  rCard: 18, rBtn: 12, shadow: "0 10px 30px rgba(15, 23, 42, 0.10)", h1: 30, kpi: 36, label: 13, sidebarW: 260, claroLateral: true,
  textos: {
    titulo: "Dashboard", menu: ["Dashboard", "Funnels", "Users", "Reports", "Settings"], rango: "Last 30 days", exportar: "Export",
    kpis: [["Total visits", "12,345", "+5%"], ["Conversion rate", "4.5%", "+1%"], ["Revenue", "$9,876", "-3%"]],
    grafica: "Weekly visitors", tabla: "Top campaigns",
    filas: [["Campaign A", "1,234", "Active"], ["Campaign B", "987", "Active"], ["Campaign C", "654", "Paused"], ["Campaign D", "321", "Active"]],
    usuario: ["John Doe", "Admin"],
  },
  iconos: "parecidos",
};

// iconos del producto: copiados de ejemplos/fidelidad/pulso/iconos.js (los mismos trazos)
const ICONOS: Record<string, React.ReactNode> = {
  resumen: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  embudos: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  audiencias: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  informes: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  ajustes: <><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></>,
  calendario: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  descargar: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
};
// lo que dibuja quien no mira el producto: «algo parecido»
const PARECIDOS: Record<string, React.ReactNode> = {
  resumen: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
  embudos: <path d="M4 6h16M7 12h10M10 18h4" />, audiencias: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  informes: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8" /></>, ajustes: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="3" /></>, descargar: <path d="M12 4v12m-5-5 5 5 5-5" />,
};
const MENU_ICONOS = ["resumen", "embudos", "audiencias", "informes", "ajustes"];
const Ico: React.FC<{ n: string; tam: number; v: Tokens }> = ({ n, tam, v }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={v.iconos === "producto" ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {(v.iconos === "producto" ? ICONOS : PARECIDOS)[n]}
  </svg>
);
const BARRAS = [38, 44, 41, 52, 49, 58, 61, 57, 66, 72, 69, 84];

/** La pantalla «Resumen» con la MISMA estructura que panel.html (grid, flex, tabla), parametrizada por sus tokens. */
const Pantalla: React.FC<{ v: Tokens; vida?: number; t: number }> = ({ v, vida = 0, t }) => {
  const T = v.textos;
  const crece = vida > 0 ? tramo(t, 5.05, 5.9, CURVAS.expo) : 1;
  const cifra = (i: number, s: string) => {
    if (!vida) return s;
    if (i === 0) return <Contador hasta={48210} t0={5.05} dur={1.1} />;
    if (i === 1) return <Contador hasta={3.8} t0={5.15} dur={1.0} decimales={1} sufijo=" %" />;
    return <Contador hasta={21940} t0={5.25} dur={1.1} sufijo=" €" />;
  };
  const pulsa = vida && t > 6.9 && t < 7.1 ? 0.94 : 1;
  const filaViva = vida ? Math.min(3, Math.max(-1, Math.floor((t - 6.0) / 0.35))) : -1;
  return (
    <div style={{ width: PW, height: PH, display: "grid", gridTemplateColumns: `${v.sidebarW}px 1fr`, fontFamily: v.fuente, fontSize: 14, lineHeight: "normal", color: v.text, background: v.bg, WebkitFontSmoothing: "antialiased", boxSizing: "border-box" }}>
      <aside style={{ background: v.sidebar, padding: "20px 14px", display: "flex", flexDirection: "column", borderRight: v.claroLateral ? `1px solid ${v.border}` : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: v.claroLateral ? v.text : "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", padding: "0 10px", marginBottom: 28 }}>
          <i style={{ width: 22, height: 22, borderRadius: "50%", border: `5px solid ${v.primary}`, boxSizing: "border-box" }} />pulso
        </div>
        <nav>
          {T.menu.map((m, i) => (
            <a key={m} style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, height: 38, padding: "0 12px", borderRadius: v.rBtn, fontWeight: 500, marginBottom: 2,
              background: i === 0 ? v.sidebarActive : undefined, color: i === 0 ? (v.claroLateral ? v.primary : "#fff") : v.sidebarText }}>
              {i === 0 && !v.claroLateral && <span style={{ position: "absolute", left: -14, top: 10, width: 3, height: 18, borderRadius: "0 2px 2px 0", background: v.primary }} />}
              <Ico n={MENU_ICONOS[i]} tam={18} v={v} />{m}
            </a>
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: v.rBtn, background: v.sidebarActive }}>
          <b style={{ width: 28, height: 28, borderRadius: "50%", background: v.claroLateral ? v.primary : "#343843", color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>{T.usuario[0].split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</b>
          <div style={{ color: v.claroLateral ? v.text : "#fff", fontSize: 13, fontWeight: 500, lineHeight: 1.25 }}>{T.usuario[0]}<small style={{ display: "block", color: v.sidebarText, fontSize: 12, fontWeight: 400 }}>{T.usuario[1]}</small></div>
        </div>
      </aside>
      <main>
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 28px", borderBottom: `1px solid ${v.border}`, background: v.surface, boxSizing: "border-box" }}>
          <h1 style={{ fontSize: v.h1, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, flex: 1 }}>{T.titulo}</h1>
          <span style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 14px", border: `1px solid ${v.border}`, borderRadius: 999, fontSize: 13, boxSizing: "border-box" }}><Ico n="calendario" tam={15} v={v} />{T.rango}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px", borderRadius: v.rBtn, background: v.primary, color: "#fff", fontWeight: 600, transform: `scale(${pulsa})` }}><Ico n="descargar" tam={16} v={v} />{T.exportar}</span>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {T.kpis.map(([l, val, d], i) => (
              <div key={l} style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: v.rCard, boxShadow: v.shadow, padding: 20, boxSizing: "border-box" }}>
                <div style={{ fontSize: v.label, textTransform: "uppercase", letterSpacing: "0.06em", color: v.muted, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: v.kpi, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{cifra(i, val)}</div>
                <span style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: i === 2 ? v.dangerBg : v.successBg, color: i === 2 ? v.danger : v.success }}>{d}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginTop: 20 }}>
            <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: v.rCard, boxShadow: v.shadow, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>{T.grafica}</div>
              <div style={{ height: 220, display: "flex", alignItems: "flex-end", gap: 14, paddingTop: 10, boxSizing: "border-box" }}>
                {BARRAS.map((b, i) => (
                  <i key={i} style={{ flex: 1, height: (b / 84) * 200 * (vida ? Math.min(1, Math.max(0, crece * 1.4 - i * 0.035)) : 1), borderRadius: v.claroLateral ? 999 : "4px 4px 0 0", background: i === 11 || v.claroLateral ? v.primary : v.barra }} />
                ))}
              </div>
            </div>
            <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: v.rCard, boxShadow: v.shadow, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>{T.tabla}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {T.filas.map(([n, c, e], i) => (
                    <tr key={n} style={{ background: i === filaViva ? "#fdf1f1" : undefined }}>
                      <td style={{ height: 48, borderTop: `1px solid ${v.border}`, fontSize: 14 }}>{n}</td>
                      <td style={{ height: 48, borderTop: `1px solid ${v.border}`, fontSize: 14, textAlign: "right", color: v.muted, fontVariantNumeric: "tabular-nums", paddingRight: 14 }}>{c}</td>
                      <td style={{ height: 48, borderTop: `1px solid ${v.border}`, textAlign: "right", width: 90 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: i === 2 ? v.warningBg : v.successBg, color: i === 2 ? v.warning : v.success }}>{e}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Rotulo: React.FC<{ t0: number; t1: number; titulo: string; detalle: string; color: string }> = ({ t0, t1, titulo, detalle, color }) => {
  const t = useSeg();
  if (t < t0 - 0.05 || t > t1 + 0.5) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 34, textAlign: "center", fontFamily: INTER, color: "#F2F4F7" }}>
      <div style={{ fontSize: 46, fontWeight: 650, letterSpacing: "-0.03em" }}><span style={{ color }}><Mascara texto={titulo} t0={t0} t1={t1} escalon={0.04} /></span></div>
      <div style={{ fontSize: 22, color: "#9BA3AF", marginTop: 6, opacity: tramo(t, t0 + 0.2, t0 + 0.5) * (1 - tramo(t, t1, t1 + 0.25)) }}>{detalle}</div>
    </div>
  );
};

export const DemoFidelidad: React.FC = () => {
  const t = useSeg();
  const entra = tramo(t, 0, 0.4);
  const cortina = tramo(t, 2.4, 3.3, CURVAS.inOut);
  const dif = tramo(t, 3.7, 3.95) * (1 - tramo(t, 4.75, 4.95));
  return (
    <AbsoluteFill style={{ background: "#0d0f12" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 50% 55%, #1b1f27 0%, #0d0f12 70%)" }} />
      <Camara2D claves={[{ t: 0, x: 960, y: 540, s: 1 }, { t: 5.0, x: 960, y: 540, s: 1 }, { t: 6.2, x: 1120, y: 470, s: 1.22 }, { t: 8, x: 1180, y: 430, s: 1.3 }]}>
        <div style={{ position: "absolute", left: PX, top: PY, width: PW, height: PH, borderRadius: 12, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.55)", opacity: entra, transform: `translateY(${(1 - entra) * 30}px)` }}>
          {/* ANTES (a ojo) debajo; DESPUÉS (fiel) encima, destapado por la cortina */}
          <Pantalla v={A_OJO} t={t} />
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - cortina) * 100}% 0 0)` }}><Pantalla v={FIEL} t={t} vida={t >= 5 ? 1 : 0} /></div>
          {cortina > 0 && cortina < 1 && <div style={{ position: "absolute", top: 0, bottom: 0, left: cortina * PW - 1, width: 3, background: "#FF2D55", boxShadow: "0 0 18px #FF2D55" }} />}
          {/* comprobación: la captura real en modo diferencia (negro = coincide) */}
          {dif > 0 && <div style={{ position: "absolute", inset: 0, opacity: dif }}><Calco imagen="fidelidad/pulso-referencia.png" ancho={PW} alto={PH} modo="diferencia" /></div>}
        </div>
      </Camara2D>
      <Rotulo t0={0.35} t1={2.25} titulo="Antes: recreada «a ojo»" detalle="letra genérica · azul inventado · radios y sombras de plantilla · textos en inglés · iconos parecidos" color="#F87171" />
      <Rotulo t0={3.35} t1={4.95} titulo="Después: copiada de la fuente" detalle="tokens.css, los mismos iconos y textos · el calco con la captura real queda negro: coincide" color="#4ADE80" />
      <Rotulo t0={5.15} t1={7.7} titulo="Y ahora se anima, idéntica al producto" detalle="cifras que cuentan, barras que crecen, fila activa, botón que se pulsa" color="#F2F4F7" />
      <Sonido volumen={0.7} sfx={[{ t: 0.05, f: "whoosh-suave", v: 0.35 }, { t: 2.4, f: "whoosh", v: 0.35 }, { t: 3.7, f: "tic", v: 0.35 }, { t: 5.05, f: "subida", v: 0.3 }, { t: 6.9, f: "click", v: 0.5 }]} />
    </AbsoluteFill>
  );
};
