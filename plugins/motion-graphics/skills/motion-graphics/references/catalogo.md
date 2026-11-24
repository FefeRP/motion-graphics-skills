# Catálogo de los dos kits

## Kit principal: HyperFrames (`kit/comun/mg.js`, todo en `window.MG`)
Firma: `Componente(t, { opciones }, ...hijos)`; las opciones están comentadas en `mg.js` encima de cada función.
Cómo se escribe una pieza: [hyperframes.md](hyperframes.md).

| Técnica (skill) | `MG.*` |
|---|---|
| Base | `h`, `F`, `capa`, `lleno`, `LLENO`, `montar`, `variables`, `M` (fps, ancho, alto, estilo) |
| Tiempo y curvas (`motion-movimiento`) | `tramo`, `ventana`, `interp`, `bezier`, `CURVAS`, `pchip`, `pista`, `golpe`, `muelle`, `azar`, `clamp`, `curva`, `muelleEstilo`, `golpeEstilo` |
| Dirección (maestra) | `ESTILOS` (oscuro, claro, agencia, oscuro-halo, oscuro-brasa, oscuro-turquesa, claro-lima, agencia-punto, oscuro-cobre, oscuro-cristal, taller, taller-claro, claro-lavanda), `mezclar`, `BASE`, `est`, `titular`, `mezclaColor`, `hex2`, `FUENTES` |
| Cámara (`motion-movimiento`) | `Camara2D`, `camara2DEn`, `Camara` (3D), `camaraEn`, `desenfoque` (= `CameraMotionBlur`), `Deriva` |
| Piezas (`motion-movimiento`, `motion-interfaz`) | `Movil` (claves x, y, z, s, r, o, b; `queda`; estela), `piezaEn`, `entraSale`, `Tarjeta` |
| Tipografía (`motion-tipografia`) | `PorPalabra`, `PorLetra`, `Lineas`, `Mascara`, `Descifra`, `Golpe`, `Contador` (separador de miles siempre), `Teclea`, `Palabra`, `Rodillo`, `Neon` |
| Transiciones (`motion-transiciones`) | `Forma` (objeto puente), `Flash`, `FugaLuz`, `ZoomAtraves`, `BarridoRadial`, `Glitch`, `Escaneo`, `Onda` |
| Luz y fondo (`motion-luz-fondo`) | `FondoEstilo`, `Halo`, `Aurora`, `Manchas`, `VeloEsquina`, `Vineta`, `Grano`, `Bokeh`, `Destello`, `Sombra`, `Hud`, `timecode` |
| Partículas (`motion-3d`) | `Chispas`, `Progreso`; 3D de CSS con `Camara` + `Movil` con `z` |
| Elementos externos (IA, recortes) | `Elemento` (imagen con recorte, ajuste, máscara, tinte con el alfa de la imagen, mezcla), `colocaMedio` (coloca un `<video class="clip">` fijo), `shader` (un shader de pantalla completa, p. ej. de la librería de componentes, con `uTime = t`; [recursos.md](recursos.md) §1) — [elementos-ia.md](elementos-ia.md) |
| Sonido (`motion-ritmo-sonido`) | bloque JSON `mg-sonido` en la pieza (música + efectos de `comun/sfx` + voz con `voz`, `vozInicio`, `volumenVoz`), convertido por `scripts/mg.mjs` |

Demos (`kit/piezas`): `oscuro` (10 s), `claro` (10 s), `agencia` (11,25 s), `mezcla` (la misma escena con cualquier
dirección: `variantes/mezcla-*.json`), `elementos` (integración de imagen y clip con alfa), `promo` (13 s, plantilla de
promo con voz: hook palabra a palabra, malla a sangre, píldora de cristal, revelado del logo, tarjeta con microdetalles;
[promo-recetas.md](promo-recetas.md)), `biblioteca` (9 s, un shader de la librería de componentes copiado tal cual:
cáusticas con gotas por tabla de tiempos y sombra del titular; [recursos.md](recursos.md) §1).

## Solo en el kit secundario (`kit-remotion/src/motion/base`, Remotion, congelado)
Para usarlos en HyperFrames hay que portarlos (tabla de equivalencias en [hyperframes.md](hyperframes.md)); la lógica
de dibujo en canvas se copia tal cual.
- `efectos-2.tsx`: `ManchasLiquidas`, `FraseVoz`, `FlashCromatico`, `PildoraElastica`, `Estrobo`, `LenteBarril`, `LineaLuz`,
  `ParedPaneles`, `TarjetaBrillo`, `PilaTarjetas`, `Orbitas`, `Seleccion`, `Tunel`, `Portal`, `Horizonte` (demo `DemoEfectos2`).
- `texto.tsx`: `Anillo`. `escenas.tsx`: `Escenas` (corte, barrido que empuja, zoom, círculo, cortina, enfoque).
- `humo.tsx`: `Humo` (shader WebGL). En HyperFrames: clip de humo generado en bucle o `Manchas`/`Aurora`.
- `fidelidad.tsx`: `Calco`, `IconoMascara`, `useFuenteLocal`, `Lienzo` (en HyperFrames, el HTML/CSS real va directo y
  las fuentes con `@font-face`).
- `captura.tsx`: `Captura`.
- `puntos.tsx` (agencia-punto): `HudCompas`, `PuntosDivide`, `IrisAro`, `Corchetes`, `FormaPolar`, `CajaTransformacion`,
  `NubePuntos` (+ formas), `TramaOnda`, `CintaRayas`, `TextoAnillos`, `PuntoSalta`.
- `taller.tsx`: `LetrasCoreografia`, `TrackingRespira`, `EstallidoLetras`, `BolaRebote`, `VentanaEditor`, `EditorCurvas`,
  `Interruptor`, `DiscoObturador`, `MosaicoVivo`, `ContadorRodillo`, `GlifoPuente` y más.
- `cobre.tsx`: `Asterisco`, `Meteoro`, `MarcaEstalla`, `MarcaBrota`, `Resplandor`, `ArcoChispa`, `TextoDeChispas`,
  `CajaCristal`, `EcoZoom`, `BotonPulsa`, `CursorMano`, `OndaChoque`, `CodigoCae`, `Salida3D`, `GlifoCambia`, `TextoBrasa`.
- `cristal.tsx`: `TecleaLuz`, `BarraPrompt`, `Cursor`, `Estallido`, `Mosaico`, `RedNodos`, `Chispa`, `Roseton`, `FondoCristal`.
- `enfoque.tsx`: `FraseCambia`, `Relevo`, `enOrbita`, `FocoRadial`, `Remolino`, `InundaLuz`, `MarcaTeclea`, `AroCarga`,
  `CURVAS_ENFOQUE` (`PorPalabra` y `VeloEsquina` ya están en `MG`).
- `producto.tsx`: `MarcoMovil`, `PilaMoviles`, `LineaTiempo`, `entraEnCuadro`, `AnilloIconos`, `IconoApp`, `Glifo`, `Pastilla`.
- `mapa3d.tsx`: mapas 3D en perspectiva (skill `motion-mapas`).
Recreaciones verificadas (`kit-remotion/src/motion/recreaciones`): `RecOscuroCobre`, `RecOscuroCristal`,
`RecAgenciaPunto`, `RecTaller`, `RecSeguimiento`, `RecMapaRuta`. Sus direcciones (tokens) sí están en `MG.ESTILOS`.

## Scripts
`kit/scripts`: `mg.mjs` (render, stills, lint, preview), `alfa.mjs` (recorte y alfa de imagen o clip), `bucle.mjs`
(bucle perfecto), `medir-bucle.mjs`, `musica.mjs`, `sfx.mjs`, `medir-ritmo.cjs`, `capturar.mjs`, `extraer-tokens.mjs`,
`comparar-fidelidad.mjs`, `comparar-video.mjs`, `revisar-guion.mjs`, `voz.mjs` (revisar y generar la locución con tiempos
por palabra), `audio.mjs` (ducking, medir voz/música, remezclar sin re-render), `franjas.mjs` (franjas y velos),
`marca.mjs` (carpeta de recursos de marca).
`kit-remotion/scripts`: `render.mjs` (render, stills, `--desde/--hasta/--mudo`), `empalmar.mjs`, `recortar.mjs` y los mismos
de medida.
