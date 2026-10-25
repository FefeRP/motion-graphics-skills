# Catálogo del kit (`kit/src/motion/base`)

Todo se importa desde `src/motion/base` (`index.ts`). Props en el JSDoc de cada componente. Motor: hoy solo Remotion;
lo específico de Remotion vive en `tiempo.ts` (reloj), `camara.tsx` (desenfoque) y `sonido.tsx`: si algún día se
añade otro motor, esos tres ficheros son el adaptador.

## Por técnica
| Técnica (skill) | Componentes |
|---|---|
| Tiempo y curvas (`motion-movimiento`) | `useSeg`, `tramo`, `ventana`, `CURVAS`, `pchip`, `pista`, `golpe` |
| Dirección / estilo (maestra) | `TokensEstilo`, `mezclar`, `EstiloProvider`, `useEstilo`, `useCurva`, `useMuelle`, `useGolpe`, `useTitular`, `ESTILOS`, `TODOS_ESTILOS` |
| Cámara (`motion-movimiento`) | `Camara`, `Camara2D`, `ConDesenfoque`, `Deriva` |
| Piezas (`motion-movimiento`, `motion-interfaz`) | `Movil`, `Pieza`, `Tarjeta`, `entraSale`, `Captura` |
| Interfaz y fidelidad (`motion-interfaz`) | `Calco`, `IconoMascara`, `useFuenteLocal`, `Lienzo`, `Teclea`, `Contador`, `Progreso`, `BotonPulsa`, `CursorMano`, `Cursor`, `BarraPrompt`, `VentanaEditor` + las recetas nuevas de §4 |
| Transiciones (`motion-transiciones`) | `Forma`, `Flash`, `FlashCromatico`, `FugaLuz`, `ZoomAtraves`, `BarridoRadial`, `Glitch`, `Estrobo`, `ManchasLiquidas`, `EcoZoom`, `IrisAro`, `Portal`, `GlifoPuente`, `Escenas` |
| Tipografía (`motion-tipografia`) | `Descifra`, `Mascara`, `Lineas`, `PorLetra`, `Golpe`, `Contador`, `Neon`, `Anillo`, `Palabra`, `Rodillo`, `FraseVoz`, `Seleccion`, `TecleaLuz`, `TextoBrasa`, `MarcaBrota`, `LetrasCoreografia`, `TrackingRespira`, `EstallidoLetras`, `ContadorRodillo`, `TextoAnillos`, `TextoDeChispas` |
| Luz y fondo (`motion-luz-fondo`) | `FondoEstilo`, `Halo`, `Aurora`, `Humo`, `Manchas`, `FondoCristal`, `Vineta`, `Grano`, `Bokeh`, `Destello`, `Sombra`, `Hud`, `Resplandor`, `LineaLuz`, `TarjetaBrillo`, `CajaCristal`, `Chispa`, `Asterisco`, `Meteoro`, `Chispas`, `OndaChoque`, `Onda` |
| 3D y partículas (`motion-3d`) | `Orbitas`, `Tunel`, `ParedPaneles`, `LenteBarril`, `Horizonte`, `NubePuntos` (+ `formaFlor`, `formaRejilla`, `formaEsfera`, `formaToro`, `formaCubo`), `FormaPolar`, `CuboAlambre`, `CintaRayas`, `TramaOnda`, `PuntosDivide`, `PuntoSalta`, `BolaRebote`, `PilaTarjetas`, `Salida3D` |
| Mapas 3D (`motion-mapas`) | `MapaCanvas`, `generaCiudad`, `rutaPorCruces`, `camaraMapa`, `medirRuta`, `enMapa`, `olaCrece`, `proyectorMapa`, `dibujaMapa`, `PALETAS_MAPA` |
| Sonido (`motion-ritmo-sonido`) | `Sonido` |

## Por fichero
- `tiempo.ts`, `estilo.tsx`, `camara.tsx`, `piezas.tsx`, `captura.tsx`, `sonido.tsx`: el motor.
- `efectos.tsx`: `Forma`, `Onda`, `Progreso`, `Flash`, `Deriva`, `ZoomAtraves`, `FugaLuz`, `BarridoRadial`, `Glitch`,
  `Palabra`, `Rodillo`, `Teclea`, `Escaneo`, `Chispas`.
- `efectos-2.tsx`: `ManchasLiquidas`, `FraseVoz`, `FlashCromatico`, `PildoraElastica`, `Estrobo`, `LenteBarril`
  (mapa SVG de 8 bits: escalones de ~5 px, úsala en planos en movimiento), `LineaLuz`, `ParedPaneles`, `TarjetaBrillo`,
  `PilaTarjetas`, `Orbitas`, `Seleccion`, `Tunel`, `Portal`, `Horizonte` (demo `DemoEfectos2`, 24 s).
- `texto.tsx`: `Descifra`, `Mascara`, `Lineas`, `PorLetra`, `Golpe`, `Contador`, `Neon`, `Anillo`.
- `escenas.tsx`: `Escenas` + transiciones (corte, barrido que empuja, zoom, círculo, cortina).
- `acabado.tsx`: `FondoEstilo`, `Aurora`, `Halo`, `Manchas`, `Vineta`, `Grano`, `Bokeh`, `Destello`, `Sombra`, `Hud`.
- `humo.tsx`: `Humo` (shader WebGL; `gl: "swangle"`).
- `fidelidad.tsx`: `Calco`, `IconoMascara`, `useFuenteLocal`, `Lienzo`.
- `puntos.tsx` (de `agencia-punto`): `HudCompas`, `PuntosDivide`, `IrisAro`, `Corchetes`, `FormaPolar`,
  `CajaTransformacion`, `NubePuntos`, `TramaOnda`, `CintaRayas`, `TextoAnillos`, `PuntoSalta`.
- `taller.tsx` (de `taller`): `LetrasCoreografia`, `TrackingRespira`, `EstallidoLetras`, `BolaRebote`, `VentanaEditor`,
  `EditorCurvas`, `Interruptor`, `DiscoObturador`, `MosaicoVivo` (+ `PesoVariable`, `CuboAlambre`, `RayasCristal`,
  `BarrasVivas`, `TrazoVivo`, `PuntosMuelle`), `ContadorRodillo`, `GlifoPuente`.
- `cobre.tsx` (de `oscuro-cobre`): `Asterisco`, `Meteoro`, `MarcaEstalla`, `MarcaBrota`, `Resplandor`, `ArcoChispa`,
  `TextoDeChispas`, `CajaCristal`, `EcoZoom`, `BotonPulsa`, `CursorMano`, `OndaChoque`, `CodigoCae`, `Salida3D`,
  `GlifoCambia`, `TextoBrasa`.
- `cristal.tsx` (de `oscuro-cristal`): `TecleaLuz`, `BarraPrompt`, `Cursor`, `Estallido`, `Mosaico`, `RedNodos`,
  `Chispa`, `Roseton`, `FondoCristal`.
- `enfoque.tsx` (de `claro-lavanda`, técnicas de enfoque): `PorPalabra` (+ `rellenoCentro`), `FraseCambia`, `Relevo`,
  `enOrbita`, `FocoRadial`, `Remolino`, `InundaLuz`, `MarcaTeclea`, `AroCarga`, `CURVAS_ENFOQUE` (palabra, quint, foco, paneo).
- `producto.tsx` (de `claro-lavanda`, enseñar un producto): `MarcoMovil`, `PilaMoviles`, `LineaTiempo`, `entraEnCuadro`,
  `AnilloIconos`, `IconoApp`, `Glifo` (+ `GLIFOS_APP`), `Pastilla`.
- `camara.tsx`: `Camara2D` acepta `b` (foco de toda la cámara) en las claves y `ancla` (punto de pantalla fijo de los zooms).
- `escenas.tsx`: transición `{ tipo: "enfoque" }`. `acabado.tsx`: `VeloEsquina`.
- `mapa3d.tsx`: mapas 3D en perspectiva por CPU (un canvas 2D): ciudad generada o con tus datos en metros, cámara
  inclinación/giro/distancia, edificios que crecen, ruta con cabeza, tráfico, flechas, ondas, niebla, desenfoque por
  submuestras y `enMapa` para anclar HTML. Pieza de ejemplo: `recreaciones/mapa-ruta.tsx` (`RecMapaRuta`).

## Scripts (`kit/scripts`)
`render.mjs` (render, stills, `--desde/--hasta/--mudo`, `--solo-audio`), `empalmar.mjs`, `recortar.mjs`, `musica.mjs`,
`sfx.mjs`, `medir-ritmo.cjs`, `capturar.mjs`, `extraer-tokens.mjs`, `comparar-fidelidad.mjs`, `comparar-video.mjs`.
