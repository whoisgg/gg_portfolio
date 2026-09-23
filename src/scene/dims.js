// Every dimension in the scene is in METERS, taken from the real objects.
// If a prop looks off, fix the number here, not the geometry.
export const DIMS = {
  room: { w: 5.0, h: 2.5, wallZ: -2.0 },
  // 20" CRT television
  tv: { w: 0.50, h: 0.42, dFront: 0.24, dRear: 0.23, screenW: 0.386, screenH: 0.29 },
  // Sony PVM-14L2 (14" pro monitor), used when public/models/crt.glb exists
  pvm: { w: 0.35, h: 0.34, d: 0.38, screenW: 0.272, screenH: 0.204 },
  // SNES (US model)
  snes: { w: 0.200, h: 0.072, d: 0.242 },
  // SNES cartridge (upper shell width, total height, thickness)
  cart: { W: 0.137, Hu: 0.059, Hl: 0.028, Wl: 0.117, D: 0.020 },
  // SNES controller
  pad: { w: 0.145, h: 0.020, d: 0.060 },
  // Universal game case standing spine-out
  gameCase: { w: 0.015, h: 0.190, d: 0.135 },
  // SNES retail box (landscape)
  box: { w: 0.190, h: 0.133, d: 0.030 },
  // Furniture
  cabinet: { w: 1.30, h: 0.45, d: 0.50 },
  shelf: { w: 0.90, d: 0.20, pitch: 0.23, rows: 3, plank: 0.018 },
  carpet: { w: 1.8, d: 1.3 },
  beanbag: { r: 0.40 },
};
