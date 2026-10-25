# Aprender un vídeo de referencia y meterlo en el kit

Cuando el usuario trae un motion graphics que le gusta, no se copia "a ojo": se mide, se recrea, se compara con el
original y lo aprendido entra en el kit como **técnicas reutilizables** (no como un estilo cerrado).

1. **Prepara**: copia el vídeo a `referencias/`, mira su formato (`ffprobe`). Si viene grabado de una pantalla, con
   bandas o con varios vídeos en uno (paneles apilados, captura de una red social), recorta la zona útil de cada pieza
   y escálala a 1920×1080 (`crop` + `scale`) antes de nada. Detecta cortes (`select='gt(scene,0.2)'`) y golpes de la
   música.
2. **Análisis fotograma a fotograma** (uno por pieza): guion plano a plano con su fotograma, trayectorias medidas
   (posición, escala, opacidad, blur por fotograma) → curva (cubic-bezier) y duración, tipografía, paleta muestreada en
   hex, capas y profundidad, transiciones y objeto puente, ritmo contra los golpes, sonido. Si tienes un revisor de
   vídeo con IA, pásale el original para contrastar; confía en tus medidas antes que en él.
3. **¿Qué es nuevo?** Lista las técnicas y comprueba cuáles ya están en el kit (`catalogo.md`). Lo nuevo entra como
   componente genérico en `src/motion/base/` (props con los valores medidos por defecto), con su receta en la skill de
   técnica que le toque. Si su paleta y su ritmo son distintos de las direcciones existentes, añádelo como **variante**
   (`mezclar()` de la dirección más cercana) en `src/motion/capas/`, nunca como skill nueva.
4. **Recrea** la pieza (o un tramo representativo) con los componentes nuevos, como composición `Rec<Nombre>` en
   `src/motion/recreaciones/`, con contenido genérico (sin las marcas ni los logos del original).
5. **Compara**: `node scripts/comparar-video.mjs original.mp4 recreacion.mp4 comp.mp4` → imagen, color y timing por
   segundo con el desfase que mejor encaja. Objetivo: timing ≥ 0,8 con desfase 0 y color < 8–10. Mira también la
   comparación lado a lado (`hstack`). Itera hasta llegar.
6. **Documenta**: receta con cifras en la skill de técnica, componente en `catalogo.md`, variante en `direcciones.md`.
   Los vídeos originales no se publican (son de sus autores): solo las recreaciones.
