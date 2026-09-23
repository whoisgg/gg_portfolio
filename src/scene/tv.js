import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS, createTVScreenMaterial } from './materials.js';
import { consoleDeckTexture, plateTexture } from './textures.js';
import { DIMS } from './dims.js';

function roundedRectShape(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function curvedScreenGeometry(w, h, bulge) {
  const g = new THREE.PlaneGeometry(w, h, 40, 30);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i) / (w / 2);
    const ny = p.getY(i) / (h / 2);
    p.setZ(i, bulge * (1 - 0.5 * (nx * nx + ny * ny)));
  }
  g.computeVertexNormals();
  return g;
}

function taperedBoxGeometry(w, h, d, taper) {
  const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getZ(i) < 0) {
      p.setX(i, p.getX(i) * taper);
      p.setY(i, p.getY(i) * taper);
    }
  }
  g.computeVertexNormals();
  return g;
}

// TV sits on the cabinet top, centred on the cabinet depth.
const TV = DIMS.tv;
export const TV_CONFIG = {
  position: new THREE.Vector3(-0.45, DIMS.cabinet.h + TV.h / 2, DIMS.room.wallZ + DIMS.cabinet.d / 2 + 0.03),
  screen: { w: TV.screenW, h: TV.screenH, x: -0.045, y: 0.01 },
};

export function createTV(scene) {
  const { screen } = TV_CONFIG;
  const tvGroup = new THREE.Group();
  tvGroup.position.copy(TV_CONFIG.position);

  const plastic = new THREE.MeshStandardMaterial({ color: COLORS.charcoal, roughness: 0.55, metalness: 0.05 });
  const plasticLight = new THREE.MeshStandardMaterial({ color: COLORS.charcoalLight, roughness: 0.5 });
  const plasticDark = new THREE.MeshStandardMaterial({ color: 0x151312, roughness: 0.7 });
  const plasticRear = new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.7 });

  // Front cabinet block (+z) and tapered tube housing (-z)
  const frontCenterZ = TV.dFront / 2 - 0.005;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(TV.w, TV.h, TV.dFront, 6, 0.016), plastic);
  shell.position.z = frontCenterZ;
  shell.castShadow = true;
  shell.receiveShadow = true;
  tvGroup.add(shell);
  const rear = new THREE.Mesh(taperedBoxGeometry(TV.w - 0.06, TV.h - 0.06, TV.dRear, 0.78), plasticRear);
  rear.position.z = -TV.dRear / 2;
  rear.castShadow = true;
  tvGroup.add(rear);

  // Front plate with cutout, inner lip, dark well
  const frontZ = frontCenterZ + TV.dFront / 2;
  const plateShape = roundedRectShape(TV.w - 0.02, TV.h - 0.02, 0.014);
  plateShape.holes.push(roundedRectShape(screen.w + 0.028, screen.h + 0.028, 0.02, screen.x, screen.y));
  const plate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(plateShape, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3 }),
    plasticLight
  );
  plate.position.z = frontZ - 0.004;
  plate.castShadow = true;
  tvGroup.add(plate);

  const lipShape = roundedRectShape(screen.w + 0.032, screen.h + 0.032, 0.02, screen.x, screen.y);
  lipShape.holes.push(roundedRectShape(screen.w + 0.004, screen.h + 0.004, 0.014, screen.x, screen.y));
  const lip = new THREE.Mesh(new THREE.ExtrudeGeometry(lipShape, { depth: 0.01, bevelEnabled: false }), plasticDark);
  lip.position.z = frontZ - 0.008;
  tvGroup.add(lip);
  const well = new THREE.Mesh(new THREE.BoxGeometry(screen.w + 0.02, screen.h + 0.02, 0.02), plasticDark);
  well.position.set(screen.x, screen.y, frontZ - 0.016);
  tvGroup.add(well);

  // Screen + glass
  const screenMaterial = createTVScreenMaterial();
  const screenMesh = new THREE.Mesh(curvedScreenGeometry(screen.w, screen.h, 0.011), screenMaterial);
  screenMesh.position.set(screen.x, screen.y, frontZ - 0.002);
  screenMesh.name = 'tvScreen';
  tvGroup.add(screenMesh);
  const glass = new THREE.Mesh(
    curvedScreenGeometry(screen.w, screen.h, 0.0115),
    new THREE.MeshPhysicalMaterial({
      color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
      transparent: true, opacity: 0.16, envMapIntensity: 1.4, depthWrite: false,
    })
  );
  glass.position.copy(screenMesh.position);
  glass.position.z += 0.0006;
  glass.name = 'tvGlass';
  tvGroup.add(glass);

  const screenGlow = new THREE.PointLight(0x33ff66, 0, 1.6, 2);
  screenGlow.position.set(screen.x, screen.y, frontZ + 0.18);
  screenGlow.name = 'screenGlow';
  tvGroup.add(screenGlow);

  // Right column: grille, knobs, buttons, jack, brand, LED
  const colX = TV.w / 2 - 0.058;
  const faceZ = frontZ + 0.015;
  const grilleBack = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(0.08, 0.17, 0.006), { depth: 0.002, bevelEnabled: false }), plasticDark);
  grilleBack.position.set(colX, 0.085, faceZ - 0.001);
  tvGroup.add(grilleBack);
  for (let i = 0; i < 12; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.0035, 0.0025), plasticLight);
    slot.position.set(colX, 0.158 - i * 0.0133, faceZ + 0.0012);
    tvGroup.add(slot);
  }
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x1d1a18, roughness: 0.35, metalness: 0.2 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.45 });
  for (const ky of [-0.05, -0.098]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0135, 0.0016, 8, 24), ringMat);
    ring.position.set(colX, ky, faceZ);
    tvGroup.add(ring);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0125, 0.01, 28), knobMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(colX, ky, faceZ + 0.005);
    tvGroup.add(knob);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.007, 0.0012), new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: 0.4 }));
    tick.position.set(colX, ky + 0.004, faceZ + 0.0106);
    tvGroup.add(tick);
  }
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.011, 0.006, 0.004, 1, 0.0012), knobMat);
    b.position.set(colX - 0.022 + i * 0.0146, -0.136, faceZ + 0.002);
    tvGroup.add(b);
  }
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.004, 12), plasticDark);
  jack.rotation.x = Math.PI / 2;
  jack.position.set(colX - 0.032, -0.16, faceZ);
  tvGroup.add(jack);
  const brand = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.006, 0.002), new THREE.MeshStandardMaterial({ color: COLORS.accent, roughness: 0.4 }));
  brand.position.set(colX + 0.004, -0.16, faceZ);
  tvGroup.add(brand);
  const tvLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0026, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0x330000, emissiveIntensity: 0.4 })
  );
  tvLed.position.set(colX + 0.034, -0.16, faceZ + 0.001);
  tvLed.name = 'tvLed';
  tvGroup.add(tvLed);

  // Feet
  for (const [fx, fz] of [[-0.2, 0.15], [0.2, 0.15], [-0.17, -0.12], [0.17, -0.12]]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.032), plasticDark);
    foot.position.set(fx, -TV.h / 2 - 0.006, fz);
    tvGroup.add(foot);
  }

  // Rabbit-ear antenna on the rear housing
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0xc9c4bb, metalness: 0.9, roughness: 0.3 });
  const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.012, 20), plasticDark);
  antennaBase.position.set(0.09, TV.h / 2 - 0.028, -0.08);
  tvGroup.add(antennaBase);
  for (const dir of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0022, 0.36, 8), antennaMat);
    rod.position.set(0.09 + dir * 0.085, TV.h / 2 + 0.13, -0.1);
    rod.rotation.z = dir * -0.5;
    rod.rotation.x = -0.18;
    tvGroup.add(rod);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 8, 8), antennaMat);
    tip.position.set(0.09 + dir * 0.168, TV.h / 2 + 0.29, -0.13);
    tvGroup.add(tip);
  }

  scene.add(tvGroup);
  const screenCenter = new THREE.Vector3(screen.x, screen.y, frontZ + 0.009).add(TV_CONFIG.position);
  return { tvGroup, screenMaterial, screenMesh, screenCenter, screenSize: { w: screen.w, h: screen.h } };
}

// ---------------------------------------------------------------------------
// SNES, US model, 200 x 72 x 242 mm. Sits on the cabinet top next to the TV.
// ---------------------------------------------------------------------------
const S = DIMS.snes;
export const CONSOLE_CONFIG = {
  position: new THREE.Vector3(0.16, DIMS.cabinet.h, DIMS.room.wallZ + DIMS.cabinet.d / 2 + 0.03),
  slot: new THREE.Vector3(-0.007, S.h - 0.0005, -0.031), // local: top of the slot opening
};

export function createConsole(scene) {
  const { w, h, d } = S;
  const consoleGroup = new THREE.Group();
  consoleGroup.position.copy(CONSOLE_CONFIG.position);

  const grey = new THREE.MeshStandardMaterial({ color: 0xc9c8cd, roughness: 0.5 });
  const greyDark = new THREE.MeshStandardMaterial({ color: 0xa3a2aa, roughness: 0.55 });
  const purple = new THREE.MeshStandardMaterial({ color: 0x5c4d9e, roughness: 0.45 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a191e, roughness: 0.85 });
  const slotDoor = new THREE.MeshStandardMaterial({ color: 0x8c8b93, roughness: 0.6 });

  const lowerH = 0.022, upperH = 0.034, deckH = 0.021;
  const lower = new THREE.Mesh(new RoundedBoxGeometry(w, lowerH, d, 3, 0.005), greyDark);
  lower.position.y = lowerH / 2;
  lower.castShadow = true;
  lower.receiveShadow = true;
  consoleGroup.add(lower);
  const upper = new THREE.Mesh(new RoundedBoxGeometry(w, upperH, d, 4, 0.006), grey);
  upper.position.y = lowerH + upperH / 2 - 0.002;
  upper.castShadow = true;
  consoleGroup.add(upper);
  const frontDeckTop = lowerH + upperH - 0.002;

  // Raised rear deck (cartridge mesa)
  const deckD = 0.15;
  const deckZ = -d / 2 + deckD / 2 + 0.007;
  const deck = new THREE.Mesh(new RoundedBoxGeometry(w - 0.01, deckH, deckD, 4, 0.008), grey);
  deck.position.set(0, frontDeckTop + deckH / 2 - 0.004, deckZ);
  deck.castShadow = true;
  consoleGroup.add(deck);
  const deckTop = frontDeckTop + deckH - 0.004;

  // Cartridge slot with spring door, rim
  const slotX = CONSOLE_CONFIG.slot.x, slotZ = CONSOLE_CONFIG.slot.z;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.002, 0.038), greyDark);
  rim.position.set(slotX, deckTop - 0.0007, slotZ);
  consoleGroup.add(rim);
  const opening = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.005, 0.026), black);
  opening.position.set(slotX, deckTop + 0.0007, slotZ);
  opening.name = 'cartridgeSlot';
  consoleGroup.add(opening);
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.0014, 0.0108), slotDoor);
    leaf.position.set(slotX, deckTop + 0.0018, slotZ + side * 0.0064);
    consoleGroup.add(leaf);
  }

  // EJECT
  const eject = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.008, 0.021, 2, 0.002), purple);
  eject.position.set(slotX + 0.085, deckTop + 0.0026, slotZ);
  consoleGroup.add(eject);
  const ejectLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.0087), new THREE.MeshStandardMaterial({ map: plateTexture('EJECT'), transparent: true, roughness: 0.6 }));
  ejectLabel.rotation.x = -Math.PI / 2;
  ejectLabel.position.set(slotX + 0.085, deckTop + 0.0004, slotZ + 0.019);
  consoleGroup.add(ejectLabel);

  // Vents across the back of the deck
  for (let i = 0; i < 14; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.0035, 0.002, 0.028), black);
    vent.position.set(-0.078 + i * 0.012, deckTop + 0.0004, deckZ - deckD / 2 + 0.024);
    consoleGroup.add(vent);
  }

  // POWER / RESET sliders, LED, print on the front deck
  const frontZ = d / 2 - 0.038;
  const sliders = [[0.038, 0.042, 'POWER'], [0.084, 0.028, 'RESET']];
  for (const [sx, len, text] of sliders) {
    const track = new THREE.Mesh(new RoundedBoxGeometry(len, 0.0035, 0.0157, 1, 0.001), black);
    track.position.set(sx, frontDeckTop - 0.0004, frontZ);
    consoleGroup.add(track);
    const knob = new THREE.Mesh(new RoundedBoxGeometry(0.013, 0.0087, 0.012, 2, 0.0024), purple);
    knob.position.set(sx - len / 2 + 0.008, frontDeckTop + 0.0035, frontZ);
    for (let g = 0; g < 3; g++) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.0009, 0.0007, 0.0104), black);
      groove.position.set(-0.0028 + g * 0.0028, 0.0045, 0);
      knob.add(groove);
    }
    consoleGroup.add(knob);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.0087), new THREE.MeshStandardMaterial({ map: plateTexture(text), transparent: true, roughness: 0.6 }));
    label.rotation.x = -Math.PI / 2;
    label.position.set(sx, frontDeckTop + 0.0004, frontZ + 0.0148);
    consoleGroup.add(label);
  }
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.0024, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0x330000, emissiveIntensity: 0.3 })
  );
  led.position.set(0.0035, frontDeckTop + 0.0014, frontZ);
  led.name = 'powerLed';
  consoleGroup.add(led);
  const print = new THREE.Mesh(new THREE.PlaneGeometry(0.073, 0.014), new THREE.MeshStandardMaterial({ map: consoleDeckTexture(), transparent: true, roughness: 0.6 }));
  print.rotation.x = -Math.PI / 2;
  print.position.set(-0.056, frontDeckTop + 0.0004, frontZ + 0.0035);
  consoleGroup.add(print);

  // Front face: recessed panel with two controller ports
  const faceZ = d / 2;
  const portY = lowerH + 0.013;
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.097, 0.028, 0.009, 2, 0.002), greyDark);
  panel.position.set(-0.045, portY, faceZ - 0.0026);
  consoleGroup.add(panel);
  for (const px of [-0.07, -0.023]) {
    const port = new THREE.Mesh(new RoundedBoxGeometry(0.033, 0.017, 0.005, 2, 0.0035), black);
    port.position.set(px, portY, faceZ + 0.0017);
    consoleGroup.add(port);
    const inner = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.0104, 0.0035, 1, 0.002), new THREE.MeshStandardMaterial({ color: 0x33323a, roughness: 0.7 }));
    inner.position.set(px, portY, faceZ + 0.0035);
    consoleGroup.add(inner);
    for (let k = 0; k < 7; k++) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.0035, 6), black);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(px - 0.0094 + k * 0.0031, portY, faceZ + 0.0054);
      consoleGroup.add(pin);
    }
  }
  for (const [fx, fz] of [[-0.078, 0.096], [0.078, 0.096], [-0.078, -0.096], [0.078, -0.096]]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.0035, 12), black);
    foot.position.set(fx, -0.0009, fz);
    consoleGroup.add(foot);
  }

  scene.add(consoleGroup);
  const slotWorld = CONSOLE_CONFIG.slot.clone().add(CONSOLE_CONFIG.position);
  const portWorld = new THREE.Vector3(-0.07, portY, faceZ + 0.005).add(CONSOLE_CONFIG.position);
  return { consoleGroup, slotWorld, portWorld };
}
