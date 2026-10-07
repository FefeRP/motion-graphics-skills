// Base común · cámara 3D continua y desenfoque de movimiento.
// Todo lo que va dentro de <Camara> está en coordenadas de mundo (px, origen en el centro de pantalla con la cámara en
// x=0,y=0,z=1). Nunca pongas `filter` en el contenedor 3D: aplana la perspectiva y las piezas saltan.
import React from "react";
import { AbsoluteFill } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { pista, useSeg, type Clave } from "./tiempo";

/** Clave de cámara: centro mirado (x, y), zoom z (1 = tamaño real) y giros en grados. */
export type ClaveCamara = { t: number; x: number; y: number; z: number; rx?: number; ry?: number; rz?: number; para?: boolean };

export const camaraEn = (claves: ClaveCamara[], t: number) => {
  // el zoom se interpola en escala logarítmica para que acercarse y alejarse se sientan uniformes
  const c = pista(claves.map((k) => ({ ...k, lz: Math.log(k.z) })) as Clave[], t, ["x", "y", "lz", "rx", "ry", "rz"] as const);
  return { x: c.x, y: c.y, z: Math.exp(c.lz), rx: c.rx, ry: c.ry, rz: c.rz };
};

export const Camara: React.FC<{ claves: ClaveCamara[]; perspectiva?: number; children: React.ReactNode }> = ({ claves, perspectiva = 2200, children }) => {
  const t = useSeg();
  const c = camaraEn(claves, t);
  return (
    <AbsoluteFill style={{ perspective: perspectiva, perspectiveOrigin: "50% 50%", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformStyle: "preserve-3d",
        transform: `translate(960px, 540px) scale(${c.z}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) translate(${-c.x}px, ${-c.y}px)` }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Desenfoque de movimiento real (varias submuestras temporales por fotograma) SOLO dentro de las ventanas indicadas
 * (barridos, zooms rápidos). Fuera no hace falta y multiplicaría el render. Va por fuera de la perspectiva.
 */
export const ConDesenfoque: React.FC<{ ventanas: [number, number][]; muestras?: number; obturador?: number; children: React.ReactNode }> = ({ ventanas, muestras = 6, obturador = 270, children }) => {
  const t = useSeg();
  const activo = ventanas.some(([a, b]) => t >= a && t <= b);
  return activo ? <CameraMotionBlur samples={muestras} shutterAngle={obturador}>{children}</CameraMotionBlur> : <>{children}</>;
};

/** Clave de cámara 2D: punto mirado (x, y en px de pantalla 1920×1080), escala s y giro rz. */
export type ClaveCamara2D = { t: number; x?: number; y?: number; s?: number; rz?: number; para?: boolean };
/**
 * Cámara 2D (paneos, zooms y giros sobre una escena plana; más barata que <Camara>). Los hijos se colocan en
 * coordenadas de pantalla (centro 960, 540); la cámara mira a (x, y) con zoom s.
 */
export const Camara2D: React.FC<{ claves: ClaveCamara2D[]; children: React.ReactNode }> = ({ claves, children }) => {
  const t = useSeg();
  const c = pista(claves as Clave[], t, ["x", "y", "s", "rz"] as const, { x: 960, y: 540, s: 1 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${c.s}) rotate(${c.rz}deg) translate(${-c.x}px, ${-c.y}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
