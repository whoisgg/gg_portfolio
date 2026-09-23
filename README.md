# gg_portfolio

Portfolio 3D: una pieza de los 90 con una CRT, un SNES y una biblioteca de juegos.
Se elige un cartucho, entra en la consola, la cámara se acerca a la tele y el
contenido (About / Projects / Lab / Contact) se dibuja sobre el vidrio.

Three.js + Vite + GSAP. `npm install`, `npm run dev`.

## Escala

Toda la escena está en **metros**. Las medidas reales viven en `src/scene/dims.js`
(SNES 200 × 72 × 242 mm, cartucho 137 × 86 mm, CRT de 20", cajas de juego, mueble).
Si algo se ve fuera de proporción, se corrige ahí, no en la geometría.

## Modelos descargados (opcional)

Los objetos son procedurales. Si se copia un `.glb` en `public/models/` con uno de
estos nombres, reemplaza a la versión procedural:

    public/models/snes.glb
    public/models/crt.glb
    public/models/cartridge.glb
    public/models/controller.glb

`src/scene/models.js` los reescala al ancho real de `dims.js` y los apoya en y = 0,
así que no importa en qué unidades los exportó el autor. Los tres primeros ya
están descargados (variante GLB con texturas 1k) y cableados en `src/main.js`:

- `snes.glb`: se ocultan el cable, el enchufe y la base del modelo antes de medir,
  para que el ancho de 200 mm sea el de la consola y no el del conjunto.
- `crt.glb`: es una Sony PVM-14L2 (14"), así que usa `DIMS.pvm` y no `DIMS.tv`; la
  pantalla de fósforo se recoloca sobre el frente del modelo.
- `cartridge.glb`: se clona cuatro veces y encima va la etiqueta propia de cada menú.

- `boxes/*.glb`: cajas SNES PAL de Frank Rennau (Mario World, Zelda, Turtles in
  Time). Se cargan antes de armar la estantería y deciden el layout. Como son
  solo tres, `makeSpineVariants` copia la textura de la caja y repinta solo la
  zona del lomo con otros títulos y colores: las paradas muestran lomos distintos
  y las carátulas reales quedan para las apiladas. Si faltan, la estantería vuelve
  a las cajas procedurales.
- Los cuatro menús son cartuchos de frente intercalados entre los lomos: es lo
  único con etiqueta completa en la estantería. Al pasar el mouse el cartucho se
  adelanta, aparece un tooltip junto al cursor con nombre y descripción, la línea
  de abajo lo nombra y la TV se enciende tenue en su color. Al clickear vuela al
  SNES y al expulsar vuelve a su hueco.
- `controller.glb`: control SNES de Yanez Designs. `crt.glb` es la Panasonic de
  Timothy Ahene; `crt-pvm.glb` es la Sony PVM, por si se prefiere.

Autores y licencias en `public/models/CREDITS.md`. Son CC-BY: el crédito va en
la sección Contact o en el pie de página.
